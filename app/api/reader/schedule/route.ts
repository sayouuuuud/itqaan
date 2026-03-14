import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

// GET /api/reader/schedule - list reader slots
export async function GET() {
    try {
        const session = await getSession()
        if (!session || session.role !== "reader") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
        }

        const slots = await query(
            `SELECT id, day_of_week, start_time, end_time, is_available, specific_date, is_recurring 
       FROM availability_slots 
       WHERE reader_id = $1 
       ORDER BY day_of_week ASC, specific_date ASC NULLS FIRST, start_time ASC`,
            [session.sub]
        )

        return NextResponse.json({ slots })
    } catch (error) {
        console.error("Get schedule error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}

// POST /api/reader/schedule - add new slots (bulk support)
export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== "reader") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
        }

        const data = await req.json()
        const { isRecurring, specificDate, daysOfWeek, periods } = data
        
        // Backward compatibility support for single values if needed
        const targetDays = Array.isArray(daysOfWeek) ? daysOfWeek : [data.dayOfWeek]
        const targetPeriods = Array.isArray(periods) ? periods : [{ startTime: data.startTime, endTime: data.endTime }]

        if (targetDays.some(d => d === undefined || d === null) || targetPeriods.some(p => !p.startTime || !p.endTime)) {
            return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 })
        }

        const insertedSlots = []

        for (const day of targetDays) {
            for (const period of targetPeriods) {
                const { startTime, endTime } = period

                // Check for overlapping slots
                const overlapQuery = isRecurring
                    ? `SELECT 1 FROM availability_slots 
                       WHERE reader_id = $1 AND day_of_week = $2 AND is_recurring = true
                       AND (
                         (start_time < $4 AND end_time > $3)
                       ) LIMIT 1`
                    : `SELECT 1 FROM availability_slots 
                       WHERE reader_id = $1 AND (
                           (is_recurring = true AND day_of_week = $2) OR
                           (specific_date = $5)
                       )
                       AND (
                         (start_time < $4 AND end_time > $3)
                       ) LIMIT 1`

                const overlapParams = isRecurring
                    ? [session.sub, day, startTime, endTime]
                    : [session.sub, day, startTime, endTime, specificDate]

                const overlap = await query(overlapQuery, overlapParams)

                if (overlap.length > 0) {
                    continue; // Skip overlaps
                }

                const res = await query(
                    `INSERT INTO availability_slots 
                    (reader_id, day_of_week, start_time, end_time, is_recurring, specific_date)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *`,
                    [session.sub, day, startTime, endTime, isRecurring || false, specificDate || null]
                )
                
                if (res && res[0]) {
                    insertedSlots.push(res[0])
                }
            }
        }

        if (insertedSlots.length === 0 && targetPeriods.length > 0) {
            return NextResponse.json({ error: "المواعيد المختارة تتعارض مع مواعيد موجودة مسبقاً" }, { status: 409 })
        }

        return NextResponse.json({ slots: insertedSlots, success: true }, { status: 201 })
    } catch (error) {
        console.error("Create slot error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}

// DELETE /api/reader/schedule - delete a slot
export async function DELETE(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== "reader") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")
        const date = searchParams.get("date")
        const dayOfWeek = searchParams.get("dayOfWeek")
        const type = searchParams.get("type") // 'all' to delete everything on that day

        if (id) {
            await query(
                `DELETE FROM availability_slots WHERE id = $1 AND reader_id = $2`,
                [id, session.sub]
            )
        } else if (type === "all" && dayOfWeek !== null && date) {
            // Delete both recurring slots for this day of week AND specific slots for this date
            await query(
                `DELETE FROM availability_slots 
                 WHERE reader_id = $1 
                 AND (
                     (day_of_week = $2 AND is_recurring = true) OR 
                     (specific_date = $3)
                 )`,
                [session.sub, Number(dayOfWeek), date]
            )
        } else if (date) {
            await query(
                `DELETE FROM availability_slots WHERE specific_date = $1 AND reader_id = $2`,
                [date, session.sub]
            )
        } else if (dayOfWeek !== null) {
            await query(
                `DELETE FROM availability_slots WHERE day_of_week = $1 AND reader_id = $2 AND is_recurring = true`,
                [Number(dayOfWeek), session.sub]
            )
        } else {
            return NextResponse.json({ error: "معرف الموعد أو اليوم مطلوب" }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Delete slot error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
