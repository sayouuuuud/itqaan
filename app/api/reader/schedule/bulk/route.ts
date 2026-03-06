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

        const slotsToInsert: any[] = []
        let dayMatchCount = 0;

        // Parse startDate and endDate manually to avoid timezone shifts
        // Assuming format YYYY-MM-DD
        const [sY, sM, sD] = startDate.split('-').map(Number);
        const [eY, eM, eD] = endDate.split('-').map(Number);

        const curr = new Date(sY, sM - 1, sD);
        const end = new Date(eY, eM - 1, eD);

        while (curr <= end) {
            const dayOfWeek = curr.getDay() // Local day (0-Sunday)

            if (!days || days.length === 0 || days.includes(dayOfWeek)) {
                dayMatchCount++;
                // Format date as YYYY-MM-DD using local components
                const y = curr.getFullYear();
                const m = String(curr.getMonth() + 1).padStart(2, '0');
                const d = String(curr.getDate()).padStart(2, '0');
                const dateStr = `${y}-${m}-${d}`;

                for (const time of times) {
                    const [startH, startM] = time.startTime.split(':').map(Number)
                    const [endH, endM] = time.endTime.split(':').map(Number)
                    let currentMinutes = startH * 60 + startM
                    const endMinutes = endH * 60 + endM

                    while (currentMinutes + 30 <= endMinutes) {
                        const sH = Math.floor(currentMinutes / 60).toString().padStart(2, '0')
                        const sM = (currentMinutes % 60).toString().padStart(2, '0')
                        const eH = Math.floor((currentMinutes + 30) / 60).toString().padStart(2, '0')
                        const eM = ((currentMinutes + 30) % 60).toString().padStart(2, '0')

                        slotsToInsert.push({
                            reader_id: session.sub,
                            day_of_week: dayOfWeek,
                            start_time: `${sH}:${sM}`,
                            end_time: `${eH}:${eM}`,
                            specific_date: dateStr,
                            is_recurring: false
                        })

                        currentMinutes += 30
                    }
                }
            }
            curr.setDate(curr.getDate() + 1)
        }

        if (dayMatchCount === 0) {
            return NextResponse.json({ error: "لا توجد أيام مطابقة في هذا النطاق" }, { status: 400 })
        }

        if (slotsToInsert.length === 0) {
            return NextResponse.json({ error: "فترات الوقت المحددة غير صحيحة أو قصيرة جداً (أقل من 30 دقيقة)" }, { status: 400 })
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
                let dateMatches = false;
                if (existing.is_recurring) {
                    dateMatches = true;
                } else if (existing.specific_date) {
                    const eDate = existing.specific_date instanceof Date ? existing.specific_date : new Date(existing.specific_date);
                    const y = eDate.getFullYear();
                    const m = String(eDate.getMonth() + 1).padStart(2, '0');
                    const d = String(eDate.getDate()).padStart(2, '0');
                    const dbDate = `${y}-${m}-${d}`;
                    dateMatches = (dbDate === slot.specific_date);
                }

                if (!sameDay || !dateMatches) return false;

                // Time overlap check: 
                // A overlaps B if (A.start < B.end AND A.end > B.start)
                // Normalize to HH:mm (5 chars) because DB might return HH:mm:ss (e.g. 09:30:00)
                const sS = slot.start_time.substring(0, 5);
                const sE = slot.end_time.substring(0, 5);
                const eS = (existing.start_time as string).substring(0, 5);
                const eE = (existing.end_time as string).substring(0, 5);

                return (sS < eE && sE > eS);
            })

            if (isOverlap) {
                overlapCount++;
                continue; // Skip inserting this overlapping slot
            }

            try {
                const client = await (await import("@/lib/db")).default?.connect()
                if (client) {
                    await client.query(
                        `INSERT INTO availability_slots 
                        (reader_id, day_of_week, start_time, end_time, specific_date, is_recurring, is_available)
                        VALUES ($1, $2, $3, $4, $5, $6, true)`,
                        [slot.reader_id, slot.day_of_week, slot.start_time, slot.end_time, slot.specific_date, slot.is_recurring]
                    )
                    insertedCount++;
                    client.release()
                } else {
                    return NextResponse.json({ error: "No DB connection pool" }, { status: 500 })
                }
            } catch (dbErr: any) {
                return NextResponse.json({ error: `DB Bulk Error: ${dbErr.message}` }, { status: 500 })
            }

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
