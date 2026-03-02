import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

// PATCH /api/notifications/[id] — mark single notification as read
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

        const { id } = await params
        await query(
            `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
            [id, session.sub]
        )
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Mark notification error:", error)
        return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
    }
}
