import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"
import { logAdminAction } from "@/lib/activity-log"

// GET /api/admin/recitations - list all recitations with filters
export async function GET(req: NextRequest) {
    try {
        const session = await getSession()
        if (!requireRole(session, ["admin"])) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const search = searchParams.get("search")
        const readerName = searchParams.get("reader")
        const status = searchParams.get("status")

        let whereClause = "WHERE 1=1"
        const params: any[] = []

        if (search) {
            params.push(`%${search}%`)
            whereClause += ` AND (u.name ILIKE $${params.length} OR r.id::text ILIKE $${params.length})`
        }

        if (readerName) {
            params.push(readerName)
            whereClause += ` AND r.assigned_reader_id = $${params.length}`
        }

        if (status) {
            params.push(status)
            whereClause += ` AND r.status = $${params.length}`
        }

        const recitations = await query(
            `SELECT 
         r.id, 
         r.surah_name as "surah", 
         u.name as "studentName", 
         u.email as "studentEmail",
         r.status, 
         r.created_at as "createdAt",
         reader.name as "assignedReaderName",
         r.ayah_from as "fromAyah",
         r.ayah_to as "toAyah",
         session_reader.name as "sessionReaderName",
         bk.status as "bookingStatus",
         bk.slot_start as "bookingSlotStart"
       FROM recitations r
       JOIN users u ON u.id = r.student_id
       LEFT JOIN users reader ON reader.id = r.assigned_reader_id
       LEFT JOIN bookings bk ON bk.recitation_id = r.id
       LEFT JOIN users session_reader ON session_reader.id = bk.reader_id
       ${whereClause}
       ORDER BY r.created_at DESC`,
            params
        )

        return NextResponse.json({ recitations })
    } catch (error) {
        console.error("Admin recitations error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}

// PATCH /api/admin/recitations - Reassign reader
export async function PATCH(req: NextRequest) {
    try {
        const session = await getSession()
        if (!requireRole(session, ["admin"])) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
        }

        const { recitationId, readerId } = await req.json()

        if (!recitationId) {
            return NextResponse.json({ error: "معرف التلاوة مطلوب" }, { status: 400 })
        }

        await query(
            "UPDATE recitations SET assigned_reader_id = $1, assigned_at = NOW() WHERE id = $2",
            [readerId || null, recitationId]
        )

        await logAdminAction({
            userId: session!.sub,
            action: 'recitation_reassigned',
            entityType: 'recitation',
            entityId: recitationId,
            description: `Admin reassigned recitation to reader ${readerId || 'unassigned'}`,
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Admin reassign error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
