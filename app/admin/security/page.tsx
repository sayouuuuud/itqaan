'use client'

import { useState, useEffect } from 'react'
import { Shield, Lock, Unlock, AlertTriangle, CheckCircle, User, Clock, Monitor, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/context'

export default function AdminSecurityPage() {
    const { t } = useI18n()
    const isAr = t.locale === 'ar'
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const load = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/security')
            if (res.ok) setData(await res.json())
        } finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const handleUnlock = async (userId: string, action: 'unlock' | 'lock') => {
        setActionLoading(userId)
        try {
            await fetch('/api/admin/security', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action })
            })
            await load()
        } finally { setActionLoading(null) }
    }

    if (loading) return (
        <div className="flex justify-center p-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" />
        </div>
    )

    const stats = data?.stats || {}

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-[#0B3D2E]" />
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{isAr ? 'الأمان والحماية' : 'Security Center'}</h1>
                    <p className="text-gray-500 text-sm">{isAr ? 'مراقبة وإدارة أمان الحسابات' : 'Monitor and manage account security'}</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: isAr ? 'تسجيل دخول اليوم' : 'Logins Today', value: stats.logins_today || 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: isAr ? 'فشل اليوم' : 'Failed Today', value: stats.failed_today || 0, color: 'text-red-500', bg: 'bg-red-50' },
                    { label: isAr ? 'فشل الأسبوع' : 'Failed (7d)', value: stats.failed_week || 0, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: isAr ? 'حسابات مقفلة' : 'Locked Accounts', value: stats.locked_accounts || 0, color: 'text-red-700', bg: 'bg-red-100/50' },
                    { label: isAr ? 'حسابات نشطة' : 'Active Accounts', value: stats.active_accounts || 0, color: 'text-[#0B3D2E]', bg: 'bg-emerald-50/50' },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} border border-gray-100/50 rounded-2xl p-5 text-center shadow-sm`}>
                        <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Locked Accounts */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <Lock className="w-5 h-5 text-red-500" />
                        <h2 className="font-bold text-gray-800">{isAr ? 'الحسابات المقفلة' : 'Locked Accounts'}</h2>
                    </div>
                    {(data?.lockedAccounts?.length || 0) > 0 && (
                        <span className="bg-red-50 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-black uppercase">
                            {data.lockedAccounts.length} {isAr ? 'حساب' : 'Accounts'}
                        </span>
                    )}
                </div>
                {!data?.lockedAccounts?.length ? (
                    <div className="px-6 py-16 text-center">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                        </div>
                        <p className="text-gray-500 font-medium">{isAr ? 'جميع الحسابات آمنة، لا توجد حسابات مقفلة حالياً' : 'All accounts are secure, no locked accounts currently'}</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
                            <tr>
                                {[isAr ? 'المستخدم' : 'User', isAr ? 'الدور' : 'Role', isAr ? 'تاريخ القفل' : 'Locked At', isAr ? 'المحاولات' : 'Attempts', isAr ? 'الإجراء' : 'Actions']
                                    .map(h => <th key={h} className="px-5 py-4 font-bold text-start">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {data.lockedAccounts.map((acc: any) => (
                                <tr key={acc.id} className="hover:bg-gray-50/30 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-red-600 border border-red-50">
                                                {acc.name?.[0] || <User className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{acc.name}</p>
                                                <p className="text-xs text-gray-400">{acc.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${acc.role === 'admin' ? 'bg-purple-50 text-purple-600' :
                                                acc.role === 'reader' ? 'bg-amber-50 text-amber-600' :
                                                    'bg-blue-50 text-blue-600'
                                            }`}>
                                            {acc.role === 'admin' ? (isAr ? 'مدير' : 'Admin') :
                                                acc.role === 'reader' ? (isAr ? 'مقرئ' : 'Reader') :
                                                    (isAr ? 'طالب' : 'Student')}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-xs text-gray-500">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(acc.locked_at).toLocaleString(isAr ? 'ar-SA' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100">{acc.failed_attempts}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleUnlock(acc.id, 'unlock')}
                                            disabled={!!actionLoading}
                                            className="border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-lg h-8 gap-1.5"
                                        >
                                            {actionLoading === acc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlock className="w-3.5 h-3.5" />}
                                            {isAr ? 'إلغاء القفل' : 'Unlock'}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Failed Login Attempts */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <h2 className="font-semibold text-gray-800">{isAr ? 'محاولات تسجيل الدخول الفاشلة' : 'Failed Login Attempts'}</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                {[isAr ? 'المستخدم' : 'User', isAr ? 'التفاصيل' : 'Details', isAr ? 'IP' : 'IP', isAr ? 'الوقت' : 'Time']
                                    .map(h => <th key={h} className="px-4 py-3 text-gray-600 font-medium text-start">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(data?.failedLogins || []).slice(0, 20).map((log: any) => (
                                <tr key={log.id} className="hover:bg-red-50/30">
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-gray-800">{log.user_name || '—'}</p>
                                        <p className="text-xs text-gray-400">{log.user_email || '—'}</p>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{log.description || '—'}</td>
                                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.ip_address || '—'}</td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(log.created_at).toLocaleString('ar-EG')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Successful Logins */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                    <User className="w-5 h-5 text-green-500" />
                    <h2 className="font-semibold text-gray-800">{isAr ? 'آخر عمليات تسجيل الدخول الناجحة' : 'Recent Successful Logins'}</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                {[isAr ? 'المستخدم' : 'User', isAr ? 'الدور' : 'Role', isAr ? 'IP' : 'IP', isAr ? 'الوقت' : 'Time']
                                    .map(h => <th key={h} className="px-4 py-3 text-gray-600 font-medium text-start">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(data?.recentLogins || []).map((log: any) => (
                                <tr key={log.id} className="hover:bg-green-50/30">
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-gray-800">{log.user_name || '—'}</p>
                                        <p className="text-xs text-gray-400">{log.user_email}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs ${log.user_role === 'admin' ? 'bg-purple-100 text-purple-700' : log.user_role === 'reader' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {log.user_role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{log.ip_address || '—'}</td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(log.created_at).toLocaleString('ar-EG')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
