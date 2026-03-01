import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import { createNotification } from "@/lib/notifications"

// GET /api/bookings
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    let whereClause = ""
    const params: unknown[] = []

    if (session.role === "student") {
      params.push(session.sub)
      whereClause = "WHERE b.student_id = $1"
    } else if (session.role === "reader") {
      params.push(session.sub)
      whereClause = "WHERE b.reader_id = $1"
    }

    const bookings = await query(
      `SELECT b.*,
              s.name as student_name, s.email as student_email,
              r.name as reader_name
       FROM bookings b
       JOIN users s ON b.student_id = s.id
       JOIN users r ON b.reader_id = r.id
       ${whereClause}
       ORDER BY b.slot_start DESC`,
      params
    )

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error("Get bookings error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}

// POST /api/bookings - create booking with auto-assign (Logic B)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "student") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    // Accept both formats: { slotStart, slotEnd } or { date, startTime, endTime }
    const body = await req.json()
    let slotStart = body.slotStart
    let slotEnd = body.slotEnd
    const notes = body.notes

    // Build timestamps from date + time if needed
    if (!slotStart && body.date && body.startTime) {
      // Ensure time string has only HH:mm (or HH:mm:ss) and doesn't get double seconds
      const cleanStartTime = body.startTime.split(':').slice(0, 2).join(':')
      slotStart = `${body.date}T${cleanStartTime}:00`

      const endTime = body.endTime || body.startTime
      const cleanEndTime = endTime.split(':').slice(0, 2).join(':')
      slotEnd = `${body.date}T${cleanEndTime}:00`
    }

    if (!slotStart || !slotEnd) {
      return NextResponse.json({ error: "بيانات الحجز غير مكتملة" }, { status: 400 })
    }

    let slotDate = ""
    try {
      const parsedStart = new Date(slotStart)
      if (isNaN(parsedStart.getTime())) {
        // Fallback: try to extract YYYY-MM-DD directly if the string matches
        const dMatch = String(slotStart).match(/^(\d{4}-\d{2}-\d{2})/)
        if (dMatch) {
          slotDate = dMatch[1]
        } else {
          return NextResponse.json({ error: "تاريخ/وقت الحجز غير صالح" }, { status: 400 })
        }
      } else {
        slotDate = parsedStart.toISOString().split("T")[0]
      }
    } catch (err) {
      return NextResponse.json({ error: "خطأ في معالجة التاريخ" }, { status: 400 })
    }

    // Get student's gender for matching
    const studentRows = await query<{ gender: string }>(
      `SELECT gender FROM users WHERE id = $1`, [session.sub]
    )
    const studentGender = studentRows[0]?.gender

    // Logic B: Auto-assign reader with configurable strategy
    // Read strategy from system_settings (default: least_booked_today)
    const strategyRows = await query<{ setting_value: string }>(
      `SELECT setting_value FROM system_settings WHERE setting_key = 'reader_assignment_strategy' LIMIT 1`
    )
    const strategy = strategyRows[0]?.setting_value?.replace(/^"|"$/g, '') || 'least_booked_today'

    let genderFilter = ""
    const queryParams: unknown[] = [slotStart, slotEnd, slotDate]

    if (studentGender) {
      genderFilter = "AND u.gender = $4"
      queryParams.push(studentGender)
    }

    // Build ORDER BY based on strategy
    let orderByClause = ""
    if (strategy === 'least_booked_today') {
      orderByClause = "ORDER BY booking_count ASC"
    } else if (strategy === 'least_total_bookings') {
      orderByClause = "ORDER BY total_booking_count ASC"
    } else {
      orderByClause = "ORDER BY RANDOM()"
    }

    const availableReaders = await query<{ id: string; booking_count: number }>(
      `SELECT u.id,
              COALESCE((SELECT COUNT(*) FROM bookings b WHERE b.reader_id = u.id AND b.status IN ('pending', 'confirmed') AND DATE(b.slot_start) = $3::date), 0) as booking_count,
              COALESCE((SELECT COUNT(*) FROM bookings b2 WHERE b2.reader_id = u.id AND b2.status IN ('pending', 'confirmed', 'completed')), 0) as total_booking_count,
              COALESCE((SELECT AVG(rating) FROM ratings rt WHERE rt.reader_id = u.id), 0) as avg_rating
       FROM users u
       WHERE u.role = 'reader'
         AND u.is_active = true
         AND u.approval_status IN ('approved', 'auto_approved')
         ${genderFilter}
         AND NOT EXISTS (
           SELECT 1 FROM bookings b
           WHERE b.reader_id = u.id
           AND b.status IN ('pending', 'confirmed')
           AND b.slot_start < $2 AND b.slot_end > $1
         )
       ${orderByClause}
       LIMIT 1`,
      queryParams
    )

    if (availableReaders.length === 0) {
      return NextResponse.json(
        { error: "لا يوجد مقرئ متاح في هذا الوقت. يرجى اختيار وقت آخر." },
        { status: 409 }
      )
    }

    const assignedReaderId = availableReaders[0].id

    // Find the latest needs_session recitation to link to booking
    const needsSessionRecitation = await query<{ id: string }>(
      `SELECT id FROM recitations WHERE student_id = $1 AND status = 'needs_session'
       ORDER BY created_at DESC LIMIT 1`,
      [session.sub]
    )

    const recitationId = needsSessionRecitation[0]?.id || null

    const result = await query(
      `INSERT INTO bookings (student_id, reader_id, recitation_id, slot_start, slot_end, notes, status, scheduled_at, duration_minutes)
       VALUES ($1, $2, $3, $4, $5, $6, 'confirmed', $4, 30)
       RETURNING *`,
      [session.sub, assignedReaderId, recitationId, slotStart, slotEnd, notes || null]
    )

    // Update the latest recitation status to session_booked (PostgreSQL-safe subquery)
    if (recitationId) {
      await query(
        `UPDATE recitations SET status = 'session_booked' WHERE id = $1`,
        [recitationId]
      )
    }

    // Notify student and reader
    const notifDate = new Date(slotStart).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const notifTime = new Date(slotStart).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    await createNotification({
      userId: session.sub,
      type: 'session_booked',
      title: 'تم تأكيد حجز جلستك ✅',
      message: `تم حجز جلستك بنجاح يوم ${notifDate} الساعة ${notifTime}. ستجد رابط الجلسة هنا قبل الموعد.`,
      category: 'session',
      link: '/student/sessions',
      relatedBookingId: result[0].id as string,
    })
    await createNotification({
      userId: assignedReaderId,
      type: 'session_booked',
      title: 'حجز جلسة جديدة 📅',
      message: `تم حجز جلسة تصحيح معك يوم ${notifDate} الساعة ${notifTime}.`,
      category: 'session',
      link: '/reader/sessions',
      relatedBookingId: result[0].id as string,
    })

    return NextResponse.json({ booking: result[0] }, { status: 201 })
  } catch (error) {
    console.error("Create booking error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
