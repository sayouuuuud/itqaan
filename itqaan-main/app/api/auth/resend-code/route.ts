import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { sendVerificationEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json()

        if (!email) {
            return NextResponse.json({ error: "البريد الإلكتروني مطلوب" }, { status: 400 })
        }

        const users = await query<{
            id: string
            name: string
            email: string
            email_verified: boolean
        }>(
            `SELECT id, name, email, email_verified FROM users WHERE email = $1 LIMIT 1`,
            [email.toLowerCase()]
        )

        if (users.length === 0) {
            return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 })
        }

        const user = users[0]

        if (user.email_verified) {
            return NextResponse.json({ error: "الحساب مفعل بالفعل، يرجى تسجيل الدخول" }, { status: 400 })
        }

        // Generate a new 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

        await query(
            `UPDATE users SET verification_code = $1, verification_expires_at = $2 WHERE id = $3`,
            [verificationCode, expiresAt.toISOString(), user.id]
        )

        // Send the email
        await sendVerificationEmail(user.email, user.name, verificationCode)

        return NextResponse.json(
            { message: "تم إعادة إرسال كود التفعيل بنجاح" },
            { status: 200 }
        )
    } catch (error) {
        console.error("Resend code error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
