import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { createNotification } from "@/lib/notifications"

// PATCH /api/bookings/[id]/reschedule/[reqId] - accept or reject a reschedule request
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; reqId: string }> }
) {
    const session = await getSession()
    if (!session || !requireRole(session, ["reader", "student"])) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const { id, reqId } = await params
    const { action, rejectionReason } = await req.json() // action: 'accept' | 'reject'

    if (!["accept", "reject"].includes(action)) {
        return NextResponse.json({ error: "الإجراء غير صحيح" }, { status: 400 })
    }

    // Fetch the request and booking
    const reqRow = await queryOne<{
        id: string; booking_id: string; requested_by: string; requested_by_role: string;
        proposed_slot_start: string; proposed_slot_end: string; status: string;
    }>(
        `SELECT * FROM booking_reschedule_requests WHERE id = $1 AND booking_id = $2 AND status = 'pending'`,
        [reqId, id]
    )

    if (!reqRow) {
        return NextResponse.json({ error: "الطلب غير موجود أو تم البت فيه" }, { status: 404 })
    }

    const booking = await queryOne<{
        student_id: string; reader_id: string;
        student_name: string; reader_name: string;
    }>(
        `SELECT b.student_id, b.reader_id, s.name as student_name, r.name as reader_name
     FROM bookings b
     JOIN users s ON s.id = b.student_id
     JOIN users r ON r.id = b.reader_id
     WHERE b.id = $1`,
        [id]
    )

    if (!booking) return NextResponse.json({ error: "الحجز غير موجود" }, { status: 404 })

    // Only the OTHER party can accept/reject (not the requester)
    const isRequester = reqRow.requested_by === session.sub
    if (isRequester) {
        return NextResponse.json({ error: "لا تستطيع قبول طلبك الخاص" }, { status: 403 })
    }

    // Verify user is part of this booking
    const isInBooking =
        booking.student_id === session.sub || booking.reader_id === session.sub
    if (!isInBooking) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }

    if (action === "accept") {
        // Update the booking slot times
        await query(
            `UPDATE bookings
       SET slot_start = $1, slot_end = $2, scheduled_at = $1, status = 'confirmed', updated_at = NOW()
       WHERE id = $3`,
            [reqRow.proposed_slot_start, reqRow.proposed_slot_end, id]
        )

        // Mark request as accepted
        await query(
            `UPDATE booking_reschedule_requests SET status = 'accepted', updated_at = NOW() WHERE id = $1`,
            [reqId]
        )

        // Notify the requester
        const newDate = new Date(reqRow.proposed_slot_start).toLocaleDateString("ar-SA", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
        })
        await createNotification({
            userId: reqRow.requested_by,
            type: "reschedule_accepted",
            title: "تم قبول تعديل الموعد ✅",
            message: `تم قبول طلب تعديل الموعد. موعدك الجديد: ${newDate}`,
            category: "booking",
            link: reqRow.requested_by_role === "reader" ? "/reader/sessions" : "/student/sessions",
            relatedBookingId: id,
        })
    } else {
        // Mark request as rejected
        await query(
            `UPDATE booking_reschedule_requests SET status = 'rejected', rejection_reason = $1, updated_at = NOW() WHERE id = $2`,
            [rejectionReason || "تم الرفض", reqId]
        )

        // Notify the requester about rejection
        const requesterLink = reqRow.requested_by_role === "reader" ? "/reader/sessions" : "/student/sessions"
        await createNotification({
            userId: reqRow.requested_by,
            type: "reschedule_rejected",
            title: "تم رفض تعديل الموعد ❌",
            message: rejectionReason || "تم رفض طلب تعديل الموعد من الطرف الآخر.",
            category: "booking",
            link: requesterLink,
            relatedBookingId: id,
        })
    }

    return NextResponse.json({ success: true })
}
