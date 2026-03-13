import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { createNotification } from "@/lib/notifications"

// POST /api/bookings/[id]/reschedule - Create reschedule request
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session || !requireRole(session, ["reader", "student"])) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const { id } = await params
    const { proposedSlotStart, proposedSlotEnd } = await req.json()

    if (!proposedSlotStart || !proposedSlotEnd) {
        return NextResponse.json({ error: "الوقت المقترح مطلوب" }, { status: 400 })
    }

    // Fetch booking - verify the user is part of this booking
    const booking = await queryOne<{
        id: string; student_id: string; reader_id: string;
        student_name: string; reader_name: string;
        student_email: string; reader_email: string; status: string
    }>(
        `SELECT b.id, b.student_id, b.reader_id, b.status,
            s.name as student_name, s.email as student_email,
            r.name as reader_name, r.email as reader_email
     FROM bookings b
     JOIN users s ON s.id = b.student_id
     JOIN users r ON r.id = b.reader_id
     WHERE b.id = $1`,
        [id]
    )

    if (!booking) return NextResponse.json({ error: "الحجز غير موجود" }, { status: 404 })
    if (booking.status === "cancelled" || booking.status === "completed") {
        return NextResponse.json({ error: "لا يمكن تعديل هذا الحجز" }, { status: 400 })
    }

    const isReader = session.role === "reader" && booking.reader_id === session.sub
    const isStudent = session.role === "student" && booking.student_id === session.sub

    if (!isReader && !isStudent) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }

    // Cancel any existing pending reschedule requests for this booking
    await query(
        `UPDATE booking_reschedule_requests SET status = 'rejected', rejection_reason = 'طلب أحدث'
     WHERE booking_id = $1 AND status = 'pending'`,
        [id]
    )

    // Create new reschedule request
    const requestedByRole = session.role as "reader" | "student"
    const result = await queryOne<{ id: string }>(
        `INSERT INTO booking_reschedule_requests
       (booking_id, requested_by, requested_by_role, proposed_slot_start, proposed_slot_end)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
        [id, session.sub, requestedByRole, proposedSlotStart, proposedSlotEnd]
    )

    // Notify the other party
    const slotDate = new Date(proposedSlotStart)
    const formattedDate = slotDate.toLocaleDateString("ar-SA", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
    })
    const formattedTime = slotDate.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })

    if (isReader) {
        await createNotification({
            userId: booking.student_id,
            type: "reschedule_request",
            title: "طلب تعديل موعد الجلسة 📅",
            message: `اقترح المقرئ ${booking.reader_name} تغيير موعد الجلسة إلى ${formattedDate} الساعة ${formattedTime}`,
            category: "booking",
            link: "/student/sessions",
            relatedBookingId: id,
        })
    } else {
        await createNotification({
            userId: booking.reader_id,
            type: "reschedule_request",
            title: "طلب تعديل موعد الجلسة 📅",
            message: `طلب الطالب ${booking.student_name} تغيير موعد الجلسة إلى ${formattedDate} الساعة ${formattedTime}`,
            category: "booking",
            link: "/reader/sessions",
            relatedBookingId: id,
        })
    }

    return NextResponse.json({ success: true, requestId: result?.id })
}

// GET /api/bookings/[id]/reschedule - Get pending reschedule requests for this booking
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const { id } = await params

    const requests = await query<{
        id: string; requested_by_role: string; proposed_slot_start: string;
        proposed_slot_end: string; status: string; created_at: string;
        requester_name: string;
    }>(
        `SELECT rr.id, rr.requested_by_role, rr.proposed_slot_start, rr.proposed_slot_end,
            rr.status, rr.created_at, u.name as requester_name
     FROM booking_reschedule_requests rr
     JOIN users u ON u.id = rr.requested_by
     WHERE rr.booking_id = $1
     ORDER BY rr.created_at DESC
     LIMIT 5`,
        [id]
    )

    return NextResponse.json({ requests })
}
