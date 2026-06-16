import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getSession, requireRole } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { logAdminAction } from "@/lib/activity-log"

function generateTempPassword(): string {
  // 10-char password with letters + digits
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
  let pw = ""
  for (let i = 0; i < 10; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)]
  }
  return pw
}

// POST /api/admin/initiatives/[id]/approve - Super Admin approves and provisions an Initiative Admin account.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const { id } = await params

  const initiative = await queryOne<{
    id: string
    name: string
    status: string
    contact_name: string | null
    contact_email: string | null
    admin_user_id: string | null
  }>(
    `SELECT id, name, status, contact_name, contact_email, admin_user_id FROM initiatives WHERE id = $1`,
    [id]
  )

  if (!initiative) {
    return NextResponse.json({ error: "المبادرة غير موجودة" }, { status: 404 })
  }
  if (initiative.status === "approved" && initiative.admin_user_id) {
    return NextResponse.json({ error: "تمت الموافقة على هذه المبادرة مسبقاً" }, { status: 409 })
  }
  if (!initiative.contact_email) {
    return NextResponse.json({ error: "لا يوجد بريد إلكتروني لمسؤول التواصل" }, { status: 400 })
  }

  const email = initiative.contact_email.toLowerCase()

  // Ensure the email is not already used by another account.
  const existingUser = await queryOne<{ id: string }>(
    `SELECT id FROM users WHERE email = $1 LIMIT 1`,
    [email]
  )
  if (existingUser) {
    return NextResponse.json(
      { error: "البريد الإلكتروني لمسؤول التواصل مستخدم بالفعل في حساب آخر. يرجى تعديله أولاً." },
      { status: 409 }
    )
  }

  const tempPassword = generateTempPassword()
  const passwordHash = await bcrypt.hash(tempPassword, 10)

  // Create the Initiative Admin account, scoped to this initiative.
  const created = await query<{ id: string }>(
    `INSERT INTO users
       (name, email, password_hash, role, initiative_id, email_verified, approval_status, is_active)
     VALUES ($1, $2, $3, 'initiative_admin', $4, TRUE, 'approved', TRUE)
     RETURNING id`,
    [initiative.contact_name || initiative.name, email, passwordHash, id]
  )

  const adminUserId = created[0]?.id
  if (!adminUserId) {
    return NextResponse.json({ error: "تعذّر إنشاء حساب مشرف المبادرة" }, { status: 500 })
  }

  await query(
    `UPDATE initiatives
     SET status = 'approved', admin_user_id = $1, approved_by = $2, approved_at = now(),
         rejection_reason = NULL, updated_at = now()
     WHERE id = $3`,
    [adminUserId, session!.sub, id]
  )

  // Email the credentials to the initiative admin.
  await sendEmail({
    to: email,
    subject: `تمت الموافقة على مبادرتكم "${initiative.name}" - إتقان التعليمية`,
    body: `تمت الموافقة على مبادرتكم. بيانات الدخول: البريد ${email} وكلمة المرور المؤقتة ${tempPassword}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #0B3D2E;">تهانينا، تمت الموافقة على مبادرتكم 🎉</h2>
        <p style="color: #475569; line-height: 1.7;">
          أهلاً ${initiative.contact_name || ""}، يسعدنا إبلاغكم بأنه تمت الموافقة على انضمام مبادرة
          "<strong>${initiative.name}</strong>" إلى منصة إتقان التعليمية. تم إنشاء حساب مشرف المبادرة الخاص بكم.
        </p>
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px; margin:20px 0;">
          <p style="margin:8px 0;"><strong>البريد الإلكتروني:</strong> ${email}</p>
          <p style="margin:8px 0;"><strong>كلمة المرور المؤقتة:</strong>
            <span style="font-family: monospace; font-size:18px; color:#0B3D2E;">${tempPassword}</span>
          </p>
        </div>
        <p style="color:#64748b; font-size:14px;">يُنصح بتغيير كلمة المرور بعد أول تسجيل دخول.</p>
        <hr style="border:none; border-top:1px solid #e2e8f0; margin:20px 0;" />
        <p style="font-size:12px; color:#94a3b8; text-align:center;">منصة إتقان التعليمية — جميع الحقوق محفوظة</p>
      </div>
    `,
  })

  await logAdminAction({
    userId: session!.sub,
    action: "initiative_approved",
    entityType: "initiative",
    entityId: id,
    description: `Admin approved initiative "${initiative.name}" and provisioned admin ${email}`,
  })

  return NextResponse.json({ success: true, status: "approved", adminUserId })
}
