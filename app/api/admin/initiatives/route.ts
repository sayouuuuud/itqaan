import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { generateJoinCode } from "@/lib/initiatives"

// أنشئ join_code فريد غير مكرر في الجدول
async function uniqueJoinCode(): Promise<string> {
  let code = generateJoinCode()
  for (let attempt = 0; attempt < 5; attempt++) {
    const clash = await queryOne<{ id: string }>(
      `SELECT id FROM initiatives WHERE join_code = $1 LIMIT 1`,
      [code]
    )
    if (!clash) return code
    code = generateJoinCode()
  }
  return code
}

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

// POST /api/admin/initiatives
// إنشاء مبادرة جديدة مباشرة بحالة "معتمدة" من قِبل الإدارة العليا.
// يقبل الاسم فقط (إنشاء سريع) أو نموذج كامل.
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 })
  }

  const name = typeof body.name === "string" ? body.name.trim() : ""
  if (!name) {
    return NextResponse.json({ error: "اسم المبادرة مطلوب" }, { status: 400 })
  }

  const type = typeof body.type === "string" && body.type.trim() ? body.type.trim() : null
  const description = typeof body.description === "string" && body.description.trim() ? body.description.trim() : null
  const contactName = typeof body.contact_name === "string" && body.contact_name.trim() ? body.contact_name.trim() : null
  const contactEmail = typeof body.contact_email === "string" && body.contact_email.trim() ? body.contact_email.trim() : null
  const contactPhone = typeof body.contact_phone === "string" && body.contact_phone.trim() ? body.contact_phone.trim() : null
  const targetCount =
    body.target_students_count != null && !Number.isNaN(Number(body.target_students_count))
      ? Number(body.target_students_count)
      : null

  const joinCode = await uniqueJoinCode()

  const rows = await query<{ id: string }>(
    `INSERT INTO initiatives
       (name, type, description, contact_name, contact_email, contact_phone,
        target_students_count, status, join_code, join_enabled, approved_by, approved_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved', $8, true, $9, now(), now(), now())
     RETURNING id`,
    [name, type, description, contactName, contactEmail, contactPhone, targetCount, joinCode, session!.sub]
  )

  return NextResponse.json({ id: rows[0].id }, { status: 201 })
}
