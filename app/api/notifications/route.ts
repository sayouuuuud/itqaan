import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

// GET /api/notifications
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const notifications = await query(
      `SELECT id, type, title, message, category, link, is_read, created_at,
              related_recitation_id, related_booking_id
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [session.sub]
    )

    const unreadCount = (notifications as { is_read: boolean }[]).filter(n => !n.is_read).length

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}

// PATCH /api/notifications — mark ALL as read
export async function PATCH() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    await query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
      [session.sub]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mark notifications error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
