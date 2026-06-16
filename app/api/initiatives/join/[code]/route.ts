import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { query, queryOne } from "@/lib/db"
import { sendVerificationEmail } from "@/lib/email"
import { INITIATIVE_TYPE_LABELS } from "@/lib/initiatives"

interface InitiativeForJoin {
  id: string
  name: string
  type: string | null
  status: string
  join_enabled: boolean
}

async function resolveInitiative(code: string): Promise<InitiativeForJoin | null> {
  return queryOne<InitiativeForJoin>(
    `SELECT id, name, type, status, join_enabled
     FROM initiatives WHERE UPPER(join_code) = UPPER($1) LIMIT 1`,
    [code]
  )
}

// GET /api/initiatives/join/[code] - public: resolve initiative for the invite landing page.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const initiative = await resolveInitiative(code)

  if (!initiative || initiative.status !== "approved" || !initiative.join_enabled) {
    return NextResponse.json({ error: "رابط الدعوة غير صالح أو منتهي" }, { status: 404 })
  }

  return NextResponse.json({
    initiative: {
      id: initiative.id,
      name: initiative.name,
      typeLabel: initiative.type ? INITIATIVE_TYPE_LABELS[initiative.type] || "أخرى" : null,
    },
  })
}

// POST /api/initiatives/join/[code] - public: register a student tagged with this initiative.
export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params
    const initiative = await resolveInitiative(code)

    if (!initiative || initiative.status !== "approved" || !initiative.join_enabled) {
      return NextResponse.json({ error: "رابط الدعوة غير صالح أو منتهي" }, { status: 404 })
    }

    const { name, email, password, gender } = await req.json()

    if (!name || !email || !password) {
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
      [email.toLowerCase()]
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
      [name, email.toLowerCase(), passwordHash, gender || null, initiative.id, verificationCode, expiresAt.toISOString()]
    )
    const user = created[0]

    await sendVerificationEmail(user.email, user.name, verificationCode)

    return NextResponse.json(
      {
        user,
        requiresVerification: true,
        message: "تم إنشاء الحساب، يرجى تفعيل بريدك الإلكتروني",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Initiative join error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
