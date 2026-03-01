import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"
import { createNotification } from "@/lib/notifications"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !requireRole(session, ["reader"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const { id } = await params
  const { meetingLink } = await req.json()

  if (!meetingLink) {
    return NextResponse.json({ error: "رابط الجلسة مطلوب" }, { status: 400 })
  }

  // Update the booking with the new link
  await query(
    `UPDATE bookings SET meeting_link = $1 WHERE id = $2 AND reader_id = $3`,
    [meetingLink, id, session.sub]
  )

  // Fetch student ID to send notification & automated message
  const bookingData = await query<{ student_id: string }>(
    `SELECT student_id FROM bookings WHERE id = $1`,
    [id]
  )

  if (bookingData.length > 0) {
    const studentId = bookingData[0].student_id

    // Send an automated chat message in the booking comments
    const automatedMessage = `تم إضافة رابط الجلسة: ${meetingLink}`
    await query(
      `INSERT INTO booking_comments (booking_id, user_id, comment_text) VALUES ($1, $2, $3)`,
      [id, session.sub, automatedMessage]
    )

    // Send a notification to the student
    await createNotification({
      userId: studentId,
      type: "session_booked",
      title: "تم تحديد رابط الجلسة 🔗",
      message: "أضاف المقرئ رابط الدخول لجلسة التسميع القادمة. تفقد تفاصيل الجلسة.",
      category: "session",
      link: `/student/sessions`,
      relatedBookingId: id,
    })
  }

  return NextResponse.json({ success: true })
}
