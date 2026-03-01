"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Save, Eye, RefreshCw, Shield } from "lucide-react"
import Link from "next/link"

export default function PrivacyPolicyAdminPage() {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadContent()
  }, [])

  async function loadContent() {
    setLoading(true)
    const { data } = await supabase.from("privacy_policy").select("*").limit(1).single()
    if (data) {
      setContent(data.content)
      setLastUpdated(data.updated_at)
    }
    setLoading(false)
  }

  async function saveContent() {
    setSaving(true)
    setMessage("")
    try {
      const { data: existing } = await supabase.from("privacy_policy").select("id").limit(1).single()
      if (existing) {
        await supabase.from("privacy_policy").update({ content, updated_at: new Date().toISOString() }).eq("id", existing.id)
      } else {
        await supabase.from("privacy_policy").insert({ content })
      }
      setMessage("تم حفظ سياسة الخصوصية بنجاح")
      loadContent()
    } catch (error) {
      setMessage("حدث خطأ أثناء الحفظ")
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">سياسة الخصوصية</h1>
          </div>

          <p className="text-muted-foreground">تحرير صفحة سياسة الخصوصية</p>

          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              آخر تحديث: {new Date(lastUpdated).toLocaleDateString("ar-SA")}
            </p>
          )}
        </div>
        <Link href="/privacy" target="_blank">
          <Button variant="outline">
            <Eye className="h-4 w-4 ml-2" />
            معاينة الصفحة
          </Button>
        </Link>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-xl text-center ${
            message.includes("خطأ") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* Editor */}
      <div className="bg-card rounded-2xl p-6 border shadow-sm">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">
            يمكنك استخدام Markdown للتنسيق (العناوين #، القوائم -، الروابط [نص](رابط))
          </p>
        </div>

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={20}
          className="bg-muted font-mono text-sm resize-none"
          placeholder={`# سياسة الخصوصية\n\nنحن نحترم خصوصيتك...`}
          dir="rtl"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={loadContent}>
          <RefreshCw className="h-4 w-4 ml-2" />
          إعادة تحميل
        </Button>
        <Button onClick={saveContent} disabled={saving}>
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 ml-2" />
              حفظ التغييرات
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
