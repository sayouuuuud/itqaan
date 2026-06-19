import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { query, queryOne } from "@/lib/db"

// POST /api/admin-invite/[id]
// المدعو يكمل بياناته وينشئ حسابه كمشرف مبادرة.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: initiativeId } = await params
  const body = await req.json().catch(() => ({}))

  const name = typeof body.name === "string" ? body.name.trim() : ""
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const password = typeof body.password === "string" ? body.password : ""

  if (!name || !email || !password) {
    return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }, { status: 400 })
  }

  // التحقق من وجود المبادرة وأنها لم يُعيَّن لها مشرف بعد
  const initiative = await queryOne<{ id: string; name: string; admin_user_id: string | null; status: string }>(
    `SELECT id, name, admin_user_id, status FROM initiatives WHERE id = $1`,
    [initiativeId]
  )
  if (!initiative) {
    return NextResponse.json({ error: "المبادرة غير موجودة" }, { status: 404 })
  }
  if (initiative.admin_user_id) {
    return NextResponse.json({ error: "تم تعيين مشرف لهذه المبادرة بالفعل" }, { status: 409 })
  }

  // التحقق من عدم تكرار الإيميل
  const existing = await queryOne<{ id: string }>(`SELECT id FROM users WHERE email = $1`, [email])
  if (existing) {
    return NextResponse.json({ error: "البريد الإلكتروني مستخدم بالفعل" }, { status: 400 })
  }

  const hashedPw = await bcrypt.hash(password, 12)
  const newUser = await query<{ id: string }>(
    `INSERT INTO users (name, email, password_hash, role, initiative_id, email_verified, created_at, updated_at)
     VALUES ($1,$2,$3,'initiative_admin',$4,true,now(),now()) RETURNING id`,
    [name, email, hashedPw, initiativeId]
  )
  const newUserId = newUser[0].id
  await query(`UPDATE initiatives SET admin_user_id=$1, updated_at=now() WHERE id=$2`, [newUserId, initiativeId])

  return NextResponse.json({ success: true })
}
