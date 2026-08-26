import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { queryStrict, isDbConnectionError, DB_UNAVAILABLE_MESSAGE } from "@/lib/db"
import { signToken } from "@/lib/auth"
import { sendVerificationEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, gender } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
        { status: 400 }
      )
    }

    if (gender && !['male', 'female'].includes(gender)) {
      return NextResponse.json({ error: "الجنس غير صحيح" }, { status: 400 })
    }

    // queryStrict (not queryOne) so a database outage surfaces as a real error
    // instead of an empty result that silently changes the flow.
    const existingRows = await queryStrict<{ id: string; email_verified: boolean }>(
      "SELECT id, email_verified FROM users WHERE email = $1 LIMIT 1",
      [email.toLowerCase()]
    )
    const existing = existingRows[0] || null

    const passwordHash = await bcrypt.hash(password, 10)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    let user;

    if (existing) {
      if (existing.email_verified) {
        return NextResponse.json(
          { error: "البريد الإلكتروني مسجل ومفعل مسبقاً، يرجى تسجيل الدخول" },
          { status: 409 }
        )
      } else {
        return NextResponse.json(
          {
            error: "البريد الإلكتروني مسجل ولكنه غير مفعل.",
            requiresVerification: true
          },
          { status: 409 }
        )
      }
    } else {
      // Create new record
      const newUsers = await queryStrict<{ id: string; name: string; email: string; role: string }>(
        `INSERT INTO users (name, email, password_hash, role, gender, verification_code, verification_expires_at, email_verified)
         VALUES ($1, $2, $3, 'student', $4, $5, $6, FALSE)
         RETURNING id, name, email, role`,
        [name, email.toLowerCase(), passwordHash, gender || null, verificationCode, expiresAt.toISOString()]
      )
      user = newUsers[0]
    }

    // Send verification email
    await sendVerificationEmail(user.email, user.name, verificationCode)

    return NextResponse.json({
      user,
      requiresVerification: true,
      message: "تم إنشاء الحساب، يرجى تفعيل بريدك الإلكتروني"
    }, { status: 201 })
  } catch (error) {
    console.error("Register error:", error)
    if (isDbConnectionError(error)) {
      return NextResponse.json({ error: DB_UNAVAILABLE_MESSAGE }, { status: 503 })
    }
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
