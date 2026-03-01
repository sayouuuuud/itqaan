'use client'

import { useEffect, useRef, useState } from 'react'

interface UseIntersectionObserverOptions {
  threshold?: number | number[]
  root?: Element | null
  rootMargin?: string
  freezeOnceVisible?: boolean
  triggerOnce?: boolean
}

// Main hook with new API
export function useIntersectionObserver(
  options?: UseIntersectionObserverOptions
): { ref: React.RefObject<any>; isVisible: boolean }

// Legacy hook for backward compatibility
export function useIntersectionObserver(
  ref: React.RefObject<any>,
  options?: UseIntersectionObserverOptions
): boolean

// Implementation
export function useIntersectionObserver(
  refOrOptions?: React.RefObject<any> | UseIntersectionObserverOptions,
  options?: UseIntersectionObserverOptions
): { ref: React.RefObject<any>; isVisible: boolean } | boolean {
  const internalRef = useRef<any>(null)
  const [isVisible, setIsVisible] = useState(false)

  const isLegacyAPI = refOrOptions && 'current' in refOrOptions
  const legacyRef = isLegacyAPI ? (refOrOptions as React.RefObject<any>) : null
  const opts = isLegacyAPI ? options : (refOrOptions as UseIntersectionObserverOptions | undefined)

  const {
    threshold = 0,
    root = null,
    rootMargin = '0%',
    freezeOnceVisible = false,
    triggerOnce = false,
  } = opts || {}

  useEffect(() => {
    const element = legacyRef?.current || internalRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)

        if (entry.isIntersecting && (freezeOnceVisible || triggerOnce)) {
          observer.unobserve(element)
        }
      },
      { threshold, root, rootMargin }
    )

    observer.observe(element)

    return () => observer.unobserve(element)
  }, [threshold, root, rootMargin, freezeOnceVisible, triggerOnce, legacyRef])

  if (isLegacyAPI) {
    return isVisible
  }

  return { ref: internalRef, isVisible }
}
