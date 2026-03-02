"use client"

import { useState, useEffect, useCallback, useRef, Suspense, use } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    MessagesSquare, Search, MessageCircle, ChevronLeft,
    CheckCircle, XCircle, Loader2, User, BookOpen,
    Shield, Send, MessageSquare
} from "lucide-react"

// --- TYPES ---
type Conversation = {
    id: string
    admin_id: string
    student_id: string | null
    reader_id: string | null
    student_name: string | null
    student_avatar: string | null
    reader_name: string | null
    reader_avatar: string | null
    last_message_preview: string | null
    last_message_at: string | null
}

type Message = {
    id: string
    message_text: string
    sender_id: string
    sender_name: string
    sender_role: string
    sender_avatar: string | null
    created_at: string
}

// --- COMPONENTS ---

function SupervisionTab({ isAr, t }: { isAr: boolean, t: any }) {
    const [conversations, setConversations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)

    const [selectedConvo, setSelectedConvo] = useState<any>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [loadingMessages, setLoadingMessages] = useState(false)

    const fetchConvos = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page: String(page) })
            if (search) params.set('search', search)
            const res = await fetch(`/api/admin/conversations?${params}`)
            if (res.ok) {
                const data = await res.json()
                setConversations(data.conversations)
                setTotal(data.total)
            }
        } finally {
            setLoading(false)
        }
    }, [page, search])

    useEffect(() => {
        const t = setTimeout(fetchConvos, 300)
        return () => clearTimeout(t)
    }, [fetchConvos])

    const openConvo = async (c: any) => {
        setSelectedConvo(c)
        setLoadingMessages(true)
        try {
            const res = await fetch(`/api/admin/conversations/${c.id}`)
            if (res.ok) {
                const data = await res.json()
                setMessages(data.messages)
            }
        } finally {
            setLoadingMessages(false)
        }
    }

    const toggleActive = async (id: string, is_active: boolean) => {
        await fetch('/api/admin/conversations', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, is_active: !is_active }),
        })
        fetchConvos()
    }

    const totalPages = Math.ceil(total / 20)

    return (
        <div className="space-y-6">
            <div className="relative max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-all" />
                <Input
                    className="pr-10 bg-white/50 border-gray-200 focus:bg-white transition-all rounded-xl"
                    placeholder={isAr ? 'البحث باسم الطالب أو المقرئ...' : 'Search by student or reader name...'}
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1) }}
                />
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800">
                        {t.admin.supervision} <span className="text-gray-400 font-normal text-sm">({total})</span>
                    </h3>
                </div>

                {loading ? (
                    <div className="flex justify-center p-16"><Loader2 className="w-7 h-7 animate-spin text-[#0B3D2E]" /></div>
                ) : conversations.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 font-medium">{isAr ? 'لا توجد محادثات' : 'No conversations found'}</div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {conversations.map(c => (
                            <div key={c.id} className="flex items-center gap-4 p-5 hover:bg-gray-50/50 transition-colors">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                                    <MessagesSquare className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0 text-right">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="flex items-center gap-1.5 text-sm font-bold text-gray-800 bg-gray-50 px-2 py-0.5 rounded-lg">
                                            <User className="w-3.5 h-3.5 text-gray-400" /> {c.student_name}
                                        </span>
                                        <span className="text-gray-300 text-xs">↔</span>
                                        <span className="flex items-center gap-1.5 text-sm font-bold text-gray-600 bg-gray-50 px-2 py-0.5 rounded-lg">
                                            <BookOpen className="w-3.5 h-3.5 text-gray-400" /> {c.reader_name}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 truncate mb-2">{c.last_message_preview || (isAr ? 'لا توجد رسائل بعد' : 'No messages yet')}</p>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                                            <MessageCircle className="w-3 h-3" />
                                            {c.message_count} {isAr ? 'رسالة' : 'messages'}
                                        </span>
                                        {c.last_message_at && (
                                            <span className="text-[11px] font-bold text-gray-400">
                                                {new Date(c.last_message_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                                            </span>
                                        )}
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {c.is_active ? (isAr ? 'نشطة' : 'Active') : (isAr ? 'مغلقة' : 'Closed')}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button variant="outline" size="sm" onClick={() => openConvo(c)} className="rounded-xl border-gray-200 hover:bg-gray-100 h-9 px-4 font-bold text-xs gap-2">
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        {isAr ? 'عرض' : 'View'}
                                    </Button>
                                    <Button
                                        variant="ghost" size="sm"
                                        onClick={() => toggleActive(c.id, c.is_active)}
                                        className={`rounded-xl h-9 w-9 p-0 ${c.is_active ? 'hover:bg-red-50 hover:text-red-500' : 'hover:bg-emerald-50 hover:text-emerald-500'}`}
                                        title={c.is_active ? (isAr ? 'إغلاق المحادثة' : 'Close Conversation') : (isAr ? 'فتح المحادثة' : 'Open Conversation')}
                                    >
                                        {c.is_active
                                            ? <XCircle className="w-4 h-4" />
                                            : <CheckCircle className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-5 border-t border-gray-50 bg-gray-50/10">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-xl font-bold">{t.previous}</Button>
                        <span className="text-sm font-bold text-gray-500">{isAr ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}</span>
                        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-xl font-bold">{t.next}</Button>
                    </div>
                )}
            </div>

            <Dialog open={!!selectedConvo} onOpenChange={() => setSelectedConvo(null)}>
                <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
                    <DialogHeader className="p-6 pb-4 border-b border-gray-100 bg-white">
                        <DialogTitle className="text-right text-gray-900 font-black text-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <span>{isAr ? 'تفاصيل المحادثة' : 'Conversation Details'}</span>
                            </div>
                            <span className="text-sm font-bold text-gray-400">{selectedConvo ? `${selectedConvo.student_name} ↔ ${selectedConvo.reader_name}` : ''}</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 text-right bg-gray-50/50">
                        {loadingMessages ? (
                            <div className="flex flex-col items-center justify-center p-12 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" />
                                <p className="text-gray-400 font-bold text-sm tracking-wide">{t.loading}</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <p className="text-center text-gray-400 font-bold text-sm py-12">{isAr ? 'لا توجد رسائل' : 'No messages'}</p>
                        ) : (
                            messages.map(m => (
                                <div key={m.id} className={`flex gap-3 ${m.sender_role === 'reader' ? '' : 'flex-row-reverse'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 shadow-sm border ${m.sender_role === 'reader' ? 'bg-white text-emerald-700 border-emerald-100' : 'bg-white text-blue-700 border-blue-100'}`}>
                                        {m.sender_name?.[0] || '?'}
                                    </div>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${m.sender_role === 'reader'
                                        ? 'bg-white border border-emerald-50 text-emerald-900 rounded-tr-none'
                                        : 'bg-white border border-blue-50 text-blue-900 rounded-tl-none'}`}>
                                        <div className="flex items-center justify-between gap-4 mb-1.5">
                                            <span className={`text-[11px] font-black uppercase tracking-wider ${m.sender_role === 'reader' ? 'text-emerald-500' : 'text-blue-500'}`}>
                                                {m.sender_name} · {m.sender_role === 'reader' ? (isAr ? 'مقرئ' : 'Reader') : (isAr ? 'طالب' : 'Student')}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-300">
                                                {new Date(m.created_at).toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="leading-relaxed font-medium">{m.message_text}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function DirectChatTab({ isAr, t }: { isAr: boolean, t: any }) {
    const searchParams = useSearchParams()
    const initialUserId = searchParams.get("userId")
    const initialUserRole = searchParams.get("userRole")

    const [conversations, setConversations] = useState<Conversation[]>([])
    const [activeConv, setActiveConv] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [text, setText] = useState("")
    const [sending, setSending] = useState(false)
    const [loading, setLoading] = useState(true)
    const [loadingMsgs, setLoadingMsgs] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const pollRef = useRef<NodeJS.Timeout | null>(null)
    const didInit = useRef(false)

    const openConversation = useCallback(async (conv: Conversation) => {
        setActiveConv(conv)
        setLoadingMsgs(true)
        if (pollRef.current) clearInterval(pollRef.current)
        try {
            const res = await fetch(`/api/conversations/${conv.id}/messages`)
            const d = await res.json()
            setMessages(d.messages || [])
        } finally { setLoadingMsgs(false) }
        pollRef.current = setInterval(async () => {
            const res = await fetch(`/api/conversations/${conv.id}/messages`)
            const d = await res.json()
            setMessages(d.messages || [])
        }, 5000)
    }, [])

    useEffect(() => {
        fetch("/api/auth/me").then(r => r.json()).then(d => setCurrentUserId(d.user?.id || null))
    }, [])

    useEffect(() => {
        let firstRun = true
        async function fetchConvs() {
            if (firstRun) setLoading(true)
            try {
                const res = await fetch("/api/conversations")
                const d = await res.json()
                const convs: Conversation[] = d.conversations || []
                setConversations(convs)

                if (!didInit.current && initialUserId && initialUserRole) {
                    didInit.current = true
                    const existing = convs.find(c =>
                        (initialUserRole === "student" && c.student_id === initialUserId) ||
                        (initialUserRole === "reader" && c.reader_id === initialUserId)
                    )
                    if (existing) {
                        openConversation(existing)
                    } else {
                        const cr = await fetch("/api/conversations", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId: initialUserId, userRole: initialUserRole }),
                        })
                        if (cr.ok) {
                            const cd = await cr.json()
                            const newConvRes = await fetch("/api/conversations")
                            const allConvs = (await newConvRes.json()).conversations || []
                            setConversations(allConvs)
                            const newConv = allConvs.find((c: Conversation) => c.id === cd.conversation.id)
                            if (newConv) openConversation(newConv)
                        }
                    }
                } else if (!didInit.current && convs.length > 0) {
                    didInit.current = true
                    // Removed auto-open behavior
                }
            } finally {
                if (firstRun) setLoading(false)
                firstRun = false
            }
        }
        fetchConvs()
        const interval = setInterval(fetchConvs, 5000)
        return () => clearInterval(interval)
    }, [initialUserId, initialUserRole, openConversation])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

    const sendMessage = async () => {
        if (!text.trim() || !activeConv) return
        setSending(true)
        const optimistic: Message = {
            id: `tmp-${Date.now()}`,
            message_text: text,
            sender_id: currentUserId || "",
            sender_name: isAr ? "أنت" : "You",
            sender_role: "admin",
            sender_avatar: null,
            created_at: new Date().toISOString(),
        }
        setMessages(p => [...p, optimistic])
        setText("")
        try {
            await fetch(`/api/conversations/${activeConv.id}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: optimistic.message_text }),
            })
            const res = await fetch(`/api/conversations/${activeConv.id}/messages`)
            const d = await res.json()
            setMessages(d.messages || [])
        } finally { setSending(false) }
    }

    const getOtherPartyName = (c: Conversation) => c.student_name || c.reader_name || (isAr ? "مستخدم" : "User")
    const getOtherPartyAvatar = (c: Conversation) => c.student_avatar || c.reader_avatar
    const getOtherPartyRole = (c: Conversation) => c.student_id ? (isAr ? "طالب" : "Student") : (isAr ? "مقرئ" : "Reader")

    if (loading) return (
        <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" />
        </div>
    )

    return (
        <div className="flex flex-col lg:flex-row-reverse gap-6 h-[650px]">
            {/* Sidebar */}
            <div className="w-full lg:w-72 shrink-0 bg-white border border-gray-100 rounded-3xl overflow-hidden flex flex-col shadow-sm">
                <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/30">
                    <p className="font-black text-sm text-gray-800 tracking-wide uppercase">
                        {t.admin.directChat} <span className="text-gray-400 font-bold ml-1">({conversations.length})</span>
                    </p>
                </div>
                <div className="overflow-y-auto flex-1">
                    {conversations.length === 0 ? (
                        <div className="p-10 text-center space-y-3">
                            <MessageSquare className="w-10 h-10 text-gray-200 mx-auto" />
                            <p className="text-xs font-bold text-gray-400 leading-relaxed">
                                {isAr ? "اذهب لصفحة المستخدم لبدء محادثة" : "Go to user profile to start chat"}
                            </p>
                        </div>
                    ) : (
                        conversations.map(c => {
                            const name = getOtherPartyName(c)
                            const avatar = getOtherPartyAvatar(c)
                            const role = getOtherPartyRole(c)
                            const isActive = activeConv?.id === c.id
                            return (
                                <button
                                    key={c.id}
                                    onClick={() => openConversation(c)}
                                    className={`w-full text-right px-5 py-4 border-b border-gray-50 transition-all hover:bg-gray-50 ${isActive ? "bg-emerald-50/50 border-r-4 border-r-[#0B3D2E]" : ""}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-sm font-black shadow-sm border transition-all ${isActive ? 'bg-[#0B3D2E] text-white border-transparent' : 'bg-white text-emerald-700 border-gray-100'}`}>
                                            {avatar ? (
                                                <img src={avatar} alt={name} className="w-full h-full rounded-2xl object-cover" />
                                            ) : (name[0] || "U")}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-black truncate mb-0.5 ${isActive ? 'text-[#0B3D2E]' : 'text-gray-900'}`}>{name}</p>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{role}</p>
                                            {c.last_message_preview && (
                                                <p className="text-[11px] text-gray-400 truncate mt-1 opacity-80">{c.last_message_preview}</p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-white border border-gray-100 rounded-3xl overflow-hidden flex flex-col shadow-sm">
                {!activeConv ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-4">
                        <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner">
                            <MessageSquare className="w-10 h-10 opacity-30" />
                        </div>
                        <p className="text-sm font-black tracking-widest uppercase">{isAr ? "اختر محادثة للبدء" : "Select a conversation to start"}</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-4 bg-gray-50/20">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-sm font-black shadow-sm border border-emerald-100">
                                {getOtherPartyAvatar(activeConv) ? (
                                    <img src={getOtherPartyAvatar(activeConv)!} alt="" className="w-full h-full rounded-xl object-cover" />
                                ) : (getOtherPartyName(activeConv)[0])}
                            </div>
                            <div className="text-right">
                                <p className="font-black text-gray-900 text-sm leading-tight">{getOtherPartyName(activeConv)}</p>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">{getOtherPartyRole(activeConv)}</p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
                            {loadingMsgs ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" />
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.loading}</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-300 py-10 gap-3">
                                    <MessageSquare className="w-12 h-12 opacity-20" />
                                    <p className="text-xs font-black uppercase tracking-widest">{isAr ? "ابدأ المحادثة..." : "Start the conversation..."}</p>
                                </div>
                            ) : (
                                messages.map(m => {
                                    const isMe = m.sender_id === currentUserId
                                    return (
                                        <div key={m.id} className={`flex ${isMe ? "justify-start" : "justify-end"}`}>
                                            <div className={`max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm transition-all ${isMe
                                                ? "bg-[#0B3D2E] text-white rounded-tl-none border-none"
                                                : "bg-white border border-gray-100 text-gray-800 rounded-tr-none"
                                                }`}>
                                                {!isMe && <p className="text-[10px] font-black mb-1.5 text-emerald-600 uppercase tracking-wider">{m.sender_name}</p>}
                                                <p className="leading-relaxed font-medium text-sm">{m.message_text}</p>
                                                <p className={`text-[10px] mt-2 font-bold ${isMe ? "text-emerald-100/50" : "text-gray-300"}`}>
                                                    {new Date(m.created_at).toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input */}
                        <div className="border-t border-gray-50 px-6 py-4 flex flex-row-reverse gap-3 bg-white">
                            <button
                                onClick={sendMessage}
                                disabled={!text.trim() || sending}
                                className="h-12 px-6 bg-[#0B3D2E] text-white rounded-2xl font-black text-sm hover:bg-[#0A3527] disabled:opacity-50 transition-all shadow-lg shadow-emerald-900/10 flex items-center justify-center shrink-0"
                            >
                                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                            <input
                                type="text"
                                value={text}
                                onChange={e => setText(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && sendMessage()}
                                placeholder={isAr ? "اكتب رسالتك..." : "Type your message..."}
                                className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-right text-sm font-bold text-gray-700 focus:ring-4 focus:ring-[#0B3D2E]/5 focus:border-[#0B3D2E]/20 focus:bg-white outline-none placeholder:text-gray-300 transition-all"
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

function AdminConversationsContent() {
    const { t, locale } = useI18n()
    const isAr = locale === 'ar'
    const searchParams = useSearchParams()
    const router = useRouter()

    const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "chat")

    useEffect(() => {
        const tab = searchParams.get("tab")
        if (tab && tab !== activeTab) {
            setActiveTab(tab)
        }
    }, [searchParams, activeTab])

    const handleTabChange = (val: string) => {
        setActiveTab(val)
        const params = new URLSearchParams(searchParams.toString())
        params.set("tab", val)
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                        {t.admin.conversations}
                    </h1>
                    <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">
                        {activeTab === "supervision"
                            ? (isAr ? 'مركز الإشراف والرقابة' : 'Monitoring & Supervision Hub')
                            : (isAr ? 'التواصل المباشر مع المستخدمين' : 'Direct User Support')}
                    </p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="bg-white p-1.5 rounded-2xl mb-8 flex-wrap justify-start gap-2 border border-gray-100 shadow-sm inline-flex">
                    <TabsTrigger value="chat" className="rounded-xl font-black gap-2 px-6 py-3 data-[state=active]:bg-[#0B3D2E] data-[state=active]:text-white transition-all">
                        <MessageSquare className="w-4 h-4" />
                        {t.admin.directChat}
                    </TabsTrigger>
                    <TabsTrigger value="supervision" className="rounded-xl font-black gap-2 px-6 py-3 data-[state=active]:bg-[#0B3D2E] data-[state=active]:text-white transition-all">
                        <Shield className="w-4 h-4" />
                        {t.admin.supervision}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="supervision" className="space-y-6">
                    <SupervisionTab isAr={isAr} t={t} />
                </TabsContent>

                <TabsContent value="chat" className="space-y-6">
                    <DirectChatTab isAr={isAr} t={t} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default function AdminConversationsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[#0B3D2E]" /></div>}>
            <AdminConversationsContent />
        </Suspense>
    )
}
