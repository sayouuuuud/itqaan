"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, Send, MessageSquare, User, Shield, Trash2, Edit2 } from "lucide-react"

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
    updated_at?: string
}

function AdminChatContent() {
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
    const [editingMessage, setEditingMessage] = useState<Message | null>(null)
    const [deletingConvId, setDeletingConvId] = useState<string | null>(null)
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
        async function init() {
            setLoading(true)
            const res = await fetch("/api/conversations")
            const d = await res.json()
            const convs: Conversation[] = d.conversations || []
            setConversations(convs)

            // If URL has a userId, create or open that conversation
            if (!didInit.current && initialUserId && initialUserRole) {
                didInit.current = true
                const existing = convs.find(c =>
                    (initialUserRole === "student" && c.student_id === initialUserId) ||
                    (initialUserRole === "reader" && c.reader_id === initialUserId)
                )
                if (existing) {
                    openConversation(existing)
                } else {
                    // Create new conversation with that user
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
                openConversation(convs[0])
            }
            setLoading(false)
        }
        init()
    }, [initialUserId, initialUserRole, openConversation])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

    const sendMessage = async () => {
        if (!text.trim() || !activeConv) return
        setSending(true)

        if (editingMessage) {
            const oldMsgId = editingMessage.id
            setMessages(p => p.map(m => m.id === oldMsgId ? { ...m, message_text: text, updated_at: new Date().toISOString() } : m))
            setEditingMessage(null)
            setText("")

            try {
                await fetch(`/api/conversations/${activeConv.id}/messages/${oldMsgId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message_text: text }),
                })
            } finally { setSending(false) }
            return
        }

        const optimistic: Message = {
            id: `tmp-${Date.now()}`,
            message_text: text,
            sender_id: currentUserId || "",
            sender_name: "أنت",
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

    const handleDeleteMessage = async (msgId: string) => {
        if (!activeConv || !confirm("هل أنت متأكد من حذف هذه الرسالة؟")) return
        setMessages(p => p.filter(m => m.id !== msgId))
        try {
            await fetch(`/api/conversations/${activeConv.id}/messages/${msgId}`, { method: "DELETE" })
        } catch { } // Optimistic
    }

    const handleDeleteConversation = async () => {
        if (!activeConv || !confirm("هل أنت متأكد من حذف هذه المحادثة نهائياً لكلا الطرفين؟")) return
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

    const getOtherPartyName = (c: Conversation) => c.student_name || c.reader_name || "مستخدم"
    const getOtherPartyAvatar = (c: Conversation) => c.student_avatar || c.reader_avatar
    const getOtherPartyRole = (c: Conversation) => c.student_id ? "طالب" : "مقرئ"

    if (loading) return (
        <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" />
        </div>
    )

    return (
        <div className="max-w-5xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="w-7 h-7 text-[#0B3D2E]" />
                    رسائل الإدارة
                </h1>
                <p className="text-sm text-gray-500 mt-1">تواصل مباشر مع الطلاب والمقرئين</p>
            </div>

            {conversations.length === 0 && !loading ? (
                <div className="bg-white border border-gray-100 rounded-2xl py-16 text-center shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">لا توجد محادثات بعد</p>
                    <p className="text-gray-400 text-sm mt-1">اذهب لصفحة تفاصيل أي مستخدم واضغط "مراسلة" لبدء محادثة</p>
                </div>
            ) : (
                <div className="flex gap-4 h-[620px]">
                    {/* Sidebar */}
                    <div className="w-64 shrink-0 bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                        <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                            <p className="font-bold text-sm text-gray-700">المحادثات ({conversations.length})</p>
                        </div>
                        <div className="overflow-y-auto flex-1">
                            {conversations.map(c => {
                                const name = getOtherPartyName(c)
                                const avatar = getOtherPartyAvatar(c)
                                const role = getOtherPartyRole(c)
                                return (
                                    <button
                                        key={c.id}
                                        onClick={() => openConversation(c)}
                                        className={`w-full text-right px-4 py-3.5 border-b border-gray-50 transition-colors hover:bg-gray-50 ${activeConv?.id === c.id ? "bg-[#0B3D2E]/5 border-r-2 border-r-[#0B3D2E]" : ""}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-sm font-bold text-[#0B3D2E]">
                                                {avatar ? (
                                                    <img src={avatar} alt={name} className="w-full h-full rounded-full object-cover" />
                                                ) : (name[0] || "م")}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-800 truncate">{name}</p>
                                                <p className="text-xs text-gray-400 truncate">{role}</p>
                                                {c.last_message_preview && (
                                                    <p className="text-xs text-gray-400 truncate mt-0.5">{c.last_message_preview}</p>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                        {!activeConv ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                                <p className="text-sm">اختر محادثة للبدء</p>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 bg-gray-50/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-[#0B3D2E]">
                                            {getOtherPartyAvatar(activeConv) ? (
                                                <img src={getOtherPartyAvatar(activeConv)!} alt="" className="w-full h-full rounded-full object-cover" />
                                            ) : (getOtherPartyName(activeConv)[0])}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{getOtherPartyName(activeConv)}</p>
                                            <p className="text-xs text-gray-400">{getOtherPartyRole(activeConv)}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleDeleteConversation}
                                        disabled={deletingConvId === activeConv.id}
                                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                        title="حذف المحادثة"
                                    >
                                        {deletingConvId === activeConv.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                    </button>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                                    {loadingMsgs ? (
                                        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#0B3D2E]" /></div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
                                            <User className="w-10 h-10 mb-3 opacity-30" />
                                            <p className="text-sm">ابدأ المحادثة...</p>
                                        </div>
                                    ) : (
                                        messages.map(m => {
                                            const isMe = m.sender_id === currentUserId
                                            return (
                                                <div key={m.id} className={`flex ${isMe ? "justify-start" : "justify-end"} group relative`}>
                                                    <div className="absolute -top-3 rtl:right-0 ltr:left-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden py-1 px-1 z-10">
                                                        {isMe && (
                                                            <button
                                                                onClick={() => {
                                                                    setEditingMessage(m)
                                                                    setText(m.message_text)
                                                                }}
                                                                className="p-1.5 text-gray-400 hover:text-[#0B3D2E] hover:bg-gray-50 rounded transition-colors"
                                                                title="تعديل"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteMessage(m.id)}
                                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-50 rounded transition-colors"
                                                            title="حذف"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${isMe
                                                        ? "bg-[#0B3D2E] text-white rounded-tl-sm"
                                                        : "bg-white border border-gray-100 text-gray-800 rounded-tr-sm shadow-sm"
                                                        }`}>
                                                        {!isMe && <p className="text-[10px] font-bold mb-1 text-[#D4A843]">{m.sender_name}</p>}
                                                        <p className="whitespace-pre-wrap leading-relaxed">{m.message_text}</p>
                                                        <div className={`text-[10px] mt-1.5 flex justify-between items-center ${isMe ? "text-white/60" : "text-gray-400"}`}>
                                                            <span>{new Date(m.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</span>
                                                            {m.updated_at && <span className="ml-2 rtl:mr-2 rtl:ml-0 opacity-70 italic">(مُعدلة)</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                    <div ref={bottomRef} />
                                </div>

                                {/* Input */}
                                <div className="border-t border-gray-100 px-4 py-3 flex flex-col gap-3 bg-white">
                                    {editingMessage && (
                                        <div className="flex items-center justify-between bg-amber-50 text-amber-800 px-3 py-2 rounded-lg text-xs border border-amber-200/50">
                                            <div className="flex items-center gap-2">
                                                <Edit2 className="w-3.5 h-3.5" />
                                                <span>جاري تعديل الرسالة...</span>
                                            </div>
                                            <button onClick={() => { setEditingMessage(null); setText("") }} className="hover:underline font-bold">
                                                إلغاء
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={sendMessage}
                                            disabled={!text.trim() || sending}
                                            className="px-5 py-2.5 bg-[#0B3D2E] text-white rounded-xl font-medium hover:bg-[#0A3528] disabled:opacity-50 transition-colors shrink-0"
                                        >
                                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 rtl:-scale-x-100" />}
                                        </button>
                                        <input
                                            type="text"
                                            value={text}
                                            onChange={e => setText(e.target.value)}
                                            onKeyDown={e => e.key === "Enter" && sendMessage()}
                                            placeholder="اكتب رسالتك..."
                                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm rtl:text-right text-gray-700 focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E] outline-none placeholder:text-gray-400"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default function AdminChatPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" /></div>}>
            <AdminChatContent />
        </Suspense>
    )
}
