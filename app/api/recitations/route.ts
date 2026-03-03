import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import { createNotification } from "@/lib/notifications"

// GET /api/recitations - list recitations
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    let whereClause = ""
    const params: unknown[] = []

    if (session.role === "student") {
      params.push(session.sub)
      whereClause = "WHERE r.student_id = $1"
    } else if (session.role === "reader") {
      params.push(session.sub)
      whereClause = "WHERE (r.assigned_reader_id = $1 OR (r.assigned_reader_id IS NULL AND r.status = 'pending'))"
    }

    if (status) {
      params.push(status)
      whereClause += whereClause
        ? ` AND r.status = $${params.length}`
        : `WHERE r.status = $${params.length}`
    }

    params.push(limit, offset)

    const recitations = await query(
      `SELECT r.*, 
              s.name as student_name, s.email as student_email,
              rd.name as reader_name
       FROM recitations r
       LEFT JOIN users s ON r.student_id = s.id
       LEFT JOIN users rd ON r.assigned_reader_id = rd.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    )

    return NextResponse.json({ recitations, page, limit })
  } catch (error) {
    console.error("Get recitations error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}

// POST /api/recitations - submit new recitation (Al-Fatiha only)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "student") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const { audioUrl, audioDuration, notes, qiraah } = await req.json()

    if (!audioUrl) {
      return NextResponse.json({ error: "رابط التسجيل الصوتي مطلوب" }, { status: 400 })
    }

    // Check if student already has a pending/in_review recitation (prevent duplicate submissions)
    const existing = await query(
      `SELECT id, status FROM recitations 
       WHERE student_id = $1 AND status IN ('pending', 'in_review')
       ORDER BY created_at DESC LIMIT 1`,
      [session.sub]
    )

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "لديك تسجيل بانتظار المراجعة بالفعل. لا يمكنك إرسال تسجيل جديد حتى تظهر نتيجة التسجيل السابق." },
        { status: 409 }
      )
    }

    const result = await query(
      `INSERT INTO recitations (student_id, surah_name, surah_number, ayah_from, ayah_to, audio_url, audio_duration_seconds, submission_type, student_notes, qiraah, status)
       VALUES ($1, 'الفاتحة', 1, 1, 7, $2, $3, 'recorded', $4, $5, 'pending')
       RETURNING *`,
      [session.sub, audioUrl, audioDuration || null, notes || null, qiraah || 'حفص عن عاصم']
    )

    // Auto-assign a reader matching the student's gender
    const student = await query<{ gender: string }>("SELECT gender FROM users WHERE id = $1", [session.sub])
    if (student.length > 0 && student[0].gender) {
      const reader = await query<{ id: string }>(
        `SELECT u.id FROM users u
         JOIN reader_profiles rp ON u.id = rp.user_id
         WHERE u.role = 'reader' AND u.approval_status = 'approved' AND u.is_active = true AND rp.is_accepting_students = true AND u.gender = $1
         ORDER BY RANDOM() LIMIT 1`,
        [student[0].gender]
      )
      if (reader.length > 0) {
        await query("UPDATE recitations SET assigned_reader_id = $1, assigned_at = NOW() WHERE id = $2", [reader[0].id, result[0].id])
        
        // Notify the assigned reader
        try {
          await createNotification({
            userId: reader[0].id,
            type: 'recitation_received',
            title: 'تم تعيينك لتقييم تلاوة جديدة',
            message: 'تم تعيينك لتقييم تلاوة جديدة لسورة الفاتحة. يرجى مراجعتها في أقرب وقت.',
            category: 'recitation',
            link: '/reader/recitations',
            relatedRecitationId: result[0].id as string,
          })
        } catch (notifError) {
          console.error("Failed to create notification for reader:", notifError)
          // Don't fail the request if notification fails
        }
      }
    }

    // Notify student that submission was received
    await createNotification({
      userId: session.sub,
      type: 'recitation_received',
      title: 'تم استلام تلاوتك ✅',
      message: 'تم إرسال تلاوتك بنجاح وسيتم مراجعتها من قبل مقرئ معتمد قريبًا.',
      category: 'recitation',
      link: '/student/recitations',
      relatedRecitationId: result[0].id as string,
    })

    // Notify admins about new recitation
    const admins = await query<{ id: string }>(`SELECT id FROM users WHERE role = 'admin' AND is_active = true`)
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'new_recitation_admin',
        title: 'تلاوة جديدة تنتظر المراجعة',
        message: 'ارسل طالب تلاوته لسورة الفاتحة وتحتاج إلى تعيين مقرئ.',
        category: 'recitation',
        link: '/admin/recitations',
        relatedRecitationId: result[0].id as string,
      })
    }

    return NextResponse.json({ recitation: result[0] }, { status: 201 })
  } catch (error) {
    console.error("Create recitation error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
