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

// POST /api/reader/schedule - add a new slot
export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== "reader") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
        }

        const { dayOfWeek, startTime, endTime, isRecurring, specificDate } = await req.json()

        if (dayOfWeek === undefined || !startTime || !endTime) {
            return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 })
        }

        // Check for overlaps
        // A recurring slot overlaps with any other slot on the same day_of_week
        // A specific date slot overlaps with recurring on same day_of_week OR same specific_date
        const overlappingSlots = await query(
            `SELECT id FROM availability_slots 
             WHERE reader_id = $1 
             AND day_of_week = $2 
             AND (
                 ($3 = true) OR -- If new is recurring, check all on that day
                 ($3 = false AND (is_recurring = true OR specific_date = $4)) -- If new is specific, check recurring OR same date
             )
             AND (
                 (start_time <= $5 AND end_time > $5) OR 
                 (start_time < $6 AND end_time >= $6) OR
                 (start_time >= $5 AND end_time <= $6)
             )`,
            [session.sub, dayOfWeek, isRecurring || false, specificDate || null, startTime, endTime]
        )

        if (overlappingSlots.length > 0) {
            return NextResponse.json({ error: "يوجد تعارض مع موعد آخر في نفس الوقت" }, { status: 409 })
        }

        const [startH, startM] = startTime.split(':').map(Number)
        const [endH, endM] = endTime.split(':').map(Number)
        let currentMinutes = startH * 60 + startM
        const endMinutes = endH * 60 + endM

        const insertedSlots = []

        try {
            while (currentMinutes + 30 <= endMinutes) {
                const sH = Math.floor(currentMinutes / 60).toString().padStart(2, '0')
                const sM = (currentMinutes % 60).toString().padStart(2, '0')
                const eH = Math.floor((currentMinutes + 30) / 60).toString().padStart(2, '0')
                const eM = ((currentMinutes + 30) % 60).toString().padStart(2, '0')

                const client = await (await import("@/lib/db")).default?.connect()
                if (client) {
                    const result = await client.query(
                        `INSERT INTO availability_slots (reader_id, day_of_week, start_time, end_time, is_available, is_recurring, specific_date)
                   VALUES ($1, $2, $3, $4, true, $5, $6)
                   RETURNING id, day_of_week, start_time, end_time, is_available, is_recurring, specific_date`,
                        [session.sub, dayOfWeek, `${sH}:${sM}`, `${eH}:${eM}`, isRecurring || false, specificDate || null]
                    )
                    insertedSlots.push(result.rows[0])
                    client.release()
                } else {
                    return NextResponse.json({ error: "No DB pool available inside loop" }, { status: 500 })
                }

                currentMinutes += 30
            }
        } catch (dbErr: any) {
            console.error("DB Error:", dbErr)
            return NextResponse.json({ error: `DB Error: ${dbErr.message}` }, { status: 500 })
        }

        if (insertedSlots.length === 0) {
            return NextResponse.json({ error: "نطاق الوقت المدخل قصير جداً" }, { status: 400 })
        }

        return NextResponse.json({ slots: insertedSlots, slot: insertedSlots[0] }, { status: 201 })
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

        if (id) {
            await query(
                `DELETE FROM availability_slots WHERE id = $1 AND reader_id = $2`,
                [id, session.sub]
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
