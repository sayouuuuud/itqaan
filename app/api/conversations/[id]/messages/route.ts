import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

// GET /api/conversations/[id]/messages
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

        const { id } = await params

        const messages = await query(
            `SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar, u.role as sender_role
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
            [id]
        )

        // Mark messages as read
        await query(
            `UPDATE messages SET is_read = true, read_at = NOW()
       WHERE conversation_id = $1 AND recipient_id = $2 AND is_read = false`,
            [id, session.sub]
        )

        // Reset unread count
        if (session.role === "student") {
            await query(`UPDATE conversations SET unread_count_student = 0 WHERE id = $1`, [id])
        } else if (session.role === "reader") {
            await query(`UPDATE conversations SET unread_count_reader = 0 WHERE id = $1`, [id])
        }

        return NextResponse.json({ messages })
    } catch (error) {
        console.error("Get messages error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}

// POST /api/conversations/[id]/messages
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

        const { id } = await params
        const { text, type, attachmentUrl } = await req.json()

        if (!text) {
            return NextResponse.json({ error: "نص الرسالة مطلوب" }, { status: 400 })
        }

        // Get the other participant
        const conv = await query(
            `SELECT student_id, reader_id FROM conversations WHERE id = $1`,
            [id]
        )

        if (conv.length === 0) {
            return NextResponse.json({ error: "المحادثة غير موجودة" }, { status: 404 })
        }

        let recipientId = ""
        if (session.role === "student" && session.sub === conv[0].student_id) {
            recipientId = conv[0].reader_id
        } else if (session.role === "reader" && session.sub === conv[0].reader_id) {
            recipientId = conv[0].student_id
        } else {
            return NextResponse.json({ error: "غير مصرح لك بإرسال رسالة في هذه المحادثة" }, { status: 403 })
        }

        const newMsg = await query(
            `INSERT INTO messages (conversation_id, sender_id, recipient_id, message_text, message_type, attachment_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [id, session.sub, recipientId, text, type || "text", attachmentUrl || null]
        )

        return NextResponse.json({ message: newMsg[0] }, { status: 201 })
    } catch (error) {
        console.error("Create message error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
