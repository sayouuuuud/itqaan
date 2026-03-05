import { NextResponse } from "next/server"
import { getSetting } from "@/lib/settings"

export async function GET() {
    try {
        const contactInfo = await getSetting("contact_info", {
            email: "info@itqaan.com",
            phone: "+966 50 000 0000",
            address: "الرياض، المملكة العربية السعودية"
        })

        return NextResponse.json({ contactInfo })
    } catch (error) {
        console.error("Public settings error:", error)
        return NextResponse.json({ error: "حدث خطأ في جلب البيانات" }, { status: 500 })
    }
}
