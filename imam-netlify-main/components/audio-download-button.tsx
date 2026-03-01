"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"

interface AudioDownloadButtonProps {
    audioUrl: string
    title: string
    className?: string
    variant?: "default" | "outline" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
    audioId?: string // For bandwidth tracking
    table?: "lessons" | "sermons" // For tracking which table
}

/**
 * Audio Download Button Component
 * Handles downloading of split audio files by merging chunks into a single MP3 file
 */
export function AudioDownloadButton({
    audioUrl,
    title,
    className = "",
    variant = "outline",
    size = "sm",
    audioId,
    table = "lessons"
}: AudioDownloadButtonProps) {
    const [isDownloading, setIsDownloading] = useState(false)
    const [downloadProgress, setDownloadProgress] = useState(0)

    const handleDownload = async () => {
        if (!audioUrl || isDownloading) return

        setIsDownloading(true)
        setDownloadProgress(0)

        try {
            // Build tracking params
            const trackingParams = audioId ? `&id=${audioId}&table=${table}` : ''

            // Always use the download-audio API which handles both regular and split files
            // This also helps avoid CORS issues by proxying the request
            // Add timestamp to prevent caching, and explicit download flag
            const downloadUrl = `/api/download-audio?url=${encodeURIComponent(audioUrl)}&filename=${encodeURIComponent(title)}&t=${Date.now()}${trackingParams}&download=true`

            console.log('🔽 Starting audio download from:', downloadUrl)

            // Fetch with progress tracking
            const response = await fetch(downloadUrl)

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const contentLength = response.headers.get('content-length')
            const total = contentLength ? parseInt(contentLength, 10) : 0
            let loaded = 0

            const reader = response.body?.getReader()
            if (!reader) throw new Error('ReadableStream not supported')

            const chunks: BlobPart[] = []

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                chunks.push(value)
                loaded += value.length

                if (total) {
                    setDownloadProgress(Math.round((loaded / total) * 100))
                }
            }

            // Force Content-Type to audio/mpeg for the Blob
            // This ensures the OS treats it as an MP3 file
            const contentType = 'audio/mpeg'
            const blob = new Blob(chunks, { type: contentType })

            console.log('✅ Audio blob created, size:', blob.size)

            // Determine file extension - Force MP3 as requested
            const extension = 'mp3'

            // Create download link
            const blobUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = blobUrl
            link.download = `${title || 'audio'}.${extension}`
            link.style.display = 'none'

            // Trigger download
            document.body.appendChild(link)
            link.click()

            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link)
                window.URL.revokeObjectURL(blobUrl)
                console.log('🧹 Cleanup completed')
                setIsDownloading(false)
                setDownloadProgress(0)
            }, 1000)

        } catch (error) {
            console.error('❌ Download error:', error)
            alert('حدث خطأ أثناء تحميل الملف الصوتي. الرجاء المحاولة مرة أخرى.')
            setIsDownloading(false)
            setDownloadProgress(0)
        }
    }

    return (
        <>
            <Button
                variant={variant}
                size={size}
                onClick={handleDownload}
                disabled={isDownloading || !audioUrl}
                className={className}
            >
                {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                    <Download className="h-4 w-4 ml-2" />
                )}
                تحميل المقطع
            </Button>

            {/* Download Progress Dialog */}
            <Dialog open={isDownloading} onOpenChange={(open) => !open && isDownloading ? null : setIsDownloading(open)}>
                <DialogContent className="sm:max-w-md [&>button]:hidden">
                    <div className="flex flex-col items-center justify-center p-6 space-y-6">

                        {/* Animated Icon */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                            <div className="relative bg-primary/10 p-4 rounded-full">
                                <Download className="w-8 h-8 text-primary animate-bounce" />
                            </div>
                        </div>

                        <div className="text-center space-y-2">
                            <DialogTitle className="text-lg font-bold text-foreground">جاري تحميل المقطع الصوتي...</DialogTitle>
                            <p className="text-sm text-muted-foreground">
                                يرجى الانتظار بينما نجمع ونحضر الملف للتحميل
                            </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>التقدم</span>
                                <span>{downloadProgress}%</span>
                            </div>
                            <div className="h-2 w-full bg-secondary/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-300 ease-out"
                                    style={{ width: `${downloadProgress}%` }}
                                />
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground animate-pulse">
                            {downloadProgress < 50 ? 'جاري تجميع الأجزاء...' :
                                downloadProgress < 100 ? 'جاري التحميل من الخادم...' :
                                    'جاري الحفظ على جهازك...'}
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
