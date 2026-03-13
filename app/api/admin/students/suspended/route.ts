import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"

// GET /api/admin/students/suspended
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    const allowedRoles: ("admin" | "reciter_supervisor" | "student_supervisor")[] = ["admin", "reciter_supervisor", "student_supervisor"]
    if (!requireRole(session, allowedRoles)) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const suspendedStudents = await query(
      `SELECT 
        u.id, 
        u.name as student_name, 
        u.email, 
        u.suspended_at, 
        u.suspension_reason,
        r.name as last_reader_name,
        rec.id as recitation_id
       FROM users u
       LEFT JOIN recitations rec ON rec.student_id = u.id AND rec.status NOT IN ('mastered', 'cancelled')
       LEFT JOIN users r ON r.id = rec.assigned_reader_id
       WHERE u.student_status = 'suspended'
       ORDER BY u.suspended_at DESC`
    )

    return NextResponse.json({ students: suspendedStudents })
  } catch (error) {
    console.error("Fetch suspended error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
