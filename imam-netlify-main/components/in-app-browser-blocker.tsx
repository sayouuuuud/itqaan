"use client"

import { useEffect, useState } from "react"

/**
 * Detects in-app browsers (Facebook, Instagram, etc.) and prompts user to open in external browser
 */
export function InAppBrowserBlocker() {
    const [isBlocked, setIsBlocked] = useState(false)

    useEffect(() => {
        // Only run on client
        if (typeof window === "undefined") return

        const ua = navigator.userAgent || (navigator as any).vendor || ""

        // Detect common in-app browsers
        const isInAppBrowser = /FBAN|FBAV|Instagram|Line|Twitter|Snapchat|Messenger/i.test(ua)

        if (isInAppBrowser) {
            // Show native confirm dialog
            const shouldOpenExternal = window.confirm(
                "الموقع يعمل بشكل أفضل في متصفح خارجي.\n\nهل تريد فتح الموقع في المتصفح الرئيسي؟"
            )

            if (shouldOpenExternal) {
                openInExternalBrowser()
            } else {
                // User chose to stay - disable blocking for now
                // setIsBlocked(true)
            }
        }
    }, [])

    const openInExternalBrowser = () => {
        const url = window.location.href

        // Try different methods to open in external browser
        const isAndroid = /android/i.test(navigator.userAgent)
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)

        if (isAndroid) {
            // Android intent URL
            window.location.href = `intent://${url.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`
        } else if (isIOS) {
            // iOS - try to open in Safari
            // This may not always work due to iOS restrictions
            window.location.href = url
        } else {
            // Fallback - just try to open
            window.open(url, "_system")
        }
    }

    // We are disabling the blocker for now as it causes issues with styles in some in-app browsers
    // if (isBlocked) {
    //     return (
    //         <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center p-4">
    //             <div className="text-center max-w-md">
    //                 <div className="text-6xl mb-4">🌐</div>
    //                 <h1 className="text-2xl font-bold text-foreground mb-4">
    //                     يرجى فتح الموقع في متصفح خارجي
    //                 </h1>
    //                 <p className="text-text-muted mb-6">
    //                     للحصول على أفضل تربة، يرجى فتح هذا الرابط في متصفح Chrome أو Safari
    //                 </p>
    //                 <button
    //                     onClick={openInExternalBrowser}
    //                     className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-hover transition"
    //                 >
    //                     فتح في المتصفح
    //                 </button>
    //                 <p className="text-xs text-text-muted mt-4">
    //                     انسخ الرابط وافتحه في المتصفح الرئيسي
    //                 </p>
    //                 <div className="mt-2 bg-muted p-2 rounded text-xs text-foreground break-all">
    //                     {typeof window !== "undefined" ? window.location.href : ""}
    //                 </div>
    //             </div>
    //         </div>
    //     )
    // }

    return null
}
