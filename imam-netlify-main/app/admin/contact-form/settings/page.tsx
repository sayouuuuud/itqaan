"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UiverseToggle } from "@/components/ui/uiverse-toggle"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Settings, Save, ArrowRight, AlertCircle, Trash2 } from "lucide-react"
import Link from "next/link"

interface ContactSettings {
  id?: string
  important_notice: string
  notice_enabled: boolean
  email: string
  phone: string
  whatsapp_number: string
  address: string
  subject_options: string[]
}

const defaultSettings: ContactSettings = {
  important_notice: "هذا النموذج مخصص للتواصل العام والاقتراحات التقنية. لا يقدم الموقع فتاوى شرعية ولا يتم الرد على الأسئلة الفقهية عبر هذا النموذج.",
  notice_enabled: true,
  email: "",
  phone: "",
  whatsapp_number: "",
  address: "",
  subject_options: ["استفسار عام", "طلب فتوى", "اقتراح", "شكوى", "أخرى"],
}

export default
function ContactFormSettingsPage() {
  const [settings, setSettings] = useState<ContactSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })

  const supabase = createClient()

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("contact_settings").select("*").limit(1).single()

      if (data) {
        setSettings({
          id: data.id,
          important_notice: data.important_notice || defaultSettings.important_notice,
          notice_enabled: data.notice_enabled ?? true,
          email: data.email || "",
          phone: data.phone || "",
          whatsapp_number: data.whatsapp_number || "",
          address: data.address || "",
          subject_options: data.subject_options || defaultSettings.subject_options,
        })
      }
    } catch (error) {
      console.log("[v0] No existing settings, using defaults")
    }
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    setMessage({ type: "", text: "" })

    try {
      const payload = {
        important_notice: settings.important_notice,
        notice_enabled: settings.notice_enabled,
        email: settings.email,
        phone: settings.phone,
        whatsapp_number: settings.whatsapp_number,
        address: settings.address,
        subject_options: settings.subject_options,
        updated_at: new Date().toISOString(),
      }
      if (settings.id) {
        const { error } = await supabase.from("contact_settings").update(payload).eq("id", settings.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("contact_settings").insert(payload)
        if (error) throw error
      }

      setMessage({ type: "success", text: "تم حفظ الإعدادات بنجاح" })
      loadSettings()
    } catch (error: any) {
      console.error("[v0] Save error:", error)
      setMessage({ type: "error", text: "حدث خطأ أثناء الحفظ: " + error.message })
    } finally {
      setSaving(false)
    }
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
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin/contact-form" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Settings className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">إعدادات صفحة التواصل</h1>
          </div>
          <p className="text-muted-foreground">تخصيص التنويه الهام ومعلومات التواصل</p>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div
          className={`p-4 rounded-xl text-center ${
            message.type === "error"
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Notice Settings */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">التنويه الهام</h3>
        </div>
        <p className="text-sm text-muted-foreground">هذا التنويه يظهر في صفحة التواصل للزوار</p>
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
          <div>
            <Label className="text-base">تفعيل التنويه</Label>
            <p className="text-sm text-muted-foreground">إظهار أو إخفاء التنويه الهام</p>
          </div>
          <div className="flex items-center justify-center">
            <UiverseToggle
              checked={settings.notice_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, notice_enabled: checked })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>نص التنويه</Label>
          <Textarea
            value={settings.important_notice}
            onChange={(e) => setSettings({ ...settings, important_notice: e.target.value })}
            className="bg-muted resize-none"
            rows={3}
            placeholder="أدخل نص التنويه الذي سيظهر للزوار..."
          />
        </div>
      </div>

      {/* Subject Options */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">مواضيع الرسائل</h3>
        </div>
        <p className="text-sm text-muted-foreground">المواضيع المتاحة في قائمة الموضوع</p>
        <div className="space-y-3">
          {(settings.subject_options || []).map((subject, index) => (
            <div key={index} className="flex items-center gap-3">
              <Input
                value={subject}
                onChange={(e) => {
                  const newSubjects = [...settings.subject_options]
                  newSubjects[index] = e.target.value
                  setSettings({ ...settings, subject_options: newSubjects })
                }}
                className="bg-muted dark:bg-background-alt"
                placeholder="أدخل موضوع..."
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newSubjects = settings.subject_options.filter((_, i) => i !== index)
                  setSettings({ ...settings, subject_options: newSubjects })
                }}
                disabled={settings.subject_options.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={() => {
              setSettings({
                ...settings,
                subject_options: [...settings.subject_options, ""]
              })
            }}
            className="w-full"
          >
            إضافة موضوع جديد
          </Button>
        </div>
      </div>

      {/* Contact Info Settings */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
        <h3 className="text-lg font-bold text-foreground">معلومات التواصل</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>البريد الإلكتروني</Label>
            <Input
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="bg-muted dark:bg-background-alt"
              placeholder="example@domain.com"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label>رقم الهاتف</Label>
            <Input
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              className="bg-muted dark:bg-background-alt"
              placeholder="+966 xxx xxx xxxx"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label>رقم الواتساب</Label>
            <Input
              value={settings.whatsapp_number}
              onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
              className="bg-muted dark:bg-background-alt"
              placeholder="+966 xxx xxx xxxx"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label>العنوان</Label>
            <Input
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="bg-muted dark:bg-background-alt"
              placeholder="المدينة، البلد"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary-hover text-white">
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


