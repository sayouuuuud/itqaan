import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { queryOne, query } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const range = searchParams.get('range') || 'month' // week, month, 3months, year
    
    let timeFilter = "AND created_at >= NOW() - INTERVAL '30 days'"
    if (range === 'week') timeFilter = "AND created_at >= NOW() - INTERVAL '7 days'"
    if (range === '3months') timeFilter = "AND created_at >= NOW() - INTERVAL '90 days'"
    if (range === 'year') timeFilter = "AND created_at >= NOW() - INTERVAL '365 days'"

    const role = session.role

    if (role === 'student') {
      const stats = await getStudentStats(session.sub, timeFilter)
      return NextResponse.json(stats)
    }

    if (role === 'reader') {
      const stats = await getReaderStats(session.sub, timeFilter)
      return NextResponse.json(stats)
    }

    if (['admin', 'student_supervisor', 'reciter_supervisor'].includes(role)) {
      // Admin/Supervisor stats (handled in existing route but we can extend here or unify)
      // For now, let's focus on Student/Reader as requested for role-specific stats.
      return NextResponse.json({ role, message: "Stats available via /api/admin/stats" })
    }

    return NextResponse.json({ error: "Role not supported" }, { status: 400 })
  } catch (error) {
    console.error("Stats API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

async function getStudentStats(userId: string, timeFilter: string) {
  // Mastery rate
  const masteryData = await queryOne<{ total: string; mastered: string }>(
    `SELECT 
      COUNT(*) as total, 
      COUNT(*) FILTER (WHERE status = 'mastered') as mastered 
     FROM recitations 
     WHERE student_id = $1 ${timeFilter}`,
    [userId]
  )
  
  const total = parseInt(masteryData?.total || "0")
  const mastered = parseInt(masteryData?.mastered || "0")
  const masteryRate = total > 0 ? Math.round((mastered / total) * 100) : 0

  // Sessions count
  const sessionsData = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM bookings WHERE student_id = $1 AND status = 'completed' ${timeFilter}`,
    [userId]
  )

  // Progress (daily recitations)
  const progressData = await query<{ date: string; count: string }>(
    `SELECT to_char(created_at, 'DD/MM') as date, COUNT(*) as count
     FROM recitations
     WHERE student_id = $1 ${timeFilter}
     GROUP BY to_char(created_at, 'DD/MM'), DATE(created_at)
     ORDER BY DATE(created_at) ASC`,
    [userId]
  )

  return {
    masteryRate,
    completedSessions: parseInt(sessionsData?.count || "0"),
    progress: progressData.map(p => ({ date: p.date, count: parseInt(p.count) }))
  }
}

async function getReaderStats(userId: string, timeFilter: string) {
  // Session completion rate
  const sessionData = await queryOne<{ total: string; completed: string }>(
    `SELECT 
      COUNT(*) as total, 
      COUNT(*) FILTER (WHERE status = 'completed') as completed 
     FROM bookings 
     WHERE reader_id = $1 ${timeFilter}`,
    [userId]
  )
  
  const totalSess = parseInt(sessionData?.total || "0")
  const completedSess = parseInt(sessionData?.completed || "0")
  const completionRate = totalSess > 0 ? Math.round((completedSess / totalSess) * 100) : 0

  // Student count (unique students reviewed or sessioned)
  const studentsData = await queryOne<{ count: string }>(
    `SELECT COUNT(DISTINCT student_id) as count 
     FROM (
       SELECT student_id FROM recitations WHERE assigned_reader_id = $1 ${timeFilter}
       UNION
       SELECT student_id FROM bookings WHERE reader_id = $1 ${timeFilter}
     ) as reader_students`,
    [userId]
  )

  // Satisfaction (average rating)
  const ratingData = await queryOne<{ avg: string }>(
    `SELECT AVG(rating) as avg FROM reader_ratings WHERE reader_id = $1 ${timeFilter}`,
    [userId]
  )

  return {
    completionRate,
    studentCount: parseInt(studentsData?.count || "0"),
    averageRating: parseFloat(ratingData?.avg || "0").toFixed(1)
  }
}
