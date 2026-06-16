import { NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"

// GET /api/admin/initiatives/compare?ids=uuid1,uuid2,...
// يرجع مقاييس مجمّعة لكل مبادرة مُحدّدة لعرضها جنباً بجنب
export async function GET(req: Request) {
  const session = await getSession()
  if (!requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const raw = searchParams.get("ids") || ""
  const ids = raw.split(",").map((s) => s.trim()).filter(Boolean)

  if (ids.length < 2) {
    return NextResponse.json({ error: "يجب تحديد مبادرتين على الأقل" }, { status: 400 })
  }
  if (ids.length > 6) {
    return NextResponse.json({ error: "الحد الأقصى 6 مبادرات للمقارنة" }, { status: 400 })
  }

  // نجيب الاسم + المقاييس الأساسية لكل مبادرة دفعة واحدة
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ")

  const rows = await query<{
    id: string
    name: string
    status: string
    participants: string
    verified: string
    total_recitations: string
    mastered: string
    in_review: string
    last_activity: string | null
  }>(
    `SELECT
        i.id,
        i.name,
        i.status,
        COUNT(DISTINCT u.id)                                          AS participants,
        COUNT(DISTINCT u.id) FILTER (WHERE u.email_verified)          AS verified,
        COUNT(r.id)                                                   AS total_recitations,
        COUNT(r.id) FILTER (WHERE r.status = 'mastered')              AS mastered,
        COUNT(r.id) FILTER (WHERE r.status = 'in_review')             AS in_review,
        MAX(r.created_at)                                             AS last_activity
     FROM initiatives i
     LEFT JOIN users u ON u.initiative_id = i.id AND u.role = 'student'
     LEFT JOIN recitations r ON r.initiative_id = i.id
     WHERE i.id IN (${placeholders})
     GROUP BY i.id
     ORDER BY i.name`,
    ids
  )

  const data = rows.map((r) => {
    const total = parseInt(r.total_recitations) || 0
    const mastered = parseInt(r.mastered) || 0
    return {
      id: r.id,
      name: r.name,
      status: r.status,
      participants: parseInt(r.participants) || 0,
      verifiedParticipants: parseInt(r.verified) || 0,
      totalRecitations: total,
      mastered,
      inReview: parseInt(r.in_review) || 0,
      masteryRate: total > 0 ? Math.round((mastered / total) * 100) : 0,
      lastActivity: r.last_activity,
    }
  })

  return NextResponse.json({ initiatives: data })
}
