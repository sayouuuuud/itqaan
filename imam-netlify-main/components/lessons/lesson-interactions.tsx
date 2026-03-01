"use client"

import { useState } from "react"
import { Share2, ChevronLeft } from "lucide-react"

interface LessonInteractionsProps {
    audioUrl: string | null
    title: string
    description?: string
    lessonId?: string
    table?: string
}

export function LessonInteractions({ audioUrl, title, description, lessonId, table = "lessons" }: LessonInteractionsProps) {
    const [downloadProgress, setDownloadProgress] = useState<number>(0)
    const [isDownloading, setIsDownloading] = useState(false)

    const handleShare = () => {
        if (typeof window === "undefined") return
        if (navigator.share) {
            navigator
                .share({
                    title: title || "درس",
                    text: description,
                    url: window.location.href,
                })
                .catch(() => { })
        } else {
            navigator.clipboard.writeText(window.location.href).catch(() => { })
            alert("تم نسخ الرابط")
        }
    }

    const handleDownload = async () => {
        if (!audioUrl || isDownloading) return

        setIsDownloading(true)
        setDownloadProgress(0)

        try {
            // Construct the download URL
            let downloadLink = audioUrl

            // Base query params for tracking
            const trackingParams = lessonId ? `&id=${lessonId}&table=${table}&download=true` : ''

            // If it's a relative path (uploads), use download api
            if (audioUrl.startsWith("uploads/")) {
                downloadLink = `/api/download?key=${encodeURIComponent(audioUrl)}${trackingParams}`
            }
            // If it's a split file or external URL, use download-audio proxy
            else if (audioUrl.startsWith("split:") || !audioUrl.startsWith("/")) {
                // For proxy, we pass the tracking params as well
                downloadLink = `/api/download-audio?url=${encodeURIComponent(audioUrl)}${trackingParams}`
            }

            // Fetch with progress
            const xhr = new XMLHttpRequest();
            xhr.open('GET', downloadLink, true);
            xhr.responseType = 'blob';

            xhr.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    setDownloadProgress(percentComplete);
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    const blob = xhr.response;
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    // Force .m4a extension as requested
                    link.download = `${title || 'lesson'}.m4a`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                }
                setIsDownloading(false);
                setDownloadProgress(0);
            };

            xhr.onerror = () => {
                console.error('Download failed');
                setIsDownloading(false);
            };

            xhr.send();

        } catch (error) {
            console.error('Download error:', error)
            setIsDownloading(false)
        }
    }

    return (
        <div className="mb-12 pb-12 border-b border-border no-print">
            <h3 className="font-bold text-foreground mb-4">مشاركة وتنزيل</h3>
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={handleShare}
                        className="inline-flex items-center gap-2 bg-background border border-border hover:bg-accent transition-all duration-300 font-medium px-4 py-2 rounded-lg cursor-pointer text-sm"
                    >
                        <Share2 className="h-4 w-4" />
                        مشاركة
                    </button>

                    <button
                        onClick={handleDownload}
                        disabled={isDownloading || !audioUrl}
                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white border border-transparent transition-all duration-300 font-medium px-4 py-2 rounded-lg cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="h-4 w-4 rotate-[-90deg]" />
                        {isDownloading ? `جاري التحميل ${Math.round(downloadProgress)}%` : 'تحميل صوتي'}
                    </button>
                </div>

                {isDownloading && (
                    <div className="w-full max-w-md bg-muted rounded-full h-2.5 overflow-hidden">
                        <div
                            className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${downloadProgress}%` }}
                        ></div>
                    </div>
                )}
            </div>
        </div>
    )
}
