import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { sendMasteredEmail, sendNeedsSessionEmail } from "@/lib/email"
import { createNotification } from "@/lib/notifications"

// POST /api/recitations/:id/review - submit review (mastered / needs_session)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== "reader") {
      return NextResponse.json({ error: "غير مصرح - يجب أن تكون مقرئاً" }, { status: 401 })
    }

    const { id } = await params
    const {
      tajweedScore, pronunciationScore, fluencyScore, memorizationScore,
      overallScore, feedback, verdict, errorMarkers
    } = await req.json()

    if (!verdict || !["mastered", "needs_session"].includes(verdict)) {
      return NextResponse.json({ error: "القرار يجب أن يكون 'mastered' أو 'needs_session'" }, { status: 400 })
    }

    // Verify the recitation is assigned to this reader
    const recitation = await queryOne<{ student_id: string; assigned_reader_id: string; status: string }>(
      `SELECT student_id, assigned_reader_id, status FROM recitations WHERE id = $1`,
      [id]
    )

    if (!recitation) {
      return NextResponse.json({ error: "التلاوة غير موجودة" }, { status: 404 })
    }

    if (recitation.assigned_reader_id && recitation.assigned_reader_id !== session.sub) {
      return NextResponse.json({ error: "هذه التلاوة ليست مسندة إليك" }, { status: 403 })
    }

    // Check if a review already exists (for update scenario)
    const existingReview = await queryOne(
      `SELECT id FROM reviews WHERE recitation_id = $1`, [id]
    )

    let review
    if (existingReview) {
      // Update existing review
      review = await query(
        `UPDATE reviews SET 
           tajweed_score = $1, pronunciation_score = $2, fluency_score = $3,
           memorization_score = $4, overall_score = $5, detailed_feedback = $6,
           verdict = $7, error_markers = $8
         WHERE recitation_id = $9
         RETURNING *`,
        [
          tajweedScore || null, pronunciationScore || null, fluencyScore || null,
          memorizationScore || null, overallScore || null, feedback || null,
          verdict, JSON.stringify(errorMarkers || []), id
        ]
      )
    } else {
      // Create new review
      review = await query(
        `INSERT INTO reviews (recitation_id, reader_id, tajweed_score, pronunciation_score, fluency_score, memorization_score, overall_score, detailed_feedback, verdict, error_markers)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          id, session.sub, tajweedScore || null, pronunciationScore || null,
          fluencyScore || null, memorizationScore || null, overallScore || null,
          feedback || null, verdict, JSON.stringify(errorMarkers || [])
        ]
      )
    }

    // Update recitation status + assign reader if not already assigned
    await query(
      `UPDATE recitations SET status = $1, assigned_reader_id = COALESCE(assigned_reader_id, $2), reviewed_at = NOW()
       WHERE id = $3`,
      [verdict, session.sub, id]
    )

    // Send email notification to student
    if (recitation.student_id) {
      const student = await queryOne<{ email: string; name: string }>(
        `SELECT email, name FROM users WHERE id = $1`, [recitation.student_id]
      )
      if (student) {
        if (verdict === "mastered") {
          sendMasteredEmail(student.email, student.name)
          await createNotification({
            userId: recitation.student_id,
            type: 'mastered',
            title: 'مبروك! لقد أتقنت سورة الفاتحة ✅',
            message: 'تمت مراجعة تلاوتك وحكم عليها بالإتقان. يمكنك الآن استخراج شهادتك.',
            category: 'recitation',
            link: '/student',
            relatedRecitationId: id,
          })
        } else {
          sendNeedsSessionEmail(student.email, student.name)
          await createNotification({
            userId: recitation.student_id,
            type: 'needs_session',
            title: 'تلاوتك تحتاج جلسة تصحيح 📅',
            message: 'قام المقرئ بمراجعة تلاوتك. تحتاج إلى جلسة تصحيح مباشرة. احجز موعدك الآن.',
            category: 'recitation',
            link: '/student/booking',
            relatedRecitationId: id,
          })
        }
      }
    }

    return NextResponse.json({ review: review[0] }, { status: 201 })
  } catch (error) {
    console.error("Submit review error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
