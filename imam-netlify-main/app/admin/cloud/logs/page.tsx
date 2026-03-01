'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowLeft, Search, Trash2, Download, RefreshCw, FileText } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface LogEntry {
    id: string
    log_type: string
    resource_type: string | null
    resource_id: string | null
    bandwidth_consumed: number
    ip_address: string | null
    success: boolean
    error_message: string | null
    created_at: string
}

const LOG_TYPE_LABELS: Record<string, { label: string; color: string }> = {
    download: { label: 'تحميل', color: 'bg-blue-100 text-blue-800' },
    view: { label: 'قراءة', color: 'bg-green-100 text-green-800' },
    stream: { label: 'استماع', color: 'bg-purple-100 text-purple-800' },
    limit_exceeded: { label: 'تجاوز الحد', color: 'bg-red-100 text-red-800' },
    api_call: { label: 'API', color: 'bg-gray-100 text-gray-800' },
    error: { label: 'خطأ', color: 'bg-red-100 text-red-800' },
    rate_limit: { label: 'Rate Limit', color: 'bg-orange-100 text-orange-800' },
    setting_change: { label: 'تغيير إعداد', color: 'bg-yellow-100 text-yellow-800' }
}

function formatBytes(bytes: number): string {
    if (!bytes || isNaN(bytes)) return '-'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('ar-EG', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

export default function BandwidthLogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [successFilter, setSuccessFilter] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [page, setPage] = useState(0)
    const limit = 50

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.set('limit', limit.toString())
            params.set('offset', (page * limit).toString())

            if (typeFilter !== 'all') params.set('type', typeFilter)
            if (successFilter !== 'all') params.set('success', successFilter)

            const res = await fetch(`/api/bandwidth/logs?${params}`)
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setLogs(data.logs || [])
            setTotal(data.total || 0)
        } catch (error) {
            console.error(error)
            toast.error('فشل في تحميل السجلات')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [page, typeFilter, successFilter])

    const handleDeleteOld = async () => {
        if (!confirm('هل أنت متأكد من حذف السجلات القديمة (أكثر من 90 يوم)؟')) return

        try {
            const res = await fetch('/api/bandwidth/logs?days=90', { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete')
            const data = await res.json()
            toast.success(`تم حذف ${data.deletedCount} سجل`)
            fetchLogs()
        } catch (error) {
            toast.error('فشل في حذف السجلات')
        }
    }

    const handleExport = () => {
        window.open('/api/bandwidth/export?format=excel&period=month', '_blank')
    }

    const filteredLogs = logs.filter(log => {
        if (!searchQuery) return true
        const search = searchQuery.toLowerCase()
        return (
            log.ip_address?.toLowerCase().includes(search) ||
            log.error_message?.toLowerCase().includes(search) ||
            log.resource_id?.toLowerCase().includes(search)
        )
    })

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/bandwidth">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <FileText className="h-8 w-8 text-primary" />
                            سجلات الباندويدث
                        </h1>
                        <p className="text-muted-foreground">إجمالي: {total} سجل</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchLogs} size="icon">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="h-4 w-4 ml-2" />
                        تصدير
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteOld}>
                        <Trash2 className="h-4 w-4 ml-2" />
                        حذف القديم
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="بحث بـ IP أو رسالة الخطأ..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pr-10"
                                />
                            </div>
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="نوع العملية" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">جميع الأنواع</SelectItem>
                                <SelectItem value="download">تحميل</SelectItem>
                                <SelectItem value="view">قراءة</SelectItem>
                                <SelectItem value="stream">استماع</SelectItem>
                                <SelectItem value="limit_exceeded">تجاوز الحد</SelectItem>
                                <SelectItem value="error">أخطاء</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={successFilter} onValueChange={setSuccessFilter}>
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="النتيجة" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">الكل</SelectItem>
                                <SelectItem value="true">ناجح</SelectItem>
                                <SelectItem value="false">فشل</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">لا توجد سجلات</p>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-right">الوقت</TableHead>
                                        <TableHead className="text-right">النوع</TableHead>
                                        <TableHead className="text-right">المصدر</TableHead>
                                        <TableHead className="text-center">النتيجة</TableHead>
                                        <TableHead className="text-center">الباندويدث</TableHead>
                                        <TableHead className="text-right">IP</TableHead>
                                        <TableHead className="text-right">التفاصيل</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLogs.map((log) => {
                                        const typeInfo = LOG_TYPE_LABELS[log.log_type] || { label: log.log_type, color: 'bg-gray-100' }
                                        return (
                                            <TableRow key={log.id}>
                                                <TableCell className="text-sm">{formatDate(log.created_at)}</TableCell>
                                                <TableCell>
                                                    <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {log.resource_type === 'book' ? '📚' : log.resource_type === 'audio' ? '🎵' : '⚙️'}
                                                    <span className="mr-1">{log.resource_type || '-'}</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {log.success ? (
                                                        <span className="text-green-600">✅</span>
                                                    ) : (
                                                        <span className="text-red-600">❌</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {formatBytes(log.bandwidth_consumed)}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {log.ip_address || '-'}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                                                    {log.error_message || '-'}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">
                                    عرض {page * limit + 1} - {Math.min((page + 1) * limit, total)} من {total}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page === 0}
                                        onClick={() => setPage(p => p - 1)}
                                    >
                                        السابق
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={(page + 1) * limit >= total}
                                        onClick={() => setPage(p => p + 1)}
                                    >
                                        التالي
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
