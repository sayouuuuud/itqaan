"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download } from "lucide-react"
import dynamic from "next/dynamic"

// Dynamic import for PDFViewer
const PDFViewer = dynamic(() => import("@/components/pdf-viewer").then(mod => mod.PDFViewer), {
    ssr: false,
    loading: () => <div className="h-96 w-full flex items-center justify-center bg-muted/10 rounded-lg animate-pulse">جاري تحميل القارئ...</div>
})

interface BookInteractionsProps {
    bookId: string | number
    bookTitle: string
    pdfUrl: string
    pdfViewUrl: string
    hasPdf: boolean
}

export function BookInteractions({ bookId, bookTitle, pdfUrl, pdfViewUrl, hasPdf }: BookInteractionsProps) {
    const [pdfViewerOpen, setPdfViewerOpen] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const [downloadProgress, setDownloadProgress] = useState(0)

    const handleDownload = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        if (!pdfUrl) return

        setIsDownloading(true)
        setDownloadProgress(0)

        try {
            let downloadLink = pdfUrl

            // Safety check: if URL is still split/manifest: (maybe from old cache or logic miss), fix it
            if (downloadLink && (downloadLink.startsWith('split:') || downloadLink.startsWith('manifest:'))) {
                console.log('🔄 Converting split/manifest URL to proxy in handleDownload')
                downloadLink = `/api/download-pdf?url=${encodeURIComponent(downloadLink)}&id=${bookId}` // No inline for download
            }

            console.log('🔽 Starting download from:', downloadLink)

            // Fetch the file with progress
            const response = await fetch(downloadLink)

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const contentLength = response.headers.get('content-length')
            const total = contentLength ? parseInt(contentLength, 10) : 0
            let loaded = 0

            const reader = response.body?.getReader()
            if (!reader) throw new Error('ReadableStream not supported')

            const chunks = []

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                chunks.push(value)
                loaded += value.length

                if (total) {
                    setDownloadProgress(Math.round((loaded / total) * 100))
                }
            }

            const blob = new Blob(chunks, { type: 'application/pdf' })
            console.log('✅ Blob created, size:', blob.size)

            // Create download link
            const downloadUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = `${bookTitle || 'book'}.pdf`
            link.style.display = 'none'

            // Trigger download
            document.body.appendChild(link)
            link.click()

            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link)
                window.URL.revokeObjectURL(downloadUrl)
                console.log('🧹 Cleanup completed')
                setIsDownloading(false)
                setDownloadProgress(0)
            }, 1000)

        } catch (error) {
            console.error('❌ Download error:', error)
            alert('حدث خطأ أثناء تحميل الملف. الرجاء المحاولة مرة أخرى.')
            setIsDownloading(false)
            setDownloadProgress(0)
        }
    }

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: bookTitle || 'كتاب',
                url: window.location.href,
            }).catch(() => { })
        } else {
            navigator.clipboard.writeText(window.location.href).catch(() => { })
            alert("تم نسخ الرابط للحافظة")
        }
    }

    return (
        <>
            <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-border mb-8">
                {hasPdf ? (
                    <>
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-all shadow-md hover:shadow-lg font-medium"
                        >
                            <span className="material-icons-outlined">picture_as_pdf</span>
                            تحميل PDF
                        </button>
                        <button
                            onClick={() => setPdfViewerOpen(true)}
                            className="flex items-center gap-2 bg-background text-foreground border border-border px-6 py-3 rounded-lg hover:bg-muted transition-all font-medium"
                        >
                            <span className="material-icons-outlined">visibility</span>
                            عرض
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 bg-background text-foreground border border-border px-6 py-3 rounded-lg hover:bg-muted transition-all font-medium ml-auto"
                        >
                            <span className="material-icons-outlined">share</span>
                            مشاركة
                        </button>
                    </>
                ) : (
                    <div className="px-6 py-2 bg-muted text-muted-foreground rounded-lg opacity-50 cursor-not-allowed">
                        الكتاب غير متاح
                    </div>
                )}
            </div>

            {/* PDF Viewer Dialog */}
            <Dialog open={pdfViewerOpen} onOpenChange={setPdfViewerOpen}>
                <DialogContent className="w-full h-[100dvh] sm:w-[90vw] sm:h-[90vh] max-w-none p-0 flex flex-col rounded-none sm:rounded-lg">
                    <DialogHeader className="flex-shrink-0 p-3 sm:p-5 border-b bg-muted">
                        <div className="flex items-center justify-between gap-2">
                            <DialogTitle className="text-sm sm:text-lg font-bold text-foreground truncate max-w-[150px] sm:max-w-xl">{bookTitle || 'كتاب'}</DialogTitle>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDownload}
                                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs"
                                >
                                    <span className="material-icons-outlined text-xs">download</span>
                                    <span>تحميل PDF</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPdfViewerOpen(false)}
                                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs"
                                >
                                    <span className="material-icons-outlined text-xs">close</span>
                                    <span className="hidden sm:inline">إغلاق</span>
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="flex-1 bg-muted p-2 sm:p-3 overflow-hidden">
                        {/* Universal Native PDF Viewer for Mobile & Desktop */}
                        <div className="w-full h-full bg-background rounded-lg shadow-2xl overflow-hidden">
                            <PDFViewer
                                fileKey={pdfViewUrl}
                                title={bookTitle || 'كتاب'}
                                className="w-full h-full"
                                bookId={String(bookId)}
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

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
                            <h3 className="text-lg font-bold text-foreground">جاري تحضير الملف...</h3>
                            <p className="text-sm text-muted-foreground">
                                يرجى الانتظار بينما نقوم بتجهيز الكتاب للتحميل
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
                            {downloadProgress < 100 ? 'جاري التحميل من الخادم...' : 'جاري الحفظ على جهازك...'}
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
