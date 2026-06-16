import { NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { getManagedInitiative } from "@/lib/initiatives"

// GET /api/initiative/participants/[id] - تفاصيل طالب + تاريخ تلاواته الكامل
// مقيّد صارماً: الطالب لازم ينتمي لمبادرة المشرف
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!requireRole(session, ["initiative_admin", "admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const initiative = await getManagedInitiative(session)
  if (!initiative) {
    return NextResponse.json({ error: "لا توجد مبادرة مرتبطة بحسابك" }, { status: 404 })
  }

  const { id } = await params

  // التحقق من أن الطالب ينتمي لهذه المبادرة
  const student = await queryOne<{
    id: string
    name: string
    email: string
    gender: string | null
    email_verified: boolean
    created_at: string
    initiative_id: string | null
  }>(
    `SELECT id, name, email, gender, email_verified, created_at, initiative_id
     FROM users WHERE id = $1 AND role = 'student' AND initiative_id = $2`,
    [id, initiative.id]
  )

  if (!student) {
    return NextResponse.json({ error: "الطالب غير موجود في هذه المبادرة" }, { status: 404 })
  }

  // تاريخ التلاوات الكامل
  const recitations = await query<{
    id: string
    status: string
    reader_name: string | null
    student_notes: string | null
    qiraah: string | null
    score: number | null
    created_at: string
    reviewed_at: string | null
    audio_duration_seconds: number | null
  }>(
    `SELECT
        r.id, r.status, r.student_notes, r.qiraah, r.score,
        r.created_at, r.reviewed_at, r.audio_duration_seconds,
        u.name AS reader_name
     FROM recitations r
     LEFT JOIN users u ON u.id = r.reader_id
     WHERE r.student_id = $1
     ORDER BY r.created_at DESC`,
    [id]
  )

  // ملخص إحصائي
  const total = recitations.length
  const mastered = recitations.filter((r) => r.status === "mastered").length
  const inReview = recitations.filter((r) => r.status === "in_review").length
  const pending = recitations.filter((r) => r.status === "pending").length
  const masteryRate = total > 0 ? Math.round((mastered / total) * 100) : 0

  return NextResponse.json({
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      gender: student.gender,
      emailVerified: student.email_verified,
      joinedAt: student.created_at,
    },
    summary: { total, mastered, inReview, pending, masteryRate },
    recitations: recitations.map((r) => ({
      id: r.id,
      status: r.status,
      readerName: r.reader_name,
      studentNotes: r.student_notes,
      qiraah: r.qiraah,
      score: r.score,
      createdAt: r.created_at,
      reviewedAt: r.reviewed_at,
      durationSeconds: r.audio_duration_seconds,
    })),
  })
}
