"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render dynamic content on server
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Sun className="h-4 w-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const handleThemeToggle = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleThemeToggle}
      className="h-9 w-9 relative"
    >
      <Sun className={`h-6 w-6 transition-all duration-300 ${theme === "light" ? "rotate-0 scale-100" : "-rotate-90 scale-0 opacity-0"
        }`} />
      <Moon className={`absolute top-1/2 left-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${theme === "dark" ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"
        }`} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}