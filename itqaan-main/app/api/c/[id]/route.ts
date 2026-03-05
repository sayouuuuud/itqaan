import { NextResponse } from "next/server"
import { queryOne } from "@/lib/db"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params

        const [certData, sealData] = await Promise.all([
            queryOne<{
                student_id: string;
                certificate_issued: boolean;
                university: string;
                city: string;
                student_name: string;
                issued_date: Date;
            }>(
                `SELECT cd.student_id, cd.certificate_issued, cd.university, cd.city, cd.updated_at as issued_date, u.name as student_name
                 FROM certificate_data cd
                 JOIN users u ON u.id = cd.student_id
                 WHERE cd.student_id = $1`,
                [id]
            ),
            queryOne<{ setting_value: any }>(
                `SELECT setting_value FROM system_settings WHERE setting_key = 'platform_seal'`
            )
        ])

        if (!certData) {
            return NextResponse.json({ error: "Certificate not found" }, { status: 404 })
        }

        if (!certData.certificate_issued) {
            return NextResponse.json({ error: "Certificate has not been issued yet" }, { status: 403 })
        }

        const platform_seal_url = sealData?.setting_value?.url || null

        return NextResponse.json({ certificate: { ...certData, platform_seal_url } })
    } catch (error) {
        console.error("Fetch certificate API err:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
