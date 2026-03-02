import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import * as db from "@/lib/db"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!requireRole(session, ["admin"])) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
        }

        const { id } = await params

        const recitation = await db.queryOne<any>(
            `SELECT 
               r.id, 
               r.surah_name, 
               r.ayah_from, 
               r.ayah_to, 
               r.audio_url, 
               r.audio_duration_seconds, 
               r.submission_type, 
               r.recitation_type, 
               r.status, 
               r.student_notes, 
               r.internal_notes, 
               r.created_at, 
               r.reviewed_at,
               s.name as student_name, 
               s.email as student_email, 
               s.avatar_url as student_avatar,
               rd.name as reader_name, 
               rd.email as reader_email, 
               rd.avatar_url as reader_avatar,
               rev.overall_score, 
               rev.verdict, 
               rev.detailed_feedback,
               rev.tajweed_score,
               rev.pronunciation_score,
               rev.fluency_score,
               rev.memorization_score,
               rev.strengths,
               rev.areas_for_improvement
             FROM recitations r
             INNER JOIN users s ON r.student_id = s.id
             LEFT JOIN users rd ON r.assigned_reader_id = rd.id
             LEFT JOIN reviews rev ON rev.recitation_id = r.id
             WHERE r.id = $1`,
            [id]
        )

        if (!recitation) {
            return NextResponse.json({ error: "Recitation not found" }, { status: 404 })
        }

        return NextResponse.json(recitation)
    } catch (error) {
        console.error("Admin recitation fetch error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
