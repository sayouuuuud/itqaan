"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UiverseToggle } from "@/components/ui/uiverse-toggle"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Download, Mail, MessageSquare, Search, Trash2, Phone, CheckCircle } from "lucide-react"

interface ContactMessage {
  id: string
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
  created_at: string
  is_read: boolean
}

interface ContactField {
  id: string
  name: string
  label: string
  is_required: boolean
  is_active: boolean
}

const defaultFields: ContactField[] = [
  { id: "1", name: "name", label: "الاسم", is_required: true, is_active: true },
  { id: "2", name: "email", label: "البريد الإلكتروني", is_required: true, is_active: true },
  { id: "3", name: "phone", label: "رقم الهاتف", is_required: false, is_active: true },
  { id: "4", name: "subject", label: "الموضوع", is_required: false, is_active: true },
  { id: "5", name: "message", label: "الرسالة", is_required: true, is_active: true },
]

export default function ContactSettingsPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [fields, setFields] = useState<ContactField[]>(defaultFields)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"messages" | "settings">("messages")
  const [message, setMessage] = useState("")
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const { data: messagesData } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })
    if (messagesData) {
      setMessages(messagesData)
    }
    const { data: fieldsData } = await supabase.from("contact_fields").select("*").order("id", { ascending: true })
    if (fieldsData && fieldsData.length > 0) {
      setFields(fieldsData)
    }
    setLoading(false)
  }

  async function saveFieldSettings() {
    setSaving(true)
    setMessage("")
    try {
      for (const field of fields) {
        await supabase.from("contact_fields").upsert({
          id: field.id,
          name: field.name,
          label: field.label,
          is_required: field.is_required,
          is_active: field.is_active,
        })
      }
      setMessage("تم حفظ الإعدادات بنجاح")
    } catch (error: any) {
      setMessage("حدث خطأ: " + error.message)
    }
    setSaving(false)
  }

  async function deleteMessage(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذه الرسالة؟")) return
    const { error } = await supabase.from("contact_messages").delete().eq("id", id)
    if (!error) {
      setMessages(messages.filter((m) => m.id !== id))
    }
  }

  async function markAsRead(id: string) {
    await supabase.from("contact_messages").update({ is_read: true }).eq("id", id)
    setMessages(messages.map((m) => (m.id === id ? { ...m, is_read: true } : m)))
  }

  function exportToCSV() {
    const headers = ["الاسم", "البريد الإلكتروني", "الهاتف", "الموضوع", "الرسالة", "التاريخ"]
    const csvContent = [
      headers.join(","),
      ...messages.map((m) =>
        [
          `"${m.name}"`,
          `"${m.email}"`,
          `"${m.phone || ""}"`,
          `"${m.subject || ""}"`,
          `"${m.message.replace(/"/g, '""')}"`,
          `"${new Date(m.created_at).toLocaleDateString("ar-EG")}"`,
        ].join(",")
      ),
    ].join("\n")
    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `contact_messages_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  function toggleFieldActive(index: number) {
    const updated = [...fields]
    updated[index].is_active = !updated[index].is_active
    setFields(updated)
  }

  function toggleFieldRequired(index: number) {
    const updated = [...fields]
    updated[index].is_required = !updated[index].is_required
    setFields(updated)
  }

  const filteredMessages = messages.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.message.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const unreadCount = messages.filter((m) => !m.is_read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-serif flex items-center gap-3">
            <Mail className="h-8 w-8 text-primary" />
            إدارة رسائل التواصل
          </h1>
          <p className="text-text-muted mt-2">عرض رسائل الزوار وتخصيص نموذج الاتصال</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV} disabled={messages.length === 0}>
            <Download className="h-4 w-4 ml-2" />
            تصدير CSV
          </Button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-center ${
            message.includes("خطأ") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-text-muted">إجمالي الرسائل</p>
            <p className="text-2xl font-bold text-foreground">{messages.length}</p>
          </div>
        </div>
        <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-text-muted">غير مقروءة</p>
            <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
          </div>
        </div>
        <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-text-muted">مقروءة</p>
            <p className="text-2xl font-bold text-green-600">{messages.length - unreadCount}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("messages")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "messages" ? "text-primary border-b-2 border-primary" : "text-text-muted hover:text-primary"
          }`}
        >
          الرسائل
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "settings" ? "text-primary border-b-2 border-primary" : "text-text-muted hover:text-primary"
          }`}
        >
          إعدادات النموذج
        </button>
      </div>

      {activeTab === "messages" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-bold text-lg">الرسائل الواردة</h3>
            <div className="relative">
              <Search className="absolute top-1/2 right-3 transform -translate-y-1/2 text-text-muted h-4 w-4" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 bg-muted w-full md:w-64"
                placeholder="بحث..."
              />
            </div>
          </div>

          {filteredMessages.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد رسائل</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${!msg.is_read ? "bg-primary/5" : ""}`}
                  onClick={() => markAsRead(msg.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {!msg.is_read && <span className="w-2 h-2 bg-primary rounded-full" />}
                      <span className="font-bold text-foreground">{msg.name}</span>
                      <span className="text-sm text-text-muted">({msg.email})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">
                        {new Date(msg.created_at).toLocaleDateString("ar-EG")}
                      </span>
                      <Button variant="ghost" size="icon" onClick={() => deleteMessage(msg.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {msg.subject && (
                    <p className="text-sm font-medium text-primary mb-1">{msg.subject}</p>
                  )}
                  <p className="text-text-muted text-sm line-clamp-2">{msg.message}</p>

                  {msg.phone && (
                    <p className="text-xs text-text-muted mt-2 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {msg.phone}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "settings" && (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
          <h3 className="font-bold text-lg text-foreground">تخصيص حقول النموذج</h3>
          <p className="text-sm text-muted-foreground">اختر الحقول التي تريد عرضها في نموذج التواصل</p>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center justify-between p-4 bg-muted rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center">
                    <UiverseToggle checked={field.is_active} onCheckedChange={() => toggleFieldActive(index)} />
                  </div>
                  <div>
                    <Label className="text-base">{field.label}</Label>
                    <p className="text-xs text-muted-foreground">{field.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">مطلوب</Label>
                  <div className="flex items-center justify-center">
                    <UiverseToggle
                      checked={field.is_required}
                      onCheckedChange={() => toggleFieldRequired(index)}
                      disabled={!field.is_active}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button onClick={saveFieldSettings} disabled={saving} className="bg-primary hover:bg-primary-hover text-white">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              "حفظ الإعدادات"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}


