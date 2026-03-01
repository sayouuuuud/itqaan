import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

// GET /api/bookings/:id/comments
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const { id } = await params
  const comments = await query(
    `SELECT bc.*, u.name as author_name, u.role as author_role
     FROM booking_comments bc
     JOIN users u ON u.id = bc.user_id
     WHERE bc.booking_id = $1
     ORDER BY bc.created_at ASC`,
    [id]
  )

  return NextResponse.json({ comments })
}

// POST /api/bookings/:id/comments
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const { id } = await params
  const { text } = await req.json()

  if (!text?.trim()) {
    return NextResponse.json({ error: "نص التعليق مطلوب" }, { status: 400 })
  }

  // Verify the user is part of this booking (student or reader)
  const booking = await query(
    `SELECT student_id, reader_id FROM bookings WHERE id = $1`,
    [id]
  )
  if (booking.length === 0) {
    return NextResponse.json({ error: "الحجز غير موجود" }, { status: 404 })
  }
  const b = booking[0] as { student_id: string; reader_id: string }
  if (b.student_id !== session.sub && b.reader_id !== session.sub && session.role !== "admin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const comment = await query(
    `INSERT INTO booking_comments (booking_id, user_id, comment_text)
     VALUES ($1, $2, $3)
     RETURNING *, (SELECT name FROM users WHERE id = $2) as author_name`,
    [id, session.sub, text.trim()]
  )

  return NextResponse.json({ comment: comment[0] })
}
