"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Loader2, Send, MessageSquare, User, BookOpen } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

type Conversation = {
    id: string
    reader_name: string
    reader_avatar: string | null
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
}
export default function StudentChatPage() {
    const { t, locale } = useI18n()
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


    useEffect(() => {
        fetch("/api/auth/me").then(r => r.json()).then(d => setCurrentUserId(d.user?.id || null))
        fetch("/api/conversations")
            .then(r => r.json())
            .then(d => {
                const convs = d.conversations || []
                setConversations(convs)
                if (convs.length > 0) openConversation(convs[0])
            })
            .finally(() => setLoading(false))
    }, [])

    const openConversation = useCallback(async (conv: Conversation) => {
        setActiveConv(conv)
        setLoadingMsgs(true)
        if (pollRef.current) clearInterval(pollRef.current)
        try {
            const res = await fetch(`/api/conversations/${conv.id}/messages`)
            const d = await res.json()
            setMessages(d.messages || [])
        } finally { setLoadingMsgs(false) }
        // Poll every 5 seconds
        pollRef.current = setInterval(async () => {
            const res = await fetch(`/api/conversations/${conv.id}/messages`)
            const d = await res.json()
            setMessages(d.messages || [])
        }, 5000)
    }, [])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

    const sendMessage = async () => {
        if (!text.trim() || !activeConv) return
        setSending(true)
        const optimisticMsg: Message = {
            id: `tmp-${Date.now()}`,
            message_text: text,
            sender_id: currentUserId || "",
            sender_name: t.student.you,
            sender_role: "student",
            sender_avatar: null,
            created_at: new Date().toISOString(),
        }
        setMessages(p => [...p, optimisticMsg])
        setText("")
        try {
            await fetch(`/api/conversations/${activeConv.id}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: optimisticMsg.message_text }),
            })
            const res = await fetch(`/api/conversations/${activeConv.id}/messages`)
            const d = await res.json()
            setMessages(d.messages || [])
        } finally { setSending(false) }
    }

    if (loading) return (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" /></div>
    )

    if (conversations.length === 0) return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">{t.student.messagesTitle}</h1>
            <p className="text-sm text-slate-500 mb-8">{t.student.chatAfterBookingSubtitle}</p>
            <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">{t.student.noConversationsYet}</p>
                <p className="text-slate-400 text-sm mt-1">{t.student.chatAfterBookingSubtitle}</p>
            </div>
        </div>
    )

    return (
        <div className="max-w-5xl">
            <h1 className="text-2xl font-bold text-slate-800 mb-1">{t.student.messagesTitle}</h1>
            <p className="text-sm text-slate-500 mb-5">{t.student.chatSubtitle}</p>

            <div className="flex gap-4 h-[600px]">
                {/* Conversations List */}
                <div className="w-64 shrink-0 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                    <div className="px-4 py-3 border-b border-slate-100">
                        <p className="font-bold text-sm text-slate-700">{t.student.conversationsHeader}</p>
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {conversations.map(c => (
                            <button
                                key={c.id}
                                onClick={() => openConversation(c)}
                                className={`w-full text-right px-4 py-3.5 border-b border-slate-50 transition-colors hover:bg-slate-50 ${activeConv?.id === c.id ? "bg-[#0B3D2E]/5 border-l-2 border-l-[#0B3D2E]" : ""}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-sm font-bold text-[#0B3D2E]">
                                        {c.reader_avatar ? (
                                            <img src={c.reader_avatar} alt={c.reader_name} className="w-full h-full rounded-full object-cover" />
                                        ) : (c.reader_name?.[0] || t.userFallbackLetter)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{c.reader_name}</p>
                                        {c.last_message_preview && (
                                            <p className="text-xs text-slate-400 truncate mt-0.5">{c.last_message_preview}</p>
                                        )}
                                    </div>
                                    {c.unread_count_student > 0 && (
                                        <span className="w-5 h-5 bg-[#D4A843] text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                                            {c.unread_count_student}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                    {/* Header */}
                    <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-[#0B3D2E]">
                            {activeConv?.reader_name?.[0] || t.userFallbackLetter}
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-sm">{activeConv?.reader_name || t.student.certifiedReaderFallback}</p>
                            <p className="text-xs text-slate-400">{t.student.certifiedReaderFallback}</p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                        {loadingMsgs ? (
                            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#0B3D2E]" /></div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-10">
                                <BookOpen className="w-10 h-10 mb-3 opacity-30" />
                                <p className="text-sm">{t.student.startConversationMsg}</p>
                            </div>
                        ) : (
                            messages.map(m => {
                                const isMe = m.sender_id === currentUserId
                                return (
                                    <div key={m.id} className={`flex ${isMe ? "justify-start" : "justify-end"}`}>
                                        <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${isMe
                                            ? "bg-[#0B3D2E] text-white rounded-br-md"
                                            : "bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm"
                                            }`}>
                                            {!isMe && <p className="text-[10px] font-bold mb-1 text-[#D4A843]">{m.sender_name}</p>}
                                            <p className="leading-relaxed">{m.message_text}</p>
                                            <p className={`text-[10px] mt-1.5 ${isMe ? "text-white/60" : "text-slate-400"}`}>
                                                {new Date(m.created_at).toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="border-t border-slate-100 px-4 py-3 flex gap-3">
                        <button
                            onClick={sendMessage}
                            disabled={!text.trim() || sending}
                            className="px-5 py-2.5 bg-[#0B3D2E] text-white rounded-xl font-medium hover:bg-[#0A3528] disabled:opacity-50 transition-colors shrink-0"
                        >
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                        <input
                            type="text"
                            value={text}
                            onChange={e => setText(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && sendMessage()}
                            placeholder={t.student.writeMessagePlaceholder}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-right text-slate-700 focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E] placeholder:text-slate-400"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
