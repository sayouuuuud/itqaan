import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || !session.sub) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
        }

        const token = req.cookies.get("auth-token")?.value
        if (!token) {
            return NextResponse.json({ error: "مفقود" }, { status: 401 })
        }

        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null

        // Update the session's last_active_at
        const result = await query(
            `UPDATE user_sessions SET last_active_at = NOW(), ip_address = COALESCE($2, ip_address) WHERE token = $1 RETURNING id`,
            [token, ip]
        )

        // Fallback: If no session found for this token (e.g. old token), insert one to keep tracking
        if (result.length === 0) {
            const userAgent = req.headers.get("user-agent") || "Unknown"
            await query(
                `INSERT INTO user_sessions (user_id, token, ip_address, user_agent, expires_at, last_active_at)
         VALUES ($1, $2, $3, $4, NOW() + INTERVAL '30 days', NOW())`,
                [session.sub, token, ip, userAgent]
            ).catch(() => { })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Heartbeat error:", error)
        return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
    }
}
