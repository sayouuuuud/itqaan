import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

        // 1. Unread notifications
        const notifRes = await query<{ count: string }>(
            `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
            [session.sub]
        )
        const notifications = parseInt(notifRes[0]?.count || "0")

        // 2. Unread messages
        let messageCount = 0
        if (session.role === "student") {
            const msgRes = await query<{ sum: string }>(
                `SELECT SUM(unread_count_student) as sum FROM conversations WHERE student_id = $1`,
                [session.sub]
            )
            messageCount = parseInt(msgRes[0]?.sum || "0")
        } else if (session.role === "reader") {
            const msgRes = await query<{ sum: string }>(
                `SELECT SUM(unread_count_reader) as sum FROM conversations WHERE reader_id = $1`,
                [session.sub]
            )
            messageCount = parseInt(msgRes[0]?.sum || "0")
        } else if (session.role === "admin") {
            const msgRes = await query<{ sum: string }>(
                `SELECT SUM(unread_count_admin) as sum FROM conversations WHERE admin_id = $1`,
                [session.sub]
            )
            messageCount = parseInt(msgRes[0]?.sum || "0")
        }

        return NextResponse.json({
            notifications,
            messages: messageCount
        })
    } catch (error) {
        console.error("Unread counts error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
