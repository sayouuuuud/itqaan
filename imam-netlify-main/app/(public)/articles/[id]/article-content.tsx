"use client"

import dynamic from "next/dynamic"

// Dynamically import SafeHtml to avoid SSR issues
const SafeHtml = dynamic(() => import("@/components/ui/safe-html").then(mod => ({ default: mod.SafeHtml })), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted h-32 rounded-lg"></div>
})

interface ArticleContentProps {
  content: string | null | undefined
  className?: string
}

export function ArticleContent({ content, className }: ArticleContentProps) {
  if (!content) return null

  return (
    <SafeHtml
      html={content}
      className={className}
    />
  )
}


import dynamic from "next/dynamic"

// Dynamically import SafeHtml to avoid SSR issues
const SafeHtml = dynamic(() => import("@/components/ui/safe-html").then(mod => ({ default: mod.SafeHtml })), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted h-32 rounded-lg"></div>
})

interface ArticleContentProps {
  content: string | null | undefined
  className?: string
}

export function ArticleContent({ content, className }: ArticleContentProps) {
  if (!content) return null

  return (
    <SafeHtml
      html={content}
      className={className}
    />
  )
}

