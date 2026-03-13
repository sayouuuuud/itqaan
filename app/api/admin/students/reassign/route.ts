import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { createNotification } from "@/lib/notifications"

// POST /api/admin/students/reassign
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    const allowedRoles: ("admin" | "reciter_supervisor")[] = ["admin", "reciter_supervisor"]
    if (!requireRole(session, allowedRoles)) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const { studentId, newReaderId } = await req.json()
    if (!studentId || !newReaderId) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 })
    }

    // 1. Get current active recitation and reader
    const recitation = await queryOne<{ id: string; assigned_reader_id: string }>(
      `SELECT id, assigned_reader_id FROM recitations 
       WHERE student_id = $1 AND status NOT IN ('mastered', 'cancelled')
       ORDER BY created_at DESC LIMIT 1`,
      [studentId]
    )

    if (!recitation) {
      return NextResponse.json({ error: "لا توجد تلاوة نشطة لهذا الطالب" }, { status: 400 })
    }

    const oldReaderId = recitation.assigned_reader_id;

    // 2. Handle reservation transfer if it exists
    const reservation = await queryOne<{ id: string }>(
      `SELECT id FROM reserved_slots WHERE student_id = $1 AND status = 'pending' AND recitation_id = $2`,
      [studentId, recitation.id]
    )

    if (reservation && oldReaderId !== newReaderId) {
      // Decrement old reader capacity
      await query(
        `UPDATE reader_profiles SET current_reserved_slots = GREATEST(0, current_reserved_slots - 1) WHERE user_id = $1`,
        [oldReaderId]
      )
      
      // Transfer reservation
      await query(
        `UPDATE reserved_slots SET reader_id = $1 WHERE id = $2`,
        [newReaderId, reservation.id]
      )

      // Increment new reader capacity
      await query(
        `UPDATE reader_profiles SET current_reserved_slots = current_reserved_slots + 1 WHERE user_id = $1`,
        [newReaderId]
      )
    }

    // 3. Update recitation assignment
    await query(
      `UPDATE recitations SET assigned_reader_id = $1 WHERE id = $2`,
      [newReaderId, recitation.id]
    )

    // 4. Update student status if they were suspended
    await query(
      `UPDATE users SET student_status = 'active', suspended_at = NULL, suspension_reason = NULL WHERE id = $1`,
      [studentId]
    )

    // 5. Notify student
    await createNotification({
      userId: studentId,
      type: 'reschedule_request', // Re-using type or should have 'reassigned'
      title: 'تغيير المقرئ المخصص 🔄',
      message: 'تم تعيينك لمقرئ جديد. يمكنك الآن متابعة تلاوتك أو حجز موعدك.',
      category: 'session',
      link: '/student',
      relatedRecitationId: recitation.id,
    })

    return NextResponse.json({ success: true, message: "تم تحويل الطالب بنجاح" })
  } catch (error) {
    console.error("Reassign error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
