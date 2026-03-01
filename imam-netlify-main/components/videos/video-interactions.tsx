"use client"

import { Share2 } from "lucide-react"

interface VideoInteractionsProps {
    title: string
}

export function VideoInteractions({ title }: VideoInteractionsProps) {
    const handleShare = () => {
        if (typeof window === "undefined") return
        if (navigator.share) {
            navigator
                .share({
                    title: title || "فيديو",
                    url: window.location.href,
                })
                .catch(() => { })
        } else {
            navigator.clipboard.writeText(window.location.href).catch(() => { })
            alert("تم نسخ الرابط")
        }
    }

    return (
        <div className="flex flex-wrap items-center gap-3 mt-4">
            <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 bg-background border border-border hover:bg-accent transition-all duration-300 font-medium px-4 py-2 rounded-lg cursor-pointer text-sm"
            >
                <Share2 className="h-4 w-4" />
                مشاركة
            </button>
        </div>
    )
}
