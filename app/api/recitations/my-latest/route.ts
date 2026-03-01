import { NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET() {
  const session = await getSession()
  if (!session || !requireRole(session, ["student"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const rows = await query(
    `SELECT r.id, r.surah_name, r.status, r.created_at, r.audio_url,
            r.student_notes, r.audio_duration_seconds,
            u.name as assigned_reader_name,
            EXISTS(SELECT 1 FROM certificate_data cd WHERE cd.student_id = $1) as has_cert_data
     FROM recitations r
     LEFT JOIN users u ON r.assigned_reader_id = u.id
     WHERE r.student_id = $1
     ORDER BY r.created_at DESC
     LIMIT 1`,
    [session.sub]
  )

  if (rows.length === 0) {
    // Even if no recitation, check if cert data exists
    const certCheck = await query(`SELECT EXISTS(SELECT 1 FROM certificate_data WHERE student_id = $1) as exists`, [session.sub])
    return NextResponse.json({
      recitation: null,
      has_cert_data: certCheck[0].exists
    })
  }

  return NextResponse.json({
    recitation: rows[0],
    has_cert_data: rows[0].has_cert_data
  })
}
