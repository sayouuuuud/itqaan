import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value

  if (token) {
    await query(`DELETE FROM user_sessions WHERE token = $1`, [token]).catch((err) => {
      console.error("Failed to delete user session on logout:", err)
    })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set("auth-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  })
  return response
}
