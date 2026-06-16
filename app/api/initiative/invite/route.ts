import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { getManagedInitiative, generateJoinCode } from "@/lib/initiatives"

// GET /api/initiative/invite - return the current join code + enabled state.
export async function GET() {
  const session = await getSession()
  if (!requireRole(session, ["initiative_admin", "admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const initiative = await getManagedInitiative(session)
  if (!initiative) {
    return NextResponse.json({ error: "لا توجد مبادرة مرتبطة بحسابك" }, { status: 404 })
  }

  return NextResponse.json({
    joinCode: initiative.join_code,
    joinEnabled: initiative.join_enabled,
  })
}

// PATCH /api/initiative/invite - regenerate the code or toggle enabled.
// body: { action: "regenerate" } | { joinEnabled: boolean }
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!requireRole(session, ["initiative_admin", "admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const initiative = await getManagedInitiative(session)
  if (!initiative) {
    return NextResponse.json({ error: "لا توجد مبادرة مرتبطة بحسابك" }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))

  if (body.action === "regenerate") {
    let code = generateJoinCode()
    for (let attempt = 0; attempt < 5; attempt++) {
      const clash = await queryOne<{ id: string }>(
        `SELECT id FROM initiatives WHERE join_code = $1 AND id <> $2 LIMIT 1`,
        [code, initiative.id]
      )
      if (!clash) break
      code = generateJoinCode()
    }
    await query(`UPDATE initiatives SET join_code = $1, updated_at = now() WHERE id = $2`, [code, initiative.id])
    return NextResponse.json({ joinCode: code, joinEnabled: initiative.join_enabled })
  }

  if (typeof body.joinEnabled === "boolean") {
    await query(`UPDATE initiatives SET join_enabled = $1, updated_at = now() WHERE id = $2`, [body.joinEnabled, initiative.id])
    return NextResponse.json({ joinCode: initiative.join_code, joinEnabled: body.joinEnabled })
  }

  return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 })
}
