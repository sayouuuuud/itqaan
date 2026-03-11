import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { queryOne } from "@/lib/db"
import { generateCertificatePDF } from "@/lib/pdf"

export async function GET(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const studentId = searchParams.get("student_id")

        if (!studentId) {
            return NextResponse.json({ error: "student_id مطلوب" }, { status: 400 })
        }

        // Security check: If not admin, can only download own certificate
        // sub is the user ID in the JWTPayload
        if (session.role !== 'admin' && session.sub !== studentId) {
            return NextResponse.json({ error: "غير مصرح لك بتحميل هذه الشهادة" }, { status: 403 })
        }

        // Check if certificate is issued
        const cert = await queryOne<{ certificate_issued: boolean; student_name: string }>(
            `SELECT cd.certificate_issued, u.name as student_name
             FROM certificate_data cd
             JOIN users u ON u.id = cd.student_id
             WHERE cd.student_id = $1`,
            [studentId]
        )

        if (!cert) {
            return NextResponse.json({ error: "البيانات غير موجودة" }, { status: 404 })
        }

        if (!cert.certificate_issued) {
            return NextResponse.json({ error: "الشهادة لم تصدر بعد" }, { status: 400 })
        }

        // Generate PDF on-demand
        const pdfResult = await generateCertificatePDF(studentId)

        if (!pdfResult || !pdfResult.buffer) {
            return NextResponse.json({ error: "فشل إنشاء ملف الـ PDF" }, { status: 500 })
        }

        // Return PDF as download
        const filename = `certificate-${cert.student_name.replace(/\s+/g, '-')}.pdf`

        // Convert Buffer to Uint8Array for NextResponse body
        const uint8Array = new Uint8Array(pdfResult.buffer)

        return new NextResponse(uint8Array, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
                "Cache-Control": "no-cache",
            },
        })

    } catch (error) {
        console.error("Certificate download error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
