"use client"

import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { ThemeToggle } from "@/components/ui/theme-toggle"

// Helper function to resolve preview src
const resolvePreviewSrc = (value: string) => {
  if (!value) return ""

  // UploadThing or Cloudinary URLs (direct URLs)
  if (/^https?:\/\//i.test(value)) return value

  // Local public files (like /logo.png)
  if (value.startsWith('/') && !value.includes('uploads/')) return value

  // Old B2 paths - try to use download API
  if (value.startsWith('uploads/') || value.startsWith('/uploads/')) {
    console.warn('⚠️ Old B2 path detected, using download API:', value)
    return `/api/download?key=${encodeURIComponent(value.replace(/^\//, ''))}`
  }

  // Any other path - return as is
  return value
}

const defaultNavLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/schedule", label: "الجدول" },
  { href: "/khutba", label: "خطب" },
  { href: "/dars", label: "دروس" },
  { href: "/articles", label: "مقالات" },
  { href: "/books", label: "كتب" },
  { href: "/videos", label: "مرئيات" },
]

interface NavItem {
  id: string
  label: string
  href: string
  order_index: number
  is_active?: boolean
}

export interface HeaderProps {
  initialLogo?: string | null
  initialDarkLogo?: string | null
  initialNavLinks?: { href: string; label: string }[]
}

