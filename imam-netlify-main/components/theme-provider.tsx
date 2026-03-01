'use client'

import * as React from 'react'
import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

function ThemeFixer() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const html = document.documentElement

    // Ensure correct class application for CSS variables to work
    if (resolvedTheme === 'dark') {
      html.classList.add('dark')
      if (html.classList.contains('light')) {
        html.classList.remove('light')
      }
    } else if (resolvedTheme === 'light') {
      html.classList.add('light') // Ensure light class is present for CSS variables
      html.classList.remove('dark')
    }
  }, [resolvedTheme])

  return null
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ThemeFixer />
      {children}
    </NextThemesProvider>
  )
}
