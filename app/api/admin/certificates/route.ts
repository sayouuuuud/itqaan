import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { sendCertificateIssuedEmail } from "@/lib/email"
import { generateCertificateImage } from "@/lib/certificate-generator"

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

        const [appsData, globalCeremonyRow, platformSealRow, universities, entities] = await Promise.all([
            query(
                `SELECT cd.*, u.name as student_name, u.email as student_email, ae.name as entity_name,
                   (SELECT status FROM recitations r WHERE r.student_id = cd.student_id ORDER BY created_at DESC LIMIT 1) as recitation_status
                 FROM certificate_data cd
                 JOIN users u ON u.id = cd.student_id
                 LEFT JOIN authorized_entities ae ON ae.id = cd.entity_id
                 WHERE 1=1 ${statusCondition}
                 ORDER BY cd.created_at DESC`
            ),
            queryOne<{ setting_value: any }>(
                `SELECT setting_value FROM system_settings WHERE setting_key = 'global_ceremony_date'`
            ),
            queryOne<{ setting_value: any }>(
                `SELECT setting_value FROM system_settings WHERE setting_key = 'platform_seal'`
            ),
            query(`SELECT * FROM universities ORDER BY name ASC`),
            query(`SELECT * FROM authorized_entities ORDER BY name ASC`)
        ])

        const globalCeremony = globalCeremonyRow?.setting_value || { date: null, message: "" }
        const platformSealUrl = platformSealRow?.setting_value?.url || null

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
            globalCeremony,
            platformSealUrl,
            universities,
            entities
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

        // --- Set Platform Seal ---
        if (action === "set_platform_seal") {
            const { url } = body
            await query(
                `INSERT INTO system_settings (setting_key, setting_value, updated_at) 
                 VALUES ('platform_seal', $1, NOW()) 
                 ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()`,
                [JSON.stringify({ url: url || null })]
            )
            return NextResponse.json({ success: true })
        }

        // --- Manage Universities ---
        if (action === "add_university") {
            const { name } = body
            if (!name) return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 })
            const res = await query(`INSERT INTO universities (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING *`, [name])
            return NextResponse.json({ university: res[0] })
        }
        if (action === "delete_university") {
            const { id } = body
            await query(`DELETE FROM universities WHERE id = $1`, [id])
            return NextResponse.json({ success: true })
        }

        // --- Manage Authorized Entities ---
        if (action === "add_entity") {
            const { name, seal_url } = body
            if (!name) return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 })
            const res = await query(`INSERT INTO authorized_entities (name, seal_url) VALUES ($1, $2) RETURNING *`, [name, seal_url || null])
            return NextResponse.json({ entity: res[0] })
        }
        if (action === "update_entity") {
            const { id, name, seal_url } = body
            const res = await query(`UPDATE authorized_entities SET name = $1, seal_url = $2, updated_at = NOW() WHERE id = $3 RETURNING *`, [name, seal_url, id])
            return NextResponse.json({ entity: res[0] })
        }
        if (action === "delete_entity") {
            const { id } = body
            await query(`DELETE FROM authorized_entities WHERE id = $1`, [id])
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
                certificate_photo_url: string | null;
                serial_code: string | null;
                name_en: string | null;
            }>(
                `SELECT cd.student_id, cd.certificate_issued, u.name as student_name, u.email as student_email,
                        cd.ceremony_date, cd.pdf_file_url, cd.certificate_photo_url, cd.serial_code, cd.name_en
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

            const protocol = req.headers.get("x-forwarded-proto") || "http";
            const host = req.headers.get("host");
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || (host ? `${protocol}://${host}` : "http://localhost:3000");
            const certificateUrl = `${baseUrl}/c/${cert.student_id}`

            // Generate certificate image using Sharp layer compositor
            const imgResult = await generateCertificateImage({
                studentId: cert.student_id,
                studentName: cert.student_name, // Always pass native Arabic name to ensure fresh transliteration
                photoUrl: cert.certificate_photo_url || null,
                serialCode: cert.serial_code || `ITQ-MAK-${cert.student_id.slice(0, 8).toUpperCase()}`,
            })
            const certificateImageUrl = imgResult?.url || null
            const certificateImageBuffer = imgResult?.buffer || null
            const nameEn = imgResult?.nameEn || cert.name_en

            await query(
                `UPDATE certificate_data SET certificate_issued = true, certificate_url = $1, certificate_image_url = $2, name_en = $3, updated_at = NOW() WHERE id = $4`,
                [certificateUrl, certificateImageUrl, nameEn, id]
            )

            // Send email with ceremony info and certificate image
            if (cert.student_email) {
                await sendCertificateIssuedEmail(
                    cert.student_email,
                    cert.student_name,
                    certificateUrl,
                    ceremonyDate,
                    ceremonyMessage,
                    certificateImageUrl,
                    certificateImageBuffer
                )
            }

            const { createNotificationForAdmins } = await import('@/lib/notifications')
            await createNotificationForAdmins({
                type: 'general',
                title: "إصدار شهادة 📜",
                message: `قام المسؤول ${session.name} بإصدار شهادة للطالب ${cert.student_name}.`,
                category: "general",
                link: `/admin/certificates?status=issued`
            })

            return NextResponse.json({ success: true, certificateUrl })
        }

        return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 })
    } catch (error) {
        console.error("Certificate action error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
