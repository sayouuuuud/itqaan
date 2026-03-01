import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'all'
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''

    // Validate date format to prevent injection
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    const hasDateFilter = dateFrom && dateTo && dateRegex.test(dateFrom) && dateRegex.test(dateTo)

    const dateFilter = hasDateFilter
      ? `AND created_at BETWEEN '${dateFrom}' AND '${dateTo}T23:59:59Z'`
      : ''

    const [
      recitationStats,
      recitationsByStatus,
      sessionStats,
      topReviewers,
      topSessionReaders,
      topContributors,
      topStudents,
      certificateCount,
      emailCount,
      masteryTrend,
      dailyRecitations,
      genderStats,
      cityStats,
      userStats,
    ] = await Promise.all([
      // Overall recitation stats
      query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'mastered') AS mastered,
          COUNT(*) FILTER (WHERE status = 'needs_session') AS needs_session,
          COUNT(*) FILTER (WHERE status = 'pending') AS pending,
          COUNT(*) FILTER (WHERE status = 'in_review') AS in_review,
          COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
          COUNT(*) FILTER (WHERE status = 'session_booked') AS session_booked,
          ROUND(COUNT(*) FILTER (WHERE status = 'mastered') * 100.0 / NULLIF(COUNT(*), 0), 1) AS mastery_rate
        FROM recitations
        WHERE 1=1 ${dateFilter}
      `),
      // Recitations by month
      query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'mastered') AS mastered
        FROM recitations
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY month
        ORDER BY month ASC
      `),
      // Session stats
      query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'completed') AS completed,
          COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
          COUNT(*) FILTER (WHERE status = 'no_show') AS no_show,
          COUNT(*) FILTER (WHERE status = 'pending') AS pending,
          ROUND(AVG(duration_minutes) FILTER (WHERE status = 'completed'), 0) AS avg_duration
        FROM bookings
        WHERE 1=1 ${dateFilter}
      `),
      // Top readers by reviews completed
      query(`
        SELECT u.name, u.avatar_url,
          COUNT(rev.id) AS reviews_count,
          ROUND(AVG(rev.overall_score), 1) AS avg_score,
          COUNT(rev.id) FILTER (WHERE rev.verdict = 'mastered') AS mastered_count
        FROM users u
        JOIN reviews rev ON rev.reader_id = u.id
        WHERE u.role = 'reader'
        GROUP BY u.id, u.name, u.avatar_url
        ORDER BY reviews_count DESC
        LIMIT 10
      `),
      // Top readers by sessions
      query(`
        SELECT u.name, u.avatar_url,
          COUNT(b.id) AS sessions_count,
          COUNT(b.id) FILTER (WHERE b.status = 'completed') AS completed_sessions,
          ROUND(AVG(rr.rating), 2) AS avg_rating
        FROM users u
        JOIN bookings b ON b.reader_id = u.id
        LEFT JOIN reader_ratings rr ON rr.booking_id = b.id
        WHERE u.role = 'reader'
        GROUP BY u.id, u.name, u.avatar_url
        ORDER BY sessions_count DESC
        LIMIT 10
      `),
      // Top contributors overall (readers: reviews + sessions)
      query(`
        SELECT u.name, u.avatar_url,
          COALESCE(rev_count, 0) + COALESCE(sess_count, 0) AS total_contribution,
          COALESCE(rev_count, 0) AS reviews,
          COALESCE(sess_count, 0) AS sessions
        FROM users u
        LEFT JOIN (SELECT reader_id, COUNT(*) AS rev_count FROM reviews GROUP BY reader_id) r ON r.reader_id = u.id
        LEFT JOIN (SELECT reader_id, COUNT(*) AS sess_count FROM bookings WHERE status='completed' GROUP BY reader_id) s ON s.reader_id = u.id
        WHERE u.role = 'reader'
        ORDER BY total_contribution DESC
        LIMIT 10
      `),
      // Most active students
      query(`
        SELECT u.name, u.email, u.avatar_url,
          COUNT(DISTINCT rec.id) AS recitations,
          COUNT(DISTINCT b.id) AS bookings,
          COUNT(DISTINCT rr.id) AS ratings_given
        FROM users u
        LEFT JOIN recitations rec ON rec.student_id = u.id
        LEFT JOIN bookings b ON b.student_id = u.id
        LEFT JOIN reader_ratings rr ON rr.student_id = u.id
        WHERE u.role = 'student'
        GROUP BY u.id, u.name, u.email, u.avatar_url
        ORDER BY recitations + bookings DESC
        LIMIT 10
      `),
      // Certificates issued
      query(`
        SELECT COUNT(*) AS count FROM certificate_data WHERE certificate_issued = true
      `),
      // Emails sent (activity log)
      query(`
        SELECT COUNT(*) AS count FROM activity_logs WHERE action LIKE 'email_%'
      `),
      // Mastery rate over time
      query(`
        SELECT
          TO_CHAR(DATE_TRUNC('week', created_at), 'MM/DD') AS week,
          DATE_TRUNC('week', created_at) AS raw_week,
          ROUND(COUNT(*) FILTER (WHERE status = 'mastered') * 100.0 / NULLIF(COUNT(*), 0), 1) AS mastery_rate,
          COUNT(*) AS total
        FROM recitations
        WHERE created_at >= NOW() - INTERVAL '12 weeks'
        GROUP BY raw_week, week
        ORDER BY raw_week ASC
      `),
      // Daily recitations (30 days)
      query(`
        SELECT TO_CHAR(created_at, 'Mon DD') AS date, COUNT(*) AS count
        FROM recitations
        ${hasDateFilter ? 'WHERE ' + dateFilter.substring(4) : "WHERE created_at >= NOW() - INTERVAL '30 days'"}
        GROUP BY date, created_at::date
        ORDER BY created_at::date ASC
        LIMIT 30
      `),
      // Gender distribution
      query(`SELECT gender, COUNT(*) AS count FROM users WHERE role = 'student' GROUP BY gender`),
      // City distribution
      query(`
        SELECT u.city, COUNT(*) AS count
        FROM users u
        WHERE u.role = 'student' AND u.city IS NOT NULL
        GROUP BY u.city
        ORDER BY count DESC
        LIMIT 10
      `),
      // User counts
      query(`
        SELECT
          (SELECT COUNT(*) FROM users WHERE role = 'student') AS total_students,
          (SELECT COUNT(*) FROM users WHERE role = 'reader' AND approval_status = 'approved') AS total_readers
      `),
    ])

    return NextResponse.json({
      recitations: {
        ...(recitationStats[0] as any),
        byMonth: recitationsByStatus,
        daily: dailyRecitations
      },
      sessions: sessionStats[0],
      users: {
        ...(userStats[0] as any),
        gender: genderStats,
        byCity: cityStats,
      },
      topReviewers,
      topSessionReaders,
      topContributors,
      topStudents,
      certificates: (certificateCount[0] as any)?.count || 0,
      emailsSent: (emailCount[0] as any)?.count || 0,
      masteryTrend,
    })
  } catch (e: any) {
    console.error('Reports error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
