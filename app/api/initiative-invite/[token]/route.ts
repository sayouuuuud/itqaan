import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { query, queryOne, ensureInitiativeInvitesSchema } from "@/lib/db"
import { sendVerificationEmail } from "@/lib/email"
import { INITIATIVE_TYPE_LABELS } from "@/lib/initiatives"
import { notifyInitiativeAdmin } from "@/lib/notifications"

interface InviteRecord {
  id: string
  initiative_id: string
  email: string
  status: string
  expires_at: string | null
  initiative_name: string
  initiative_type: string | null
  initiative_status: string
}

async function resolveInvite(token: string): Promise<InviteRecord | null> {
  return queryOne<InviteRecord>(
    `SELECT inv.id, inv.initiative_id, inv.email, inv.status, inv.expires_at,
            i.name AS initiative_name, i.type AS initiative_type, i.status AS initiative_status
     FROM initiative_invites inv
     JOIN initiatives i ON i.id = inv.initiative_id
     WHERE inv.token = $1
     LIMIT 1`,
    [token]
  )
}

function isInvalid(invite: InviteRecord | null): string | null {
  if (!invite) return "رابط الدعوة غير صالح"
  if (invite.status === "accepted") return "تم استخدام هذه الدعوة مسبقاً"
  if (invite.initiative_status !== "approved") return "المبادرة غير متاحة حالياً"
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) return "انتهت صلاحية رابط الدعوة"
  return null
}

// GET /api/initiative-invite/[token] - resolve the invite for the registration page.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  await ensureInitiativeInvitesSchema()
  const { token } = await params
  const invite = await resolveInvite(token)
  const err = isInvalid(invite)
  if (err || !invite) {
    return NextResponse.json({ error: err || "رابط الدعوة غير صالح" }, { status: 404 })
  }

  return NextResponse.json({
    invite: {
      email: invite.email,
      initiative: {
        name: invite.initiative_name,
        typeLabel: invite.initiative_type ? INITIATIVE_TYPE_LABELS[invite.initiative_type] || "أخرى" : null,
      },
    },
  })
}

// POST /api/initiative-invite/[token] - register the invited student, tagged with the initiative.
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    await ensureInitiativeInvitesSchema()
    const { token } = await params
    const invite = await resolveInvite(token)
    const err = isInvalid(invite)
    if (err || !invite) {
      return NextResponse.json({ error: err || "رابط الدعوة غير صالح" }, { status: 404 })
    }

    const { name, password, gender } = await req.json()
    const email = invite.email // email is locked to the invited address

    if (!name || !password) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }, { status: 400 })
    }
    if (gender && !["male", "female"].includes(gender)) {
      return NextResponse.json({ error: "الجنس غير صحيح" }, { status: 400 })
    }

    const existing = await queryOne<{ id: string; email_verified: boolean }>(
      "SELECT id, email_verified FROM users WHERE email = $1 LIMIT 1",
      [email]
    )
    if (existing) {
      return NextResponse.json(
        {
          error: existing.email_verified
            ? "البريد الإلكتروني مسجل مسبقاً، يرجى تسجيل الدخول"
            : "البريد الإلكتروني مسجل ولكنه غير مفعل.",
          requiresVerification: !existing.email_verified,
        },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    const created = await query<{ id: string; name: string; email: string; role: string }>(
      `INSERT INTO users (name, email, password_hash, role, gender, initiative_id, verification_code, verification_expires_at, email_verified)
       VALUES ($1, $2, $3, 'student', $4, $5, $6, $7, FALSE)
       RETURNING id, name, email, role`,
      [name, email, passwordHash, gender || null, invite.initiative_id, verificationCode, expiresAt.toISOString()]
    )
    const user = created[0]

    // Mark the invite accepted.
    await query(
      `UPDATE initiative_invites SET status = 'accepted', accepted_at = now(), accepted_user_id = $1 WHERE id = $2`,
      [user.id, invite.id]
    )

    await sendVerificationEmail(user.email, user.name, verificationCode)

    await notifyInitiativeAdmin(invite.initiative_id, {
      type: "initiative_student_joined",
      title: "طالب جديد قبِل دعوتك",
      message: `سجّل ${name} في مبادرتك عبر دعوة البريد الإلكتروني.`,
      category: "general",
      link: `/initiative/participants`,
    })

    return NextResponse.json(
      {
        user,
        requiresVerification: true,
        message: "تم إنشاء الحساب، يرجى تفعيل بريدك الإلكتروني",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Initiative invite accept error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