export function Header({ initialLogo, initialDarkLogo, initialNavLinks }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [scrolled, setScrolled] = useState(false)
  const [navLinks, setNavLinks] = useState<{ href: string; label: string }[]>(
    initialNavLinks || defaultNavLinks
  )
  // No default fallback - wait for DB logo to load
  const [logoPath, setLogoPath] = useState<string | null>(initialLogo || null)
  const [darkLogoPath, setDarkLogoPath] = useState<string | null>(initialDarkLogo || null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [searchOpen])

  useEffect(() => {
    // Check dark mode
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
        (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
      setIsDarkMode(isDark)
    }

    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    // Also listen to system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', checkDarkMode)

    // Listen to logo changes in localStorage
    const handleLogoChange = (e: StorageEvent) => {
      if (e.key === 'site_logo_path' && e.newValue && e.newValue !== logoPath) {
        console.log('🎨 Header: Logo updated from localStorage:', e.newValue)
        const newLogo = e.newValue
        setLogoPath(newLogo)
        setDarkLogoPath(newLogo)
      }
    }

    window.addEventListener('storage', handleLogoChange)

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', checkDarkMode)
      window.removeEventListener('storage', handleLogoChange)
    }
  }, [])

  useEffect(() => {
    async function loadNavbarAndSettings() {
      // Skip client-side fetching if server already provided data
      if (initialLogo && initialNavLinks && initialNavLinks.length > 0) {
        console.log('🎨 Header: Using server-provided data, skipping client fetch')
        return
      }

      const supabase = createClient()
      const { data: navData } = await supabase
        .from("navbar_items")
        .select("*")
        .order("order_index", { ascending: true })
      if (navData && navData.length > 0) {
        // Filter active items in JavaScript if is_active exists
        const activeItems = navData.filter((item: NavItem) => item.is_active !== false)
        if (activeItems.length > 0) {
          setNavLinks(activeItems.map((item: NavItem) => ({
            href: item.href,
            label: item.label
          })))
        }
      }

      console.log('🎨 Header: Loading logo from database...')

      let logoFromDB = null
      let darkLogoFromDB = null

      // Try site_settings FIRST (this is where Admin saves the logo)
      try {
        const { data: siteSettings, error: siteError } = await supabase
          .from("site_settings")
          .select("*")
          .eq("key", "site_logo")
          .single()

        if (siteSettings && !siteError && siteSettings.value) {
          console.log('🎨 Header: Found logo in site_settings:', siteSettings.value)
          logoFromDB = siteSettings.value
          darkLogoFromDB = siteSettings.value
        }
      } catch (siteError) {
        console.log('🎨 Header: Error reading site_settings:', siteError)
      }

      // Only try appearance_settings if site_settings didn't have a logo
      if (!logoFromDB) {
        console.log('🎨 Header: No logo in site_settings, trying appearance_settings...')
        const { data: appearanceData, error: appearanceError } = await supabase
          .from("appearance_settings")
          .select("site_logo_path, site_logo_path_dark")
          .limit(1)

        if (appearanceError) {
          console.error('🎨 Header: Error loading appearance_settings:', appearanceError)
        }

        if (appearanceData?.[0]) {
          console.log('🎨 Header: Found logo in appearance_settings:', appearanceData[0])
          logoFromDB = appearanceData[0].site_logo_path || null
          darkLogoFromDB = appearanceData[0].site_logo_path_dark || null
        }
      }

      // Use localStorage first (most recent), then DB data, then fallback
      const logoFromStorage = localStorage.getItem('site_logo_path')

      // Clear localStorage if it's older than 5 minutes (to prevent stale data)
      const logoTimestamp = localStorage.getItem('site_logo_timestamp')
      if (logoFromStorage && logoTimestamp) {
        const timestamp = parseInt(logoTimestamp)
        const now = Date.now()
        const fiveMinutes = 5 * 60 * 1000
        if (now - timestamp > fiveMinutes) {
          console.log('🎨 Header: Clearing stale localStorage logo data')
          localStorage.removeItem('site_logo_path')
          localStorage.removeItem('site_logo_timestamp')
        }
      }

      // Priority: localStorage (most recent) > DB data > nothing (no fallback)
      const finalLogo = logoFromStorage || logoFromDB || ''
      const finalDarkLogo = logoFromStorage || darkLogoFromDB || ''

      // Use the actual logo from database
      const resolvedLogo = resolvePreviewSrc(finalLogo)
      const resolvedDarkLogo = resolvePreviewSrc(finalDarkLogo)

      console.log('🎨 Header: Using logo:', finalLogo)
      console.log('🎨 Header: Resolved logo URL:', resolvedLogo)

      setLogoPath(resolvedLogo)
      setDarkLogoPath(resolvedDarkLogo)
    }
    loadNavbarAndSettings()
  }, [initialLogo, initialNavLinks])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchOpen(false)
      setSearchQuery("")
    }
  }
  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95 transition-all duration-200 border-b border-border",
          scrolled ? "shadow-md" : "shadow-sm",
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-1">
          <div className="flex justify-between h-[74px] items-center">
            <Link href="/" className="flex items-center group relative h-[74px]">
              {logoPath && !imgError ? (
                <img
                  src={resolvePreviewSrc(logoPath)}
                  alt="شعار الموقع"
                  className="h-12 md:h-14 object-contain dark:hidden"
                  onError={() => setImgError(true)}
                />
              ) : null}
              {darkLogoPath && !imgError ? (
                <img
                  src={resolvePreviewSrc(darkLogoPath)}
                  alt="شعار الموقع"
                  className="h-12 md:h-14 w-auto md:w-[250px] object-contain hidden dark:block"
                  onError={() => setImgError(true)}
                />
              ) : null}
              {(!logoPath && !darkLogoPath) || imgError ? (
                <img
                  src="/logo.png"
                  alt="شعار الموقع"
                  className="h-12 md:h-14 object-contain w-max"
                />
              ) : null}
            </Link>

            {/* Navigation - Desktop (Center) */} <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
              {navLinks.map((link) => (<Link key={link.href}
                href={link.href}
                className={cn("hover:text-primary transition-colors py-1", pathname === link.href ? "text-primary font-bold border-b-2 border-primary" : "text-foreground",)} >
                {link.label} </Link>

              ))} </nav>

            {/* Actions (Left) */} <div className="flex items-center gap-2">
              <button onClick={() =>
                setSearchOpen(true)}
                className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-all" aria-label="بحث" > <span className="material-icons-outlined flex flex-col">
                  search</span>
              </button>

              <ThemeToggle />
              <Link href="/subscribe" className="hidden sm:flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground px-5 py-2 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg" >
                <span className="material-icons-outlined text-sm">
                  notifications</span>

                اشترك </Link>

              {/* Mobile menu button */} <button className="lg:hidden text-muted-foreground p-2 hover:bg-muted rounded-lg transition-colors" onClick={() =>
                setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"} > <span className="material-icons-outlined">
                  {mobileMenuOpen ? "close" : "menu"}</span>
              </button>

            </div>
          </div>

          {/* Mobile Navigation */} {mobileMenuOpen && (<nav className="lg:hidden py-4 border-t border-border animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (<Link key={link.href}
                href={link.href}
                onClick={() =>
                  setMobileMenuOpen(false)}
                className={cn("py-3 px-4 rounded-lg hover:bg-muted transition-colors flex items-center gap-3", pathname === link.href ? "text-primary font-bold bg-primary/5" : "text-foreground",)} > {link.label} </Link>

              ))} <Link href="/subscribe" onClick={() =>
                setMobileMenuOpen(false)}
                className="mt-2 text-center bg-primary hover:bg-primary-hover text-primary-foreground py-3 px-4 rounded-lg font-medium transition-colors" > اشترك الآن </Link>
            </div>

          </nav>

          )} </div>
      </header>

      {/* Search Modal */} {searchOpen && (<div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 bg-background/80 dark:bg-background/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={() =>
        setSearchOpen(false)} > <div className="w-full max-w-2xl mx-4 bg-card rounded-2xl shadow-2xl p-6 border border-border animate-in slide-in-from-top-4 duration-300" onClick={(e) =>
          e.stopPropagation()}
          dir="rtl" > <form onSubmit={handleSearch}
            className="flex gap-3">
            <input type="text" value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)}
              placeholder="ابحث في الخطب، الدروس، المقالات، والكتب..." className="flex-1 px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" autoFocus /> <button type="submit" className="bg-primary hover:bg-primary-hover text-primary-foreground px-6 rounded-xl transition-colors flex items-center gap-2" >
              <span className="material-icons-outlined">
                search</span>
            </button>

          </form>
          <div className="mt-4 text-sm text-muted-foreground flex items-center justify-between">
            <span>
              اضغط <kbd className="px-2 py-1 bg-background border border-border rounded text-xs font-mono">
                Enter</kbd>

              للبحث </span>
            <span>
              اضغط <kbd className="px-2 py-1 bg-background border border-border rounded text-xs font-mono">
                Esc</kbd>

              للإغلاق </span>
          </div>

        </div>
      </div>

      )} </>
  )
}
