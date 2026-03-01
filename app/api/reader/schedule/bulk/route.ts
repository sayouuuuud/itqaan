import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

// POST /api/reader/schedule/bulk - bulk add slots
export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== "reader") {
            return NextResponse.json({ error: "غير مسجل" }, { status: 401 })
        }

        const { startDate, endDate, times, days } = await req.json()

        if (!startDate || !endDate || !times || !Array.isArray(times) || times.length === 0) {
            return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 })
        }

        const start = new Date(startDate)
        const end = new Date(endDate)

        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
            return NextResponse.json({ error: "نطاق تاريخ غير صحيح" }, { status: 400 })
        }

        const slotsToInsert: any[] = []
        const curr = new Date(start)

        while (curr <= end) {
            const dayOfWeek = curr.getDay() // 0-6

            // If specific days are selected, filter by them. If no days selected, apply to all.
            if (!days || days.length === 0 || days.includes(dayOfWeek)) {
                const dateStr = curr.toISOString().split('T')[0]

                for (const time of times) {
                    slotsToInsert.push({
                        reader_id: session.sub,
                        day_of_week: dayOfWeek,
                        start_time: time.startTime,
                        end_time: time.endTime,
                        specific_date: dateStr,
                        is_recurring: false
                    })
                }
            }
            curr.setDate(curr.getDate() + 1)
        }

        if (slotsToInsert.length === 0) {
            return NextResponse.json({ error: "لا توجد أيام مطابقة في هذا النطاق" }, { status: 400 })
        }

        // First, fetch existing slots for this reader to check for overlaps
        const existingSlots = await query(
            `SELECT id, day_of_week, start_time, end_time, specific_date, is_recurring 
             FROM availability_slots WHERE reader_id = $1`,
            [session.sub]
        )

        // Batch insert
        let overlapCount = 0;
        let insertedCount = 0;

        for (const slot of slotsToInsert) {
            // Check if this slot overlaps with existing slots
            // An overlap happens if:
            // 1. Same day of week
            // 2. Either (is_recurring=true) OR (specific_date matches exactly)
            // 3. Time overlaps
            const isOverlap = existingSlots.some((existing: any) => {
                const sameDay = existing.day_of_week === slot.day_of_week;

                // If it's the exact same specific_date, or existing is a recurring slot that applies to this date
                let dateMatches = false;
                if (existing.is_recurring) {
                    dateMatches = true; // Recurring slots apply to all dates
                } else if (existing.specific_date) {
                    // Check if specific_date from DB matches our slot's specific_date
                    const dbDate = new Date(existing.specific_date).toISOString().split('T')[0];
                    dateMatches = (dbDate === slot.specific_date);
                }

                if (!sameDay || !dateMatches) return false;

                // Time overlap check: 
                // A overlaps B if (A.start < B.end AND A.end > B.start)
                return (slot.start_time < existing.end_time && slot.end_time > existing.start_time);
            })

            if (isOverlap) {
                overlapCount++;
                continue; // Skip inserting this overlapping slot
            }

            await query(
                `INSERT INTO availability_slots 
                (reader_id, day_of_week, start_time, end_time, specific_date, is_recurring, is_available)
                VALUES ($1, $2, $3, $4, $5, $6, true)`,
                [slot.reader_id, slot.day_of_week, slot.start_time, slot.end_time, slot.specific_date, slot.is_recurring]
            )
            insertedCount++;

            // Add the newly inserted slot to our memory cache so we don't overlap within the same bulk addition
            existingSlots.push(slot);
        }

        if (insertedCount === 0 && overlapCount > 0) {
            return NextResponse.json({ error: "جميع المواعيد المحددة تتعارض مع مواعيد موجودة مسبقاً" }, { status: 409 });
        }

        return NextResponse.json({
            success: true,
            count: insertedCount,
            skipped: overlapCount,
            message: overlapCount > 0 ? `تم إضافة ${insertedCount} موعد، وتجاهل ${overlapCount} موعد للتعارض.` : undefined
        })
    } catch (error) {
        console.error("Bulk schedule error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
