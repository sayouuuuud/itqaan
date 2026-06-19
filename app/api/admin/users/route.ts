import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"
import bcrypt from "bcryptjs"
import { logAdminAction } from "@/lib/activity-log"

// GET /api/admin/users - list all users (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    const allowedRoles: ("admin" | "student_supervisor" | "reciter_supervisor")[] = ["admin", "student_supervisor", "reciter_supervisor"]
    if (!requireRole(session, allowedRoles)) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const role = searchParams.get("role")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    let whereClause = "WHERE 1=1"
    const params: unknown[] = []

    // Enforce role restrictions for supervisors
    if (session!.role === 'student_supervisor') {
      params.push('student')
      whereClause += ` AND u.role = $${params.length}`
    } else if (session!.role === 'reciter_supervisor') {
      params.push('reader')
      whereClause += ` AND u.role = $${params.length}`
    } else if (role) {
      if (role === 'supervisors') {
        whereClause += ` AND u.role IN ('student_supervisor', 'reciter_supervisor', 'initiative_admin')`
      } else {
        params.push(role)
        whereClause += ` AND u.role = $${params.length}`
      }
    }

    if (search) {
      const searchVal = `%${search}%`
      params.push(searchVal)
      const idx1 = params.length
      params.push(searchVal)
      const idx2 = params.length
      whereClause += ` AND (u.name ILIKE $${idx1} OR u.email ILIKE $${idx2})`
    }

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN reader_profiles rp ON u.id = rp.user_id
      ${whereClause}
    `
    const countResult = await query(countQuery, params)
    const totalUsers = parseInt((countResult[0] as any).total)

    // Get paginated users
    // NOTE: keep this base query free of any dependency on the `initiatives`
    // table / `users.initiative_id` column so the list always renders even if
    // that schema is missing on a given database. Initiative info is attached
    // separately below in a guarded query.
    let users = await query<Record<string, any>>(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at, u.avatar_url, u.is_accepting_recitations,
              (SELECT COUNT(*) FROM recitations r WHERE r.student_id = u.id) as recitations_count,
              rp.rating, rp.total_reviews, rp.nationality,
              EXISTS(
                SELECT 1 FROM user_sessions us 
                WHERE us.user_id = u.id 
                AND us.last_active_at > NOW() - INTERVAL '5 minutes'
              ) as is_online
       FROM users u
       LEFT JOIN reader_profiles rp ON u.id = rp.user_id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    )

    // Progressive fallback: if the rich query returned nothing but the count
    // says there ARE users, the rich query almost certainly threw because of a
    // missing optional column/table (e.g. avatar_url, is_accepting_recitations,
    // rp.nationality, user_sessions, recitations). `lib/db.ts` swallows query
    // errors and returns [], so re-run a minimal query that only relies on
    // columns guaranteed to exist on the `users` table.
    if (users.length === 0 && totalUsers > 0) {
      console.error("[v0] users rich query returned empty with count=" + totalUsers + "; falling back to minimal query")
      users = await query<Record<string, any>>(
        `SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at
         FROM users u
         ${whereClause}
         ORDER BY u.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      )
      // Normalize optional fields so the UI has predictable shapes.
      for (const u of users) {
        u.avatar_url = u.avatar_url ?? null
        u.is_accepting_recitations = u.is_accepting_recitations ?? null
        u.recitations_count = u.recitations_count ?? 0
        u.rating = u.rating ?? null
        u.total_reviews = u.total_reviews ?? null
        u.nationality = u.nationality ?? null
        u.is_online = u.is_online ?? false
      }
    }

    // Enrich with initiative info (id + name). Guarded so a missing
    // initiatives table / column never breaks the users list. We first probe
    // information_schema to confirm `users.initiative_id` exists, so we never
    // even issue a query that would throw "column u.initiative_id does not
    // exist" on databases that lack the column.
    if (users.length > 0) {
      // Default every user to null so the shape is always consistent.
      for (const u of users) {
        u.initiative_id = u.initiative_id ?? null
        u.initiative_name = u.initiative_name ?? null
      }
      try {
        const colCheck = await query<{ exists: boolean }>(
          `SELECT EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_name = 'users' AND column_name = 'initiative_id'
           ) as exists`
        )
        const hasInitiativeColumn = Boolean((colCheck[0] as any)?.exists)

        if (hasInitiativeColumn) {
          const ids = users.map(u => u.id)
          const initiativeRows = await query<{ id: string; initiative_id: string | null; initiative_name: string | null }>(
            `SELECT u.id, u.initiative_id,
                    (SELECT ini.name FROM initiatives ini WHERE ini.id = u.initiative_id) as initiative_name
             FROM users u
             WHERE u.id = ANY($1::uuid[])`,
            [ids]
          )
          const map = new Map(initiativeRows.map(r => [r.id, r]))
          for (const u of users) {
            const info = map.get(u.id)
            u.initiative_id = info?.initiative_id ?? null
            u.initiative_name = info?.initiative_name ?? null
          }
        }
      } catch (e) {
        console.error("[v0] initiative enrichment skipped:", e)
      }
    }

    const totalPages = Math.ceil(totalUsers / limit)

    return NextResponse.json({ 
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    })
  } catch (error) {
    console.error("Admin users error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}

// PATCH /api/admin/users - toggle user active status
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    const allowedRoles: ("admin" | "student_supervisor" | "reciter_supervisor")[] = ["admin", "student_supervisor", "reciter_supervisor"]
    if (!requireRole(session, allowedRoles)) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }

    const { userId, isActive, role, name, email, password, gender } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "معرف المستخدم مطلوب" }, { status: 400 })
    }

    // Role-based validation for supervisors
    const currentUsers = await query("SELECT role FROM users WHERE id = $1", [userId])
    if (currentUsers.length === 0) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 })
    const currentUser = currentUsers[0] as any

    if (session!.role === 'student_supervisor') {
      if (currentUser.role !== 'student' || (role && role !== 'student')) {
        return NextResponse.json({ error: "غير مصرح لك بتعديل هذا المستخدم" }, { status: 403 })
      }
    } else if (session!.role === 'reciter_supervisor') {
      if (currentUser.role !== 'reader' || (role && role !== 'reader')) {
        return NextResponse.json({ error: "غير مصرح لك بتعديل هذا المستخدم" }, { status: 403 })
      }
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
      if (role === 'reader') {
        updates.push(`approval_status = 'approved'`)
      }
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

    if (role === 'reader') {
      const existingProfile = await query("SELECT id FROM reader_profiles WHERE user_id = $1", [userId])
      if (existingProfile.length === 0) {
        const userRec = await query("SELECT name FROM users WHERE id = $1", [userId])
        const userName = name || (userRec[0] as any)?.name || 'Unknown'
        await query(
          `INSERT INTO reader_profiles (user_id, full_name_triple) VALUES ($1, $2)`,
          [userId, userName]
        )
      }
    }

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
    const allowedRoles: ("admin" | "student_supervisor" | "reciter_supervisor")[] = ["admin", "student_supervisor", "reciter_supervisor"]
    if (!requireRole(session, allowedRoles)) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }

    const { name, email, password, role, gender } = await req.json()

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 })
    }

    // Role-based validation for supervisors
    if (session!.role === 'student_supervisor' && role !== 'student') {
      return NextResponse.json({ error: "مشرف الطلاب يمكنه إضافة طلاب فقط" }, { status: 403 })
    }
    if (session!.role === 'reciter_supervisor' && role !== 'reader') {
      return NextResponse.json({ error: "مشرف المقرئين يمكنه إضافة مقرئين فقط" }, { status: 403 })
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
      `INSERT INTO users (name, email, password_hash, role, email_verified, is_active, gender, approval_status)
       VALUES ($1, $2, $3, $4, TRUE, TRUE, $5, 'approved')
       RETURNING id, name, email, role, is_active, created_at, gender`,
      [name, email.toLowerCase(), passwordHash, role, gender || null]
    )

    if (role === 'reader') {
      await query(
        `INSERT INTO reader_profiles (user_id, full_name_triple) VALUES ($1, $2)`,
        [(result[0] as any).id, name]
      )
    }

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
