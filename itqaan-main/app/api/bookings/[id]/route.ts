import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

        const { id } = await params
        const { status } = await req.json()

        if (!status) {
            return NextResponse.json({ error: "الحالة مطلوبة" }, { status: 400 })
        }

        const result = await query(
            `UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *`,
            [status, id]
        )

        if (result.length === 0) {
            return NextResponse.json({ error: "لم يتم العثور على الحجز" }, { status: 404 })
        }

        return NextResponse.json({ booking: result[0] })
    } catch (error) {
        console.error("Update booking error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
