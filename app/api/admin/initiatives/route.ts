import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"

// GET /api/admin/initiatives?status=pending|approved|rejected|suspended
// Super Admin only.
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const status = req.nextUrl.searchParams.get("status")
  const validStatus = ["pending", "approved", "rejected", "suspended"]

  const params: unknown[] = []
  let where = ""
  if (status && validStatus.includes(status)) {
    params.push(status)
    where = `WHERE i.status = $1`
  }

  const initiatives = await query(
    `SELECT i.id, i.name, i.type, i.description, i.contact_name, i.contact_email,
            i.contact_phone, i.target_students_count, i.status, i.admin_user_id,
            i.rejection_reason, i.approved_at, i.created_at,
            au.email AS admin_email,
            (SELECT COUNT(*) FROM users u WHERE u.initiative_id = i.id) AS students_count
     FROM initiatives i
     LEFT JOIN users au ON au.id = i.admin_user_id
     ${where}
     ORDER BY
       CASE i.status WHEN 'pending' THEN 0 ELSE 1 END,
       i.created_at DESC`,
    params
  )

  return NextResponse.json({ initiatives })
}
