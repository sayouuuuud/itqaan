import { query, queryOne } from "@/lib/db"

export interface InitiativeStats {
  totals: {
    participants: number
    verifiedParticipants: number
    totalRecitations: number
    masteredCount: number
    pendingCount: number
    inReviewCount: number
    masteryRate: number
  }
  statusDistribution: { status: string; count: number }[]
  recitationsOverTime: { date: string; count: number }[]
  topParticipants: { name: string; mastered: number; total: number }[]
}

const STATUS_LABELS: Record<string, string> = {
  pending: "بانتظار التعيين",
  in_review: "قيد المراجعة",
  mastered: "متقن",
  needs_session: "يحتاج جلسة",
  session_booked: "تم حجز جلسة",
  rejected: "مرفوض",
}

export const INITIATIVE_STATUS_LABELS = STATUS_LABELS

// Compute all statistics for a single initiative, strictly scoped by initiative_id.
export async function computeInitiativeStats(initiativeId: string): Promise<InitiativeStats> {
  const totalsRow = await queryOne<{
    participants: string
    verified: string
  }>(
    `SELECT
        COUNT(*) AS participants,
        COUNT(*) FILTER (WHERE email_verified) AS verified
     FROM users WHERE initiative_id = $1 AND role = 'student'`,
    [initiativeId]
  )

  const recTotals = await queryOne<{
    total: string
    mastered: string
    pending: string
    in_review: string
  }>(
    `SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'mastered') AS mastered,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'in_review') AS in_review
     FROM recitations WHERE initiative_id = $1`,
    [initiativeId]
  )

  const statusRows = await query<{ status: string; count: string }>(
    `SELECT status, COUNT(*) AS count FROM recitations WHERE initiative_id = $1 GROUP BY status`,
    [initiativeId]
  )

  const overTimeRows = await query<{ date: string; count: string }>(
    `SELECT to_char(created_at, 'DD/MM') AS date, COUNT(*) AS count
     FROM recitations
     WHERE initiative_id = $1 AND created_at >= NOW() - interval '30 days'
     GROUP BY to_char(created_at, 'DD/MM'), DATE(created_at)
     ORDER BY DATE(created_at) ASC
     LIMIT 14`,
    [initiativeId]
  )

  const topRows = await query<{ name: string; mastered: string; total: string }>(
    `SELECT u.name,
            COUNT(r.id) FILTER (WHERE r.status = 'mastered') AS mastered,
            COUNT(r.id) AS total
     FROM users u
     LEFT JOIN recitations r ON r.student_id = u.id
     WHERE u.initiative_id = $1 AND u.role = 'student'
     GROUP BY u.id, u.name
     HAVING COUNT(r.id) > 0
     ORDER BY mastered DESC, total DESC
     LIMIT 5`,
    [initiativeId]
  )

  const totalRecitations = parseInt(recTotals?.total || "0")
  const masteredCount = parseInt(recTotals?.mastered || "0")

  return {
    totals: {
      participants: parseInt(totalsRow?.participants || "0"),
      verifiedParticipants: parseInt(totalsRow?.verified || "0"),
      totalRecitations,
      masteredCount,
      pendingCount: parseInt(recTotals?.pending || "0"),
      inReviewCount: parseInt(recTotals?.in_review || "0"),
      masteryRate: totalRecitations > 0 ? Math.round((masteredCount / totalRecitations) * 100) : 0,
    },
    statusDistribution: statusRows.map((r) => ({
      status: STATUS_LABELS[r.status] || r.status,
      count: parseInt(r.count),
    })),
    recitationsOverTime: overTimeRows.map((r) => ({ date: r.date, count: parseInt(r.count) })),
    topParticipants: topRows.map((r) => ({
      name: r.name,
      mastered: parseInt(r.mastered) || 0,
      total: parseInt(r.total) || 0,
    })),
  }
}
