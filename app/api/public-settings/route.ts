import { NextResponse } from "next/server"
import { getSetting } from "@/lib/settings"

export async function GET() {
    try {
        const [contactInfo, branding] = await Promise.all([
            getSetting("contact_info", {
                email: "info@itqaan.com",
                phone: "+966 50 000 0000",
                address: "الرياض، المملكة العربية السعودية"
            }),
            getSetting("branding", {
                logoUrl: "/branding/main-logo.png",
                dashboardLogoUrl: "/branding/dashboard-logo.png",
                faviconUrl: "/favicon.png"
            })
        ])

        return NextResponse.json({ contactInfo, branding })
    } catch (error) {
        console.error("Public settings error:", error)
        return NextResponse.json({ error: "حدث خطأ في جلب البيانات" }, { status: 500 })
    }
}
