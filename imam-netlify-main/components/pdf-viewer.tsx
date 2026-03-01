"use client"

import { useState, useEffect, useRef } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { LoadingSpinner } from "./loading-spinner"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { useSignedUrl } from "@/hooks/use-signed-url"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"


// Use local static worker from public folder to ensure Same-Origin (fixes Brave Android)
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

interface PDFViewerProps {
  fileKey: string // Can be a raw URL or a key
  title: string
  className?: string
}

export function PDFViewer({ fileKey, title, className = "" }: PDFViewerProps) {
  const isUrl = fileKey.startsWith("http") || fileKey.startsWith("/api") || fileKey.startsWith("split:")
  const { signedUrl: hookSignedUrl, loading: hookLoading, error: hookError } = useSignedUrl(!isUrl ? fileKey : "")

  // Determine the final URL to usage
  let finalUrl = "";

  if (fileKey.startsWith("split:") || fileKey.startsWith("manifest:")) {
    // Handle split/manifest files via proxy
    finalUrl = `/api/download-pdf?url=${encodeURIComponent(fileKey)}&inline=true`
  } else if (isUrl) {
    // If it is a local API endpoint (starts with /), append inline=true to bypass CORS via proxy
    if (fileKey.startsWith("/") && !fileKey.includes("inline=true")) {
      finalUrl = `${fileKey}${fileKey.includes('?') ? '&' : '?'}inline=true`
    } else if (fileKey.startsWith("http")) {
      // External URL
      // If it's UploadThing or R2, use DIRECT URL to save Vercel bandwidth and enable native Range Requests
      if (fileKey.includes('utfs.io') || fileKey.includes('uploadthing') || fileKey.includes('r2.dev')) {
        finalUrl = fileKey
      } else {
        // Other external URLs (like old Cloudinary or others) - proxy to avoid CORS or tracking
        finalUrl = `/api/download-pdf?url=${encodeURIComponent(fileKey)}&inline=true`
      }
    } else {
      finalUrl = fileKey
    }
  } else {
    finalUrl = hookSignedUrl || ""
  }

  const [numPages, setNumPages] = useState<number>(0)
  const [scale, setScale] = useState<number>(1.0)
  const [containerWidth, setContainerWidth] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const containerRef = useRef<HTMLDivElement>(null)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
  }

  // Handle Resize for responsive page width
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          setContainerWidth(entry.contentRect.width)
        }
      }
    })

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  // Track current page based on scroll position (with debounce for performance)
  useEffect(() => {
    const container = containerRef.current
    if (!container || numPages === 0) return

    let scrollTimeout: ReturnType<typeof setTimeout> | null = null

    const handleScroll = () => {
      // Debounce scroll handler to prevent excessive updates during fast scrolling
      if (scrollTimeout) clearTimeout(scrollTimeout)

      scrollTimeout = setTimeout(() => {
        const containerHeight = container.clientHeight
        const pageElements = container.querySelectorAll('[data-page]')

        for (const el of pageElements) {
          const rect = el.getBoundingClientRect()
          const containerRect = container.getBoundingClientRect()
          const relativeTop = rect.top - containerRect.top

          // Page is considered "current" if it's mostly visible
          if (relativeTop >= -rect.height / 2 && relativeTop <= containerHeight / 2) {
            const pageNum = parseInt(el.getAttribute('data-page') || '1', 10)
            setCurrentPage(pageNum)
            break
          }
        }
      }, 100) // 100ms debounce
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (scrollTimeout) clearTimeout(scrollTimeout)
    }
  }, [numPages])

  // Auto-scale on mobile/desktop based on container width
  const effectiveWidth = containerWidth > 0 ? containerWidth - 32 : 300 // padding consideration

  const [pdfError, setPdfError] = useState<Error | null>(null)

  function onDocumentLoadError(error: Error) {
    console.error('❌ PDF Load Error:', error)
    setPdfError(error)
  }

  if ((!isUrl && hookLoading)) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted/10 rounded-lg">
        <LoadingSpinner />
      </div>
    )
  }

  if ((!isUrl && hookError)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-red-50 text-red-600 rounded-lg p-4 text-center">
        <p className="font-bold mb-2">فشل تحميل رابط الملف</p>
        <p className="text-sm mb-4">{hookError}</p>
      </div>
    )
  }

  if (pdfError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-red-50 text-red-600 rounded-lg p-4 text-center">
        <p className="font-bold mb-2">حدث خطأ أثناء عرض الملف</p>
        <p className="text-sm mb-4 ltr" dir="ltr">{pdfError.message}</p>
        <Button
          variant="outline"
          onClick={() => { setPdfError(null); window.location.reload(); }}
          className="bg-white hover:bg-gray-100"
        >
          إعادة المحاولة
        </Button>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full bg-muted ${className}`}>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-card border-b border-border shadow-sm z-10 sticky top-0">

        {/* Page Info */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">عدد الصفحات: {numPages}</span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
            title="تصغير"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setScale(s => Math.min(3, s + 0.1))}
            title="تكبير"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setScale(1); }} // Reset Zoom
            title="إعادة تعيين الحجم"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Viewport */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex justify-center p-4 bg-muted/50"
        style={{ direction: 'ltr' }}
      >
        <Document
          file={finalUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex items-center justify-center p-10 h-full">
              <LoadingSpinner />
              <span className="mr-2">جاري تحميل المستند...</span>
            </div>
          }
          className="flex flex-col items-center pb-20 w-full"
        >
          {/* Render All Pages for Vertical Scrolling with Lazy Loading */}
          {numPages > 0 && Array.from(new Array(numPages), (el, index) => (
            <LazyPDFPage
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              width={effectiveWidth * scale}
              currentPage={currentPage}
            />
          ))}

        </Document>
      </div>
    </div>
  )
}

// Helper component for Lazy Loading Pages with 3-page window (optimized for bandwidth)
function LazyPDFPage({
  pageNumber,
  width,
  currentPage
}: {
  pageNumber: number
  width: number
  currentPage: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Load page if: within 1 page of current OR first page only (preload)
  // Reduced from ±2 to ±1 for bandwidth savings (~40% less data loaded while scrolling)
  const isInWindow = Math.abs(pageNumber - currentPage) <= 1 || pageNumber === 1

  return (
    <div
      ref={ref}
      data-page={pageNumber}
      className="bg-white shadow-lg mb-8 relative transition-all duration-200"
      style={{
        minHeight: width * 1.4, // Approximation to reserve space
        width: width
      }}
    >
      {isInWindow ? (
        <Page
          pageNumber={pageNumber}
          width={width}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="bg-white"
          loading={
            <div className="flex flex-col items-center justify-center animate-pulse text-gray-300 bg-white" style={{ height: width * 1.414, width: '100%' }}>
              <LoadingSpinner size="lg" />
              <span className="mt-4 text-sm">جاري تحميل الصفحة {pageNumber}...</span>
            </div>
          }
        />
      ) : (
        // Placeholder for pages outside window
        <div style={{ height: width * 1.414, width: '100%' }} className="bg-gray-50 flex flex-col items-center justify-center text-gray-300 border border-dashed border-gray-200">
          <span className="text-sm font-medium">صفحة {pageNumber}</span>
        </div>
      )}
    </div>
  )
}
