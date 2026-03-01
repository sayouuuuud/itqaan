"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
    Bell, CheckCheck, Mic, Calendar, Award, MessageSquare,
    UserCheck, UserX, Loader2, BookOpen, ChevronRight
} from "lucide-react"

type Notification = {
    id: string
    type: string
    title: string
    message: string
    category: string
    link: string | null
    is_read: boolean
    created_at: string
    related_recitation_id: string | null
    related_booking_id: string | null
}

const TYPE_ICON: Record<string, React.ElementType> = {
    recitation_received: Mic,
    recitation_reviewed: BookOpen,
    mastered: Award,
    needs_session: Calendar,
    session_booked: Calendar,
    session_reminder: Calendar,
    new_reader_application: UserCheck,
    reader_approved: UserCheck,
    reader_rejected: UserX,
    new_recitation_admin: Mic,
    general: Bell,
}

const TYPE_COLOR: Record<string, string> = {
    mastered: "bg-emerald-50 text-emerald-600",
    needs_session: "bg-blue-50 text-blue-600",
    session_booked: "bg-purple-50 text-purple-600",
    session_reminder: "bg-amber-50 text-amber-600",
    recitation_received: "bg-[#0B3D2E]/8 text-[#0B3D2E]",
    recitation_reviewed: "bg-[#0B3D2E]/8 text-[#0B3D2E]",
    new_reader_application: "bg-blue-50 text-blue-600",
    reader_approved: "bg-emerald-50 text-emerald-600",
    reader_rejected: "bg-red-50 text-red-600",
    general: "bg-slate-50 text-slate-500",
}

function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    const m = Math.floor(diff / 60000)
    const h = Math.floor(diff / 3600000)
    const d = Math.floor(diff / 86400000)
    if (m < 1) return "الآن"
    if (m < 60) return `منذ ${m} دقيقة`
    if (h < 24) return `منذ ${h} ساعة`
    return `منذ ${d} يوم`
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [markingAll, setMarkingAll] = useState(false)

    const load = useCallback(async () => {
        const res = await fetch("/api/notifications")
        if (res.ok) {
            const d = await res.json()
            setNotifications(d.notifications || [])
        }
        setLoading(false)
    }, [])

    useEffect(() => { load() }, [load])

    const markAllRead = async () => {
        setMarkingAll(true)
        await fetch("/api/notifications", { method: "PATCH" })
        setNotifications(p => p.map(n => ({ ...n, is_read: true })))
        setMarkingAll(false)
    }

    const markOneRead = async (id: string) => {
        await fetch(`/api/notifications/${id}`, { method: "PATCH" })
        setNotifications(p => p.map(n => n.id === id ? { ...n, is_read: true } : n))
    }

    const unread = notifications.filter(n => !n.is_read).length

    if (loading) return (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" /></div>
    )

    return (
        <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">الإشعارات</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {unread > 0 ? `لديك ${unread} إشعار غير مقروء` : "جميع الإشعارات مقروءة"}
                    </p>
                </div>
                {unread > 0 && (
                    <button
                        onClick={markAllRead}
                        disabled={markingAll}
                        className="flex items-center gap-2 text-sm font-medium text-[#0B3D2E] border border-[#0B3D2E]/30 px-4 py-2 rounded-xl hover:bg-[#0B3D2E]/5 transition-colors disabled:opacity-50"
                    >
                        {markingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                        تعليم الكل كمقروء
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-7 h-7 text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-medium">لا توجد إشعارات</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map(n => {
                        const Icon = TYPE_ICON[n.type] || Bell
                        const iconClass = TYPE_COLOR[n.type] || "bg-slate-50 text-slate-500"
                        const isUnread = !n.is_read

                        const inner = (
                            <div
                                className={`flex items-start gap-4 bg-white border rounded-2xl p-4 shadow-sm transition-colors hover:border-[#0B3D2E]/20 cursor-pointer ${isUnread ? "border-[#0B3D2E]/20 bg-[#0B3D2E]/[0.02]" : "border-slate-200"}`}
                                onClick={() => { if (isUnread) markOneRead(n.id) }}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={`text-sm font-semibold ${isUnread ? "text-slate-800" : "text-slate-600"}`}>{n.title}</p>
                                        {isUnread && <div className="w-2 h-2 rounded-full bg-[#0B3D2E] shrink-0 mt-1.5" />}
                                    </div>
                                    <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                                    <p className="text-xs text-slate-400 mt-2">{timeAgo(n.created_at)}</p>
                                </div>
                                {n.link && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-1 rotate-180" />}
                            </div>
                        )

                        return n.link ? (
                            <Link key={n.id} href={n.link} onClick={() => { if (isUnread) markOneRead(n.id) }}>
                                {inner}
                            </Link>
                        ) : (
                            <div key={n.id}>{inner}</div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
