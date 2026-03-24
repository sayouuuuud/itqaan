"use client"

import { useState, useEffect, useCallback } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import {
    CalendarDays, Search, Filter, Link2, CheckCircle, XCircle,
    Clock, Users, Loader2, ExternalLink, Edit
} from "lucide-react"

const STATUS_OPTIONS = [
    { value: '', label: 'الكل', labelEn: 'All' },
    { value: 'pending', label: 'بانتظار التأكيد', labelEn: 'Pending' },
    { value: 'confirmed', label: 'مؤكد', labelEn: 'Confirmed' },
    { value: 'completed', label: 'مكتمل', labelEn: 'Completed' },
    { value: 'cancelled', label: 'ملغي', labelEn: 'Cancelled' },
    { value: 'no_show', label: 'لم يحضر', labelEn: 'No Show' },
]

const STATUS_COLOR: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    confirmed: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
    completed: 'bg-primary/10 text-primary border border-primary/20',
    cancelled: 'bg-destructive/10 text-destructive border border-destructive/20',
    no_show: 'bg-muted text-muted-foreground border border-border',
    rescheduled: 'bg-purple-500/10 text-purple-500 border border-purple-500/20',
}

export default function AdminBookingsPage() {
    const { t, locale } = useI18n()
    const isAr = locale === "ar"

    const [bookings, setBookings] = useState<any[]>([])
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)

    const [filterStatus, setFilterStatus] = useState('')
    const [filterDate, setFilterDate] = useState('')

    const [editBooking, setEditBooking] = useState<any>(null)
    const [editLink, setEditLink] = useState('')
    const [editStatus, setEditStatus] = useState('')
    const [editReaderId, setEditReaderId] = useState('')
    const [readerSearchQuery, setReaderSearchQuery] = useState('')
    const [availableReaders, setAvailableReaders] = useState<{ id: string; name: string; email: string }[]>([])
    const [saving, setSaving] = useState(false)

    const fetchBookings = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page: String(page) })
            if (filterStatus) params.set('status', filterStatus)
            if (filterDate) { params.set('dateFrom', filterDate); params.set('dateTo', filterDate) }
            const res = await fetch(`/api/admin/bookings?${params}`)
            if (res.ok) {
                const data = await res.json()
                setBookings(data.bookings)
                setTotal(data.total)
                setStats(data.stats)
            }
        } finally {
            setLoading(false)
        }
    }, [page, filterStatus, filterDate])

    useEffect(() => { fetchBookings() }, [fetchBookings])

    const openEdit = async (b: any) => {
        setEditBooking(b)
        setEditLink(b.meeting_link || '')
        setEditStatus(b.status)
        setEditReaderId('')
        setReaderSearchQuery('')
        try {
            const res = await fetch('/api/admin/bookings', { method: 'PUT' })
            if (res.ok) {
                const d = await res.json()
                setAvailableReaders(d.readers || [])
            }
        } catch { }
    }

    const handleSave = async () => {
        if (!editBooking) return
        setSaving(true)
        try {
            await fetch('/api/admin/bookings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editBooking.id,
                    status: editStatus,
                    meeting_link: editLink,
                    ...(editReaderId ? { reader_id: editReaderId } : {})
                }),
            })
            setEditBooking(null)
            fetchBookings()
        } finally {
            setSaving(false)
        }
    }

    const totalPages = Math.ceil(total / 20)

    return (
        <div className="space-y-8" dir={isAr ? "rtl" : "ltr"}>
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-foreground">{isAr ? 'الجلسات والحجوزات' : 'Sessions & Bookings'}</h1>
                <p className="text-muted-foreground font-bold mt-1 tracking-wide">{isAr ? 'إدارة ومتابعة جميع الجلسات المحجوزة' : 'Manage and track all booked sessions'}</p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                        { label: isAr ? 'اليوم' : 'Today', value: stats.today, color: 'bg-blue-500/10 text-blue-400', icon: CalendarDays },
                        { label: isAr ? 'بانتظار التأكيد' : 'Pending', value: stats.pending, color: 'bg-orange-500/10 text-orange-400', icon: Clock },
                        { label: isAr ? 'مؤكدة' : 'Confirmed', value: stats.confirmed, color: 'bg-emerald-500/10 text-emerald-400', icon: CheckCircle },
                        { label: isAr ? 'مكتملة' : 'Completed', value: stats.completed, color: 'bg-purple-500/10 text-purple-400', icon: Users },
                        { label: isAr ? 'ملغية' : 'Cancelled', value: stats.cancelled, color: 'bg-red-500/10 text-red-500', icon: XCircle },
                    ].map(s => (
                        <div key={s.label} className="bg-card border border-border rounded-3xl p-5 shadow-sm transition-all hover:border-primary/20">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{s.label}</p>
                                    <p className="text-3xl font-black text-foreground mt-1">{s.value ?? 0}</p>
                                </div>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color} border border-current/10 shadow-sm`}>
                                    <s.icon className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
                {[
                    { key: '', label: t.admin.allSessions },
                    { key: 'upcoming', label: t.admin.upcoming },
                    { key: 'today', label: t.admin.today },
                    { key: 'completed', label: t.admin.completed },
                ].map((btn) => (
                    <button
                        key={btn.key}
                        onClick={() => {
                            setFilterStatus(btn.key)
                            setPage(1)
                        }}
                        className={`flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-black transition-all border ${filterStatus === btn.key
                            ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted"
                            }`}
                    >
                        {btn.label}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between">
                    <h3 className="font-bold text-foreground">
                        {isAr ? 'قائمة الحجوزات' : 'Bookings List'}
                        <span className="text-muted-foreground font-normal text-sm mr-2">({total} {isAr ? 'إجمالي' : 'total'})</span>
                    </h3>
                </div>

                {loading ? (
                    <div className="flex justify-center p-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
                ) : bookings.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground font-medium">{isAr ? 'لا توجد حجوزات تطابق الفلاتر' : 'No bookings match the filters'}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-muted-foreground bg-muted/50 text-[11px] font-black uppercase tracking-widest">
                                    <th className="text-right py-4 px-6 font-black whitespace-nowrap">{isAr ? 'الطالب' : 'Student'}</th>
                                    <th className="text-right py-4 px-6 font-black whitespace-nowrap">{isAr ? 'المقرئ' : 'Reader'}</th>
                                    <th className="text-right py-4 px-6 font-black whitespace-nowrap">{isAr ? 'التاريخ والوقت' : 'Date & Time'}</th>
                                    <th className="text-right py-4 px-6 font-black whitespace-nowrap">{isAr ? 'المدة' : 'Duration'}</th>
                                    <th className="text-right py-4 px-6 font-black whitespace-nowrap">{isAr ? 'الحالة' : 'Status'}</th>
                                    <th className="text-right py-4 px-6 font-black whitespace-nowrap">{isAr ? 'رابط الجلسة' : 'Session Link'}</th>
                                    <th className="text-center py-4 px-6 font-black whitespace-nowrap">{isAr ? 'إجراء' : 'Action'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border border-b border-border">
                                {bookings.map(b => (
                                    <tr key={b.id} className="hover:bg-muted/30 transition-colors whitespace-nowrap border-b border-border/50">
                                        <td className="py-4 px-6 font-bold text-foreground">{b.student_name}</td>
                                        <td className="py-4 px-6 text-muted-foreground font-medium">{b.reader_name}</td>
                                        <td className="py-4 px-6 text-muted-foreground text-xs font-bold">
                                            {new Date(b.scheduled_at).toLocaleString(isAr ? 'ar-SA' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}
                                        </td>
                                        <td className="py-4 px-6 text-muted-foreground font-bold">{b.duration_minutes} {isAr ? 'د' : 'min'}</td>
                                        <td className="py-4 px-6">
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider ${STATUS_COLOR[b.status] || 'bg-muted text-muted-foreground'}`}>
                                                {STATUS_OPTIONS.find(s => s.value === b.status)?.label || b.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            {b.meeting_link ? (
                                                <a href={b.meeting_link} target="_blank" rel="noreferrer"
                                                    className="text-primary text-xs font-black flex items-center gap-1.5 hover:underline">
                                                    <ExternalLink className="w-3.5 h-3.5" /> {isAr ? 'رابط' : 'Link'}
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <Button variant="ghost" size="sm" onClick={() => openEdit(b)} className="rounded-xl border border-border hover:bg-muted font-bold text-xs h-9">
                                                <Edit className="w-3.5 h-3.5 ml-1" />
                                                {isAr ? 'تعديل' : 'Edit'}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-5 border-t border-border bg-muted/10">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-xl font-bold">{t.previous}</Button>
                        <span className="text-sm font-bold text-muted-foreground">{isAr ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}</span>
                        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-xl font-bold">{t.next}</Button>
                    </div>
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editBooking} onOpenChange={() => setEditBooking(null)}>
                <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl bg-card">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-foreground">{isAr ? 'تعديل الحجز' : 'Edit Booking'}</DialogTitle>
                    </DialogHeader>
                    {editBooking && (
                        <div className="space-y-4 py-4">
                            <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
                                <p className="text-sm font-bold text-foreground flex items-center justify-between">
                                    <span className="text-muted-foreground">{isAr ? 'الطالب:' : 'Student:'}</span>
                                    {editBooking.student_name}
                                </p>
                                <p className="text-sm font-bold text-foreground flex items-center justify-between">
                                    <span className="text-muted-foreground">{isAr ? 'المقرئ:' : 'Reader:'}</span>
                                    {editBooking.reader_name}
                                </p>
                                <p className="text-sm font-bold text-foreground flex items-center justify-between">
                                    <span className="text-muted-foreground">{isAr ? 'الوقت:' : 'Time:'}</span>
                                    {new Date(editBooking.scheduled_at).toLocaleString(isAr ? 'ar-SA' : 'en-US')}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">{isAr ? 'الحالة' : 'Status'}</label>
                                <select
                                    className="w-full h-11 rounded-2xl border border-border bg-muted/30 px-4 text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/10 outline-none"
                                    value={editStatus}
                                    onChange={e => setEditStatus(e.target.value)}
                                >
                                    {STATUS_OPTIONS.filter(s => s.value).map(o => (
                                        <option key={o.value} value={o.value}>{isAr ? o.label : o.labelEn}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">{isAr ? 'تغيير المقرئ (اختياري)' : 'Change Reader (Optional)'}</label>
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                                        <Input
                                            className="h-9 rounded-xl bg-muted/20 border-border text-xs focus:bg-card pr-9"
                                            placeholder={isAr ? "بحث باسم المقرئ أو إيميله..." : "Search reader name or email..."}
                                            value={readerSearchQuery}
                                            onChange={e => setReaderSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <select
                                        className="w-full h-11 rounded-2xl border border-border bg-muted/30 px-4 text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/10 outline-none"
                                        value={editReaderId}
                                        onChange={e => setEditReaderId(e.target.value)}
                                    >
                                        <option value="">{isAr ? 'بدون تغيير (المقرئ الحالي)' : 'No change (keep current reader)'}</option>
                                        {availableReaders.filter(r => 
                                            !readerSearchQuery || 
                                            r.name.toLowerCase().includes(readerSearchQuery.toLowerCase()) || 
                                            (r.email && r.email.toLowerCase().includes(readerSearchQuery.toLowerCase())) ||
                                            r.id.toLowerCase().includes(readerSearchQuery.toLowerCase())
                                        ).map(r => (
                                            <option key={r.id} value={r.id}>{r.name} {r.email ? `(${r.email})` : ''}</option>
                                        ))}
                                    </select>
                                </div>
                                {editReaderId && (
                                    <p className="text-[10px] font-bold text-orange-400 mt-1">⚠️ {isAr ? 'سيتم إشعار الطالب والمقرئ الجديد عند الحفظ.' : 'Student and new reader will be notified.'}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">{isAr ? 'رابط الجلسة' : 'Session Link'}</label>
                                <div className="flex gap-2">
                                    <Input
                                        className="rounded-2xl h-11 bg-muted/30 border-border focus:bg-card font-medium"
                                        value={editLink}
                                        onChange={e => setEditLink(e.target.value)}
                                        placeholder="https://zoom.us/j/..."
                                        dir="ltr"
                                    />
                                    {editLink && (
                                        <a href={editLink} target="_blank" rel="noreferrer"
                                            className="h-11 w-11 flex items-center justify-center rounded-2xl border border-border bg-muted/30 text-primary hover:bg-muted transition-all shrink-0">
                                            <ExternalLink className="w-5 h-5" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setEditBooking(null)} className="rounded-2xl font-black">{isAr ? 'إلغاء' : 'Cancel'}</Button>
                        <Button onClick={handleSave} className="rounded-2xl font-black bg-primary text-primary-foreground hover:bg-primary/90" disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                            {isAr ? 'حفظ التغييرات' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
