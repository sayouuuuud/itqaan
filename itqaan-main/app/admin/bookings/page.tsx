"use client"

import { useState, useEffect, useCallback } from "react"
import { useI18n } from "@/lib/i18n/context"
import { StatusBadge } from "@/components/status-badge"
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
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
    no_show: 'bg-gray-100 text-gray-600',
    rescheduled: 'bg-purple-100 text-purple-700',
}

export default function AdminBookingsPage() {
    const { t } = useI18n()
    const isAr = t.locale === "ar"

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
    const [availableReaders, setAvailableReaders] = useState<{ id: string; name: string }[]>([])
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
        // Fetch available readers for dropdown
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{isAr ? 'الجلسات والحجوزات' : 'Sessions & Bookings'}</h1>
                    <p className="text-sm text-gray-500 mt-1">{isAr ? 'إدارة ومتابعة جميع الجلسات المحجوزة' : 'Manage and track all booked sessions'}</p>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                        { label: isAr ? 'اليوم' : 'Today', value: stats.today, color: 'bg-blue-50 text-blue-600', icon: CalendarDays },
                        { label: isAr ? 'بانتظار التأكيد' : 'Pending', value: stats.pending, color: 'bg-amber-50 text-amber-600', icon: Clock },
                        { label: isAr ? 'مؤكدة' : 'Confirmed', value: stats.confirmed, color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle },
                        { label: isAr ? 'مكتملة' : 'Completed', value: stats.completed, color: 'bg-purple-50 text-purple-600', icon: Users },
                        { label: isAr ? 'ملغية' : 'Cancelled', value: stats.cancelled, color: 'bg-red-50 text-red-600', icon: XCircle },
                    ].map(s => (
                        <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs text-gray-500">{s.label}</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{s.value ?? 0}</p>
                                </div>
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
                                    <s.icon className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                    <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                    <select
                        className="flex-1 h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900"
                        value={filterStatus}
                        onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
                    >
                        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{isAr ? o.label : o.labelEn}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Input
                        type="date"
                        className="h-10 w-44"
                        value={filterDate}
                        onChange={e => { setFilterDate(e.target.value); setPage(1) }}
                    />
                </div>
                {(filterStatus || filterDate) && (
                    <Button variant="ghost" size="sm" onClick={() => { setFilterStatus(''); setFilterDate(''); setPage(1) }}>
                        {isAr ? 'مسح الفلاتر' : 'Clear Filters'}
                    </Button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-900">
                        {isAr ? 'قائمة الحجوزات' : 'Bookings List'}
                        <span className="text-gray-400 font-normal text-sm mr-2">({total} {isAr ? 'إجمالي' : 'total'})</span>
                    </h3>
                </div>

                {loading ? (
                    <div className="flex justify-center p-16"><Loader2 className="w-7 h-7 animate-spin text-[#0B3D2E]" /></div>
                ) : bookings.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">{isAr ? 'لا توجد حجوزات تطابق الفلاتر' : 'No bookings match the filters'}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-500 bg-gray-50">
                                    <th className="text-right py-3 px-4 font-medium">الطالب</th>
                                    <th className="text-right py-3 px-4 font-medium">المقرئ</th>
                                    <th className="text-right py-3 px-4 font-medium">التاريخ والوقت</th>
                                    <th className="text-right py-3 px-4 font-medium">المدة</th>
                                    <th className="text-right py-3 px-4 font-medium">الحالة</th>
                                    <th className="text-right py-3 px-4 font-medium">رابط الجلسة</th>
                                    <th className="text-right py-3 px-4 font-medium"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map(b => (
                                    <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3 px-4 font-medium text-gray-900">{b.student_name}</td>
                                        <td className="py-3 px-4 text-gray-500">{b.reader_name}</td>
                                        <td className="py-3 px-4 text-gray-500 text-xs">
                                            {new Date(b.scheduled_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}
                                        </td>
                                        <td className="py-3 px-4 text-muted-foreground">{b.duration_minutes} د</td>
                                        <td className="py-3 px-4">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_COLOR[b.status] || 'bg-gray-100 text-gray-700'}`}>
                                                {STATUS_OPTIONS.find(s => s.value === b.status)?.label || b.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {b.meeting_link ? (
                                                <a href={b.meeting_link} target="_blank" rel="noreferrer"
                                                    className="text-primary text-xs flex items-center gap-1 hover:underline">
                                                    <ExternalLink className="w-3 h-3" /> رابط
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <Button variant="ghost" size="sm" onClick={() => openEdit(b)}>
                                                <Edit className="w-3.5 h-3.5" />
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
                    <div className="flex items-center justify-between p-4 border-t border-border/50">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>السابق</Button>
                        <span className="text-sm text-muted-foreground">صفحة {page} من {totalPages}</span>
                        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>التالي</Button>
                    </div>
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editBooking} onOpenChange={() => setEditBooking(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>تعديل الحجز</DialogTitle>
                    </DialogHeader>
                    {editBooking && (
                        <div className="space-y-4 py-2">
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p><span className="font-medium text-foreground">الطالب:</span> {editBooking.student_name}</p>
                                <p><span className="font-medium text-foreground">المقرئ:</span> {editBooking.reader_name}</p>
                                <p><span className="font-medium text-foreground">الوقت:</span> {new Date(editBooking.scheduled_at).toLocaleString('ar-SA')}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">الحالة</label>
                                <select
                                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
                                    value={editStatus}
                                    onChange={e => setEditStatus(e.target.value)}
                                >
                                    {STATUS_OPTIONS.filter(s => s.value).map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">تغيير المقرئ (اختياري)</label>
                                <select
                                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
                                    value={editReaderId}
                                    onChange={e => setEditReaderId(e.target.value)}
                                >
                                    <option value="">{isAr ? 'بدون تغيير (المقرئ الحالي)' : 'No change (keep current reader)'}</option>
                                    {availableReaders.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                                {editReaderId && (
                                    <p className="text-xs text-amber-600">⚠️ سيتم إشعار الطالب والمقرئ الجديد عند الحفظ.</p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    value={editLink}
                                    onChange={e => setEditLink(e.target.value)}
                                    placeholder="https://zoom.us/j/..."
                                    dir="ltr"
                                />
                                {editLink && (
                                    <a href={editLink} target="_blank" rel="noreferrer"
                                        className="h-10 w-10 flex items-center justify-center rounded-xl border border-border hover:bg-muted">
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditBooking(null)}>إلغاء</Button>
                        <Button onClick={handleSave} className="bg-[#0B3D2E] text-white" disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : null}
                            حفظ التغييرات
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
