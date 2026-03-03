import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { createNotificationForAdmins } from "@/lib/notifications"

export async function POST(req: NextRequest) {
    try {
        const { name, email, subject, message } = await req.json()

        if (!name || !email || !message) {
            return NextResponse.json({ error: "الرجاء ملء جميع الحقول المطلوبة (الاسم، البريد، الرسالة)" }, { status: 400 })
        }

        // Insert contact message into database
        await query(
            `INSERT INTO contact_messages (name, email, subject, message)
       VALUES ($1, $2, $3, $4)`,
            [name, email, subject || "", message]
        )

        // Create notification for all admin users
        try {
            await createNotificationForAdmins({
                type: "new_contact_message",
                title: "رسالة جديدة من نموذج التواصل",
                message: `تم استلام رسالة جديدة من ${name} (${email}): ${subject || "بدون موضوع"}`,
                category: "message",
                link: "/admin/contact-messages"
            })
        } catch (notifError) {
            console.error("Failed to create notification for admins:", notifError)
            // Don't fail the request if notification fails
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Contact form error:", error)
        return NextResponse.json({ error: "حدث خطأ أثناء إرسال الرسالة" }, { status: 500 })
    }
}
