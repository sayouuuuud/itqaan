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
        } else if (session.role === "admin") {
            await query(`UPDATE conversations SET unread_count_admin = 0 WHERE id = $1`, [id])
        }

        // Also mark any 'new_message' notifications as read so the bell badge doesn't accumulate
        await query(
            `UPDATE notifications SET is_read = true WHERE user_id = $1 AND type = 'new_message' AND is_read = false`,
            [session.sub]
        )

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

        // Get the conversation participants
        const conv = await query<{ student_id: string | null, reader_id: string | null, admin_id: string | null }>(
            `SELECT student_id, reader_id, admin_id FROM conversations WHERE id = $1`,
            [id]
        )

        if (conv.length === 0) {
            return NextResponse.json({ error: "المحادثة غير موجودة" }, { status: 404 })
        }

        const c = conv[0]
        let recipientId = ""

        if (session.role === "admin" && session.sub === c.admin_id) {
            // Admin sending to the user (student or reader) in this conversation
            recipientId = (c.student_id || c.reader_id)!
        } else if (session.role === "student" && session.sub === c.student_id) {
            // Student replying to admin, or to reader
            recipientId = (c.admin_id || c.reader_id)!
        } else if (session.role === "reader" && session.sub === c.reader_id) {
            // Reader replying to admin, or to student
            recipientId = (c.admin_id || c.student_id)!
        } else {
            return NextResponse.json({ error: "غير مصرح لك بإرسال رسالة في هذه المحادثة" }, { status: 403 })
        }

        const newMsg = await query(
            `INSERT INTO messages (conversation_id, sender_id, recipient_id, message_text, message_type, attachment_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [id, session.sub, recipientId, text, type || "text", attachmentUrl || null]
        )

        // Update conversation metadata and unread counts
        const recipientUser = await query<{ role: string }>(`SELECT role FROM users WHERE id = $1`, [recipientId])
        let unreadColumn = ""
        let link = "/dashboard"

        if (recipientUser.length > 0) {
            const role = recipientUser[0].role
            if (role === "student") {
                unreadColumn = "unread_count_student"
                link = "/student/chat"
            } else if (role === "reader") {
                unreadColumn = "unread_count_reader"
                link = "/reader/chat"
            } else if (role === "admin") {
                unreadColumn = "unread_count_admin"
                link = `/admin/chat?userId=${session.sub}&userRole=${session.role}`
            }
        }

        if (unreadColumn) {
            await query(
                `UPDATE conversations 
                 SET last_message_at = NOW(), 
                     last_message_preview = $1, 
                     ${unreadColumn} = ${unreadColumn} + 1 
                 WHERE id = $2`,
                [text.substring(0, 100), id]
            )
        } else {
            await query(
                `UPDATE conversations SET last_message_at = NOW(), last_message_preview = $1 WHERE id = $2`,
                [text.substring(0, 100), id]
            )
        }

        const { createNotification } = await import('@/lib/notifications')
        await createNotification({
            userId: recipientId,
            type: "new_message",
            title: "رسالة جديدة",
            message: `لديك رسالة جديدة من ${session.name || "مستخدم"}`,
            category: "message",
            link
        })

        return NextResponse.json({ message: newMsg[0] }, { status: 201 })
    } catch (error) {
        console.error("Create message error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
