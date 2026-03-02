"use client"

import { useState, useEffect, useRef } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Send, Link2, MessageSquare, Loader2, Trash2, Edit2 } from "lucide-react"

type Conversation = {
  id: string
  student_id: string
  reader_id: string
  last_message_preview: string | null
  last_message_at: string | null
  unread_count_reader: number
  student_name: string
  student_avatar?: string | null
}

type Message = {
  id: string
  sender_id: string
  message_text: string
  created_at: string
  updated_at?: string
}

export default function ReaderChatPage() {
  const { t } = useI18n()
  const isAr = t.locale === "ar"

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)

  const [messageText, setMessageText] = useState("")
  const [linkText, setLinkText] = useState("")
  const [sending, setSending] = useState(false)

  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [deletingConvId, setDeletingConvId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    async function loadConversations(init = false) {
      try {
        const res = await fetch("/api/conversations")
        if (res.ok) {
          const data = await res.json()
          setConversations(data.conversations || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (init) setLoadingConvs(false)
      }
    }
    loadConversations(true)
    const interval = setInterval(() => loadConversations(false), 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!selectedConvId) return

    if (pollRef.current) clearInterval(pollRef.current)

    async function loadMessages(init = false) {
      if (init) setLoadingMsgs(true)
      try {
        const res = await fetch(`/api/conversations/${selectedConvId}/messages`)
        if (res.ok) {
          const data = await res.json()
          setMessages(data.messages || [])

          // Mark as read in local state
          setConversations(prev =>
            prev.map(c => c.id === selectedConvId ? { ...c, unread_count_reader: 0 } : c)
          )
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (init) {
          setLoadingMsgs(false)
          scrollToBottom()
        }
      }
    }
    loadMessages(true)

    pollRef.current = setInterval(() => loadMessages(false), 5000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [selectedConvId])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  const currentConv = conversations.find(c => c.id === selectedConvId)

  const handleSend = async () => {
    if ((!messageText.trim() && !linkText.trim()) || !selectedConvId) return

    const fullMessage = linkText.trim()
      ? `${messageText}\n${linkText}`
      : messageText

    setSending(true)

    if (editingMessage) {
      const oldMsgId = editingMessage.id
      setMessages(p => p.map(m => m.id === oldMsgId ? { ...m, message_text: fullMessage, updated_at: new Date().toISOString() } : m))
      setEditingMessage(null)
      setMessageText("")
      setLinkText("")

      try {
        await fetch(`/api/conversations/${selectedConvId}/messages/${oldMsgId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message_text: fullMessage }),
        })
      } finally { setSending(false) }
      return
    }

    try {
      const res = await fetch(`/api/conversations/${selectedConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fullMessage }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages([...messages, data.message])

        // Update last message in conv list
        setConversations(prev => {
          const updated = [...prev]
          const curIdx = updated.findIndex(c => c.id === selectedConvId)
          if (curIdx > -1) {
            updated[curIdx] = {
              ...updated[curIdx],
              last_message_preview: data.message.message_text.substring(0, 100),
              last_message_at: data.message.created_at
            }
          }
          // Sort bringing recent to top
          return updated.sort((a, b) => {
            if (!a.last_message_at) return 1
            if (!b.last_message_at) return -1
            return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
          })
        })

        setMessageText("")
        setLinkText("")
        scrollToBottom()
      }
    } catch {
      alert("فشل إرسال الرسالة")
    } finally {
      setSending(false)
    }
  }

  const handleDeleteMessage = async (msgId: string) => {
    if (!selectedConvId || !confirm(isAr ? "هل أنت متأكد من حذف هذه الرسالة؟" : "Are you sure you want to delete this message?")) return
    setMessages(p => p.filter(m => m.id !== msgId))
    try {
      await fetch(`/api/conversations/${selectedConvId}/messages/${msgId}`, { method: "DELETE" })
    } catch { } // Optimistic update
  }

  const handleDeleteConversation = async () => {
    if (!selectedConvId || !confirm(isAr ? "هل أنت متأكد من حذف هذه المحادثة نهائياً لكلا الطرفين؟" : "Are you sure you want to permanently delete this conversation for both parties?")) return
    setDeletingConvId(selectedConvId)
    try {
      await fetch(`/api/conversations/${selectedConvId}`, { method: "DELETE" })
      setConversations(p => p.filter(c => c.id !== selectedConvId))
      setSelectedConvId(null)
      setMessages([])
    } finally {
      setDeletingConvId(null)
    }
  }

  const avatarColors = [
    "bg-sky-100 text-sky-600",
    "bg-emerald-100 text-emerald-600",
    "bg-amber-100 text-amber-600",
    "bg-purple-100 text-purple-600",
  ]

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
          {isAr ? "المحادثات" : "Messages"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {isAr ? "تواصل مع الطلاب حول ملاحظات التلاوة والمواعيد" : "Communicate with students"}
        </p>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <Card className="border-slate-200 lg:col-span-1 flex flex-col h-full overflow-hidden shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50">
            <CardTitle className="text-base font-bold text-slate-700">
              {isAr ? "قائمة المحادثات" : "Conversations"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#0B3D2E]" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
                <p>{isAr ? "لا توجد محادثات سابقة" : "No conversations yet"}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {conversations.map((conv, idx) => {
                  const colorClass = avatarColors[idx % avatarColors.length]
                  const isSelected = selectedConvId === conv.id
                  const hasUnread = conv.unread_count_reader > 0

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConvId(conv.id)}
                      className={`w-full flex items-center gap-3 p-4 text-right transition-colors hover:bg-slate-50 relative ${isSelected ? "bg-[#0B3D2E]/5 border-l-2 border-l-[#0B3D2E]" : ""
                        }`}
                    >
                      <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-bold text-lg ${colorClass}`}>
                        {conv.student_avatar ? (
                          <img src={conv.student_avatar} alt={conv.student_name} className="w-full h-full rounded-full object-cover" />
                        ) : (conv.student_name || "ط").charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-baseline mb-1">
                          <p className={`text-sm truncate ${hasUnread ? "font-bold text-slate-900" : "font-semibold text-slate-800"}`}>
                            {conv.student_name}
                          </p>
                          {conv.last_message_at && (
                            <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap ml-2">
                              {new Date(conv.last_message_at).toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs truncate ${hasUnread ? "font-medium text-slate-700" : "text-slate-500"}`}>
                          {conv.last_message_preview || "بدء محادثة جديدة"}
                        </p>
                      </div>
                      {hasUnread && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#D4A843]" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="border-slate-200 lg:col-span-2 flex flex-col h-full overflow-hidden shadow-sm">
          {currentConv ? (
            <>
              <CardHeader className="border-b border-slate-100 pb-4 bg-white flex flex-row items-center gap-3 space-y-0">
                <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-sm bg-emerald-100 text-emerald-600`}>
                  {currentConv.student_avatar ? (
                    <img src={currentConv.student_avatar} alt={currentConv.student_name} className="w-full h-full rounded-full object-cover" />
                  ) : (currentConv.student_name || "ط").charAt(0)}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base text-slate-800">{currentConv.student_name}</CardTitle>
                  <p className="text-xs text-slate-500">طالب</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={handleDeleteConversation}
                  disabled={deletingConvId === currentConv.id}
                  title={isAr ? "حذف المحادثة" : "Delete Conversation"}
                >
                  {deletingConvId === currentConv.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                </Button>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 space-y-4">
                {loadingMsgs ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#0B3D2E]" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
                    <p>أرسل رسالة للترحيب بالطالب</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => {
                      const isReader = msg.sender_id === currentConv.reader_id
                      const isLast = idx === messages.length - 1
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isReader ? "justify-start" : "justify-end"} group relative`}
                        >
                          {isReader && (
                            <div className="absolute -top-3 rtl:right-0 ltr:left-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden py-1 px-1 z-10">
                              <button
                                onClick={() => {
                                  setEditingMessage(msg)
                                  setMessageText(msg.message_text)
                                  setLinkText("")
                                }}
                                className="p-1.5 text-slate-400 hover:text-[#0B3D2E] hover:bg-slate-50 rounded transition-colors"
                                title={isAr ? "تعديل" : "Edit"}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded transition-colors"
                                title={isAr ? "حذف" : "Delete"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                          <div
                            className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm ${isReader
                              ? "bg-[#0B3D2E] text-white rounded-br-sm"
                              : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                              }`}
                          >
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.message_text}</p>
                            <div className={`text-[10px] mt-2 flex items-center justify-between ${isReader ? "text-emerald-100/70" : "text-slate-400"
                              }`}>
                              <span>{new Date(msg.created_at).toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                              {msg.updated_at && <span className="ml-2 rtl:mr-2 rtl:ml-0 opacity-70 italic">{isAr ? "(مُعدلة)" : "(edited)"}</span>}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </CardContent>

              {/* Input */}
              <div className="border-t border-slate-200 p-4 bg-white space-y-3">
                {editingMessage && (
                  <div className="flex items-center justify-between bg-amber-50 text-amber-800 p-2 rounded-lg text-xs mb-2 border border-amber-200/50">
                    <div className="flex items-center gap-2">
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{isAr ? "تعديل الرسالة..." : "Editing message..."}</span>
                    </div>
                    <button onClick={() => { setEditingMessage(null); setMessageText(""); setLinkText("") }} className="hover:underline font-bold">
                      {isAr ? "إلغاء" : "Cancel"}
                    </button>
                  </div>
                )}
                {!editingMessage && (
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <Input
                      placeholder={isAr ? "أضف رابطًا (ميت، زوم، إلخ) - اختياري" : "Add a link (optional)"}
                      value={linkText}
                      onChange={(e) => setLinkText(e.target.value)}
                      className="h-9 text-xs bg-slate-50 border-slate-200"
                      dir="ltr"
                    />
                  </div>
                )}
                <div className="flex items-end gap-3">
                  <Textarea
                    placeholder={isAr ? "اكتب رسالتك..." : "Type your message..."}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    rows={2}
                    className="resize-none border-slate-200 bg-slate-50 focus-visible:ring-[#0B3D2E]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    className="h-11 w-11 shrink-0 bg-[#D4A843] hover:bg-[#C49A3A] text-white rounded-xl shadow-sm"
                    onClick={handleSend}
                    disabled={(!messageText.trim() && !linkText.trim()) || sending}
                    aria-label="إرسال"
                  >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 rtl:-scale-x-100" />}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
              <MessageSquare className="w-16 h-16 text-slate-200 mb-4" />
              <p className="font-medium text-slate-500">اختر محادثة للبدء في التواصل</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
