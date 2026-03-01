'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Download, Users, Star, Mail, Award, Loader2, Medal, Clock, MapPin } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { useI18n } from '@/lib/i18n/context'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const STATUS_COLORS: Record<string, string> = { mastered: '#10b981', needs_session: '#D4A843', pending: '#f59e0b', in_review: '#3b82f6', rejected: '#ef4444', session_booked: '#8b5cf6' }
const STATUS_LABELS_AR: Record<string, string> = { mastered: 'متقن', needs_session: 'يحتاج جلسة', pending: 'قيد المراجعة', in_review: 'جاري المراجعة', rejected: 'مرفوض', session_booked: 'تم الحجز' }
const STATUS_LABELS_EN: Record<string, string> = { mastered: 'Mastered', needs_session: 'Needs Session', pending: 'Pending Review', in_review: 'In Review', rejected: 'Rejected', session_booked: 'Session Booked' }

export default function AdminReportsPage() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      const res = await fetch(`/api/admin/reports?${params}`)
      if (res.ok) setData(await res.json())
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const exportCSV = () => {
    if (!data) return
    const rows = [
      ['المقياس', 'القيمة'],
      ['إجمالي الطلاب', data.users?.total_students],
      ['إجمالي المقرئين', data.users?.total_readers],
      ['إجمالي التلاوات', data.recitations?.total],
      ['المتقنين', data.recitations?.mastered],
      ['يحتاج جلسة', data.recitations?.needs_session],
      ['قيد المراجعة', data.recitations?.pending],
      ['نسبة الإتقان', `${data.recitations?.mastery_rate}%`],
      ['إجمالي الجلسات', data.sessions?.total],
      ['جلسات مكتملة', data.sessions?.completed],
      ['جلسات ملغاة', data.sessions?.cancelled],
      ['الشهادات المُصدرة', data.certificates],
      ['الإيميلات المُرسلة', data.emailsSent],
    ]
    const csv = '\uFEFF' + rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reports-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" /></div>

  const recPieData = ['mastered', 'needs_session', 'pending', 'in_review', 'rejected', 'session_booked'].map(s => ({
    key: s,
    name: isAr ? (STATUS_LABELS_AR[s] || s) : (STATUS_LABELS_EN[s] || s),
    value: Number(data?.recitations?.[s] || 0),
    color: STATUS_COLORS[s],
  })).filter(d => d.value > 0)

  const totalPie = recPieData.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-[#0B3D2E]" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isAr ? 'التقارير والإحصائيات' : 'Reports & Statistics'}</h1>
            <p className="text-gray-500 text-sm">{isAr ? 'إحصائيات كاملة وتحليلات مفصلة عن أداء المنصة' : 'Full statistics and detailed analytics platform performance'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-gray-600">{isAr ? 'من' : 'From'}</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-gray-600">{isAr ? 'إلى' : 'To'}</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36 text-sm" />
          </div>
          <Button onClick={load} size="sm" className="bg-[#0B3D2E] text-white hover:bg-[#0B3D2E]/90">{isAr ? 'تطبيق' : 'Apply'}</Button>
          <Button onClick={exportCSV} size="sm" variant="outline" className="gap-1"><Download className="w-4 h-4" />CSV</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[
          { label: isAr ? 'إجمالي الطلاب' : 'Total Students', value: data?.users?.total_students || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: isAr ? 'إجمالي المقرئين' : 'Total Readers', value: data?.users?.total_readers || 0, icon: Medal, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: isAr ? 'إجمالي التلاوات' : 'Total Recitations', value: data?.recitations?.total || 0, icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: isAr ? 'المتقنون' : 'Mastered', value: data?.recitations?.mastered || 0, icon: Award, color: 'text-green-600', bg: 'bg-green-50' },
          { label: isAr ? 'نسبة الإتقان' : 'Mastery Rate', value: `${data?.recitations?.mastery_rate || 0}%`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: isAr ? 'إجمالي الجلسات' : 'Total Sessions', value: data?.sessions?.total || 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: isAr ? 'جلسات مكتملة' : 'Completed Sessions', value: data?.sessions?.completed || 0, icon: Clock, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: isAr ? 'يحتاج جلسة' : 'Needs Session', value: data?.recitations?.needs_session || 0, icon: Star, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: isAr ? 'الشهادات المُصدرة' : 'Certificates Issued', value: data?.certificates || 0, icon: Award, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: isAr ? 'إيميلات أُرسلت' : 'Emails Sent', value: data?.emailsSent || 0, icon: Mail, color: 'text-pink-600', bg: 'bg-pink-50' },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-2xl border border-transparent hover:border-gray-200 transition-all p-4 shadow-sm group`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bg.replace('bg-', 'bg-white/50')} group-hover:bg-white transition-colors`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{card.label}</p>
            </div>
            <p className={`text-2xl font-bold mt-3 ${card.color}`}>{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}</p>
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recitations Daily Trend */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-gray-800">{isAr ? 'نشاط التلاوات اليومي' : 'Daily Recitations Activity'}</h3>
              <p className="text-xs text-gray-500 mt-1">{isAr ? 'آخر 30 يومًا' : 'Last 30 days'}</p>
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.recitations?.daily || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" fill="#0B3D2E" radius={[4, 4, 0, 0]} name={isAr ? 'التلاوات' : 'Recitations'} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-800 mb-2">{isAr ? 'توزيع الحالات' : 'Status Distribution'}</h3>
            <p className="text-sm text-gray-500 mb-6">{isAr ? 'الإجمالي حسب الحالة' : 'Total by status'}</p>
          </div>

          <div className="flex items-center justify-center mb-6">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {recPieData.reduce((acc, d, i) => {
                  const pct = totalPie > 0 ? (d.value / totalPie) * 100 : 0
                  const offset = acc.offset
                  if (pct > 0) {
                    acc.elements.push(
                      <circle
                        key={d.key}
                        cx="18" cy="18" r="15.9"
                        fill="none"
                        stroke={d.color}
                        strokeWidth="3"
                        strokeDasharray={`${pct} ${100 - pct}`}
                        strokeDashoffset={`${-offset}`}
                        className="transition-all duration-700 ease-in-out"
                      />
                    )
                  }
                  acc.offset += pct
                  return acc
                }, { elements: [] as React.ReactNode[], offset: 0 }).elements}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-2xl font-bold text-gray-900">{totalPie}</span>
                  <span className="block text-xs text-gray-400 uppercase tracking-tighter">{isAr ? 'الإجمالي' : 'Total'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {recPieData.map((item) => (
              <div key={item.key} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-500">{item.name}</span>
                </div>
                <span className="font-medium text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recitations Monthly trend */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4">{isAr ? 'التوجه الشهري' : 'Monthly Trend'}</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.recitations?.byMonth || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="total" stroke="#0B3D2E" strokeWidth={2.5} dot={{ r: 4, fill: '#0B3D2E', strokeWidth: 2, stroke: '#fff' }} name={isAr ? 'الإجمالي' : 'Total'} />
                <Line type="monotone" dataKey="mastered" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} name={isAr ? 'متقن' : 'Mastered'} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Mastery % */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4">{isAr ? 'معدل الإتقان الأسبوعي' : 'Weekly Mastery Rate'}</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.masteryTrend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip formatter={(v: any) => [`${v}%`, isAr ? 'نسبة الإتقان' : 'Mastery Rate']} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Bar dataKey="mastery_rate" fill="#10b981" radius={[4, 4, 0, 0]} name={isAr ? 'نسبة الإتقان' : 'Mastery Rate'} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Demographics row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gender dist */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 text-sm">{isAr ? 'توزيع الجنس (الطلاب)' : 'Gender (Students)'}</h3>
          <div className="space-y-4">
            {(data?.users?.gender || []).map((g: any) => {
              const total = data.users.gender.reduce((s: number, x: any) => s + parseInt(x.count), 0)
              const pct = total > 0 ? (parseInt(g.count) / total) * 100 : 0
              return (
                <div key={g.gender} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-medium">{g.gender === 'male' ? (isAr ? 'ذكور' : 'Male') : g.gender === 'female' ? (isAr ? 'إناث' : 'Female') : (isAr ? 'غير محدد' : 'Unknown')}</span>
                    <span className="font-bold text-gray-900">{pct.toFixed(0)}% ({g.count})</span>
                  </div>
                  <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${g.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Session details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 text-sm">{isAr ? 'تفاصيل الجلسات' : 'Sessions Details'}</h3>
          <div className="space-y-3">
            {[
              { label: isAr ? 'مكتملة' : 'Completed', value: data?.sessions?.completed || 0, color: 'text-green-600', bg: 'bg-green-50' },
              { label: isAr ? 'ملغية' : 'Cancelled', value: data?.sessions?.cancelled || 0, color: 'text-red-600', bg: 'bg-red-50' },
              { label: isAr ? 'لم يحضر' : 'No Show', value: data?.sessions?.no_show || 0, color: 'text-gray-600', bg: 'bg-gray-100' },
              { label: isAr ? 'متوسط المدة' : 'Avg Duration', value: `${data?.sessions?.avg_duration || 0} ${isAr ? 'د' : 'min'}`, color: 'text-blue-600', bg: 'bg-blue-50' }
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between p-2 rounded-xl border border-gray-50">
                <span className="text-xs text-gray-500 font-medium">{s.label}</span>
                <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top cities */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 text-sm">{isAr ? 'أعلى المدن' : 'Top Cities'}</h3>
          <div className="space-y-2.5">
            {(data?.users?.byCity || []).slice(0, 5).map((c: any) => (
              <div key={c.city} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-700">{c.city}</span>
                </div>
                <span className="font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded-full">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Reviewers */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Medal className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-gray-800">{isAr ? 'أعلى المقرئين تصحيحًا' : 'Top Reviewers'}</h3>
          </div>
          <div className="space-y-4">
            {(data?.topReviewers || []).slice(0, 5).map((r: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</span>
                  <p className="text-sm text-gray-800 font-medium truncate max-w-[120px]">{r.name}</p>
                </div>
                <div className="text-end">
                  <p className="text-sm font-bold text-[#0B3D2E]">{r.reviews_count}</p>
                  <p className="text-[10px] text-green-600 uppercase font-bold tracking-tighter">{r.mastered_count} {isAr ? 'متقن' : 'Mastered'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Session Readers */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Medal className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-gray-800">{isAr ? 'أعلى المقرئين جلسات' : 'Top Session Readers'}</h3>
          </div>
          <div className="space-y-4">
            {(data?.topSessionReaders || []).slice(0, 5).map((r: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center ${i === 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</span>
                  <p className="text-sm text-gray-800 font-medium truncate max-w-[120px]">{r.name}</p>
                </div>
                <div className="text-end">
                  <p className="text-sm font-bold text-blue-600">{r.sessions_count}</p>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">✓ {r.completed_sessions} {isAr ? 'مكتملة' : 'done'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Active Students */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-purple-500" />
            <h3 className="font-bold text-gray-800">{isAr ? 'أكثر الطلاب مشاركة' : 'Most Active Students'}</h3>
          </div>
          <div className="space-y-4">
            {(data?.topStudents || []).slice(0, 5).map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center ${i === 0 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</span>
                  <div>
                    <p className="text-sm text-gray-800 font-medium truncate max-w-[110px]">{s.name}</p>
                    <p className="text-[10px] text-gray-400 truncate max-w-[110px]">{s.email}</p>
                  </div>
                </div>
                <div className="text-end">
                  <p className="text-xs text-gray-600 font-bold">{s.recitations} {isAr ? 'تلاوات' : 'recs'}</p>
                  <p className="text-[10px] text-gray-400">{s.bookings} {isAr ? 'جلسات' : 'sessions'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Contributors Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-gray-800">{isAr ? 'أكثر المقرئين مساهمة (إجمالي)' : 'Overall Top Contributors'}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 text-gray-400 text-[11px] uppercase tracking-widest font-bold">
                <th className="py-3 px-6 text-start">{isAr ? 'الترتيب' : 'Rank'}</th>
                <th className="py-3 px-6 text-start">{isAr ? 'المقرئ' : 'Reader'}</th>
                <th className="py-3 px-6 text-start">{isAr ? 'المراجعات' : 'Reviews'}</th>
                <th className="py-3 px-6 text-start">{isAr ? 'الجلسات' : 'Sessions'}</th>
                <th className="py-3 px-6 text-start">{isAr ? 'المجموع' : 'Total'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.topContributors || []).slice(0, 10).map((r: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <span className={`w-8 h-8 rounded-xl text-xs font-bold inline-flex items-center justify-center ${i === 0 ? 'bg-amber-100 text-amber-700 shadow-sm shadow-amber-200' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {r.avatar_url ? <img src={r.avatar_url} className="w-8 h-8 rounded-full border border-gray-100" /> : <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">{r.name[0]}</div>}
                      <span className="font-bold text-gray-700">{r.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-blue-600 font-bold">{r.reviews}</td>
                  <td className="py-4 px-6 text-purple-600 font-bold">{r.sessions}</td>
                  <td className="py-4 px-6">
                    <span className="font-black text-[#0B3D2E] text-lg bg-[#0B3D2E]/5 px-3 py-1 rounded-xl">{r.total_contribution}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
