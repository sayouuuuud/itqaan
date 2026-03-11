"use client"

import { useState, useEffect, useRef } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Send, Link2, MessageSquare, Loader2, Trash2, Edit2, Shield, MessagesSquare } from "lucide-react"

type Conversation = {
  id: string
  student_id: string
  reader_id: string
  last_message_preview: string | null
  last_message_at: string | null
  unread_count_reader: number
  student_name: string
  student_avatar?: string | null
  admin_id?: string | null
  admin_name?: string | null
  admin_avatar?: string | null
  is_ticket?: boolean
  ticket_status?: string
}

type Message = {
  id: string
  sender_id: string
  message_text: string
  created_at: string
  updated_at?: string
  sender_name?: string
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

  const [activeTab, setActiveTab] = useState("messages")
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false)
  const [newTicketMessage, setNewTicketMessage] = useState("")
  const [creatingTicket, setCreatingTicket] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    async function loadConversations(init = false) {
      try {
        const res = await fetch("/api/conversations")
        if (res.ok) {
          const data = await res.json()
          const convs = data.conversations || []
          setConversations(convs)

          // Prevent active chat from closing/resetting by stabilizing its state
          if (selectedConvId) {
            const stillExists = convs.find((c: Conversation) => c.id === selectedConvId)
            // If it doesn't exist anymore (e.g. deleted), we reset, otherwise we leave it
          }
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

  const handleCreateTicket = async () => {
    if (!newTicketMessage.trim()) return
    setCreatingTicket(true)
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTicket: true }),
      })
      if (res.ok) {
        const data = await res.json()
        const convId = data.conversation.id
        await fetch(`/api/conversations/${convId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: newTicketMessage }),
        })
        setTicketDialogOpen(false)
        setNewTicketMessage("")
        setActiveTab("tickets")
        setSelectedConvId(convId)

        const cRes = await fetch("/api/conversations")
        if (cRes.ok) {
          const cd = await cRes.json()
          setConversations(cd.conversations || [])
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      setCreatingTicket(false)
    }
  }

  const avatarColors = [
    "bg-sky-100 text-sky-600",
    "bg-emerald-100 text-emerald-600",
    "bg-amber-100 text-amber-600",
    "bg-purple-100 text-purple-600",
  ]

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            {isAr ? "المحادثات" : "Messages"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAr ? "تواصل مع الطلاب حول ملاحظات التلاوة وتذاكر الدعم" : "Communicate with students and support tickets"}
          </p>
        </div>
        <Button
          onClick={() => setTicketDialogOpen(true)}
          className="bg-[#C9A227] hover:bg-[#A6841E] text-white rounded-xl shadow-sm gap-2"
        >
          <Shield className="w-4 h-4" />
          {isAr ? "إنشاء تذكرة دعم فني" : "Create Support Ticket"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setSelectedConvId(null) }} className="flex-1 min-h-0 flex flex-col space-y-4">
        <div className="flex justify-end shrink-0">
          <TabsList className="bg-white p-1 border border-slate-200 shadow-sm h-12 rounded-full overflow-hidden flex-row-reverse">
            <TabsTrigger value="tickets" className="rounded-full font-bold gap-2 px-6 py-2 data-[state=active]:bg-[#1B5E3B] data-[state=active]:text-white transition-all text-sm h-full flex items-center">
              <Shield className="w-4 h-4" />
              {isAr ? "تذاكر الدعم" : "Support Tickets"}
            </TabsTrigger>
            <TabsTrigger value="messages" className="rounded-full font-bold gap-2 px-6 py-2 data-[state=active]:bg-[#1B5E3B] data-[state=active]:text-white transition-all text-sm h-full flex items-center">
              <MessagesSquare className="w-4 h-4" />
              {isAr ? "رسائل الطلاب" : "Student Messages"}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 min-h-0 flex flex-col lg:flex-row-reverse gap-6">
          {/* Conversations List */}
          <Card className="border-slate-200 w-full lg:w-1/3 flex flex-col h-full overflow-hidden shadow-sm shrink-0">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50">
              <CardTitle className="text-base font-bold text-slate-700">
                {activeTab === 'messages' ? (isAr ? "قائمة المحادثات" : "Conversations") : (isAr ? "قائمة التذاكر" : "Tickets List")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
              {loadingConvs ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#1B5E3B]" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                  <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
                  <p>{isAr ? "لا توجد محادثات سابقة" : "No conversations yet"}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {conversations.filter(c => activeTab === 'messages' ? !c.is_ticket : c.is_ticket).map((conv, idx) => {
                    const colorClass = avatarColors[idx % avatarColors.length]
                    const isSelected = selectedConvId === conv.id
                    const hasUnread = conv.unread_count_reader > 0

                    const name = conv.is_ticket ? (isAr ? "فريق الدعم الفني" : "Technical Support") : (conv.student_name || t.student.certifiedReaderFallback)

                    return (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConvId(conv.id)}
                        className={`w-full flex items-center gap-3 p-4 text-right transition-colors hover:bg-slate-50 relative ${isSelected ? "bg-[#1B5E3B]/5 border-l-2 border-l-[#1B5E3B]" : ""
                          }`}
                      >
                        <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-bold text-lg ${conv.is_ticket ? 'bg-amber-100 text-amber-700' : colorClass}`}>
                          {(!conv.is_ticket && conv.student_avatar) ? (
                            <img src={conv.student_avatar} alt={name} className="w-full h-full rounded-full object-cover" />
                          ) : (conv.admin_avatar) ? (
                            <img src={conv.admin_avatar} alt={name} className="w-full h-full rounded-full object-cover" />
                          ) : (name[0] || "ط")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-baseline mb-1">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <p className={`text-sm truncate ${hasUnread ? "font-bold text-slate-900" : "font-semibold text-slate-800"}`}>
                                {name}
                              </p>
                              {conv.is_ticket && (
                                <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                                  {isAr ? "تذكرة" : "Ticket"}
                                </span>
                              )}
                            </div>
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
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#C9A227]" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="border-slate-200 w-full lg:w-2/3 flex flex-col h-full overflow-hidden shadow-sm shrink-0">
            {currentConv ? (
              <>
                <CardHeader className="pb-4 flex flex-row items-center gap-3 space-y-0">
                  <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${currentConv.is_ticket ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-600'}`}>
                    {(!currentConv.is_ticket && currentConv.student_avatar) ? (
                      <img src={currentConv.student_avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (currentConv.admin_avatar) ? (
                      <img src={currentConv.admin_avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (currentConv.is_ticket ? (isAr ? 'ف' : 'S') : (currentConv.student_name || "ط").charAt(0))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base text-slate-800 truncate max-w-full">
                        {currentConv.is_ticket ? (isAr ? "فريق الدعم الفني" : "Technical Support") : (currentConv.student_name || "طالب")}
                      </CardTitle>
                      {currentConv.is_ticket && (
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                          {isAr ? "تذكرة دعم" : "Support Ticket"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {currentConv.is_ticket ? (isAr ? "دعم المستفيدين والمساعدة" : "Help and Support") : (isAr ? "طالب" : "Student")}
                    </p>
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
                <CardContent className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 space-y-4 border-t border-b border-transparent">
                  {loadingMsgs ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-[#1B5E3B]" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
                      <p>{currentConv.is_ticket ? (isAr ? "أرسل تفاصيل المشكلة للدعم الفني" : "Send ticket details to support") : (isAr ? "أرسل رسالة للترحيب بالطالب" : "Send a message to welcome the student")}</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, idx) => {
                        const isMe = msg.sender_id === currentConv.reader_id
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isMe ? "justify-start" : "justify-end"} group relative`}
                          >
                            {isMe && !currentConv.is_ticket && (
                              <div className="absolute -top-3 rtl:right-0 ltr:left-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden py-1 px-1 z-10">
                                <button
                                  onClick={() => {
                                    setEditingMessage(msg)
                                    setMessageText(msg.message_text)
                                    setLinkText("")
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-[#1B5E3B] hover:bg-slate-50 rounded transition-colors"
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
                               className={`max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-3 text-sm shadow-md transition-all ${isMe
                                 ? "bg-[#1B5E3B] text-white rounded-br-sm"
                                 : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm shadow-emerald-500/5"
                                 }`}
                             >
                               {!isMe && currentConv.is_ticket && (
                                 <p className="text-[10px] font-black mb-1.5 text-blue-600 uppercase tracking-wider">{msg.sender_name}</p>
                               )}
                               <p className="whitespace-pre-wrap leading-relaxed text-[14px]">{msg.message_text}</p>
                               <div className={`text-[9px] mt-2 flex items-center justify-between ${isMe ? "text-emerald-100/70" : "text-slate-400"
                                 }`}>
                                 <div className="flex items-center gap-1.5">
                                   <span>{new Date(msg.created_at).toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                                   {isMe && (
                                     <span className="flex items-center">
                                       <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                         <path d="M4 12.89L9.11 18L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                         <path d="M4 7.89L9.11 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40" />
                                       </svg>
                                     </span>
                                   )}
                                 </div>
                                 {msg.updated_at && <span className="opacity-70 italic font-medium">{isAr ? "(مُعدلة)" : "(edited)"}</span>}
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
                <div className="p-4 space-y-3">
                  {currentConv.is_ticket && currentConv.ticket_status === 'closed' ? (
                    <div className="text-center p-3 bg-slate-50 text-slate-500 rounded-xl text-sm border border-slate-200">
                      {isAr ? "تم إغلاق هذه التذكرة. يمكنك إنشاء تذكرة جديدة إذا كان لديك استفسار آخر." : "This ticket is closed. You can create a new ticket if you have another inquiry."}
                    </div>
                  ) : currentConv.is_ticket && currentConv.ticket_status !== 'closed' && messages.length > 0 && messages[messages.length - 1].sender_id === currentConv.reader_id ? (
                    <div className="text-center p-3 bg-blue-50 text-blue-800 rounded-xl text-sm border border-blue-100">
                      {isAr ? "جاري انتظار رد الإدارة على تذكرتك" : "Waiting for admin to respond to your ticket"}
                    </div>
                  ) : (
                    <>
                      {editingMessage && !currentConv.is_ticket && (
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
                      {!editingMessage && !currentConv.is_ticket && (
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
                          rows={1}
                          className="resize-none border-slate-200 bg-slate-50 focus-visible:ring-[#1B5E3B] min-h-[44px] py-2.5"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              handleSend()
                            }
                          }}
                        />
                        <Button
                          size="icon"
                          className="h-11 w-11 shrink-0 bg-[#C9A227] hover:bg-[#A6841E] text-white rounded-xl shadow-sm"
                          onClick={handleSend}
                          disabled={(!messageText.trim() && !linkText.trim()) || sending}
                          aria-label="إرسال"
                        >
                          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 rtl:-scale-x-100" />}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
                <MessageSquare className="w-16 h-16 text-slate-200 mb-4" />
                <p className="font-medium text-slate-500">{activeTab === 'tickets' ? (isAr ? "اختر تذكرة للبدء" : "Select a ticket to start in") : (isAr ? "اختر محادثة للبدء في التواصل" : "Select a conversation to start")}</p>
              </div>
            )}
          </Card>
        </div>
      </Tabs>

      <Dialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isAr ? "إنشاء تذكرة دعم فني" : "Create Support Ticket"}</DialogTitle>
            <DialogDescription>
              {isAr ? "اكتب تفاصيل المشكلة أو الاستفسار وسيقوم فريق الدعم بالرد عليك في أقرب وقت." : "Write the details of your issue or inquiry and support will reply soon."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder={isAr ? "تفاصيل التذكرة..." : "Ticket details..."}
              value={newTicketMessage}
              onChange={(e) => setNewTicketMessage(e.target.value)}
              rows={5}
              className="resize-none focus-visible:ring-[#1B5E3B]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTicketDialogOpen(false)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleCreateTicket}
              disabled={!newTicketMessage.trim() || creatingTicket}
              className="bg-[#C9A227] hover:bg-[#A6841E] text-white"
            >
              {creatingTicket ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? "إرسال التذكرة" : "Send Ticket")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
