import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"
import { createNotification } from "@/lib/notifications"
import { sendSessionLinkEmail } from "@/lib/email"

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

  // Fetch booking details for email + notification
  const bookingRows = await query<{
    student_id: string
    student_name: string
    student_email: string
    reader_name: string
    slot_start: string
  }>(
    `SELECT b.student_id, s.name as student_name, s.email as student_email,
            r.name as reader_name, b.slot_start
     FROM bookings b
     JOIN users s ON s.id = b.student_id
     JOIN users r ON r.id = b.reader_id
     WHERE b.id = $1`,
    [id]
  )

  if (bookingRows.length > 0) {
    const { student_id, student_name, student_email, reader_name, slot_start } = bookingRows[0]

    const slotDate = new Date(slot_start)
    const sessionDate = slotDate.toLocaleDateString("ar-SA", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    })
    const sessionTime = slotDate.toLocaleTimeString("ar-SA", {
      hour: "2-digit", minute: "2-digit",
    })

    // Send automated chat comment
    await query(
      `INSERT INTO booking_comments (booking_id, user_id, comment_text) VALUES ($1, $2, $3)`,
      [id, session.sub, `تم إضافة رابط الجلسة: ${meetingLink}`]
    )

    // Send notification to student
    await createNotification({
      userId: student_id,
      type: "session_booked",
      title: "تم تحديد رابط الجلسة 🔗",
      message: "أضاف المقرئ رابط الدخول لجلسة التسميع القادمة. تفقد تفاصيل الجلسة.",
      category: "session",
      link: `/student/sessions`,
      relatedBookingId: id,
    })

    // Send email with session details
    sendSessionLinkEmail(
      student_email,
      student_name,
      reader_name,
      sessionDate,
      sessionTime,
      meetingLink
    ).catch(err => console.error("[Email] Failed to send session link email:", err))
  }

  return NextResponse.json({ success: true })
}

