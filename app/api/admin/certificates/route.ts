import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { sendCertificateIssuedEmail } from "@/lib/email"
import { generateCertificatePDF } from "@/lib/pdf"

// GET /api/admin/certificates
export async function GET(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || !requireRole(session, ["admin"])) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const status = searchParams.get("status") || "pending"

        let statusCondition = ""
        if (status === "pending") {
            statusCondition = "AND cd.certificate_issued = false"
        } else if (status === "issued") {
            statusCondition = "AND cd.certificate_issued = true"
        }

        const [appsData, globalCeremonyRow] = await Promise.all([
            query(
                `SELECT cd.*, u.name as student_name, u.email as student_email,
                   (SELECT status FROM recitations r WHERE r.student_id = cd.student_id ORDER BY created_at DESC LIMIT 1) as recitation_status
                 FROM certificate_data cd
                 JOIN users u ON u.id = cd.student_id
                 WHERE 1=1 ${statusCondition}
                 ORDER BY cd.created_at DESC`
            ),
            queryOne<{ setting_value: any }>(
                `SELECT setting_value FROM system_settings WHERE setting_key = 'global_ceremony_date'`
            )
        ])

        const globalCeremony = globalCeremonyRow?.setting_value || { date: null, message: "" }

        const applications = appsData.map(app => {
            const hasCustomDate = !!app.ceremony_date
            return {
                ...app,
                effective_ceremony_date: hasCustomDate ? app.ceremony_date : globalCeremony.date,
                effective_ceremony_message: hasCustomDate ? null : globalCeremony.message,
                is_custom_ceremony: hasCustomDate
            }
        })

        return NextResponse.json({
            applications,
            globalCeremony
        })
    } catch (error) {
        console.error("Get certificates error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}

// PUT /api/admin/certificates
// Actions: "issue", "set_ceremony_date" (individual), "set_global_ceremony"
export async function PUT(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || !requireRole(session, ["admin"])) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
        }

        const body = await req.json()
        const { action } = body

        // --- Set Global Ceremony Date ---
        if (action === "set_global_ceremony") {
            const { date, message } = body
            await query(
                `UPDATE system_settings SET setting_value = $1, updated_at = NOW() WHERE setting_key = 'global_ceremony_date'`,
                [JSON.stringify({ date: date || null, message: message || "" })]
            )
            return NextResponse.json({ success: true })
        }

        // --- Set Individual Ceremony Date ---
        if (action === "set_ceremony_date") {
            const { id, ceremony_date } = body
            if (!id) return NextResponse.json({ error: "id مطلوب" }, { status: 400 })
            await query(
                `UPDATE certificate_data SET ceremony_date = $1, updated_at = NOW() WHERE id = $2`,
                [ceremony_date || null, id]
            )
            return NextResponse.json({ success: true })
        }

        // --- Issue Certificate ---
        if (action === "issue") {
            const { id } = body
            if (!id) return NextResponse.json({ error: "id مطلوب" }, { status: 400 })

            const cert = await queryOne<{
                student_id: string;
                certificate_issued: boolean;
                student_name: string;
                student_email: string;
                ceremony_date: string | null;
                pdf_file_url: string | null;
            }>(
                `SELECT cd.student_id, cd.certificate_issued, u.name as student_name, u.email as student_email,
                        cd.ceremony_date, cd.pdf_file_url
                 FROM certificate_data cd
                 JOIN users u ON u.id = cd.student_id
                 WHERE cd.id = $1`,
                [id]
            )

            if (!cert) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 })
            if (cert.certificate_issued) return NextResponse.json({ error: "تم إصدار الشهادة مسبقاً" }, { status: 400 })

            // Fetch global ceremony if no individual one
            let ceremonyDate = cert.ceremony_date
            let ceremonyMessage = ""
            if (!ceremonyDate) {
                const globalRow = await queryOne<{ setting_value: any }>(
                    `SELECT setting_value FROM system_settings WHERE setting_key = 'global_ceremony_date'`
                )
                if (globalRow?.setting_value?.date) {
                    ceremonyDate = globalRow.setting_value.date
                    ceremonyMessage = globalRow.setting_value.message || ""
                }
            }

            const certificateUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/c/${cert.student_id}`

            // Generate certificate PDF
            const certificatePdfUrl = await generateCertificatePDF(certificateUrl, cert.student_id)

            await query(
                `UPDATE certificate_data SET certificate_issued = true, certificate_url = $1, certificate_pdf_url = $2, updated_at = NOW() WHERE id = $3`,
                [certificateUrl, certificatePdfUrl, id]
            )

            // Send email with ceremony info and PDF
            if (cert.student_email) {
                await sendCertificateIssuedEmail(
                    cert.student_email,
                    cert.student_name,
                    certificateUrl,
                    ceremonyDate,
                    ceremonyMessage,
                    certificatePdfUrl
                )
            }

            return NextResponse.json({ success: true, certificateUrl })
        }

        return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 })
    } catch (error) {
        console.error("Certificate action error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
