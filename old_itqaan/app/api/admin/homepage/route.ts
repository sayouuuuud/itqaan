import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET() {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const rows = await query(
            `SELECT setting_key, setting_value FROM system_settings
       WHERE setting_type = 'homepage' ORDER BY setting_key`
        )
        const settings: Record<string, any> = {}
        for (const r of rows as any[]) {
            settings[r.setting_key] = r.setting_value
        }
        return NextResponse.json({ settings })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { settings } = await req.json()
        if (!settings) return NextResponse.json({ error: 'Missing settings' }, { status: 400 })

        for (const [key, value] of Object.entries(settings)) {
            await query(
                `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public)
         VALUES ($1, $2::jsonb, 'homepage', $1, true)
         ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2::jsonb, updated_at = NOW()`,
                [key, JSON.stringify(value)]
            )
        }
        return NextResponse.json({ ok: true })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
