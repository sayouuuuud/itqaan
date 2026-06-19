import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query, queryOne, ensureInitiativeInvitesSchema } from "@/lib/db"
import { getManagedInitiative, generateInviteToken } from "@/lib/initiatives"
import { sendInitiativeInviteEmail } from "@/lib/email"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// GET /api/initiative/invite/email - list invitations sent for the managed initiative.
export async function GET() {
  const session = await getSession()
  if (!requireRole(session, ["initiative_admin", "admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  await ensureInitiativeInvitesSchema()

  const initiative = await getManagedInitiative(session)
  if (!initiative) {
    return NextResponse.json({ error: "لا توجد مبادرة مرتبطة بحسابك" }, { status: 404 })
  }

  const invites = await query<{
    id: string
    email: string
    status: string
    created_at: string
    accepted_at: string | null
  }>(
    `SELECT id, email, status, created_at, accepted_at
     FROM initiative_invites
     WHERE initiative_id = $1
     ORDER BY created_at DESC
     LIMIT 200`,
    [initiative.id]
  )

  return NextResponse.json({ invites })
}

// POST /api/initiative/invite/email - create + send an email invitation.
// body: { email: string }
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!requireRole(session, ["initiative_admin", "admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  await ensureInitiativeInvitesSchema()

  const initiative = await getManagedInitiative(session)
  if (!initiative) {
    return NextResponse.json({ error: "لا توجد مبادرة مرتبطة بحسابك" }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const email = String(body.email || "").trim().toLowerCase()

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "البريد الإلكتروني غير صالح" }, { status: 400 })
  }

  // If the email already belongs to a member of THIS initiative, no need to invite.
  const member = await queryOne<{ id: string }>(
    `SELECT id FROM users WHERE email = $1 AND initiative_id = $2 LIMIT 1`,
    [email, initiative.id]
  )
  if (member) {
    return NextResponse.json({ error: "هذا الطالب منضم بالفعل إلى مبادرتك" }, { status: 409 })
  }

  // Reuse an existing pending invite for the same email if present.
  let invite = await queryOne<{ id: string; token: string }>(
    `SELECT id, token FROM initiative_invites
     WHERE initiative_id = $1 AND email = $2 AND status = 'pending'
     ORDER BY created_at DESC LIMIT 1`,
    [initiative.id, email]
  )

  if (!invite) {
    let token = generateInviteToken()
    for (let attempt = 0; attempt < 5; attempt++) {
      const clash = await queryOne<{ id: string }>(
        `SELECT id FROM initiative_invites WHERE token = $1 LIMIT 1`,
        [token]
      )
      if (!clash) break
      token = generateInviteToken()
    }
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    const created = await query<{ id: string; token: string }>(
      `INSERT INTO initiative_invites (initiative_id, email, token, invited_by, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, token`,
      [initiative.id, email, token, session!.sub, expiresAt.toISOString()]
    )
    invite = created[0]
  }

  const proto = req.headers.get("x-forwarded-proto") || "https"
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || ""
  const inviteUrl = `${proto}://${host}/initiative-invite/${invite.token}`

  const sent = await sendInitiativeInviteEmail(email, initiative.name, inviteUrl, session!.name)
  if (!sent) {
    return NextResponse.json({ error: "تعذّر إرسال البريد. تأكد من إعدادات البريد." }, { status: 502 })
  }

  return NextResponse.json({ success: true, email, inviteUrl })
}
