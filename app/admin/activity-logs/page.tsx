"use client"

import { useState, useEffect, useCallback } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    ScrollText, Search, Filter, Download, CheckCircle, XCircle,
    Clock, Loader2, User, ChevronDown
} from "lucide-react"

const STATUS_COLOR: Record<string, string> = {
    success: 'text-emerald-600',
    failed: 'text-red-600',
    pending: 'text-amber-600',
}

export default function AdminActivityLogsPage() {
    const { t } = useI18n()

    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [availableActions, setAvailableActions] = useState<string[]>([])

    const [search, setSearch] = useState('')
    const [filterAction, setFilterAction] = useState('')
    const [filterDateFrom, setFilterDateFrom] = useState('')
    const [filterDateTo, setFilterDateTo] = useState('')

    const fetchLogs = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page: String(page) })
            if (search) params.set('search', search)
            if (filterAction) params.set('action', filterAction)
            if (filterDateFrom) params.set('dateFrom', filterDateFrom)
            if (filterDateTo) params.set('dateTo', filterDateTo)
            const res = await fetch(`/api/admin/activity-logs?${params}`)
            if (res.ok) {
                const data = await res.json()
                setLogs(data.logs || [])
                setTotal(data.total || 0)
                if (data.actions?.length) setAvailableActions(data.actions)
            }
        } finally {
            setLoading(false)
        }
    }, [page, search, filterAction, filterDateFrom, filterDateTo])

    useEffect(() => {
        const timeout = setTimeout(fetchLogs, 300)
        return () => clearTimeout(timeout)
    }, [fetchLogs])

    const totalPages = Math.ceil(total / 50)

    const handleExport = () => {
        const csv = [
            ['التاريخ', 'المستخدم', 'الدور', 'الإجراء', 'النوع', 'الوصف', 'الحالة', 'IP'].join(','),
            ...logs.map(l => [
                new Date(l.created_at).toISOString(),
                l.user_name || 'النظام',
                l.user_role || '',
                l.action,
                l.entity_type || '',
                l.description || '',
                l.status,
                l.ip_address || '',
            ].join(','))
        ].join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-6" dir="rtl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ScrollText className="w-8 h-8 text-[#0B3D2E]" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">سجل الأنشطة</h1>
                        <p className="text-sm text-gray-500 mt-1">تتبع وتدقيق جميع الأنشطة في النظام</p>
                    </div>
                </div>
                <Button variant="outline" onClick={handleExport} className="border-gray-200 hover:bg-gray-50 font-bold gap-2 rounded-xl">
                    <Download className="w-4 h-4" /> تصدير CSV
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        className="pr-10 border-gray-100 focus:ring-[#0B3D2E]/20 rounded-xl bg-gray-50/30"
                        placeholder="بحث في الوصف أو المستخدم..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1) }}
                    />
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                    <select
                        className="h-10 rounded-xl border border-gray-100 bg-gray-50/50 px-3 text-sm min-w-[180px] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20"
                        value={filterAction}
                        onChange={e => { setFilterAction(e.target.value); setPage(1) }}
                    >
                        <option value="">جميع الإجراءات</option>
                        {availableActions.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <div className="flex items-center gap-2">
                        <Input type="date" className="w-40 h-10 border-gray-100 rounded-xl bg-gray-50/50" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
                        <span className="text-gray-400">إلى</span>
                        <Input type="date" className="w-40 h-10 border-gray-100 rounded-xl bg-gray-50/50" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
                    </div>
                    {(search || filterAction || filterDateFrom || filterDateTo) && (
                        <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFilterAction(''); setFilterDateFrom(''); setFilterDateTo(''); setPage(1) }} className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl">
                            مسح الفلاتر
                        </Button>
                    )}
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        السجل الحالي
                        <span className="text-gray-400 font-normal text-xs bg-gray-100 px-2 py-0.5 rounded-full">({total})</span>
                    </h3>
                </div>

                {loading ? (
                    <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" /></div>
                ) : logs.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                            <ScrollText className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">لا توجد أنشطة مسجلة تتوافق مع البحث</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-500 bg-gray-50/50">
                                    <th className="text-right py-4 px-5 font-bold">التاريخ</th>
                                    <th className="text-right py-4 px-5 font-bold">المستخدم</th>
                                    <th className="text-right py-4 px-5 font-bold">الإجراء</th>
                                    <th className="text-right py-4 px-5 font-bold">النوع</th>
                                    <th className="text-right py-4 px-5 font-bold">الوصف</th>
                                    <th className="text-right py-4 px-5 font-bold text-center">الحالة</th>
                                    <th className="text-right py-4 px-5 font-bold">IP</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(l => (
                                    <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-5 text-xs text-gray-500 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-700">
                                                    {new Date(l.created_at).toLocaleDateString('ar-SA')}
                                                </span>
                                                <span>
                                                    {new Date(l.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-[#0B3D2E] border border-gray-200">
                                                    {l.user_name?.[0] || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">{l.user_name || 'النظام'}</p>
                                                    {l.user_role && (
                                                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                                                            {l.user_role === 'admin' ? 'مدير' : l.user_role === 'reader' ? 'مقرئ' : 'طالب'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5">
                                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md font-mono border border-gray-200">
                                                {l.action}
                                            </span>
                                        </td>
                                        <td className="py-4 px-5 text-xs font-medium text-gray-600 capitalize">{l.entity_type || '—'}</td>
                                        <td className="py-4 px-5 text-xs text-gray-500 max-w-[250px] truncate" title={l.description}>{l.description || '—'}</td>
                                        <td className="py-4 px-5 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${l.status === 'success' ? 'bg-emerald-50 text-emerald-700' :
                                                    l.status === 'failed' ? 'bg-red-50 text-red-700' :
                                                        'bg-amber-50 text-amber-700'
                                                }`}>
                                                {l.status === 'success' ? 'ناجح' : l.status === 'failed' ? 'فاشل' : 'جاري'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-5 text-xs text-gray-400 font-mono">{l.ip_address || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-5 border-t border-gray-50 bg-gray-50/20">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-lg h-9 font-bold border-gray-200">
                            السابق
                        </Button>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-600">صفحة {page}</span>
                            <span className="text-gray-300">/</span>
                            <span className="text-sm text-gray-400">{totalPages}</span>
                        </div>
                        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg h-9 font-bold border-gray-200">
                            التالي
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
