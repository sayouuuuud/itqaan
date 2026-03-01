"use client"

import type React from "react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

// Helper function to resolve preview src
const resolvePreviewSrc = (value: string) => {
  if (!value) return ""

  console.log('🔍 Footer resolvePreviewSrc input:', value)

  // UploadThing or Cloudinary URLs (direct URLs)
  if (/^https?:\/\//i.test(value)) {
    console.log('✅ Footer: Direct URL detected:', value)
    return value
  }

  // Local public files (like /logo.png)
  if (value.startsWith('/') && !value.includes('uploads/')) {
    console.log('✅ Footer: Local file detected:', value)
    return value
  }

  // Old B2 paths - try to use download API
  if (value.startsWith('uploads/') || value.startsWith('/uploads/')) {
    console.warn('⚠️ Old B2 logo path detected, trying download API:', value)
    return `/api/download?key=${encodeURIComponent(value.replace(/^\//, ''))}`
  }

  // Any other path - return as is
  console.log('⚠️ Footer: Unknown path format, returning as-is:', value)
  return value
}

export function Footer() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [logoPath, setLogoPath] = useState<string | null>(null)
  const [darkLogoPath, setDarkLogoPath] = useState<string | null>(null)
  const [settings, setSettings] = useState({
    youtube_channel: "",
    telegram_channel: "",
    facebook_page: "",
    developer_link: "",
  })

  useEffect(() => {
    // Listen to logo changes in localStorage
    const handleLogoChange = (e: StorageEvent) => {
      if (e.key === 'site_logo_path' && e.newValue) {
        setLogoPath(e.newValue)
        setDarkLogoPath(e.newValue)
      }
    }
    window.addEventListener('storage', handleLogoChange)

    async function loadSettings() {
      const supabase = createClient()

      let logoFromDB = null
      let darkLogoFromDB = null

      // Try site_settings FIRST (this is where Admin saves the logo)
      try {
        const { data: siteLogoData } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "site_logo")
          .single()

        if (siteLogoData?.value) {
          console.log('🎨 Footer: Found logo in site_settings:', siteLogoData.value)
          logoFromDB = siteLogoData.value
          darkLogoFromDB = siteLogoData.value
        }
      } catch (error) {
        console.log('🎨 Footer: Error reading site_settings for logo')
      }

      // Only try appearance_settings if site_settings didn't have a logo
      if (!logoFromDB) {
        const { data: appearanceData } = await supabase
          .from("appearance_settings")
          .select("site_logo_path, site_logo_path_dark")
          .limit(1)

        if (appearanceData?.[0]) {
          logoFromDB = appearanceData[0].site_logo_path || null
          darkLogoFromDB = appearanceData[0].site_logo_path_dark || null
        }
      }

      // Check localStorage first (most recent)
      const logoFromStorage = localStorage.getItem('site_logo_path')

      // Clear stale localStorage data (older than 5 minutes)
      const logoTimestamp = localStorage.getItem('site_logo_timestamp')
      if (logoFromStorage && logoTimestamp) {
        const timestamp = parseInt(logoTimestamp)
        const now = Date.now()
        const fiveMinutes = 5 * 60 * 1000
        if (now - timestamp > fiveMinutes) {
          localStorage.removeItem('site_logo_path')
          localStorage.removeItem('site_logo_timestamp')
        }
      }

      // Priority: localStorage > DB data
      const finalLogo = logoFromStorage || logoFromDB || ''
      const finalDarkLogo = logoFromStorage || darkLogoFromDB || ''

      // Resolve the logo URL
      if (finalLogo) {
        setLogoPath(resolvePreviewSrc(finalLogo))
      }
      if (finalDarkLogo) {
        setDarkLogoPath(resolvePreviewSrc(finalDarkLogo))
      }

      // Load other settings
      const { data } = await supabase.from("site_settings").select("*")
      if (data) {
        const settingsObj: Record<string, string> = {}
        data.forEach((item: Record<string, unknown>) => {
          const key = (item.key || item.setting_key || "") as string
          const value = (item.value || item.setting_value || "") as string
          if (key) {
            settingsObj[key] = value
          }
        })
        setSettings({
          youtube_channel: settingsObj.youtube_channel || "",
          telegram_channel: settingsObj.telegram_channel || "",
          facebook_page: settingsObj.facebook_page || "",
          developer_link: settingsObj.developer_link || "",
        })
      }
    }
    loadSettings()

    return () => {
      window.removeEventListener('storage', handleLogoChange)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      return
    }
    setStatus("loading")
    try {
      const supabase = createClient()
      const { error } = await supabase.from("subscribers").insert({
        whatsapp_number: email
      })
      if (error) {
        if (error.code === "23505") {
          setMessage("هذا الرقم مسجل بالفعل")
        } else {
          setMessage("حدث خطأ، يرجى المحاولة مرة أخرى")
        }
        setStatus("error")
        return
      }
      setMessage("تم الاشتراك بنجاح!")
      setStatus("success")
      setEmail("")
    } catch {
      setMessage("حدث خطأ، يرجى المحاولة مرة أخرى")
      setStatus("error")
    }
  }
  return (
    <footer className="bg-surface border-t border-border pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Logo & Description */} <div className="space-y-4">
            <div className="flex items-center gap-3">
              {logoPath ? (
                <img
                  src={logoPath}
                  alt="شعار الموقع"
                  className="h-12 object-contain dark:hidden"
                />
              ) : null}
              {darkLogoPath ? (
                <img
                  src={darkLogoPath}
                  alt="شعار الموقع"
                  className="h-12 object-contain hidden dark:block"
                />
              ) : (
                <div className="bg-primary text-white p-2 rounded-lg">
                  <span className="material-icons-outlined text-2xl">mosque</span>
                </div>
              )}
            </div>
            <p className="text-sm text-text-muted leading-relaxed">
              علم نافع للقلب السليم، ومنهج وسطي قويم يجمع بين الأصالة والمعاصرة. نسعى لنشر الوعي الديني الصحيح. </p>
            <div className="flex gap-4">
              {settings.facebook_page && (<a href={settings.facebook_page}
                target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary transition-colors" >
                <span className="material-icons-outlined text-xl">
                  facebook</span>
              </a>

              )} {settings.youtube_channel && (<a href={settings.youtube_channel}
                target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-red-500 transition-colors" >
                <span className="material-icons-outlined text-xl">
                  smart_display</span>
              </a>

              )} {settings.telegram_channel && (<a href={settings.telegram_channel}
                target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-sky-500 transition-colors" >
                <span className="material-icons-outlined text-xl">
                  send</span>
              </a>

              )} </div>
          </div>

          {/* Quick Links */} <div>
            <h4 className="font-bold text-foreground mb-4">
              روابط سريعة</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  عن الشيخ </Link>
              </li>

              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  اتصل بنا </Link>
              </li>

              <li>
                <Link href="/schedule" className="hover:text-primary transition-colors">
                  جدول الدروس </Link>
              </li>



            </ul>
          </div>

          {/* Content Sections */} <div>
            <h4 className="font-bold text-foreground mb-4">
              أقسام المحتوى</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li>
                <Link href="/khutba" className="hover:text-primary transition-colors">
                  الخطب المنبرية </Link>
              </li>

              <li>
                <Link href="/dars" className="hover:text-primary transition-colors">
                  الدروس العلمية </Link>
              </li>

              <li>
                <Link href="/articles" className="hover:text-primary transition-colors">
                  المقالات </Link>
              </li>

              <li>
                <Link href="/books" className="hover:text-primary transition-colors">
                  الكتب </Link>
              </li>

              <li>
                <Link href="/videos" className="hover:text-primary transition-colors">
                  المرئيات </Link>
              </li>

            </ul>
          </div>

          {/* Newsletter */} <div>
            <h4 className="font-bold text-foreground mb-4">
              ابق على تواصل</h4>
            <p className="text-sm text-text-muted mb-4">
              اشترك في قائمة التواصل للبقاء على اتصال معنا عبر واتساب. </p>
            <form onSubmit={handleSubmit}
              className="flex flex-col gap-2">
              <input type="tel" value={email}
                onChange={(e) =>
                  setEmail(e.target.value)}
                placeholder="رقم واتساب" disabled={status === "loading"}
                className="bg-background border-none rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-primary disabled:opacity-50" /> <button type="submit" disabled={status === "loading"}
                  className="bg-primary hover:bg-primary-hover text-white text-sm font-bold py-2 rounded-lg transition-colors disabled:opacity-50" >
                {status === "loading" ? "جاري الاشتراك..." : "اشترك الآن"} </button>
            </form>

            {message && (<p className={`text-xs mt-2 ${status === "success" ? "text-green-600" : "text-red-600"}`}>
              {message}</p>

            )} </div>
        </div>

        {/* Copyright */} <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-text-muted">
          <span>
            © 2025 الشيخ السيد مراد. جميع الحقوق محفوظة.</span>
          <div className="flex items-center gap-2">
            <span>التواصل مع</span>
            {settings.developer_link ? (
              <a
                href={settings.developer_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                المطور
              </a>
            ) : (
              <span className="text-primary font-medium">المطور</span>
            )}
          </div>

        </div>
      </div>

    </footer>

  )
}
