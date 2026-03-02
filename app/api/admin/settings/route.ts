import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"

// GET /api/admin/settings
export async function GET() {
  const session = await getSession()
  if (!session || !requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const settings = await query(
    `SELECT setting_key, setting_value FROM system_settings ORDER BY setting_key`
  )

  const settingsMap = settings.reduce((acc, row: unknown) => {
    const r = row as { setting_key: string; setting_value: unknown }
    acc[r.setting_key] = r.setting_value
    return acc
  }, {} as Record<string, unknown>)

  return NextResponse.json({ settings: settingsMap })
}

// PUT /api/admin/settings
export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session || !requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const { settings } = await req.json()

  if (!settings || typeof settings !== "object") {
    return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 })
  }

  for (const [key, value] of Object.entries(settings)) {
    // setting_value is JSONB, so we need to properly format the value
    const jsonValue = JSON.stringify(value)
    await query(
      `INSERT INTO system_settings (setting_key, setting_value, setting_type, description)
       VALUES ($1, $2::jsonb, 'general', $1)
       ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2::jsonb, updated_by = $3`,
      [key, jsonValue, session.sub]
    )
  }

  return NextResponse.json({ success: true })
}
