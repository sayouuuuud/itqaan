import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

// GET /api/conversations - list all conversations for the user
export async function GET(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

        let queryStr = `
      SELECT c.id, c.student_id, c.reader_id, c.admin_id, c.last_message_at, c.last_message_preview,
             c.unread_count_student, c.unread_count_reader,
             s.name as student_name, s.avatar_url as student_avatar,
             r.name as reader_name, r.avatar_url as reader_avatar,
             a.name as admin_name, a.avatar_url as admin_avatar
      FROM conversations c
      LEFT JOIN users s ON c.student_id = s.id
      LEFT JOIN users r ON c.reader_id = r.id
      LEFT JOIN users a ON c.admin_id = a.id
    `
        const params: unknown[] = [session.sub]

        if (session.role === "student") {
            queryStr += " WHERE c.student_id = $1"
        } else if (session.role === "reader") {
            queryStr += " WHERE c.reader_id = $1"
        } else if (session.role === "admin") {
            queryStr += " WHERE c.admin_id = $1"
        } else {
            return NextResponse.json({ conversations: [] })
        }

        queryStr += " ORDER BY c.last_message_at DESC NULLS LAST"

        const conversations = await query(queryStr, params)

        return NextResponse.json({ conversations })
    } catch (error) {
        console.error("Get conversations error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}

// POST /api/conversations - find or create a conversation
export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

        const { studentId, readerId, userId, userRole } = await req.json()

        // Admin creating a conversation with a user
        if (session.role === "admin") {
            if (userId && userRole) {
                const targetStudentId = userRole === "student" ? userId : null
                const targetReaderId = userRole === "reader" ? userId : null

                // Find existing admin conversation with this user
                const existingQuery = targetStudentId
                    ? `SELECT id FROM conversations WHERE admin_id = $1 AND student_id = $2 AND reader_id IS NULL`
                    : `SELECT id FROM conversations WHERE admin_id = $1 AND reader_id = $2 AND student_id IS NULL`

                const existing = await query(existingQuery, [session.sub, userId])
                if (existing.length > 0) return NextResponse.json({ conversation: existing[0] })

                const result = await query(
                    `INSERT INTO conversations (admin_id, student_id, reader_id) VALUES ($1, $2, $3) RETURNING id`,
                    [session.sub, targetStudentId, targetReaderId]
                )
                return NextResponse.json({ conversation: result[0] }, { status: 201 })
            }
            return NextResponse.json({ error: "userId and userRole are required" }, { status: 400 })
        }

        // Student or reader creating a student-reader conversation
        if (!studentId || !readerId) {
            return NextResponse.json({ error: "معرف الطالب والمقرئ مطلوبان" }, { status: 400 })
        }

        // Ensure the user is part of the conversation
        if (session.role === "student" && studentId !== session.sub) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
        }
        if (session.role === "reader" && readerId !== session.sub) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
        }

        // Find existing
        const existing = await query(
            `SELECT id FROM conversations WHERE student_id = $1 AND reader_id = $2 AND admin_id IS NULL`,
            [studentId, readerId]
        )

        if (existing.length > 0) {
            return NextResponse.json({ conversation: existing[0] })
        }

        // Create new
        const result = await query(
            `INSERT INTO conversations (student_id, reader_id) VALUES ($1, $2) RETURNING id`,
            [studentId, readerId]
        )

        return NextResponse.json({ conversation: result[0] }, { status: 201 })
    } catch (error) {
        console.error("Create conversation error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
