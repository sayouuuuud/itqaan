"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Save, Palette, Upload, RefreshCw, Check } from "lucide-react"
import { FileUpload } from "@/components/admin/file-upload"

export default function AppearancePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const supabase = createClient()

  const [settings, setSettings] = useState({
    primary_color: "#1e4338",
    secondary_color: "#d4af37",
    site_logo_path: "",
    site_logo_path_dark: "",
  })

  const applyColorsToPage = useCallback((primaryColor: string, secondaryColor: string) => {
    // Apply to current page
    document.documentElement.style.setProperty("--color-primary", primaryColor)
    document.documentElement.style.setProperty("--color-primary-hover", adjustBrightness(primaryColor, -10))
    document.documentElement.style.setProperty("--color-primary-light", adjustBrightness(primaryColor, 20))
    document.documentElement.style.setProperty("--color-secondary", secondaryColor)
    document.documentElement.style.setProperty("--color-secondary-hover", adjustBrightness(secondaryColor, -10))
    document.documentElement.style.setProperty("--color-secondary-light", adjustBrightness(secondaryColor, 20))

    // Save to localStorage for persistence across pages
    localStorage.setItem(
      "site-colors",
      JSON.stringify({ primary: primaryColor, secondary: secondaryColor }),
    )
  }, [])

  // Helper function to adjust color brightness
  function adjustBrightness(hex: string, percent: number): string {
    const num = Number.parseInt(hex.replace("#", ""), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = ((num >> 8) & 0x00ff) + amt
    const B = (num & 0x0000ff) + amt
    return (
      "#" +
      (0x1000000 + (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255))
        .toString(16)
        .slice(1)
    )
  }

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setLoading(true)
    const { data, error } = await supabase.from("appearance_settings").select("*").single()

    if (data) {
      const loadedSettings = {
        primary_color: data.primary_color || "#1e4338",
        secondary_color: data.secondary_color || "#d4af37",
        site_logo_path: data.site_logo_path || "",
        site_logo_path_dark: data.site_logo_path_dark || "",
      }
      setSettings(loadedSettings)
      // Apply saved colors immediately
      applyColorsToPage(loadedSettings.primary_color, loadedSettings.secondary_color)
    }
    setLoading(false)
  }

  async function saveSettings() {
    setSaving(true)
    setMessage("")

    try {
      const { error } = await supabase.from("appearance_settings").upsert({
        id: "00000000-0000-0000-0000-000000000001",
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        site_logo_path: settings.site_logo_path,
        site_logo_path_dark: settings.site_logo_path_dark,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      // Apply colors and persist
      applyColorsToPage(settings.primary_color, settings.secondary_color)

      // Update localStorage to notify header immediately
      localStorage.setItem('site_logo_path', settings.site_logo_path)
      localStorage.setItem('site_logo_timestamp', Date.now().toString())

      // Also update site_settings for global access
      await supabase.from("site_settings").upsert([
        { key: "primary_color", value: settings.primary_color, updated_at: new Date().toISOString() },
        { key: "secondary_color", value: settings.secondary_color, updated_at: new Date().toISOString() },
        { key: "site_logo_path", value: settings.site_logo_path, updated_at: new Date().toISOString() },
      ])

      setMessage("تم حفظ الإعدادات بنجاح - الألوان مطبقة على الموقع")
    } catch (error: any) {
      console.error("Error saving settings:", error)
      setMessage("حدث خطأ أثناء الحفظ: " + error.message)
    } finally {
      setSaving(false)
    }
  }

  function handleColorChange(colorType: "primary" | "secondary", value: string) {
    const newSettings = {
      ...settings,
      [colorType === "primary" ? "primary_color" : "secondary_color"]: value,
    }
    setSettings(newSettings)
    // Apply preview immediately
    applyColorsToPage(newSettings.primary_color, newSettings.secondary_color)
  }

  function resetToDefaults() {
    const defaultPrimary = "#1e4338"
    const defaultSecondary = "#d4af37"
    setSettings({
      ...settings,
      primary_color: defaultPrimary,
      secondary_color: defaultSecondary,
    })
    applyColorsToPage(defaultPrimary, defaultSecondary)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center">
        <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold mb-3">
          إعدادات
        </span>
        <h1 className="text-4xl font-bold text-[#035d44] mb-4 font-serif">المظهر والألوان</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">تخصيص ألوان الموقع وشعاره</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-center flex items-center justify-center gap-2 ${
          message.includes("خطأ") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
        }`}>
          {!message.includes("خطأ") && <Check className="h-5 w-5" />}
          {message}
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Colors Section */}
        <div className="bg-card rounded-2xl p-6 border border-border space-y-6">
<div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
<Palette className="h-6 w-6" />
            </div>
<div>
              <h2 className="text-xl font-bold text-foreground">الألوان</h2>
<p className="text-sm text-muted-foreground">تخصيص ألوان الموقع الرئيسية (يتم تطبيقها فوراً وحفظها)</p>
</div>
          </div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
<Label>اللون الأساسي</Label>
<div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.primary_color}
onChange = {(e) => handleColorChange("primary", e.target.value)}
className="w-12 h-12 rounded-lg border border-border cursor-pointer"
                />
                <Input
                  value={settings.primary_color}
onChange = {(e) => handleColorChange("primary", e.target.value)}
className="font-mono"
                  dir="ltr"
                />
              </div>
<div
                className="h-20 rounded-xl flex items-center justify-center text-white font-bold transition-colors"
                style={{ backgroundColor: settings.primary_color }}
              >
                اللون الأساسي
              </div>
</div>

            <div className="space-y-3">
<Label>اللون الثانوي</Label>
<div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.secondary_color}
onChange = {(e) => handleColorChange("secondary", e.target.value)}
className="w-12 h-12 rounded-lg border border-border cursor-pointer"
                />
                <Input
                  value={settings.secondary_color}
onChange = {(e) => handleColorChange("secondary", e.target.value)}
className="font-mono"
                  dir="ltr"
                />
              </div>
<div
                className="h-20 rounded-xl flex items-center justify-center text-white font-bold transition-colors"
                style={{ backgroundColor: settings.secondary_color }}
              >
                اللون الثانوي
              </div>
</div>
          </div>
<Button variant="outline" onClick={resetToDefaults}
className="w-full bg-transparent">
            <RefreshCw className="h-4 w-4 ml-2" />
            استعادة الألوان الافتراضية
          </Button>
</div>

        {/* Logo Section */}
        <div className="bg-card rounded-2xl p-6 border border-border space-y-6">
<h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            شعار الموقع
          </h2>
          
          {/* Light Mode Logo */}
          <div className="space-y-3">
            <Label>شعار وضع الضوء</Label>
            <FileUpload
              accept="image/*"
              folder="logos"
              label="رفع شعار وضع الضوء"
              onUploadComplete={(path) => setSettings({ ...settings,
                site_logo_path: path
              })}
              currentFile={settings.site_logo_path}
            />
            {settings.site_logo_path && (
              <div className="p-4 bg-background rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-2">معاينة شعار وضع الضوء:</p>
                <img
                  src={settings.site_logo_path || "/placeholder.svg"}
                  alt="شعار الموقع"
                  className="h-16 object-contain mx-auto"
                />
              </div>
            )}
          </div>

          {/* Dark Mode Logo */}
          <div className="space-y-3">
            <Label>شعار وضع الظلام</Label>
            <FileUpload
              accept="image/*"
              folder="logos"
              label="رفع شعار وضع الظلام"
              onUploadComplete={(path) => setSettings({ ...settings,
                site_logo_path_dark: path
              })}
              currentFile={settings.site_logo_path_dark}
            />
            {settings.site_logo_path_dark && (
              <div className="p-4 bg-background dark:bg-card rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-2">معاينة شعار وضع الظلام:</p>
                <img
                  src={settings.site_logo_path_dark || "/placeholder.svg"}
                  alt="شعار الموقع - وضع الظلام"
                  className="h-16 object-contain mx-auto"
                />
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <Button onClick={saveSettings}
disabled = {saving}
className="w-full bg-primary hover:bg-primary-hover text-white">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 ml-2" />
              حفظ الإعدادات
            </>
          )}
        </Button>
</div>
    </div>
  )
}

