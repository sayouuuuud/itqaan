import { NextResponse } from "next/server"
import { query, queryOne } from "@/lib/db"

// GET /api/public/stats - public stats for landing page (no auth required)
export async function GET() {
    try {
        // Count students who mastered Al-Fatiha
        const masteredCount = await queryOne<{ count: string }>(
            `SELECT COUNT(DISTINCT student_id) as count 
       FROM recitations 
       WHERE status = 'mastered'`
        )

        // Total registered students
        const totalStudents = await queryOne<{ count: string }>(
            `SELECT COUNT(*) as count FROM users WHERE role = 'student'`
        )

        return NextResponse.json({
            masteredStudents: parseInt(masteredCount?.count || "0"),
            totalStudents: parseInt(totalStudents?.count || "0"),
        })
    } catch (error) {
        console.error("Public stats error:", error)
        return NextResponse.json({
            masteredStudents: 0,
            totalStudents: 0,
        })
    }
}
