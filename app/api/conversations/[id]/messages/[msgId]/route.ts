import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string, msgId: string } }
) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

        const { id, msgId } = params
        const { message_text } = await req.json()

        if (!message_text || !message_text.trim()) {
            return NextResponse.json({ error: "محتوى الرسالة مطلوب" }, { status: 400 })
        }

        // Verify the message exists and belongs to the user
        const messages = await query(
            `SELECT sender_id FROM messages WHERE id = $1 AND conversation_id = $2`,
            [msgId, id]
        )

        if (messages.length === 0) {
            return NextResponse.json({ error: "الرسالة غير موجودة" }, { status: 404 })
        }

        const msg = messages[0]

        // Only the sender can edit their message
        if (msg.sender_id !== session.sub) {
            return NextResponse.json({ error: "غير مصرح لك بتعديل هذه الرسالة" }, { status: 403 })
        }

        // Update the message
        const updated = await query(
            `UPDATE messages 
             SET message_text = $1, updated_at = NOW() 
             WHERE id = $2 AND conversation_id = $3 
             RETURNING *`,
            [message_text.trim(), msgId, id]
        )

        return NextResponse.json({ success: true, message: updated[0] })
    } catch (error) {
        console.error("Edit message error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string, msgId: string } }
) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

        const { id, msgId } = params

        // Verify the message exists and belongs to the user or user is admin
        const messages = await query(
            `SELECT sender_id FROM messages WHERE id = $1 AND conversation_id = $2`,
            [msgId, id]
        )

        if (messages.length === 0) {
            return NextResponse.json({ error: "الرسالة غير موجودة" }, { status: 404 })
        }

        const msg = messages[0]

        // Only the sender OR an admin can delete a message
        if (msg.sender_id !== session.sub && session.role !== "admin") {
            return NextResponse.json({ error: "غير مصرح لك بحذف هذه الرسالة" }, { status: 403 })
        }

        // Delete the message
        await query(
            `DELETE FROM messages WHERE id = $1 AND conversation_id = $2`,
            [msgId, id]
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Delete message error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
