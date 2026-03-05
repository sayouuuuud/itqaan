import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"

// GET /api/readers/availability - get current reader's availability
export async function GET() {
  const session = await getSession()
  if (!session || !requireRole(session, ["reader"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const slots = await query(
    `SELECT * FROM availability_slots WHERE reader_id = $1 ORDER BY day_of_week, start_time`,
    [session.sub]
  )

  return NextResponse.json({ slots })
}

// POST /api/readers/availability - add new availability slot
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !requireRole(session, ["reader"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const { dayOfWeek, startTime, endTime } = await req.json()

  if (dayOfWeek === undefined || !startTime || !endTime) {
    return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 })
  }

  if (dayOfWeek < 0 || dayOfWeek > 6) {
    return NextResponse.json({ error: "يوم الأسبوع غير صحيح" }, { status: 400 })
  }

  const slot = await query(
    `INSERT INTO availability_slots (reader_id, day_of_week, start_time, end_time, is_available)
     VALUES ($1, $2, $3, $4, true)
     RETURNING *`,
    [session.sub, dayOfWeek, startTime, endTime]
  )

  return NextResponse.json({ slot: slot[0] })
}

// DELETE /api/readers/availability - delete an availability slot
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session || !requireRole(session, ["reader"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const { slotId } = await req.json()

  if (!slotId) {
    return NextResponse.json({ error: "معرف الفترة مطلوب" }, { status: 400 })
  }

  await query(
    `DELETE FROM availability_slots WHERE id = $1 AND reader_id = $2`,
    [slotId, session.sub]
  )

  return NextResponse.json({ success: true })
}
