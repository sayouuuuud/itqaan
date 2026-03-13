import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

// GET /api/auth/me — return full user profile including avatar
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "غير مسجل" }, { status: 401 })
    }

    const rows = await query<{
      id: string
      name: string
      email: string
      role: string
      avatar_url: string | null
      gender: string | null
      phone: string | null
    }>(
      `SELECT id, name, email, role, avatar_url, gender, phone FROM users WHERE id = $1`,
      [session.sub]
    )

    if (!rows.length) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 })
    }

    return NextResponse.json({ user: rows[0] })
  } catch (error) {
    console.error("Auth me error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}

// PATCH /api/auth/me — update name and/or avatar_url
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const body = await req.json()
    const { name, avatar_url, phone, gender } = body

    const updates: string[] = []
    const params: unknown[] = []

    if (name !== undefined) {
      params.push(name)
      updates.push(`name = $${params.length}`)
    }
    if (avatar_url !== undefined) {
      params.push(avatar_url)
      updates.push(`avatar_url = $${params.length}`)
    }
    if (phone !== undefined) {
      params.push(phone)
      updates.push(`phone = $${params.length}`)
    }
    if (gender !== undefined) {
      params.push(gender)
      updates.push(`gender = $${params.length}`)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "لا توجد بيانات للتحديث" }, { status: 400 })
    }

    params.push(session.sub)
    const result = await query<{ id: string; name: string; email: string; avatar_url: string | null; role: string }>(
      `UPDATE users SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${params.length}
       RETURNING id, name, email, avatar_url, role`,
      params
    )

    return NextResponse.json({ user: result[0] })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
