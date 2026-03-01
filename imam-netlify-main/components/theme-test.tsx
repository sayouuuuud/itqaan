"use client"

import { useTheme } from "next-themes"

export function ThemeTest() {
  const { theme } = useTheme()
  
  return (
    <div className="p-4 bg-card border border-border rounded-lg">
      <p>Current theme: {theme}</p>
      <p>HTML class: {typeof window !== 'undefined' ? document.documentElement.className : 'N/A'}</p>
      <div className="mt-2 p-2 bg-primary text-primary-foreground rounded">
        This should have primary colors in both themes
      </div>
    </div>
  )
}