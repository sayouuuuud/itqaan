import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "hana-lazan-secret-key-change-in-production"
)

const publicPaths = ["/", "/about", "/contact", "/sitemap-page", "/login", "/login-admin", "/register", "/reader-register", "/forgot-password", "/reset-password", "/verify", "/privacy", "/terms", "/maintenance"]
const apiPublicPaths = ["/api/auth/login", "/api/auth/register", "/api/admin/homepage", "/api/admin/analytics"]

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    // Skip static assets early
    if (pathname.startsWith("/_next") || pathname.startsWith("/uploads") || pathname.includes(".")) {
        return NextResponse.next()
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
        // If trying to access admin panel, redirect to login-admin
        if (pathname.startsWith("/admin")) {
            return NextResponse.redirect(new URL("/login-admin", req.url))
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
        if (pathname.startsWith("/admin")) {
            const adminRoles = ["admin", "student_supervisor", "reciter_supervisor"]
            if (!adminRoles.includes(role)) {
                return NextResponse.redirect(new URL("/login-admin", req.url))
            }
        }

        // Add user info to headers for API routes
        const response = NextResponse.next()
        response.headers.set("x-user-id", payload.sub as string)
        response.headers.set("x-user-role", role)
        return response
    } catch (err) {
        if (pathname.startsWith("/api/")) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
        }

        // If it's a public path, just show it anyway (even if token is bad)
        const normalizedPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
        if (publicPaths.includes(normalizedPath || '/')) {
            const response = NextResponse.next()
            response.cookies.delete("auth-token")
            return response
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
