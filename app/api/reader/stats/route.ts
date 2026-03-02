import { NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { queryOne } from "@/lib/db"

// GET /api/reader/stats - reader dashboard KPIs
export async function GET() {
    try {
        const session = await getSession()
        if (!session || !requireRole(session, ["reader"])) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
        }

        // Recitations awaiting review (assigned to this reader)
        const pendingReviews = await queryOne<{ count: string }>(
            `SELECT COUNT(*) as count FROM recitations 
       WHERE assigned_reader_id = $1 AND status IN ('pending', 'in_review')`,
            [session.sub]
        )

        // Today's sessions
        const todaySessions = await queryOne<{ count: string }>(
            `SELECT COUNT(*) as count FROM bookings 
       WHERE reader_id = $1 AND status IN ('pending', 'confirmed')
       AND slot_start::date = CURRENT_DATE`,
            [session.sub]
        )

        // Upcoming sessions (next 7 days)
        const upcomingSessions = await queryOne<{ count: string }>(
            `SELECT COUNT(*) as count FROM bookings 
       WHERE reader_id = $1 AND status IN ('pending', 'confirmed')
       AND slot_start > NOW() AND slot_start <= NOW() + interval '7 days'`,
            [session.sub]
        )

        // Mastered count by this reader
        const masteredCount = await queryOne<{ count: string }>(
            `SELECT COUNT(*) as count FROM recitations 
       WHERE assigned_reader_id = $1 AND status = 'mastered'`,
            [session.sub]
        )

        return NextResponse.json({
            pendingReviews: parseInt(pendingReviews?.count || "0"),
            todaySessions: parseInt(todaySessions?.count || "0"),
            upcomingSessions: parseInt(upcomingSessions?.count || "0"),
            masteredCount: parseInt(masteredCount?.count || "0"),
        })
    } catch (error) {
        console.error("Reader stats error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
