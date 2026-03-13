import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

// POST /api/auth/change-password — change password for logged-in user
export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

        const { currentPassword, newPassword } = await req.json()

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 })
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }, { status: 400 })
        }

        const rows = await query<{ password_hash: string }>(
            `SELECT password_hash FROM users WHERE id = $1`,
            [session.sub]
        )

        if (!rows.length) {
            return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 })
        }

        const isValid = await bcrypt.compare(currentPassword, rows[0].password_hash)
        if (!isValid) {
            return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 400 })
        }

        const hash = await bcrypt.hash(newPassword, 10)
        await query(
            `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
            [hash, session.sub]
        )

        return NextResponse.json({ message: "تم تغيير كلمة المرور بنجاح" })
    } catch (error) {
        console.error("Change password error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
