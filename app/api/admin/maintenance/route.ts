import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { revalidatePath } from "next/cache"

// POST /api/admin/maintenance - System maintenance actions
export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!requireRole(session, ["admin"])) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
        }

        const { action } = await req.json()

        if (action === "clear-cache") {
            // Revalidate main landing and dashboards
            revalidatePath("/")
            revalidatePath("/admin")
            revalidatePath("/reader")
            revalidatePath("/student")

            return NextResponse.json({ success: true, message: "تم تفريغ الكاش وتحديث الصفحات بنجاح" })
        }

        if (action === "backup") {
            // Mock backup - in a real app, this might trigger a DB dump or return a S3 link
            return NextResponse.json({
                success: true,
                message: "تم بدء عملية النسخ الاحتياطي لقاعدة البيانات. ستصلك رسالة عند الاكتمال.",
                downloadUrl: "#"
            })
        }

        return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 })
    } catch (error) {
        console.error("Maintenance API error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
