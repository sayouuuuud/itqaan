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
  const { action, reason } = await req.json()

  if (!["reject", "suspend", "reactivate"].includes(action)) {
    return NextResponse.json({ error: "إجراء غير صحيح" }, { status: 400 })
  }

  const existing = await queryOne<{ id: string; status: string; name: string }>(
    `SELECT id, status, name FROM initiatives WHERE id = $1`,
    [id]
  )
  if (!existing) {
    return NextResponse.json({ error: "المبادرة غير موجودة" }, { status: 404 })
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
