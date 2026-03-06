"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, Send, MessageSquare, BookOpen, Link2, Trash2, Edit2, MoreVertical } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog"

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
    is_ticket?: boolean
    ticket_status?: string
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
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#1B5E3B]" /></div>}>
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
    const [sending, setSending] = useState(false)
    const [loadingConvs, setLoadingConvs] = useState(true)
    const [loadingMsgs, setLoadingMsgs] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    const [activeTab, setActiveTab] = useState("messages")
    const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false)
    const [newTicketMessage, setNewTicketMessage] = useState("")
    const [creatingTicket, setCreatingTicket] = useState(false)

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

        // Fetch conversations
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
        if (!messageText.trim() || !activeConv) return
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

    const handleCreateTicket = async () => {
        if (!newTicketMessage.trim()) return;
        setCreatingTicket(true);
        try {
            // 1. Create ticket
            const res = await fetch("/api/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isTicket: true }),
            });
            if (res.ok) {
                const convData = await res.json();
                const targetConvId = convData.conversation?.id;

                // 2. Send the initial message immediately
                await fetch(`/api/conversations/${targetConvId}/messages`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: newTicketMessage }),
                });

                // Refresh UI
                const r2 = await fetch("/api/conversations");
                if (r2.ok) {
                    const d2 = await r2.json();
                    const allConvs = d2.conversations || [];
                    setConversations(allConvs);
                    const target = allConvs.find((c: Conversation) => c.id === targetConvId);

                    setIsTicketDialogOpen(false);
                    setNewTicketMessage("");
                    setActiveTab("tickets");

                    if (target) openConversation(target);
                }
            } else {
                alert(isAr ? "حدث خطأ أثناء إنشاء التذكرة" : "Error creating ticket");
            }
        } catch (e) {
            console.error(e);
            alert(isAr ? "حدث خطأ" : "An error occurred");
        } finally {
            setCreatingTicket(false);
        }
    }

    const currentConv = conversations.find(c => c.id === activeConv?.id) || activeConv

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                        {t.student.messagesTitle}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {t.student.chatSubtitle}
                    </p>
                </div>
                <Button
                    onClick={() => setIsTicketDialogOpen(true)}
                    className="bg-[#0B3D2E] hover:bg-[#0A3528] text-white"
                >
                    <MessageSquare className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {isAr ? "إنشاء تذكرة" : "Create Ticket"}
                </Button>
            </div>


            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setActiveConv(null); setMessages([]); }} className="flex-1 min-h-0 flex flex-col">
                <TabsList className="bg-white p-1.5 rounded-2xl mb-6 flex-wrap justify-start gap-2 border border-slate-200 shadow-sm inline-flex">
                    <TabsTrigger value="messages" className="rounded-xl font-bold gap-2 px-6 py-2.5 data-[state=active]:bg-[#1B5E3B] data-[state=active]:text-white transition-all text-sm">
                        <MessageSquare className="w-4 h-4" />
                        {t.student.messagesTitle || (isAr ? "المحادثات" : "Messages")}
                    </TabsTrigger>
                    <TabsTrigger value="tickets" className="rounded-xl font-bold gap-2 px-6 py-2.5 data-[state=active]:bg-[#1B5E3B] data-[state=active]:text-white transition-all text-sm">
                        <MoreVertical className="w-4 h-4" />
                        {isAr ? "تذاكر الدعم" : "Support Tickets"}
                    </TabsTrigger>
                </TabsList>

                <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
                    {/* Conversations List */}
                    <Card className="border-slate-200 w-full lg:w-1/3 flex flex-col h-full overflow-hidden shadow-sm">
                        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50">
                            <CardTitle className="text-base font-bold text-slate-700">
                                {activeTab === "messages" ? t.student.conversationsHeader : (isAr ? "قائمة التذاكر" : "Tickets List")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-y-auto">
                            {loadingConvs ? (
                                <div className="p-8 flex justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-[#1B5E3B]" />
                                </div>
                            ) : conversations.filter(c => activeTab === "tickets" ? c.is_ticket : !c.is_ticket).length === 0 ? (
                                <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                                    <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
                                    <p className="font-medium text-slate-600">
                                        {activeTab === "messages" ? t.student.noConversationsYet : (isAr ? "لا توجد تذاكر حالياً" : "No tickets yet")}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {activeTab === "messages" ? t.student.chatAfterBookingSubtitle : ""}
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {conversations.filter(c => activeTab === "tickets" ? c.is_ticket : !c.is_ticket).map((c, idx) => {
                                        const colorClass = avatarColors[idx % avatarColors.length]
                                        const isSelected = activeConv?.id === c.id
                                        const hasUnread = c.unread_count_student > 0
                                        const name = c.is_ticket ? (isAr ? "فريق الدعم الفني" : "Technical Support") : (c.admin_id ? t.admin?.administration || "الإدارة" : (c.reader_name || t.student.certifiedReaderFallback))

                                        return (
                                            <button
                                                key={c.id}
                                                onClick={() => openConversation(c)}
                                                className={`w-full flex items-center gap-3 p-4 text-right transition-colors hover:bg-slate-50 relative ${isSelected ? "bg-[#1B5E3B]/5 border-l-2 border-l-[#1B5E3B]" : ""
                                                    }`}
                                            >
                                                <div className="relative">
                                                    <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-bold text-lg ${c.admin_id || c.is_ticket ? 'bg-amber-100 text-amber-700' : colorClass}`}>
                                                        {(c.admin_avatar || c.reader_avatar) ? (
                                                            <img src={(c.admin_avatar || c.reader_avatar)!} alt={name} className="w-full h-full rounded-full object-cover" />
                                                        ) : (name[0] || t.userFallbackLetter)}
                                                    </div>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex justify-between items-baseline mb-1">
                                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                                            <p className={`text-sm truncate ${hasUnread ? "font-bold text-slate-900" : "font-semibold text-slate-800"}`}>
                                                                {name}
                                                            </p>
                                                            {c.is_ticket && (
                                                                <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                                                                    {isAr ? "تذكرة" : "Ticket"}
                                                                </span>
                                                            )}
                                                        </div>
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
                    <Card className="border-slate-200 w-full lg:w-2/3 flex flex-col h-full overflow-hidden shadow-sm">
                        {currentConv ? (
                            <>
                                <CardHeader className="pb-4 flex flex-row items-center gap-3 space-y-0">
                                    <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${currentConv.admin_id || currentConv.is_ticket ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-600'}`}>
                                        {(currentConv.admin_avatar || currentConv.reader_avatar) ? (
                                            <img src={(currentConv.admin_avatar || currentConv.reader_avatar)!} alt="avatar" className="w-full h-full rounded-full object-cover" />
                                        ) : (currentConv.is_ticket ? (isAr ? 'ف' : 'S') : currentConv.admin_id ? (t.admin?.administration?.[0] || 'إ') : (currentConv.reader_name?.[0] || t.userFallbackLetter))}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <CardTitle className="text-base text-slate-800 truncate max-w-full">
                                                {currentConv.is_ticket ? (isAr ? "فريق الدعم الفني" : "Technical Support") : (currentConv.admin_id ? (t.admin?.administration || "الإدارة") : (currentConv.reader_name || t.student.certifiedReaderFallback))}
                                            </CardTitle>
                                            {currentConv.is_ticket && (
                                                <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                                                    {isAr ? "تذكرة دعم" : "Support Ticket"}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {currentConv.is_ticket ? (isAr ? "دعم المستفيدين والمساعدة" : "Help and Support") : (currentConv.admin_id ? "إدارة المنصة" : t.student.certifiedReaderFallback)}
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
                                                        {isMe && !currentConv.is_ticket && (
                                                            <div className="absolute -top-3 rtl:right-0 ltr:left-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden py-1 px-1 z-10">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingMessage(msg)
                                                                        setMessageText(msg.message_text)
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
                                                            className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm ${isMe
                                                                ? "bg-[#1B5E3B] text-white rounded-br-sm"
                                                                : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                                                                }`}
                                                        >
                                                            {!isMe && <p className="text-[10px] font-bold mb-1.5 text-[#C9A227]">{msg.sender_role === 'admin' ? t.admin?.administration || "الإدارة" : msg.sender_name}</p>}
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
                                <div className="p-4 space-y-3">
                                    {currentConv.is_ticket && currentConv.ticket_status === 'closed' ? (
                                        <div className="text-center p-3 bg-slate-50 text-slate-500 rounded-xl text-sm border border-slate-200">
                                            {isAr ? "تم إغلاق هذه التذكرة. يمكنك إنشاء تذكرة جديدة إذا كان لديك استفسار آخر." : "This ticket is closed. You can create a new ticket if you have another inquiry."}
                                        </div>
                                    ) : currentConv.is_ticket && currentConv.ticket_status !== 'closed' && messages.length > 0 && messages[messages.length - 1].sender_id === currentUserId ? (
                                        <div className="text-center p-3 bg-blue-50 text-blue-800 rounded-xl text-sm border border-blue-100">
                                            {isAr ? "جاري انتظار رد الإدارة على تذكرتك" : "Waiting for admin to respond to your ticket"}
                                        </div>
                                    ) : (
                                        <>
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
                                                    className="resize-none border-slate-200 bg-slate-50 focus-visible:ring-[#1B5E3B]"
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
                                                    disabled={!messageText.trim() || sending}
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
                                <p className="font-medium text-slate-500">اختر محادثة للبدء في التواصل</p>
                            </div>
                        )}
                    </Card>
                </div>
            </Tabs>

            <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
                <DialogContent className="sm:max-w-md bg-white p-0 border-0 rounded-2xl overflow-hidden shadow-2xl">
                    <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
                        <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-[#1B5E3B]" />
                            {isAr ? "إنشاء تذكرة دعم فني" : "Create Support Ticket"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-sm mt-1.5">
                            {isAr ? "يرجى كتابة تفاصيل مشكلتك او استفسارك وسيتم الرد عليك في أقرب وقت متاح." : "Please describe your issue or inquiry, and we will get back to you as soon as possible."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-6">
                        <div className="space-y-4">
                            <div className="space-y-2 text-right">
                                <label className="text-sm font-bold text-slate-700">{isAr ? "نص الرسالة" : "Message text"}</label>
                                <Textarea
                                    placeholder={t.student.writeMessagePlaceholder || (isAr ? "اكتب تفاصيل مشكلتك هنا..." : "Write details here...")}
                                    value={newTicketMessage}
                                    onChange={(e) => setNewTicketMessage(e.target.value)}
                                    rows={5}
                                    className="resize-none bg-white border-slate-200 focus-visible:ring-[#1B5E3B]"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 sm:justify-start flex-row-reverse">
                        <Button
                            type="button"
                            disabled={!newTicketMessage.trim() || creatingTicket}
                            onClick={handleCreateTicket}
                            className="bg-[#1B5E3B] hover:bg-[#0A3527] text-white sm:ml-auto"
                        >
                            {creatingTicket && <Loader2 className="w-4 h-4 animate-spin mr-2 rtl:ml-2 rtl:mr-0" />}
                            {isAr ? "إرسال التذكرة" : "Submit Ticket"}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsTicketDialogOpen(false)}
                            className="text-slate-500 hover:bg-slate-200/50 sm:mr-2"
                        >
                            {isAr ? "إلغاء" : "Cancel"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
