import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { logAdminAction } from "@/lib/activity-log"

// GET /api/admin/initiatives/[id] - detail (Super Admin only)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const { id } = await params

  const initiative = await queryOne(
    `SELECT i.*, au.email AS admin_email, au.name AS admin_name,
            (SELECT COUNT(*) FROM users u WHERE u.initiative_id = i.id) AS students_count
     FROM initiatives i
     LEFT JOIN users au ON au.id = i.admin_user_id
     WHERE i.id = $1`,
    [id]
  )

  if (!initiative) {
    return NextResponse.json({ error: "المبادرة غير موجودة" }, { status: 404 })
  }

  return NextResponse.json({ initiative })
}

// PATCH /api/admin/initiatives/[id] - reject or suspend (Super Admin only)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const { id } = await params
  const { action, reason, adminUserId } = await req.json()

  if (!["reject", "suspend", "reactivate", "assign_admin", "unassign_admin"].includes(action)) {
    return NextResponse.json({ error: "إجراء غير صحيح" }, { status: 400 })
  }

  const existing = await queryOne<{ id: string; status: string; name: string; admin_user_id: string | null }>(
    `SELECT id, status, name, admin_user_id FROM initiatives WHERE id = $1`,
    [id]
  )
  if (!existing) {
    return NextResponse.json({ error: "المبادرة غير موجودة" }, { status: 404 })
  }

  // ——— ربط أو فك ربط مشرف المبادرة ———
  if (action === "assign_admin" || action === "unassign_admin") {
    // فك ربط المشرف الحالي (إن وُجد) عن هذه المبادرة
    if (existing.admin_user_id) {
      await query(
        `UPDATE users SET initiative_id = NULL, updated_at = now() WHERE id = $1 AND role = 'initiative_admin'`,
        [existing.admin_user_id]
      )
    }

    let newAdminId: string | null = null
    if (action === "assign_admin") {
      if (!adminUserId || typeof adminUserId !== "string") {
        return NextResponse.json({ error: "اختر مشرفاً للربط" }, { status: 400 })
      }
      const user = await queryOne<{ id: string; role: string; initiative_id: string | null }>(
        `SELECT id, role, initiative_id FROM users WHERE id = $1`,
        [adminUserId]
      )
      if (!user) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 })
      if (user.role !== "initiative_admin") {
        return NextResponse.json({ error: "يمكن ربط حسابات مشرفي المبادرات فقط" }, { status: 400 })
      }
      if (user.initiative_id && user.initiative_id !== id) {
        return NextResponse.json({ error: "هذا المشرف مرتبط بمبادرة أخرى بالفعل" }, { status: 400 })
      }
      await query(
        `UPDATE users SET initiative_id = $1, is_active = TRUE, updated_at = now() WHERE id = $2`,
        [id, adminUserId]
      )
      newAdminId = adminUserId
    }

    await query(
      `UPDATE initiatives SET admin_user_id = $1, updated_at = now() WHERE id = $2`,
      [newAdminId, id]
    )

    await logAdminAction({
      userId: session!.sub,
      action: action === "assign_admin" ? "initiative_admin_assigned" : "initiative_admin_unassigned",
      entityType: "initiative",
      entityId: id,
      description: `Admin ${action === "assign_admin" ? "assigned" : "unassigned"} initiative admin for "${existing.name}"`,
    })

    return NextResponse.json({ success: true, adminUserId: newAdminId })
  }

  let newStatus = existing.status
  if (action === "reject") newStatus = "rejected"
  if (action === "suspend") newStatus = "suspended"
  if (action === "reactivate") newStatus = "approved"

  await query(
    `UPDATE initiatives
     SET status = $1,
         rejection_reason = CASE WHEN $1 = 'rejected' THEN $2 ELSE rejection_reason END,
         updated_at = now()
     WHERE id = $3`,
    [newStatus, reason || null, id]
  )

  // If suspending, deactivate the initiative admin account so they can't log in.
  if (action === "suspend") {
    await query(
      `UPDATE users SET is_active = FALSE WHERE initiative_id = $1 AND role = 'initiative_admin'`,
      [id]
    )
  }
  if (action === "reactivate") {
    await query(
      `UPDATE users SET is_active = TRUE WHERE initiative_id = $1 AND role = 'initiative_admin'`,
      [id]
    )
  }

  await logAdminAction({
    userId: session!.sub,
    action: `initiative_${action}`,
    entityType: "initiative",
    entityId: id,
    description: `Admin ${action}d initiative "${existing.name}"`,
  })

  return NextResponse.json({ success: true, status: newStatus })
}
