import type React from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { createPublicClient } from "@/lib/supabase/public"
import { unstable_cache } from "next/cache"

// Cache appearance settings (logo) - checks site_settings first, then appearance_settings
const getAppearanceSettings = unstable_cache(
  async () => {
    try {
      const supabase = createPublicClient()

      // Check site_settings first (where admin saves the logo)
      const { data: siteSettings } = await supabase
        .from("site_settings")
        .select("*")
        .eq("key", "site_logo")
        .single()

      if (siteSettings?.value) {
        return {
          site_logo_path: siteSettings.value,
          site_logo_path_dark: siteSettings.value
        }
      }

      // Fallback to appearance_settings
      const { data } = await supabase.from("appearance_settings").select("*").limit(1)
      return data?.[0] || {}
    } catch {
      return {}
    }
  },
  ["appearance_settings_v2"],
  { revalidate: 300 }
)

// Cache navbar items
const getNavbarItems = unstable_cache(
  async () => {
    try {
      const supabase = createPublicClient()
      const { data } = await supabase
        .from("navbar_items")
        .select("*")
        .order("order_index", { ascending: true })

      if (!data) return []

      // Filter active items
      return data
        .filter((item: any) => item.is_active !== false)
        .map((item: any) => ({
          href: item.href,
          label: item.label
        }))
    } catch {
      return []
    }
  },
  ["navbar_items"],
  { revalidate: 300 }
)

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const appearance = await getAppearanceSettings()
  const navLinks = await getNavbarItems()

  // Helper to resolve logo URL
  const resolveLogo = (path: string | null) => {
    if (!path) return null
    if (/^https?:\/\//i.test(path)) return path
    if (path.startsWith('/') && !path.includes('uploads/')) return path
    // Local uploads (contain uploads/ and no http prefix)
    if (path.startsWith('uploads/') || path.startsWith('/uploads/')) {
      return path.startsWith('/') ? path : `/${path}`
    }
    return `/api/download?key=${encodeURIComponent(path)}`
  }

  const logoUrl = resolveLogo(appearance.site_logo_path)
  const darkLogoUrl = resolveLogo(appearance.site_logo_path_dark)

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        initialLogo={logoUrl}
        initialDarkLogo={darkLogoUrl}
        initialNavLinks={navLinks.length > 0 ? navLinks : undefined}
      />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
