import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { computeInitiativeStats } from "@/lib/initiative-stats"

export const dynamic = "force-dynamic"

// GET /api/admin/initiatives/[id]/stats - Super Admin analytics for a specific initiative.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const { id } = await params
  const stats = await computeInitiativeStats(id)
  return NextResponse.json(stats)
}
