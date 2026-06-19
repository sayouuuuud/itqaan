import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getSession, requireRole } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { generateJoinCode } from "@/lib/initiatives"
import { sendEmail } from "@/lib/email"

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
  let pw = ""
  for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)]
  return pw
}

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
// إنشاء مبادرة جديدة مباشرة بحالة "معتمدة".
// adminMode: "none" | "existing" | "new" | "invite"
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
  if (!name) return NextResponse.json({ error: "اسم المبادرة مطلوب" }, { status: 400 })

  const type = typeof body.type === "string" && body.type.trim() ? body.type.trim() : null
  const description = typeof body.description === "string" && body.description.trim() ? body.description.trim() : null
  const contactName = typeof body.contact_name === "string" && body.contact_name.trim() ? body.contact_name.trim() : null
  const contactEmail = typeof body.contact_email === "string" && body.contact_email.trim() ? body.contact_email.trim() : null
  const contactPhone = typeof body.contact_phone === "string" && body.contact_phone.trim() ? body.contact_phone.trim() : null
  const targetCount =
    body.target_students_count != null && !Number.isNaN(Number(body.target_students_count))
      ? Number(body.target_students_count)
      : null

  const adminMode = typeof body.adminMode === "string" ? body.adminMode : "none"
  const joinCode = await uniqueJoinCode()

  // إنشاء المبادرة
  const rows = await query<{ id: string }>(
    `INSERT INTO initiatives
       (name, type, description, contact_name, contact_email, contact_phone,
        target_students_count, status, join_code, join_enabled, approved_by, approved_at, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'approved',$8,true,$9,now(),now(),now())
     RETURNING id`,
    [name, type, description, contactName, contactEmail, contactPhone, targetCount, joinCode, session!.sub]
  )
  const initiativeId = rows[0].id

  // ——— معالجة المشرف ———
  if (adminMode === "existing") {
    // ربط يوزر موجود كمشرف
    const existingUserId = typeof body.existingUserId === "string" ? body.existingUserId : null
    if (existingUserId) {
      const user = await queryOne<{ id: string; name: string }>(
        `SELECT id, name FROM users WHERE id = $1`, [existingUserId]
      )
      if (user) {
        await query(`UPDATE users SET role='initiative_admin', initiative_id=$1 WHERE id=$2`, [initiativeId, existingUserId])
        await query(`UPDATE initiatives SET admin_user_id=$1 WHERE id=$2`, [existingUserId, initiativeId])
      }
    }
  } else if (adminMode === "new") {
    // إنشاء يوزر جديد وربطه كمشرف
    const adminName = typeof body.adminName === "string" ? body.adminName.trim() : ""
    const adminEmail = typeof body.adminEmail === "string" ? body.adminEmail.trim().toLowerCase() : ""
    if (adminName && adminEmail) {
      const exists = await queryOne<{ id: string }>(`SELECT id FROM users WHERE email=$1`, [adminEmail])
      if (exists) {
        return NextResponse.json({ error: "البريد الإلكتروني مستخدم بالفعل" }, { status: 400 })
      }
      const tempPassword = generateTempPassword()
      const hashedPw = await bcrypt.hash(tempPassword, 12)
      const newUser = await query<{ id: string }>(
        `INSERT INTO users (name, email, password_hash, role, initiative_id, email_verified, created_at, updated_at)
         VALUES ($1,$2,$3,'initiative_admin',$4,true,now(),now()) RETURNING id`,
        [adminName, adminEmail, hashedPw, initiativeId]
      )
      const newUserId = newUser[0].id
      await query(`UPDATE initiatives SET admin_user_id=$1 WHERE id=$2`, [newUserId, initiativeId])
      // إرسال credentials
      await sendEmail({
        to: adminEmail,
        subject: `تم تعيينك مشرفاً لمبادرة "${name}" - إتقان التعليمية`,
        body: `مرحباً ${adminName}،\n\nتم إنشاء حسابك كمشرف لمبادرة "${name}".\n\nالبريد: ${adminEmail}\nكلمة المرور المؤقتة: ${tempPassword}`,
        html: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e2e8f0;border-radius:10px;">
          <h2 style="color:#0B3D2E;">أهلاً ${adminName}</h2>
          <p>تم تعيينك مشرفاً لمبادرة <strong>${name}</strong> على منصة إتقان التعليمية.</p>
          <div style="background:#f8fafc;padding:16px;border-radius:8px;margin:20px 0;">
            <p style="margin:4px 0;"><strong>البريد:</strong> ${adminEmail}</p>
            <p style="margin:4px 0;"><strong>كلمة المرور المؤقتة:</strong> <span style="font-size:18px;font-weight:bold;color:#D4A843;">${tempPassword}</span></p>
          </div>
          <p>يُرجى تغيير كلمة المرور فور تسجيل الدخول.</p>
        </div>`,
      })
    }
  } else if (adminMode === "invite") {
    // إرسال دعوة بالإيميل عبر رابط إكمال البيانات
    const inviteEmail = typeof body.inviteEmail === "string" ? body.inviteEmail.trim().toLowerCase() : ""
    if (inviteEmail) {
      // رابط الدعوة يوجّه لصفحة إكمال البيانات مع معرّف المبادرة
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://itqaan-eight.vercel.app"
      const inviteLink = `${baseUrl}/admin-invite/${initiativeId}`
      await sendEmail({
        to: inviteEmail,
        subject: `دعوة لإدارة مبادرة "${name}" - إتقان التعليمية`,
        body: `تمت دعوتك لإدارة مبادرة "${name}" على منصة إتقان. اضغط الرابط لإكمال بياناتك: ${inviteLink}`,
        html: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e2e8f0;border-radius:10px;">
          <h2 style="color:#0B3D2E;">دعوة لإدارة مبادرة</h2>
          <p>تمت دعوتك لإدارة مبادرة <strong>${name}</strong> على منصة إتقان التعليمية.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${inviteLink}" style="background:#0B3D2E;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">إكمال بياناتك والانضمام</a>
          </div>
          <p style="color:#64748b;font-size:13px;">لو الزر لم يعمل: ${inviteLink}</p>
        </div>`,
      })
      // حفظ الإيميل المدعو على المبادرة مؤقتاً حتى يكمل بياناته
      await query(`UPDATE initiatives SET contact_email=COALESCE(contact_email,$1) WHERE id=$2`, [inviteEmail, initiativeId])
    }
  }

  return NextResponse.json({ id: initiativeId }, { status: 201 })
}
