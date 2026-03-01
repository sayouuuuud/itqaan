"use client"

import { useState, useEffect, useCallback } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import {
    MessagesSquare, Search, MessageCircle, ChevronLeft,
    CheckCircle, XCircle, Loader2, User, BookOpen
} from "lucide-react"

export default function AdminConversationsPage() {
    const { t, locale } = useI18n()
    const isAr = locale === 'ar'

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
            <div>
                <h1 className="text-2xl font-bold text-foreground">{isAr ? 'المحادثات' : 'Conversations'}</h1>
                <p className="text-sm text-muted-foreground mt-1">{isAr ? 'الإشراف على محادثات الطلاب والمقرئين' : 'Supervise student and reader conversations'}</p>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    className="pr-10"
                    placeholder={isAr ? 'البحث باسم الطالب أو المقرئ...' : 'Search by student or reader name...'}
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1) }}
                />
            </div>

            {/* List */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border/50 bg-muted/30 flex items-center justify-between">
                    <h3 className="font-bold text-foreground">{isAr ? 'المحادثات' : 'Conversations'} <span className="text-muted-foreground font-normal text-sm">({total})</span></h3>
                </div>

                {loading ? (
                    <div className="flex justify-center p-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
                ) : conversations.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">{isAr ? 'لا توجد محادثات' : 'No conversations found'}</div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {conversations.map(c => (
                            <div key={c.id} className="flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                                    <MessagesSquare className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                                            <User className="w-3.5 h-3.5" /> {c.student_name}
                                        </span>
                                        <span className="text-muted-foreground text-xs">↔</span>
                                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <BookOpen className="w-3.5 h-3.5" /> {c.reader_name}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.last_message_preview || 'لا توجد رسائل بعد'}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[10px] text-muted-foreground">{c.message_count} {isAr ? 'رسالة' : 'messages'}</span>
                                        {c.last_message_at && (
                                            <span className="text-[10px] text-muted-foreground">
                                                {new Date(c.last_message_at).toLocaleDateString('ar-SA')}
                                            </span>
                                        )}
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {c.is_active ? (isAr ? 'نشطة' : 'Active') : (isAr ? 'مغلقة' : 'Closed')}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button variant="ghost" size="sm" onClick={() => openConvo(c)}>
                                        <MessageCircle className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost" size="sm"
                                        onClick={() => toggleActive(c.id, c.is_active)}
                                        title={c.is_active ? (isAr ? 'إغلاق المحادثة' : 'Close Conversation') : (isAr ? 'فتح المحادثة' : 'Open Conversation')}
                                    >
                                        {c.is_active
                                            ? <XCircle className="w-4 h-4 text-red-500" />
                                            : <CheckCircle className="w-4 h-4 text-emerald-500" />}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-border/50">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>{isAr ? 'السابق' : 'Previous'}</Button>
                        <span className="text-sm text-muted-foreground">{isAr ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}</span>
                        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>{isAr ? 'التالي' : 'Next'}</Button>
                    </div>
                )}
            </div>

            {/* Messages Dialog */}
            <Dialog open={!!selectedConvo} onOpenChange={() => setSelectedConvo(null)}>
                <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedConvo ? `${selectedConvo.student_name} ↔ ${selectedConvo.reader_name}` : ''}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto space-y-3 py-2 min-h-0">
                        {loadingMessages ? (
                            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                        ) : messages.length === 0 ? (
                            <p className="text-center text-muted-foreground text-sm py-8">{isAr ? 'لا توجد رسائل' : 'No messages'}</p>
                        ) : (
                            messages.map(m => (
                                <div key={m.id} className={`flex gap-2 ${m.sender_role === 'reader' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${m.sender_role === 'reader' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {m.sender_name?.[0] || '?'}
                                    </div>
                                    <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.sender_role === 'reader' ? 'bg-emerald-50 text-emerald-900 rounded-tl-none' : 'bg-blue-50 text-blue-900 rounded-tr-none'}`}>
                                        <p className="text-[10px] font-bold opacity-70 mb-1">{m.sender_name} · {m.sender_role === 'reader' ? (isAr ? 'مقرئ' : 'Reader') : (isAr ? 'طالب' : 'Student')}</p>
                                        <p>{m.message_text}</p>
                                        <p className="text-[10px] opacity-50 mt-1 text-left">{new Date(m.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</p>
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
