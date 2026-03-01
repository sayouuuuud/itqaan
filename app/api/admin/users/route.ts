import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"
import bcrypt from "bcryptjs"
import { logAdminAction } from "@/lib/activity-log"

// GET /api/admin/users - list all users (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!requireRole(session, ["admin"])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const role = searchParams.get("role")
    const search = searchParams.get("search")

    let whereClause = "WHERE 1=1"
    const params: unknown[] = []

    if (role) {
      params.push(role)
      whereClause += ` AND u.role = $${params.length}`
    }

    if (search) {
      params.push(`%${search}%`)
      whereClause += ` AND (u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`
    }

    const users = await query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at, u.avatar_url,
              (SELECT COUNT(*) FROM recitations r WHERE r.student_id = u.id) as recitations_count,
              rp.rating, rp.total_reviews,
              EXISTS(
                SELECT 1 FROM user_sessions us 
                WHERE us.user_id = u.id 
                AND us.last_active_at > NOW() - INTERVAL '5 minutes'
              ) as is_online
       FROM users u
       LEFT JOIN reader_profiles rp ON u.id = rp.user_id
       ${whereClause}
       ORDER BY u.created_at DESC`,
      params
    )

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Admin users error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}

// PATCH /api/admin/users - toggle user active status
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!requireRole(session, ["admin"])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }

    const { userId, isActive, role, name, email, password, gender } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "معرف المستخدم مطلوب" }, { status: 400 })
    }

    const updates: string[] = []
    const values: unknown[] = []

    if (typeof isActive === "boolean") {
      values.push(isActive)
      updates.push(`is_active = $${values.length}`)
    }

    if (role) {
      values.push(role)
      updates.push(`role = $${values.length}`)
    }

    if (name) {
      values.push(name)
      updates.push(`name = $${values.length}`)
    }

    if (email) {
      values.push(email)
      updates.push(`email = $${values.length}`)
    }

    if (password && password.length >= 6) {
      const passwordHash = await bcrypt.hash(password, 10)
      values.push(passwordHash)
      updates.push(`password_hash = $${values.length}`)
    }

    if (gender) {
      values.push(gender)
      updates.push(`gender = $${values.length}`)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "لا يوجد بيانات للتحديث" }, { status: 400 })
    }

    values.push(userId)
    const result = await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING id, name, email, role, is_active`,
      values
    )

    await logAdminAction({
      userId: session!.sub,
      action: typeof isActive === 'boolean' ? (isActive ? 'user_activated' : 'user_deactivated') : 'user_updated',
      entityType: 'user',
      entityId: userId,
      description: `Admin updated user ${userId}`,
    })

    return NextResponse.json({ user: result[0] })
  } catch (error) {
    console.error("Admin update user error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}

// POST /api/admin/users - create new user
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!requireRole(session, ["admin"])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }

    const { name, email, password, role, gender } = await req.json()

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 })
    }

    const existing = await query("SELECT id FROM users WHERE email = $1", [
      email.toLowerCase(),
    ])
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مسجل مسبقاً" },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, email_verified, is_active, gender)
       VALUES ($1, $2, $3, $4, TRUE, TRUE, $5)
       RETURNING id, name, email, role, is_active, created_at, gender`,
      [name, email.toLowerCase(), passwordHash, role, gender || null]
    )

    await logAdminAction({
      userId: session!.sub,
      action: 'user_created',
      entityType: 'user',
      entityId: (result[0] as any)?.id,
      description: `Admin created user ${email} with role ${role}`,
    })

    return NextResponse.json({ user: result[0] }, { status: 201 })
  } catch (error) {
    console.error("Admin create user error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
