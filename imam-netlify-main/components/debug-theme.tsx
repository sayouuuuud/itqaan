"use client"

import * as React from "react"
import { useTheme } from "next-themes"

export function DebugTheme() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render anything on server to avoid hydration mismatch
  if (!mounted) {
    return null
  }
  
  return (
    <div className="fixed top-20 right-4 bg-card border border-border p-4 rounded-lg z-50">
      <h3 className="text-sm font-bold mb-2">Debug Theme</h3>
      <p className="text-xs mb-2">Current theme: {theme || 'undefined'}</p>
      <button 
        onClick={() => setTheme('dark')}
        className="px-3 py-1 bg-primary text-primary-foreground text-xs rounded mr-1"
      >
        Force Dark
      </button>
      <button 
        onClick={() => setTheme('light')}
        className="px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded mr-1"
      >
        Force Light
      </button>
      <button 
        onClick={() => setTheme('system')}
        className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded mr-1 border border-border"
      >
        System
      </button>
      <div className="mt-2 text-xs">
        <div className="w-4 h-4 bg-background border border-border rounded inline-block mr-1"></div>
        <div className="w-4 h-4 bg-card border border-border rounded inline-block mr-1"></div>
        <div className="w-4 h-4 bg-surface border border-border rounded inline-block"></div>
      </div>
    </div>
  )
}