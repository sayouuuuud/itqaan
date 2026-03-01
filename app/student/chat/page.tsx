"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, Send, MessageSquare, BookOpen, Link2, Trash2, Edit2, MoreVertical } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

type Conversation = {
    id: string
    reader_name: string | null
    reader_avatar: string | null
    admin_id: string | null
    admin_name: string | null
    admin_avatar: string | null
    last_message_preview: string | null
    last_message_at: string | null
    unread_count_student: number
}

type Message = {
    id: string
    message_text: string
    sender_id: string
    sender_name: string
    sender_role: string
    sender_avatar: string | null
    created_at: string
    updated_at?: string
}

export default function StudentChatPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" /></div>}>
            <StudentChatInner />
        </Suspense>
    )
}

function StudentChatInner() {
    const { t, locale } = useI18n()
    const isAr = locale === "ar"
    const searchParams = useSearchParams()
    const withReaderId = searchParams.get("with")

    const [conversations, setConversations] = useState<Conversation[]>([])
    const [activeConv, setActiveConv] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])

    const [messageText, setMessageText] = useState("")
    const [linkText, setLinkText] = useState("")
    const [sending, setSending] = useState(false)
    const [loadingConvs, setLoadingConvs] = useState(true)
    const [loadingMsgs, setLoadingMsgs] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    const bottomRef = useRef<HTMLDivElement>(null)
    const pollRef = useRef<NodeJS.Timeout | null>(null)

    // Edit and Delete states
    const [editingMessage, setEditingMessage] = useState<Message | null>(null)
    const [deletingConvId, setDeletingConvId] = useState<string | null>(null)

    const openConversation = useCallback(async (conv: Conversation) => {
        setActiveConv(conv)
        setLoadingMsgs(true)
        if (pollRef.current) clearInterval(pollRef.current)
        try {
            const res = await fetch(`/api/conversations/${conv.id}/messages`)
            if (res.ok) {
                const d = await res.json()
                setMessages(d.messages || [])

                // Mark as read in local state
                setConversations(prev =>
                    prev.map(c => c.id === conv.id ? { ...c, unread_count_student: 0 } : c)
                )
            }
        } finally { setLoadingMsgs(false); scrollToBottom() }

        // Poll every 5 seconds
        pollRef.current = setInterval(async () => {
            const res = await fetch(`/api/conversations/${conv.id}/messages`)
            if (res.ok) {
                const d = await res.json()
                setMessages(d.messages || [])
            }
        }, 5000)
    }, [])

    useEffect(() => {
        fetch("/api/auth/me").then(r => r.json()).then(d => setCurrentUserId(d.user?.id || null))

        const fetchConvs = async (init = false) => {
            try {
                const r = await fetch("/api/conversations")
                if (r.ok) {
                    const d = await r.json()
                    const convs = d.conversations || []
                    setConversations(convs)

                    if (init) {
                        if (withReaderId) {
                            // Find or create conversation with this specific reader
                            const me = await fetch("/api/auth/me").then(r => r.json())
                            const myId = me.user?.id
                            if (myId) {
                                try {
                                    const res = await fetch("/api/conversations", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ studentId: myId, readerId: withReaderId }),
                                    })
                                    if (res.ok) {
                                        const convData = await res.json()
                                        const targetConvId = convData.conversation?.id
                                        // Refresh and find it
                                        const r2 = await fetch("/api/conversations")
                                        if (r2.ok) {
                                            const d2 = await r2.json()
                                            const allConvs = d2.conversations || []
                                            setConversations(allConvs)
                                            const target = allConvs.find((c: Conversation) => c.id === targetConvId)
                                            if (target) { openConversation(target); return }
                                        }
                                    }
                                } catch { }
                            }
                        }
                        // Fallback logic to open first chat removed as requested
                        // const readerConv = convs.find((c: Conversation) => !c.admin_id)
                        // if (readerConv) openConversation(readerConv)
                        // else if (convs.length > 0) openConversation(convs[0])
                    }
                }
            } finally {
                if (init) setLoadingConvs(false)
            }
        }

        fetchConvs(true)
        const interval = setInterval(() => fetchConvs(false), 5000)
        return () => clearInterval(interval)
    }, [openConversation, withReaderId])

    const scrollToBottom = () => {
        setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" })
        }, 100)
    }

    useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

    const handleSend = async () => {
        if ((!messageText.trim() && !linkText.trim()) || !activeConv) return
        const fullMessage = messageText

        setSending(true)

        if (editingMessage) {
            // Edit existing message
            const oldMsgId = editingMessage.id
            setMessages(p => p.map(m => m.id === oldMsgId ? { ...m, message_text: fullMessage, updated_at: new Date().toISOString() } : m))
            setEditingMessage(null)
            setMessageText("")

            try {
                await fetch(`/api/conversations/${activeConv.id}/messages/${oldMsgId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message_text: fullMessage }),
                })
            } finally { setSending(false) }
            return
        }

        const optimisticMsg: Message = {
            id: `tmp-${Date.now()}`,
            message_text: fullMessage,
            sender_id: currentUserId || "",
            sender_name: t.student.you,
            sender_role: "student",
            sender_avatar: null,
            created_at: new Date().toISOString(),
        }
        setMessages(p => [...p, optimisticMsg])

        // Update last message in conv list optimistically
        setConversations(prev => {
            const updated = [...prev]
            const curIdx = updated.findIndex(c => c.id === activeConv.id)
            if (curIdx > -1) {
                updated[curIdx] = {
                    ...updated[curIdx],
                    last_message_preview: fullMessage.substring(0, 100),
                    last_message_at: optimisticMsg.created_at
                }
            }
            return updated.sort((a, b) => {
                if (!a.last_message_at) return 1
                if (!b.last_message_at) return -1
                return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
            })
        })

        setMessageText("")
        scrollToBottom()

        try {
            await fetch(`/api/conversations/${activeConv.id}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: fullMessage }),
            })
            const res = await fetch(`/api/conversations/${activeConv.id}/messages`)
            if (res.ok) {
                const d = await res.json()
                setMessages(d.messages || [])
            }
        } finally { setSending(false) }
    }

    const handleDeleteMessage = async (msgId: string) => {
        if (!activeConv || !confirm(isAr ? "هل أنت متأكد من حذف هذه الرسالة؟" : "Are you sure you want to delete this message?")) return
        setMessages(p => p.filter(m => m.id !== msgId))
        try {
            await fetch(`/api/conversations/${activeConv.id}/messages/${msgId}`, { method: "DELETE" })
        } catch { } // Optimistic
    }

    const handleDeleteConversation = async () => {
        if (!activeConv || !confirm(isAr ? "هل أنت متأكد من حذف هذه المحادثة نهائياً لكلا الطرفين؟" : "Are you sure you want to permanently delete this conversation for both parties?")) return
        setDeletingConvId(activeConv.id)
        try {
            await fetch(`/api/conversations/${activeConv.id}`, { method: "DELETE" })
            setConversations(p => p.filter(c => c.id !== activeConv.id))
            setActiveConv(null)
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

    const currentConv = conversations.find(c => c.id === activeConv?.id) || activeConv

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col max-w-6xl mx-auto">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                    {t.student.messagesTitle}
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    {t.student.chatSubtitle}
                </p>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Conversations List */}
                <Card className="border-slate-200 lg:col-span-1 flex flex-col h-full overflow-hidden shadow-sm">
                    <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50">
                        <CardTitle className="text-base font-bold text-slate-700">
                            {t.student.conversationsHeader}
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
                                <p className="font-medium text-slate-600">{t.student.noConversationsYet}</p>
                                <p className="text-xs text-slate-400 mt-1">{t.student.chatAfterBookingSubtitle}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {conversations.map((c, idx) => {
                                    const colorClass = avatarColors[idx % avatarColors.length]
                                    const isSelected = activeConv?.id === c.id
                                    const hasUnread = c.unread_count_student > 0
                                    const name = c.admin_id ? t.admin?.administration || "الإدارة" : (c.reader_name || t.student.certifiedReaderFallback)

                                    return (
                                        <button
                                            key={c.id}
                                            onClick={() => openConversation(c)}
                                            className={`w-full flex items-center gap-3 p-4 text-right transition-colors hover:bg-slate-50 relative ${isSelected ? "bg-[#0B3D2E]/5 border-l-2 border-l-[#0B3D2E]" : ""
                                                }`}
                                        >
                                            <div className="relative">
                                                <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-bold text-lg ${c.admin_id ? 'bg-amber-100 text-amber-700' : colorClass}`}>
                                                    {(c.admin_avatar || c.reader_avatar) ? (
                                                        <img src={(c.admin_avatar || c.reader_avatar)!} alt={name} className="w-full h-full rounded-full object-cover" />
                                                    ) : (name[0] || t.userFallbackLetter)}
                                                </div>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <p className={`text-sm truncate ${hasUnread ? "font-bold text-slate-900" : "font-semibold text-slate-800"}`}>
                                                        {name}
                                                    </p>
                                                    {c.last_message_at && (
                                                        <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap ml-2">
                                                            {new Date(c.last_message_at).toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`text-xs truncate ${hasUnread ? "font-medium text-slate-700" : "text-slate-500"}`}>
                                                    {c.last_message_preview || t.student.startConversationMsg}
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
                                <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${currentConv.admin_id ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-600'}`}>
                                    {(currentConv.admin_avatar || currentConv.reader_avatar) ? (
                                        <img src={(currentConv.admin_avatar || currentConv.reader_avatar)!} alt="avatar" className="w-full h-full rounded-full object-cover" />
                                    ) : (currentConv.admin_id ? (t.admin?.administration?.[0] || 'إ') : (currentConv.reader_name?.[0] || t.userFallbackLetter))}
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-base text-slate-800">
                                        {currentConv.admin_id ? t.admin?.administration || "الإدارة" : (currentConv.reader_name || t.student.certifiedReaderFallback)}
                                    </CardTitle>
                                    <p className="text-xs text-slate-500">
                                        {currentConv.admin_id ? "إدارة المنصة" : t.student.certifiedReaderFallback}
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
                            <CardContent className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 space-y-4">
                                {loadingMsgs ? (
                                    <div className="h-full flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-[#0B3D2E]" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <BookOpen className="w-12 h-12 text-slate-200 mb-3 opacity-50" />
                                        <p>{t.student.startConversationMsg}</p>
                                    </div>
                                ) : (
                                    <>
                                        {messages.map((msg, idx) => {
                                            const isMe = msg.sender_id === currentUserId
                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={`flex ${isMe ? "justify-start" : "justify-end"} group relative`}
                                                >
                                                    {isMe && (
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
                                                        className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm ${isMe
                                                            ? "bg-[#0B3D2E] text-white rounded-br-sm"
                                                            : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                                                            }`}
                                                    >
                                                        {!isMe && <p className="text-[10px] font-bold mb-1.5 text-[#D4A843]">{msg.sender_role === 'admin' ? t.admin?.administration || "الإدارة" : msg.sender_name}</p>}
                                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.message_text}</p>
                                                        <div className={`text-[10px] mt-2 flex items-center justify-between ${isMe ? "text-emerald-100/70" : "text-slate-400"
                                                            }`}>
                                                            <span>{new Date(msg.created_at).toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                                                            {msg.updated_at && <span className="ml-2 rtl:mr-2 rtl:ml-0 opacity-70 italic">{isAr ? "(مُعدلة)" : "(edited)"}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        <div ref={bottomRef} />
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
                                        <button onClick={() => { setEditingMessage(null); setMessageText("") }} className="hover:underline font-bold">
                                            {isAr ? "إلغاء" : "Cancel"}
                                        </button>
                                    </div>
                                )}
                                <div className="flex items-end gap-3">
                                    <Textarea
                                        placeholder={t.student.writeMessagePlaceholder || (isAr ? "اكتب رسالتك..." : "Type your message...")}
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
                                        disabled={!messageText.trim() || sending}
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
