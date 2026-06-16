import { NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { getManagedInitiative } from "@/lib/initiatives"
import { computeInitiativeStats } from "@/lib/initiative-stats"

export const dynamic = "force-dynamic"

// GET /api/initiative/stats - statistics scoped to the admin's initiative.
export async function GET() {
  const session = await getSession()
  if (!requireRole(session, ["initiative_admin", "admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const initiative = await getManagedInitiative(session)
  if (!initiative) {
    return NextResponse.json({ error: "لا توجد مبادرة مرتبطة بحسابك" }, { status: 404 })
  }

  const stats = await computeInitiativeStats(initiative.id)
  return NextResponse.json({
    initiative: { id: initiative.id, name: initiative.name, target: initiative.target_students_count },
    ...stats,
  })
}
