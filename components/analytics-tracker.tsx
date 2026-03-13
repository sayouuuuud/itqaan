"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

export function AnalyticsTracker() {
    const pathname = usePathname()
    const lastTrackedPath = useRef<string | null>(null)

    useEffect(() => {
        // Prevent double tracking or tracking static assets
        if (pathname === lastTrackedPath.current) return
        if (pathname.includes('.') || pathname.startsWith('/_next') || pathname.startsWith('/api')) return

        const trackView = async () => {
            try {
                // Get user info if available
                let userId = null
                try {
                    const authRes = await fetch('/api/auth/me')
                    if (authRes.ok) {
                        const authData = await authRes.json()
                        userId = authData.user?.id || null
                    }
                } catch (e) {
                    // Fail silently if auth check fails
                }

                await fetch('/api/admin/analytics', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        path: pathname,
                        referrer: typeof document !== 'undefined' ? document.referrer : null,
                        userId: userId
                    })
                })
                lastTrackedPath.current = pathname
            } catch (err) {
                console.error("Analytics tracking failed:", err)
            }
        }

        trackView()
    }, [pathname])

    return null
}
