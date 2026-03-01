import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import bcrypt from "bcryptjs"

// GET /api/admin/profile - Get current admin data
export async function GET() {
    try {
        const session = await getSession()
        if (!session || !requireRole(session, ["admin"])) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
        }

        const user = await queryOne(
            "SELECT id, name, email FROM users WHERE id = $1",
            [session.sub]
        )

        return NextResponse.json({ user })
    } catch (error) {
        console.error("Get admin profile error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}

// PATCH /api/admin/profile - Update admin profile
export async function PATCH(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || !requireRole(session, ["admin"])) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
        }

        const { name, email, password } = await req.json()
        const adminId = session.sub

        const updates: string[] = []
        const values: any[] = []

        if (name) {
            values.push(name)
            updates.push(`name = $${values.length}`)
        }

        if (email) {
            values.push(email.toLowerCase())
            updates.push(`email = $${values.length}`)
        }

        if (password && password.length >= 6) {
            const passwordHash = await bcrypt.hash(password, 10)
            values.push(passwordHash)
            updates.push(`password_hash = $${values.length}`)
        }

        if (updates.length === 0) {
            return NextResponse.json({ error: "لا توجد بيانات لتحديثها" }, { status: 400 })
        }

        values.push(adminId)
        await query(
            `UPDATE users SET ${updates.join(", ")} WHERE id = $${values.length}`,
            values
        )

        return NextResponse.json({ success: true, message: "تم تحديث الملف الشخصي بنجاح" })
    } catch (error) {
        console.error("Admin profile update error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
