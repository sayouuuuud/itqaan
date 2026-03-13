import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

// GET /api/readers/:id/availability
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const { id } = await params

    const slots = await query(
      `SELECT * FROM availability_slots WHERE reader_id = $1 AND is_active = true ORDER BY day_of_week, start_time`,
      [id]
    )

    // Get booked slots for the next 7 days
    const bookedSlots = await query(
      `SELECT slot_start, slot_end FROM bookings
       WHERE reader_id = $1 AND status = 'confirmed'
       AND slot_start >= NOW() AND slot_start <= NOW() + interval '7 days'`,
      [id]
    )

    return NextResponse.json({ availabilitySlots: slots, bookedSlots })
  } catch (error) {
    console.error("Get availability error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}

// PUT /api/readers/:id/availability - update availability (reader only)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== "reader") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const { id } = await params
    if (session.sub !== id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }

    const { slots } = await req.json()

    // Delete existing slots
    await query("DELETE FROM availability_slots WHERE reader_id = $1", [id])

    // Insert new slots
    for (const slot of slots) {
      await query(
        `INSERT INTO availability_slots (reader_id, day_of_week, start_time, end_time)
         VALUES ($1, $2, $3, $4)`,
        [id, slot.dayOfWeek, slot.startTime, slot.endTime]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update availability error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
