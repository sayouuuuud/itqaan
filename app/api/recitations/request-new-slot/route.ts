import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { createNotification } from "@/lib/notifications"
import { addDays } from "date-fns"

// POST /api/recitations/request-new-slot
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    // 1. Check if student is suspended
    const user = await queryOne<{ student_status: string }>(
      `SELECT student_status FROM users WHERE id = $1`,
      [session.sub]
    )

    if (!user || user.student_status !== 'suspended') {
      return NextResponse.json({ error: "لا يمكن تنفيذ هذا الطلب في حالتك الحالية" }, { status: 400 })
    }

    // 2. Find the latest recitation that needs a session
    const recitation = await queryOne<{ id: string; assigned_reader_id: string }>(
      `SELECT id, assigned_reader_id FROM recitations 
       WHERE student_id = $1 AND status IN ('needs_session', 'session_booked')
       ORDER BY created_at DESC LIMIT 1`,
      [session.sub]
    )

    if (!recitation || !recitation.assigned_reader_id) {
       return NextResponse.json({ error: "لا توجد تلاوة نشطة تتطلب موعداً" }, { status: 400 })
    }

    // 3. Re-activate student
    await query(
      `UPDATE users SET student_status = 'active', suspended_at = NULL, suspension_reason = NULL WHERE id = $1`,
      [session.sub]
    )

    // 4. Create a fresh reservation (expires in 3 days)
    const expiryDate = addDays(new Date(), 3)
    await query(
      `INSERT INTO reserved_slots (student_id, reader_id, recitation_id, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [session.sub, recitation.assigned_reader_id, recitation.id, expiryDate]
    )

    // 5. Increment reserved count for reader
    await query(
      `UPDATE reader_profiles SET current_reserved_slots = current_reserved_slots + 1 WHERE user_id = $1`,
      [recitation.assigned_reader_id]
    )

    // 6. Notify reader
    await createNotification({
      userId: recitation.assigned_reader_id,
      type: 'reschedule_request',
      title: 'طلب تفعيل موعد جديد 🔄',
      message: `طلب الطالب ${session.name} الحصول على مهلة جديدة لحجز جلسته.`,
      category: 'session',
      link: '/reader/sessions',
      relatedRecitationId: recitation.id,
    })

    return NextResponse.json({ success: true, message: "تم تفعيل حسابك، يرجى حجز موعدك الآن خلال 3 أيام" })
  } catch (error) {
    console.error("Request new slot error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
