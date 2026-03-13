import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "hana-lazan-secret-key-change-in-production"
)

const publicPaths = ["/", "/about", "/contact", "/sitemap-page", "/login", "/register", "/reset-password", "/maintenance"]
const apiPublicPaths = ["/api/auth/login", "/api/auth/register", "/api/admin/homepage", "/api/admin/analytics"]

function getDeviceType(ua: string): string {
  if (!ua) return 'unknown'
  if (/bot|crawl|spider|slurp/i.test(ua)) return 'bot'
  if (/tablet|ipad|kindle/i.test(ua)) return 'tablet'
  if (/mobile|iphone|android.*mobile|windows phone/i.test(ua)) return 'mobile'
  return 'desktop'
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip static assets early
  if (pathname.startsWith("/_next") || pathname.startsWith("/uploads") || pathname.includes(".")) {
    return NextResponse.next()
  }

  // === Page tracking (fire-and-forget for non-bot page visits) ===
  const ua = req.headers.get("user-agent") || ""
  const isPage = !pathname.startsWith("/api/")
  if (isPage && !/bot|crawl|spider/i.test(ua)) {
    const origin = req.nextUrl.origin
    fetch(`${origin}/api/admin/analytics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: req.headers.get("referer") || null,
      }),
    }).catch(() => { })
  }

  // === Maintenance mode check for public pages ===
  const isPublicFacing = !pathname.startsWith("/admin") &&
    !pathname.startsWith("/student") &&
    !pathname.startsWith("/reader") &&
    !pathname.startsWith("/api") &&
    pathname !== "/login" &&
    pathname !== "/maintenance"

  if (isPublicFacing && process.env.DATABASE_URL) {
    try {
      const res = await fetch(`${req.nextUrl.origin}/api/admin/homepage`)
      if (res.ok) {
        const data = await res.json()
        const s = data?.settings || {}
        const isOn = s.maintenance_mode === true || s.maintenance_mode === "true"
        const fullPage = s.maintenance_full_page === true || s.maintenance_full_page === "true"
        if (isOn && fullPage && pathname !== "/") {
          return NextResponse.redirect(new URL("/maintenance", req.url))
        }
      }
    } catch { /* ignore */ }
  }

  // In development/demo mode, skip auth for dashboard pages
  if (!process.env.DATABASE_URL) {
    return NextResponse.next()
  }

  // Allow public paths
  if (publicPaths.includes(pathname) || pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  // Allow API public paths
  if (apiPublicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Check auth token for protected routes
  const token = req.cookies.get("auth-token")?.value

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", req.url))
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const role = payload.role as string

    // Role-based access control
    if (pathname.startsWith("/student") && role !== "student" && role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url))
    }
    if (pathname.startsWith("/reader") && role !== "reader" && role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url))
    }
    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // Add user info to headers for API routes
    const response = NextResponse.next()
    response.headers.set("x-user-id", payload.sub as string)
    response.headers.set("x-user-role", role)
    return response
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }
    const response = NextResponse.redirect(new URL("/login", req.url))
    response.cookies.delete("auth-token")
    return response
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|uploads).*)",
  ],
}
