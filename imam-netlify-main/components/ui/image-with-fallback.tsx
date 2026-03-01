"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

interface ImageWithFallbackProps {
  src: string
  alt: string
  className?: string
  fallbackSrc?: string
  showLoading?: boolean
}

export function ImageWithFallback({
  src,
  alt,
  className="",
  fallbackSrc = "/placeholder.svg",
  showLoading = true
}: ImageWithFallbackProps) {
  const [currentSrc, setCurrentSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Update currentSrc when src prop changes
  useState(() => {
    if (src !== currentSrc) {
      setCurrentSrc(src)
      setIsLoading(true)
      setHasError(false)
    }
  }, [src])

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    console.log('🖼️ Image failed to load:', currentSrc)
    setHasError(true)
    setIsLoading(false)
    // Only fallback once to avoid infinite loops
    if (currentSrc !== fallbackSrc) {
      console.log('🔄 Falling back to:', fallbackSrc)
      setCurrentSrc(fallbackSrc)
      setHasError(false)
      setIsLoading(true)
    }
  }

  if (showLoading && isLoading) {
    return (
      <div className={`flex items-center justify-center bg-muted/50 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (hasError && currentSrc === fallbackSrc) {
    return (
      <div className={`flex items-center justify-center bg-muted/50 ${className}`}>
        <div className="text-center text-muted-foreground">
          <svg className="h-8 w-8 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xs">فشل تحميل الصورة</p>
        </div>
      </div>
    )
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onLoad={handleLoad}
      onError={handleError}
    />
  )
}
