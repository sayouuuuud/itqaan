import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

        const { id } = params

        // Verify the user has access to delete it (participant or admin)
        const conversations = await query(
            `SELECT * FROM conversations WHERE id = $1`,
            [id]
        )

        if (conversations.length === 0) {
            return NextResponse.json({ error: "المحادثة غير موجودة" }, { status: 404 })
        }

        const conv = conversations[0]

        // Check ownership
        if (
            session.role !== "admin" &&
            session.sub !== conv.student_id &&
            session.sub !== conv.reader_id
        ) {
            return NextResponse.json({ error: "غير مصرح لك بحذف هذه المحادثة" }, { status: 403 })
        }

        // Delete the conversation (cascade will delete messages)
        await query(`DELETE FROM conversations WHERE id = $1`, [id])

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Delete conversation error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
