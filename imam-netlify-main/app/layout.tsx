import "./globals.css"
import type React from "react"
import type { Metadata, Viewport } from "next"
import { Amiri, Cairo } from "next/font/google"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import Script from 'next/script'
import { createPublicClient } from "@/lib/supabase/public"
import { unstable_cache } from "next/cache"
import { withTimeout } from "@/lib/utils/with-timeout"
import { SessionManager } from "@/components/session-manager"
import { InAppBrowserBlocker } from "@/components/in-app-browser-blocker"
import { AnalyticsProvider } from "@/components/analytics/analytics-provider"
import { AnalyticsTracker } from "@/components/analytics-tracker"
import { JsonLd } from "@/components/json-ld"
import { generateWebsiteSchema, generatePersonSchema } from "@/lib/schema-generator"

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
})

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
})

const getSiteSettings = unstable_cache(
  async () => {
    try {
      const supabase = createPublicClient()
      const { data } = await supabase.from("site_settings").select("*")
      if (!data) {
        return {}
      }

      const settings: Record<string, string> = {}
      data.forEach((item: any) => {
        const key = item.key || item.setting_key
        const value = item.value || item.setting_value
        if (key && value) {
          settings[key] = value
        }
      })
      return settings
    } catch {
      return {}
    }
  },
  ["site_settings"],
  { revalidate: 300 }
)

const getAppearanceSettings = unstable_cache(
  async () => {
    try {
      const supabase = createPublicClient()
      const { data } = await supabase.from("appearance_settings").select("*").limit(1)
      return data?.[0] || {}
    } catch {
      return {}
    }
  },
  ["appearance_settings"],
  { revalidate: 300 }
)

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const siteTitle =
    settings.site_title || "الشيخ السيد مراد - عالم أزهري"
  const siteDescription =
    settings.site_description ||
    "الموقع الرسمي للشيخ السيد مراد - منصة إسلامية شاملة تضم الخطب والدروس العلمية والمقالات والكتب. تعلم العلم الشرعي بفهم وسطي مستنير."
  const siteKeywords =
    settings.site_keywords ||
    "الشيخ السيد مراد,دروس إسلامية,خطب الجمعة,علم شرعي,فقه إسلامي,سيرة نبوية,مقالات دينية,كتب إسلامية"
  // Use the production domain
  const baseUrl = new URL("https://elsayed-mourad.online")

  return {
    title: {
      default: siteTitle,
      template: `%s | ${settings.site_name || "الشيخ السيد مراد"}`,
    },
    metadataBase: baseUrl,
    description: siteDescription,
    keywords: siteKeywords.split(",").map((k: string) => k.trim()),
    authors: [{ name: settings.site_author || "الشيخ السيد مراد" }],
    creator: settings.site_author || "الشيخ السيد مراد",
    openGraph: {
      type: "website",
      locale: "ar_EG",
      siteName: settings.site_name || "الشيخ السيد مراد",
      title: siteTitle,
      description: siteDescription,
      images: [{
        url: settings.og_image || "/og-default.jpg",
        width: 1200,
        height: 630,
        alt: siteTitle,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDescription,
      images: [settings.og_image || "/og-default.jpg"],
    },
    robots: {
      index: true,
      follow: true,
    },
    verification: {
      google: "t3yRqEKg6tGfcJWSeOMPcIisJSkYbIlsVkUF7zrpzdI",
    },
    generator: "v0.app",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: settings.site_name || "الشيخ السيد مراد",
    },
    formatDetection: {
      telephone: false,
    },
    other: {
      "mobile-web-app-capable": "yes",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "default",
    },
  }
}

export const viewport: Viewport = {
  themeColor: "#1e5631",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const appearance = await getAppearanceSettings()
  // Note: Colors are now handled by globals.css CSS variables, not inline styles
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${amiri.variable} ${cairo.variable}`}
    >
      <head>
        {/* Optimize Font Loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Preload Material Icons to prevent FOUC (Flash of Unstyled Content) */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
          as="style"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
          rel="stylesheet"
        />
        {/* Hide icon text until font loads */}
        <style dangerouslySetInnerHTML={{
          __html: `
          /* Hide icons until Material Icons font is loaded */
          .material-icons-outlined {
            font-size: 0 !important;
            line-height: 0;
          }
          .material-icons-outlined::before {
            font-size: 24px;
            line-height: 1;
          }
          /* When font is loaded, show normally */
          .fonts-loaded .material-icons-outlined {
            font-size: inherit !important;
            line-height: inherit;
          }
        `}} />
        <script dangerouslySetInnerHTML={{
          __html: `
          (function() {
            if (document.fonts && document.fonts.check) {
              function checkFont() {
                if (document.fonts.check('24px "Material Icons Outlined"')) {
                  document.documentElement.classList.add('fonts-loaded');
                } else {
                  requestAnimationFrame(checkFont);
                }
              }
              checkFont();
            } else {
              // Fallback: add class after a delay
              setTimeout(function() {
                document.documentElement.classList.add('fonts-loaded');
              }, 100);
            }
          })();
        `}} />
      </head>

      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={true}
          storageKey="theme"
        >
          <AuthProvider>
            <InAppBrowserBlocker />
            <SessionManager />
            <AnalyticsTracker />
            <JsonLd schema={[generateWebsiteSchema(), generatePersonSchema()]} />
            <AnalyticsProvider />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
