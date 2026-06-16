import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { query, queryOne } from "@/lib/db"
import { getSession, requireRole } from "@/lib/auth"
import { getManagedInitiative } from "@/lib/initiatives"
import { sendEmail } from "@/lib/email"

// POST /api/initiative/import-csv
// Body: multipart/form-data with field "file" (CSV)
// CSV format: name,email,gender(optional)
// يُنشئ حسابات الطلاب مباشرة (مفعّلة) ويرسل إيميل ترحيب بكلمة السر المؤقتة

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!requireRole(session, ["initiative_admin", "admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const initiative = await getManagedInitiative(session)
  if (!initiative) {
    return NextResponse.json({ error: "لا توجد مبادرة مرتبطة بحسابك" }, { status: 404 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "لم يتم إرفاق ملف" }, { status: 400 })

    const text = await file.text()
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)

    // تخطي السطر الأول إذا كان header
    const dataLines = lines[0]?.toLowerCase().startsWith("name") ? lines.slice(1) : lines

    if (dataLines.length === 0) {
      return NextResponse.json({ error: "الملف فارغ أو لا يحتوي على بيانات" }, { status: 400 })
    }
    if (dataLines.length > 500) {
      return NextResponse.json({ error: "الحد الأقصى 500 طالب في كل عملية استيراد" }, { status: 400 })
    }

    let successCount = 0
    let skippedCount = 0
    const errors: { row: number; email: string; reason: string }[] = []

    for (let i = 0; i < dataLines.length; i++) {
      const cols = dataLines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""))
      const name = cols[0]
      const email = cols[1]?.toLowerCase()
      const gender = cols[2] && ["male", "female"].includes(cols[2].toLowerCase()) ? cols[2].toLowerCase() : null

      if (!name || !email || !email.includes("@")) {
        errors.push({ row: i + 1, email: email || "", reason: "اسم أو بريد إلكتروني غير صحيح" })
        continue
      }

      // التحقق من عدم وجود الحساب مسبقاً
      const existing = await queryOne<{ id: string }>("SELECT id FROM users WHERE email = $1", [email])
      if (existing) {
        skippedCount++
        errors.push({ row: i + 1, email, reason: "البريد الإلكتروني مسجّل مسبقاً" })
        continue
      }

      // توليد كلمة مرور مؤقتة
      const tempPassword = Math.random().toString(36).slice(2, 10).toUpperCase()
      const passwordHash = await bcrypt.hash(tempPassword, 10)

      try {
        await query(
          `INSERT INTO users (name, email, password_hash, role, gender, email_verified, initiative_id)
           VALUES ($1, $2, $3, 'student', $4, true, $5)`,
          [name, email, passwordHash, gender, initiative.id]
        )

        // إرسال إيميل ترحيب بكلمة السر المؤقتة
        await sendEmail({
          to: email,
          subject: `مرحباً بك في ${initiative.name}`,
          body: `مرحباً ${name}، تم تسجيلك في مبادرة ${initiative.name}. بيانات دخولك: البريد: ${email} | كلمة المرور: ${tempPassword}`,
          html: `
            <div dir="rtl" style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
              <h2 style="color:#1a1a1a">مرحباً بك في ${initiative.name}</h2>
              <p style="color:#555">تم تسجيلك كطالب في المبادرة. بيانات دخولك:</p>
              <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin:16px 0">
                <p style="margin:4px 0"><strong>البريد الإلكتروني:</strong> ${email}</p>
                <p style="margin:4px 0"><strong>كلمة المرور المؤقتة:</strong> <code style="font-size:1.1em">${tempPassword}</code></p>
              </div>
              <p style="color:#888;font-size:13px">يُرجى تغيير كلمة المرور بعد أول تسجيل دخول.</p>
            </div>
          `,
        })

        successCount++
      } catch {
        errors.push({ row: i + 1, email, reason: "خطأ أثناء إنشاء الحساب" })
      }
    }

    // تسجيل العملية في جدول التتبع
    await query(
      `INSERT INTO initiative_csv_imports (initiative_id, imported_by, total_rows, success_count, skipped_count, error_count, errors)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        initiative.id,
        session!.sub,
        dataLines.length,
        successCount,
        skippedCount,
        errors.filter((e) => !e.reason.includes("مسبقاً")).length,
        JSON.stringify(errors),
      ]
    )

    return NextResponse.json({
      totalRows: dataLines.length,
      successCount,
      skippedCount,
      errorCount: errors.length,
      errors,
    })
  } catch (err) {
    console.error("[CSV Import]", err)
    return NextResponse.json({ error: "حدث خطأ أثناء معالجة الملف" }, { status: 500 })
  }
}
