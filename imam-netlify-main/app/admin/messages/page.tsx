"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Save } from "lucide-react"

interface Message {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  read: boolean
  created_at: string
}

interface ContactSettings {
  id?: string
  important_notice: string
  email: string
  facebook_url: string
  youtube_url: string
  telegram_url: string
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [contactSettings, setContactSettings] = useState<ContactSettings>({
    important_notice: "",
    email: "",
    facebook_url: "",
    youtube_url: "",
    telegram_url: "",
  })
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState("")
  const supabase = createClient()

  const fetchMessages = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })
    if (!error) setMessages(data || [])
    setLoading(false)
  }

  const fetchContactSettings = async () => {
    const { data } = await supabase.from("contact_settings").select("*").limit(1)
    if (data?.[0]) {
      setContactSettings(data[0])
    }
  }

  useEffect(() => {
    fetchMessages()
    fetchContactSettings()
  }, [])

  const handleMarkAsRead = async (id: string) => {
    const { error } = await supabase.from("contact_messages").update({ read: true }).eq("id", id)
    if (!error) fetchMessages()
  }

  const handleDeleteMessage = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الرسالة؟")) return
    const { error } = await supabase.from("contact_messages").delete().eq("id", id)
    if (!error) fetchMessages()
  }

  const openViewDialog = (message: Message) => {
    setSelectedMessage(message)
    setIsViewDialogOpen(true)
    if (!message.read) {
      handleMarkAsRead(message.id)
    }
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    setSettingsMessage("")
    try {
      if (contactSettings.id) {
        const { error } = await supabase
          .from("contact_settings")
          .update({
            important_notice: contactSettings.important_notice,
            email: contactSettings.email,
            facebook_url: contactSettings.facebook_url,
            youtube_url: contactSettings.youtube_url,
            telegram_url: contactSettings.telegram_url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", contactSettings.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("contact_settings").insert({
          important_notice: contactSettings.important_notice,
          email: contactSettings.email,
          facebook_url: contactSettings.facebook_url,
          youtube_url: contactSettings.youtube_url,
          telegram_url: contactSettings.telegram_url,
        })
        if (error) throw error
      }
      setSettingsMessage("تم حفظ الإعدادات بنجاح!")
      fetchContactSettings()
    } catch (error: any) {
      setSettingsMessage("حدث خطأ: " + error.message)
    }
    setSavingSettings(false)
  }

  const filteredMessages = messages.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.subject && m.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  )
  const unreadCount = messages.filter((m) => !m.read).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <span className="material-icons-outlined text-3xl text-primary">mail</span>
            رسائل التواصل
          </h1>
          <p className="text-sm text-muted-foreground mt-1">عرض وإدارة الرسائل الواردة وإعدادات صفحة التواصل</p>
        </div>

        {unreadCount > 0 && (
          <div className="bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-bold">
            {unreadCount} رسالة غير مقروءة
          </div>
        )}
      </div>
      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="messages">الرسائل</TabsTrigger>
          <TabsTrigger value="settings">إعدادات صفحة التواصل</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-6 mt-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card p-5 rounded-xl border border-border flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <span className="material-icons-outlined">mail</span>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">إجمالي الرسائل</p>
                <p className="text-2xl font-bold text-foreground">{messages.length}</p>
              </div>
            </div>
            <div className="bg-card p-5 rounded-xl border border-border flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                <span className="material-icons-outlined">mark_email_unread</span>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">غير مقروءة</p>
                <p className="text-2xl font-bold text-foreground">{unreadCount}</p>
              </div>
            </div>
            <div className="bg-card p-5 rounded-xl border border-border flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                <span className="material-icons-outlined">mark_email_read</span>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">مقروءة</p>
                <p className="text-2xl font-bold text-foreground">{messages.length - unreadCount}</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-card p-4 rounded-xl border border-border">
            <div className="relative w-full md:w-1/3">
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                <span className="material-icons-outlined">search</span>
              </span>

              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 bg-muted"
                placeholder="ابحث عن رسالة..."
              />
            </div>
          </div>

          {/* Messages List */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? "لا توجد نتائج للبحث" : "لا توجد رسائل بعد"}
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="divide-y divide-border">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 flex items-start gap-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                      !message.read ? "bg-primary/5" : ""
                    }`}
                    onClick={() => openViewDialog(message)}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        !message.read ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <span className="material-icons-outlined text-lg">
                        {!message.read ? "mark_email_unread" : "mail"}
                      </span>
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-bold text-foreground ${!message.read ? "text-primary" : ""}`}>
                          {message.name}
                        </h3>

                        {!message.read && (
                          <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">جديد</span>
                        )}
                      </div>
                      <p className="text-sm text-text-muted truncate">{message.subject || "بدون موضوع"}</p>
                      <p className="text-xs text-text-muted mt-1 line-clamp-1">{message.message}</p>
                    </div>

                    <div className="text-left shrink-0">
                      <p className="text-xs text-text-muted">
                        {new Date(message.created_at).toLocaleDateString("ar-EG")}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteMessage(message.id)
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <span className="material-icons-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
        <TabsContent value="settings" className="space-y-6 mt-6">
          <div className="bg-card rounded-xl border border-border p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">إعدادات صفحة التواصل</h2>
                <p className="text-sm text-text-muted mt-1">تحكم في محتوى صفحة "تواصل معنا"</p>
              </div>

              <Button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="bg-primary hover:bg-primary-hover text-white"
              >
                {savingSettings ? (
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

            {settingsMessage && (
              <div
                className={`p-4 rounded-lg ${
                  settingsMessage.includes("خطأ") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                }`}
              >
                {settingsMessage}
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>نص التنويه الهام</Label>
                <Textarea
                  value={contactSettings.important_notice}
                  onChange={(e) => setContactSettings({ ...contactSettings, important_notice: e.target.value })}
                  placeholder="نص التنويه الذي سيظهر في صفحة التواصل..."
                  className="bg-muted resize-none"
                  rows={4}
                />
                <p className="text-xs text-text-muted">
                  هذا النص سيظهر في صندوق التنويه الهام في صفحة "تواصل معنا"
                </p>
              </div>

              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input
                  value={contactSettings.email}
                  onChange={(e) => setContactSettings({ ...contactSettings, email: e.target.value })}
                  placeholder="contact@example.com"
                  className="bg-muted"
                  dir="ltr"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>رابط فيسبوك</Label>
                  <Input
                    value={contactSettings.facebook_url}
                    onChange={(e) => setContactSettings({ ...contactSettings, facebook_url: e.target.value })}
                    placeholder="https://facebook.com/..."
                    className="bg-muted"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>رابط يوتيوب</Label>
                  <Input
                    value={contactSettings.youtube_url}
                    onChange={(e) => setContactSettings({ ...contactSettings, youtube_url: e.target.value })}
                    placeholder="https://youtube.com/..."
                    className="bg-muted"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>رابط تيليجرام</Label>
                  <Input
                    value={contactSettings.telegram_url}
                    onChange={(e) => setContactSettings({ ...contactSettings, telegram_url: e.target.value })}
                    placeholder="https://t.me/..."
                    className="bg-muted"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-card max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="material-icons-outlined text-primary">mail</span>
              تفاصيل الرسالة
            </DialogTitle>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-muted mb-1">الاسم</p>
                  <p className="font-bold text-foreground">{selectedMessage.name}</p>
                </div>

                <div>
                  <p className="text-sm text-text-muted mb-1">البريد الإلكتروني</p>
                  <p className="font-bold text-foreground" dir="ltr">
                    {selectedMessage.email}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-text-muted mb-1">الموضوع</p>
                <p className="font-bold text-foreground">{selectedMessage.subject || "بدون موضوع"}</p>
              </div>

              <div>
                <p className="text-sm text-text-muted mb-1">الرسالة</p>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-foreground whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>
              <div className="text-sm text-text-muted">
                تاريخ الإرسال: {new Date(selectedMessage.created_at).toLocaleString("ar-EG")}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  إغلاق
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDeleteMessage(selectedMessage.id)
                    setIsViewDialogOpen(false)
                  }}
                >
                  <span className="material-icons-outlined text-sm ml-1">delete</span>
                  حذف الرسالة
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
