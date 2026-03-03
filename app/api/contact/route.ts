import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(req: NextRequest) {
    try {
        const { name, email, subject, message } = await req.json()

        if (!name || !email || !message) {
            return NextResponse.json({ error: "الرجاء كافه الحقول المطلوبة (الاسم، البريد، الرسالة)" }, { status: 400 })
        }

        await query(
            `INSERT INTO contact_messages (name, email, subject, message)
       VALUES ($1, $2, $3, $4)`,
            [name, email, subject || "", message]
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Contact form error:", error)
        return NextResponse.json({ error: "حدث خطأ أثناء إرسال الرسالة" }, { status: 500 })
    }
}
