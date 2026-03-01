"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
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
    new_message: MessageSquare,
    new_announcement: Bell,
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
    new_message: "bg-indigo-50 text-indigo-600",
    new_announcement: "bg-rose-50 text-rose-600",
    general: "bg-slate-50 text-slate-500",
}



export default function NotificationsPage() {
    const { t } = useI18n()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [markingAll, setMarkingAll] = useState(false)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)

    const load = useCallback(async (pageNum = 1) => {
        if (pageNum === 1) setLoading(true)
        else setLoadingMore(true)

        const res = await fetch(`/api/notifications?page=${pageNum}`)
        if (res.ok) {
            const d = await res.json()
            if (pageNum === 1) {
                setNotifications(d.notifications || [])
            } else {
                setNotifications(prev => {
                    // Prevent duplicates in case of double fetch
                    const existingIds = new Set(prev.map(n => n.id))
                    const newNotifs = (d.notifications || []).filter((n: Notification) => !existingIds.has(n.id))
                    return [...prev, ...newNotifs]
                })
            }
            setHasMore(d.hasMore || false)
            setUnreadCount(d.unreadCount || 0)
        }

        if (pageNum === 1) setLoading(false)
        else setLoadingMore(false)
    }, [])

    useEffect(() => {
        load(1)
        setPage(1)
    }, [load])

    const markAllRead = async () => {
        setMarkingAll(true)
        await fetch("/api/notifications", { method: "PATCH" })
        setNotifications(p => p.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
        setMarkingAll(false)
    }

    const markOneRead = async (id: string) => {
        const notif = notifications.find(n => n.id === id)
        if (!notif || notif.is_read) return

        await fetch(`/api/notifications/${id}`, { method: "PATCH" })
        setNotifications(p => p.map(n => n.id === id ? { ...n, is_read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
    }

    const getTimeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime()
        const m = Math.floor(diff / 60000)
        const h = Math.floor(diff / 3600000)
        const d = Math.floor(diff / 86400000)
        if (m < 1) return t.common.now
        if (m < 60) return `${t.common.minutesAgo} ${m}`
        if (h < 24) return `${t.common.hoursAgo} ${h}`
        return `${t.common.daysAgo} ${d}`
    }

    const unread = unreadCount

    if (loading) return (
        <div className="flex justify-center items-center min-h-[400px]">
            <div className="relative">
                <Loader2 className="w-10 h-10 animate-spin text-[#0B3D2E]" />
                <div className="absolute inset-0 bg-[#0B3D2E] opacity-20 blur-xl rounded-full" />
            </div>
        </div>
    )

    return (
        <div className="max-w-3xl mx-auto pb-12">
            {/* Premium Header Zone */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 border border-gray-100/60 rounded-3xl p-8 mb-8 shadow-sm">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#0B3D2E] opacity-[0.03] blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />

                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-[#0B3D2E]/5 rounded-2xl flex items-center justify-center border border-[#0B3D2E]/10">
                            <Bell className="w-7 h-7 text-[#0B3D2E]" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{t.notifications.title}</h1>
                            <p className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-2">
                                {unread > 0 ? (
                                    <>
                                        <span className="flex h-2 w-2 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        {t.notifications.unreadCount.replace('{unread}', unread.toString())}
                                    </>
                                ) : t.notifications.allRead}
                            </p>
                        </div>
                    </div>
                    {unread > 0 && (
                        <button
                            onClick={markAllRead}
                            disabled={markingAll}
                            className="group flex items-center gap-2 text-sm font-bold text-white bg-[#0B3D2E] px-6 py-3 rounded-xl hover:bg-[#0a3326] hover:shadow-lg hover:shadow-[#0B3D2E]/20 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:hover:transform-none disabled:hover:shadow-none"
                        >
                            {markingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4 transition-transform group-hover:scale-110" />}
                            {t.notifications.markAllRead}
                        </button>
                    )}
                </div>
            </div>

            {/* Notifications List */}
            {notifications.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center shadow-sm flex flex-col items-center justify-center min-h-[300px]">
                    <div className="w-24 h-24 bg-gradient-to-tr from-gray-50 to-gray-100 rounded-full flex items-center justify-center mb-6 border border-white shadow-inner relative overflow-hidden">
                        <Bell className="w-10 h-10 text-gray-300 relative z-10" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{t.notifications.noNotifications}</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">{t.notifications.noNotificationsDesc}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map(n => {
                        const Icon = TYPE_ICON[n.type] || Bell
                        const iconClass = TYPE_COLOR[n.type] || "bg-gray-50 text-gray-500 border-gray-100"
                        const isUnread = !n.is_read

                        const inner = (
                            <div
                                className={`group relative flex items-start gap-5 bg-white rounded-2xl p-5 transition-all duration-300 cursor-pointer overflow-hidden
                                    ${isUnread
                                        ? "border-transparent ring-1 ring-[#0B3D2E]/20 shadow-[0_4px_20px_-4px_rgba(11,61,46,0.08)] bg-gradient-to-l from-white to-[#0B3D2E]/[0.02]"
                                        : "border border-gray-100/80 shadow-sm hover:border-gray-200 hover:shadow-md hover:-translate-y-0.5 bg-white"
                                    }`}
                                onClick={() => { if (isUnread) markOneRead(n.id) }}
                            >
                                {/* Unread indicator stripe */}
                                {isUnread && (
                                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#0B3D2E] rounded-r-2xl" />
                                )}

                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-105 ${iconClass}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0 py-0.5">
                                    <div className="flex items-start justify-between gap-3">
                                        <h4 className={`text-base font-bold truncate leading-tight ${isUnread ? "text-gray-900" : "text-gray-700 hover:text-gray-900 transition-colors"}`}>
                                            {n.title}
                                        </h4>
                                        <span className="text-xs font-medium text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-1 rounded-lg border border-gray-100/50">
                                            {getTimeAgo(n.created_at)}
                                        </span>
                                    </div>
                                    <p className={`text-sm mt-1.5 leading-relaxed ${isUnread ? "text-gray-600 font-medium" : "text-gray-500"}`}>
                                        {n.message}
                                    </p>
                                </div>
                                {n.link && (
                                    <div className="shrink-0 self-center flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 text-gray-400 group-hover:bg-[#0B3D2E]/5 group-hover:text-[#0B3D2E] transition-colors border border-transparent group-hover:border-[#0B3D2E]/10">
                                        <ChevronRight className="w-4 h-4 rotate-180 transition-transform group-hover:-translate-x-0.5" />
                                    </div>
                                )}
                            </div>
                        )

                        return n.link ? (
                            <Link key={n.id} href={n.link} onClick={() => { if (isUnread) markOneRead(n.id) }} className="block outline-none focus-visible:ring-2 focus-visible:ring-[#0B3D2E]/50 rounded-2xl">
                                {inner}
                            </Link>
                        ) : (
                            <div key={n.id}>{inner}</div>
                        )
                    })}
                </div>
            )}

            {/* Load More Button */}
            {hasMore && (
                <div className="pt-8 pb-4 flex justify-center">
                    <button
                        onClick={() => {
                            const nextPage = page + 1
                            setPage(nextPage)
                            load(nextPage)
                        }}
                        disabled={loadingMore}
                        className="group relative flex items-center justify-center gap-2 text-sm font-bold text-[#0B3D2E] bg-white border-2 border-[#0B3D2E]/10 px-8 py-3.5 rounded-xl hover:border-[#0B3D2E]/30 hover:bg-[#0B3D2E]/[0.02] hover:shadow-sm transition-all active:scale-95 disabled:opacity-50 min-w-[160px]"
                    >
                        {loadingMore ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : null}
                        {loadingMore ? t.common.loading : t.notifications.showMore}
                    </button>
                </div>
            )}
        </div>
    )
}
