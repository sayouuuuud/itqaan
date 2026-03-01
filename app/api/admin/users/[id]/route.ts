import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import * as db from '@/lib/db'

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: userId } = await params

        // 1. Basic User Info (including phone)
        const user = await db.queryOne<any>(
            'SELECT id, name, email, phone, role, avatar_url, bio, is_active, created_at, last_login_at FROM users WHERE id = $1',
            [userId]
        )

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Fetch history based on user role
        let history: any[] = []
        if (user.role === 'student') {
            history = await db.query<any>(
                `SELECT 
                   r.id, 
                   r.surah_name, 
                   r.ayah_from, 
                   r.ayah_to, 
                   r.status, 
                   r.audio_url, 
                   rev.overall_score as overall_rating, 
                   r.created_at, 
                   reader.name as evaluator_name
                 FROM recitations r
                 LEFT JOIN users reader ON reader.id = r.assigned_reader_id
                 LEFT JOIN reviews rev ON rev.recitation_id = r.id
                 WHERE r.student_id = $1
                 ORDER BY r.created_at DESC
                 LIMIT 50`,
                [userId]
            )
        } else if (user.role === 'reader') {
            history = await db.query<any>(
                `SELECT 
                   r.id, 
                   r.surah_name, 
                   r.ayah_from, 
                   r.ayah_to, 
                   r.status, 
                   r.audio_url, 
                   rev.overall_score as overall_rating, 
                   r.created_at, 
                   student.name as student_name
                 FROM recitations r
                 JOIN users student ON student.id = r.student_id
                 LEFT JOIN reviews rev ON rev.recitation_id = r.id
                 WHERE r.assigned_reader_id = $1
                 ORDER BY r.created_at DESC
                 LIMIT 50`,
                [userId]
            )
        }

        // 2. Recitation Metrics
        const dailyRec = await db.queryOne<any>(
            'SELECT COUNT(*) FROM recitations WHERE student_id = $1 AND created_at > NOW() - INTERVAL \'1 day\'',
            [userId]
        )
        const weeklyRec = await db.queryOne<any>(
            'SELECT COUNT(*) FROM recitations WHERE student_id = $1 AND created_at > NOW() - INTERVAL \'7 days\'',
            [userId]
        )
        const monthlyRec = await db.queryOne<any>(
            'SELECT COUNT(*) FROM recitations WHERE student_id = $1 AND created_at > NOW() - INTERVAL \'30 days\'',
            [userId]
        )

        // 3. Session Statistics (Bookings)
        // Completed Sessions
        const completedSessions = await db.queryOne<any>(
            'SELECT COUNT(*) FROM bookings WHERE (student_id = $1 OR reader_id = $1) AND status = \'completed\'',
            [userId]
        )
        // Absences / No-Shows
        const noShows = await db.queryOne<any>(
            'SELECT COUNT(*) FROM bookings WHERE (student_id = $1 OR reader_id = $1) AND status = \'no_show\'',
            [userId]
        )
        // Cancelled Sessions
        const cancelledSessions = await db.queryOne<any>(
            'SELECT COUNT(*) FROM bookings WHERE (student_id = $1 OR reader_id = $1) AND status = \'cancelled\'',
            [userId]
        )

        // 4. Ratings (if user is a reader)
        let averageRating = 0
        if (user.role === 'reader') {
            const ratingRes = await db.queryOne<any>(
                'SELECT AVG(rating) as avg FROM reader_ratings WHERE reader_id = $1',
                [userId]
            )
            averageRating = parseFloat(ratingRes?.avg || "0")
        }

        // 5. Last tech session Info - fetch from activity_logs (login_success)
        const lastSession = await db.queryOne<any>(
            `SELECT ip_address, user_agent, created_at as last_active_at 
             FROM activity_logs 
             WHERE user_id = $1 AND action = 'login_success' 
             ORDER BY created_at DESC LIMIT 1`,
            [userId]
        )

        // 6. Fetch Country from page_views
        const countryRes = await db.queryOne<any>(
            'SELECT country FROM page_views WHERE user_id = $1 AND country IS NOT NULL ORDER BY created_at DESC LIMIT 1',
            [userId]
        )

        // 7. Activity Data (Last 14 days)
        const activityData = await db.query<any>(
            `SELECT 
                TO_CHAR(d, 'YYYY-MM-DD') as date,
                COUNT(r.id) as count
             FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, '1 day') d
             LEFT JOIN recitations r ON DATE(r.created_at) = d AND r.student_id = $1
             GROUP BY d
             ORDER BY d ASC`,
            [userId]
        )

        return NextResponse.json({
            user,
            metrics: {
                recitations: {
                    daily: parseInt(dailyRec?.count || "0"),
                    weekly: parseInt(weeklyRec?.count || "0"),
                    monthly: parseInt(monthlyRec?.count || "0")
                },
                sessions: {
                    completed: parseInt(completedSessions?.count || "0"),
                    noShow: parseInt(noShows?.count || "0"),
                    cancelled: parseInt(cancelledSessions?.count || "0")
                },
                rating: averageRating
            },
            history,
            lastSession,
            country: countryRes?.country || null,
            activityData
        })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
