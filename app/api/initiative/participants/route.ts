import { NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"
import { getManagedInitiative } from "@/lib/initiatives"

// GET /api/initiative/participants - list students enrolled in the admin's initiative,
// with their recitation progress. Strictly scoped by initiative_id.
export async function GET() {
  const session = await getSession()
  if (!requireRole(session, ["initiative_admin", "admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const initiative = await getManagedInitiative(session)
  if (!initiative) {
    return NextResponse.json({ error: "لا توجد مبادرة مرتبطة بحسابك" }, { status: 404 })
  }

  const participants = await query<{
    id: string
    name: string
    email: string
    gender: string | null
    email_verified: boolean
    created_at: string
    total_recitations: string
    mastered_count: string
    last_activity: string | null
  }>(
    `SELECT
        u.id, u.name, u.email, u.gender, u.email_verified, u.created_at,
        COUNT(r.id) AS total_recitations,
        COUNT(r.id) FILTER (WHERE r.status = 'mastered') AS mastered_count,
        MAX(r.created_at) AS last_activity
     FROM users u
     LEFT JOIN recitations r ON r.student_id = u.id
     WHERE u.initiative_id = $1 AND u.role = 'student'
     GROUP BY u.id
     ORDER BY u.created_at DESC`,
    [initiative.id]
  )

  return NextResponse.json({
    initiative: { id: initiative.id, name: initiative.name },
    participants: participants.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      gender: p.gender,
      emailVerified: p.email_verified,
      createdAt: p.created_at,
      totalRecitations: parseInt(p.total_recitations) || 0,
      masteredCount: parseInt(p.mastered_count) || 0,
      lastActivity: p.last_activity,
    })),
  })
}
