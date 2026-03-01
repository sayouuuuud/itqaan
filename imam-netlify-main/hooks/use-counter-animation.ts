import { useEffect, useState, useRef } from 'react'

interface UseCounterAnimationOptions {
  start?: number
  end: number
  duration?: number
  delay?: number
  decimals?: number
  shouldStart?: boolean
}

export function useCounterAnimation({
  start = 0,
  end,
  duration = 2000,
  delay = 0,
  decimals = 0,
  shouldStart = true,
}: UseCounterAnimationOptions) {
  const [count, setCount] = useState(start)
  const raf = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const animationFrameRef = useRef<number>(0)

  useEffect(() => {
    if (!shouldStart) {
      setCount(start)
      return
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentCount = start + (end - start) * easeOutQuart

      setCount(currentCount)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      }
    }

    const timeoutId = setTimeout(() => {
      animationFrameRef.current = requestAnimationFrame(animate)
    }, delay)

    return () => {
      clearTimeout(timeoutId)
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [start, end, duration, delay, shouldStart])

  return { count: Number(count.toFixed(decimals)) }
}
