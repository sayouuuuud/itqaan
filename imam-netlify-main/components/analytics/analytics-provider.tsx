"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, Suspense } from "react"

function AnalyticsTracker() {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        // Determine device type
        const getDeviceType = () => {
            const ua = navigator.userAgent
            if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
                return "tablet"
            }
            if (
                /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
                    ua
                )
            ) {
                return "mobile"
            }
            return "desktop"
        }

        const trackVisit = async () => {
            try {
                await fetch("/api/analytics/track", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        path: pathname,
                        deviceType: getDeviceType(),
                        referrer: document.referrer,
                    }),
                })
            } catch (error) {
                console.error("Failed to track visit:", error)
            }
        }

        // timeout to ensure page load
        const timeoutId = setTimeout(trackVisit, 1000)

        return () => clearTimeout(timeoutId)
    }, [pathname, searchParams])

    return null
}

export function AnalyticsProvider() {
    return (
        <Suspense fallback={null}>
            <AnalyticsTracker />
        </Suspense>
    )
}
