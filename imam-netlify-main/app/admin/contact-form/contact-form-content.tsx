"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import {
  Loader2,
  Mail,
  Eye,
  Trash2,
  Download,
  CheckCircle,
  Settings,
  Search,
  Filter,
  RefreshCw,
  MailOpen,
  Star,
} from "lucide-react"
import Link from "next/link"

interface Message {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  phone: string | null
  is_read: boolean
  is_favorite?: boolean
  created_at: string
}

export default function ContactFormContent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "unread" | "read">("all")
  const [filterSubject, setFilterSubject] = useState<string>("all")
  const [filterFavorite, setFilterFavorite] = useState<boolean | null>(null)
  const { user } = useAuth()
  const isVisitor = user?.email === 'visitor@gmail.com'

  const supabase = createClient()

  // ترجمة المواضيع من الإنجليزية للعربية
  const getSubjectLabel = (subject: string | null) => {
    const subjectMap: { [key: string]: string } = {
      "استفسار عام": "استفسار عام",
      "طلب فتوى": "طلب فتوى",
      "اقتراح": "اقتراح",
      "شكوى": "شكوى",
      "أخرى": "أخرى",
      "inquiry": "استفسار عام",
      "suggestion": "اقتراح تحسين",
      "report": "إبلاغ عن مشكلة",
      "other": "أخرى",
      "general": "استفسار عام"
    }

    return subjectMap[subject || ""] || (subject || "بدون موضوع")
  }

  useEffect(() => {
    loadMessages()
  }, [])

  useEffect(() => {
    let result = messages

    // Filter by status
    if (filterStatus === "unread") {
      result = result.filter((m) => !m.is_read)
    } else if (filterStatus === "read") {
      result = result.filter((m) => m.is_read)
    }

    // Filter by subject
    if (filterSubject !== "all") {
      result = result.filter((m) => m.subject === filterSubject)
    }

    // Filter by favorite
    if (filterFavorite !== null) {
      result = result.filter((m) => m.is_favorite === filterFavorite)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (m) =>
          (m.name || "").toLowerCase().includes(term) ||
          (m.email || "").toLowerCase().includes(term) ||
          (m.subject || "").toLowerCase().includes(term) ||
          (m.message || "").toLowerCase().includes(term),
      )
    }

    setFilteredMessages(result)
  }, [messages, searchTerm, filterStatus, filterSubject, filterFavorite])

  async function loadMessages() {
    setLoading(true)
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })

    if (data) {
      setMessages(data)
      setFilteredMessages(data) // This will be filtered by useEffect
    }
    if (error) {
      console.error("[v0] Error loading messages:", error)
    }
    setLoading(false)
  }

  async function markAsRead(id: string) {
    if (isVisitor) return
    await supabase.from("contact_messages").update({ is_read: true }).eq("id", id)
    loadMessages()
  }

  async function markAllAsRead() {
    if (isVisitor) return
    const unreadIds = messages.filter((m) => !m.is_read).map((m) => m.id)
    if (unreadIds.length === 0) return

    for (const id of unreadIds) {
      await supabase.from("contact_messages").update({ is_read: true }).eq("id", id)
    }
    loadMessages()
  }

  async function deleteMessage(id: string) {
    if (isVisitor) return
    if (!confirm("هل أنت متأكد من حذف هذه الرسالة؟")) return
    await supabase.from("contact_messages").delete().eq("id", id)
    setSelectedMessage(null)
    loadMessages()
  }

  async function deleteAllRead() {
    if (isVisitor) return
    const readIds = messages.filter((m) => m.is_read).map((m) => m.id)
    if (readIds.length === 0) return
    if (!confirm(`هل أنت متأكد من حذف ${readIds.length} رسالة مقروءة؟`)) return

    for (const id of readIds) {
      await supabase.from("contact_messages").delete().eq("id", id)
    }
    setSelectedMessage(null)
    loadMessages()
  }

  async function deleteAllMessages() {
    if (isVisitor) return
    if (messages.length === 0) return
    if (!confirm(`هل أنت متأكد من حذف جميع الرسائل (${messages.length} رسالة)؟`)) return

    for (const message of messages) {
      await supabase.from("contact_messages").delete().eq("id", message.id)
    }
    setSelectedMessage(null)
    loadMessages()
  }

  async function toggleFavorite(id: string) {
    const message = messages.find(m => m.id === id)
    if (!message) return

    await supabase
      .from("contact_messages")
      .update({ is_favorite: !message.is_favorite })
      .eq("id", id)

    loadMessages()
  }

  function exportCSV() {
    const headers = ["الاسم", "البريد", "الموضوع", "الرسالة", "التاريخ", "الحالة"]
    const rows = filteredMessages.map((m) => [
      `"${(m.name || "").replace(/"/g, '""')}"`,
      `"${(m.email || "").replace(/"/g, '""')}"`,
      `"${(m.subject || "").replace(/"/g, '""')}"`,
      `"${(m.message || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
      `"${new Date(m.created_at).toLocaleDateString("ar-EG")}"`,
      `"${m.is_read ? "مقروءة" : "غير مقروءة"}"`,
    ])

    const BOM = "\uFEFF"
    const csv = BOM + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `contact-messages-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground font-serif flex items-center gap-3">
            <Mail className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            رسائل التواصل
          </h1>
          <p className="text-muted-foreground mt-1">إدارة الرسائل الواردة من نموذج التواصل</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={loadMessages}>
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
          <Link href="/admin/contact-form/settings">
            <Button variant="outline">
              <Settings className="h-4 w-4 ml-2" />
              إعدادات النموذج
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={exportCSV}
            disabled={filteredMessages.length === 0}
          >
            <Download className="h-4 w-4 ml-2" />
            تصدير CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-2xl font-bold text-primary">{messages.length}</p>
          <p className="text-sm text-muted-foreground">إجمالي الرسائل</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-2xl font-bold text-blue-600">{messages.filter((m) => !m.is_read).length}</p>
          <p className="text-sm text-muted-foreground">غير مقروءة</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-2xl font-bold text-green-600">{messages.filter((m) => m.is_read).length}</p>
          <p className="text-sm text-muted-foreground">مقروءة</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-2xl font-bold text-gray-600">
            {
              messages.filter((m) => {
                const date = new Date(m.created_at)
                const today = new Date()
                return date.toDateString() === today.toDateString()
              }).length
            }
          </p>
          <p className="text-sm text-muted-foreground">اليوم</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث في الرسائل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            size="default"
            onClick={() => setFilterStatus("all")}
            className="h-10 px-4"
          >
            <Filter className="h-4 w-4 ml-2" />
            الكل
          </Button>
          <Button
            variant={filterStatus === "unread" ? "default" : "outline"}
            size="default"
            onClick={() => setFilterStatus("unread")}
            className="h-10 px-4"
          >
            غير مقروءة
          </Button>
          <Button
            variant={filterStatus === "read" ? "default" : "outline"}
            size="default"
            onClick={() => setFilterStatus("read")}
            className="h-10 px-4"
          >
            مقروءة
          </Button>
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="h-10 px-4 text-sm border rounded-lg bg-background hover:bg-accent transition-colors"
          >
            <option value="all">جميع المواضيع</option>
            <option value="استفسار عام">استفسار عام</option>
            <option value="طلب فتوى">طلب فتوى</option>
            <option value="اقتراح">اقتراح</option>
            <option value="شكوى">شكوى</option>
            <option value="أخرى">أخرى</option>
          </select>

          <Button
            variant={filterFavorite === null ? "outline" : filterFavorite ? "default" : "outline"}
            size="default"
            onClick={() => setFilterFavorite(filterFavorite === null ? true : filterFavorite === true ? false : null)}
            className="h-10 px-4"
          >
            <Star className="h-4 w-4 ml-2" />
            {filterFavorite === null ? "الكل" : filterFavorite ? "المفضلة" : "غير المفضلة"}
          </Button>
        </div>

        {messages.filter((m) => !m.is_read).length > 0 && (
          <Button
            variant="outline"
            size="default"
            onClick={markAllAsRead}
            className="h-10 px-4"
            disabled={isVisitor}
          >
            <MailOpen className="h-4 w-4 ml-2" />
            تحديد الكل كمقروء ({messages.filter((m) => !m.is_read).length})
          </Button>
        )}

        {messages.length > 0 && (
          <Button
            variant="outline"
            size="default"
            onClick={deleteAllMessages}
            className="h-10 px-4"
            disabled={isVisitor}
          >
            <Trash2 className="h-4 w-4 ml-2" />
            حذف الكل
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1 bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-bold text-foreground">الرسائل ({filteredMessages.length})</h3>
          </div>
          {filteredMessages.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Mail className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                {searchTerm || filterStatus !== "all" ? "لا توجد نتائج" : "لا توجد رسائل"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
              {filteredMessages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => {
                    setSelectedMessage(msg)
                    if (!msg.is_read) markAsRead(msg.id)
                  }}
                  className={`w-full p-4 hover:bg-accent/50 transition-colors ${selectedMessage?.id === msg.id ? "bg-primary/5" : ""
                    } ${!msg.is_read ? "bg-primary/10" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary font-bold text-sm">
                        {(msg.name || "؟").charAt(0)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 text-right">
                      {/* Name */}
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground text-base truncate text-left">
                          {msg.name || "بدون اسم"}
                        </p>
                        {msg.is_favorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                      </div>

                      {/* Subject */}
                      <p className="text-sm text-muted-foreground mb-1">
                        {getSubjectLabel(msg.subject)}
                      </p>

                      {/* Email */}
                      <p className="text-xs text-muted-foreground truncate">
                        {msg.email || "بدون بريد إلكتروني"}
                      </p>
                    </div>

                    {/* Date and Time with Unread Indicator */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0 mt-3">
                      {!msg.is_read && (
                        <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                      )}
                      <div className="text-left">
                        <p className="text-xs text-muted-foreground">
                          {new Date(msg.created_at).toLocaleTimeString("ar-EG", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(msg.created_at).getFullYear()}/
                          {new Date(msg.created_at).getMonth() + 1}/
                          {new Date(msg.created_at).getDate()}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2 bg-card rounded-lg border border-border">
          {selectedMessage ? (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedMessage.is_read && <CheckCircle className="h-5 w-5 text-green-500" />}
                  <h3 className="text-lg font-bold text-foreground">تفاصيل الرسالة</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleFavorite(selectedMessage.id)}
                    className={selectedMessage.is_favorite ? "text-yellow-500" : "text-gray-400"}
                  >
                    <Star className={`h-4 w-4 ${selectedMessage.is_favorite ? "fill-current" : ""}`} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMessage(selectedMessage.id)} disabled={isVisitor}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-background rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">الاسم</p>
                    <p className="font-medium text-foreground text-sm md:text-base">{selectedMessage.name}</p>
                  </div>
                  <div className="bg-background rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">البريد الإلكتروني</p>
                    <p className="font-medium text-foreground text-sm md:text-base break-all" dir="ltr">
                      {selectedMessage.email}
                    </p>
                  </div>
                </div>

                {selectedMessage.phone && (
                  <div className="bg-background rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">رقم الهاتف</p>
                    <p className="font-medium text-foreground text-sm md:text-base" dir="ltr">
                      {selectedMessage.phone}
                    </p>
                  </div>
                )}

                <div className="bg-background rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">الموضوع</p>
                  <p className="font-medium text-foreground">{getSubjectLabel(selectedMessage.subject)}</p>
                </div>

                <div className="bg-background rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">الرسالة</p>
                  <p className="text-foreground whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>

                <div className="text-xs text-muted-foreground">
                  تم الإرسال في:{" "}
                  {new Date(selectedMessage.created_at).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">اختر رسالة لعرض التفاصيل</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}