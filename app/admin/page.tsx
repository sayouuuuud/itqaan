"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { StatusBadge } from "@/components/status-badge"
import {
  Users, BookOpen, ClipboardList, Clock, ArrowLeft,
  TrendingUp, Download, UserCheck, Loader2, Eye
} from "lucide-react"
import { ViewsChart } from "@/components/admin/analytics/views-chart"
import { VisitorStats } from "@/components/admin/analytics/visitors-stats"

export default function AdminDashboard() {
  const { t } = useI18n()
  const isAr = t.locale === "ar"

  const [data, setData] = useState<{ stats: any, latestRecitations: any[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<any>(null)

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/stats")
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
    // Load analytics in parallel
    fetch('/api/admin/analytics?days=30').then(r => r.ok ? r.json() : null).then(d => {
      if (d) setAnalytics(d)
    }).catch(() => { })
  }, [])

  if (loading || !data) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" />
      </div>
    )
  }

  const { stats, latestRecitations } = data

  const statCards = [
    { label: t.admin.totalStudents, value: stats.totalStudents, icon: Users, iconBg: "bg-indigo-50 text-indigo-600" },
    { label: t.admin.totalReaders, value: stats.totalReaders, icon: BookOpen, iconBg: "bg-emerald-50 text-emerald-600" },
    { label: t.admin.todaysRecitations, value: stats.recitationsToday, icon: ClipboardList, iconBg: "bg-blue-50 text-blue-600" },
    { label: t.admin.avgReviewTime, value: stats.avgReviewTime, icon: Clock, iconBg: "bg-amber-50 text-amber-600" },
    { label: t.admin.pendingReaderApps, value: stats.pendingReaderApps, icon: UserCheck, iconBg: "bg-orange-50 text-orange-600" },
  ]

  const chartData = (analytics?.overTime || []).map((d: any) => ({
    date: d.raw_date || d.day,
    views_count: parseInt(d.views || '0'),
    visitors_count: parseInt(d.visitors || '0')
  }))

  const topCountriesMapped = (analytics?.topCountries || []).map((c: any) => ({
    country: c.country,
    count: parseInt(c.views || '0')
  }))

  const deviceTypesRaw = analytics?.deviceTypes || []
  const totalDevices = deviceTypesRaw.reduce((sum: number, d: any) => sum + parseInt(d.count || '0'), 0)
  const deviceTypesMapped = deviceTypesRaw.map((d: any) => ({
    device_type: d.device_type,
    count: parseInt(d.count || '0'),
    percentage: totalDevices > 0 ? Math.round((parseInt(d.count || '0') / totalDevices) * 100) : 0
  }))

  const totalViews = parseInt(analytics?.overview?.total_views || '0')
  const uniqueVisitors = parseInt(analytics?.overview?.unique_visitors || '0')
  const totalStudents = stats.totalStudents
  const totalReaders = stats.totalReaders

  return (
    <div className="space-y-6 pb-20 lg:pb-0 font-sans" dir={isAr ? "rtl" : "ltr"}>
      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
              {totalViews.toLocaleString("ar-EG")}
            </p>
            <p className="text-xs sm:text-sm text-gray-500">{t.admin.totalViews} (30 {isAr ? 'يوم' : 'Days'})</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
              {uniqueVisitors.toLocaleString("ar-EG")}
            </p>
            <p className="text-xs sm:text-sm text-gray-500">{t.admin.uniqueVisitors}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
              {(totalStudents + totalReaders).toLocaleString("ar-EG")}
            </p>
            <p className="text-xs sm:text-sm text-gray-500">{isAr ? 'إجمالي الأعضاء' : 'Total Members'}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
            <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
              {stats.recitationsToday?.toLocaleString("ar-EG") || '0'}
            </p>
            <p className="text-xs sm:text-sm text-gray-500">{t.admin.todaysRecitations}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Views Chart */}
      {analytics && (
        <ViewsChart data={chartData} />
      )}

      {/* Advanced Analytics */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visitor Stats (Countries & Devices) */}
          <div className="lg:col-span-3">
            <VisitorStats
              countryData={topCountriesMapped}
              deviceData={deviceTypesMapped}
            />
          </div>

          {/* Top Pages Table replacing TopContent */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-h-[400px] overflow-y-auto">
              <h3 className="font-bold text-gray-900 mb-4">{t.admin.topPages}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-3 text-gray-500 font-medium text-start">{t.admin.pageLabel}</th>
                      <th className="pb-3 text-gray-500 font-medium text-end">{t.admin.viewsLabel}</th>
                      <th className="pb-3 text-gray-500 font-medium text-end">{t.admin.visitorsLabel}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(analytics.topPages || []).map((p: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 font-mono text-gray-700 max-w-[300px] truncate" dir="ltr" style={{ textAlign: isAr ? 'right' : 'left' }}>{p.path}</td>
                        <td className="py-3 text-end font-bold text-[#0B3D2E]">{parseInt(p.views || '0').toLocaleString('ar-EG')}</td>
                        <td className="py-3 text-end text-gray-500 font-medium">{parseInt(p.visitors || '0').toLocaleString('ar-EG')}</td>
                      </tr>
                    ))}
                    {(!analytics.topPages || analytics.topPages.length === 0) && (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-gray-400">لا توجد بيانات متاحة</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Latest Recitations Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50 mb-0">
          <div>
            <h3 className="font-bold text-gray-900">{t.admin.latestRecitations}</h3>
            <p className="text-sm text-gray-500 mt-1">{t.admin.mostRecentSubmissions}</p>
          </div>
          <Link href="/admin/recitations" className="text-sm text-[#0B3D2E] font-medium hover:underline flex items-center gap-1">
            {t.admin.viewAll}
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 bg-white">
                <th className={`py-4 px-6 font-medium ${isAr ? 'text-right' : 'text-left'}`}>{t.admin.student}</th>
                <th className={`py-4 px-6 font-medium ${isAr ? 'text-right' : 'text-left'}`}>{t.admin.surah}</th>
                <th className={`py-4 px-6 font-medium ${isAr ? 'text-right' : 'text-left'}`}>{t.admin.reader}</th>
                <th className={`py-4 px-6 font-medium ${isAr ? 'text-right' : 'text-left'}`}>{t.admin.status}</th>
                <th className={`py-4 px-6 font-medium ${isAr ? 'text-right' : 'text-left'}`}>{t.admin.date}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {latestRecitations.length > 0 ? latestRecitations.map((rec: any) => (
                <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-900">{rec.studentName}</td>
                  <td className="py-4 px-6 text-gray-500 font-medium">{rec.surah} <span className="text-gray-400 font-normal">({rec.fromAyah}-{rec.toAyah})</span></td>
                  <td className="py-4 px-6 text-gray-500">{rec.assignedReaderName || "---"}</td>
                  <td className="py-4 px-6"><StatusBadge status={rec.status as any} /></td>
                  <td className="py-4 px-6 text-gray-400 text-xs">{new Date(rec.createdAt).toLocaleDateString(t.locale === 'ar' ? "ar-SA" : "en-US")}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    {t.admin.noRecentRecitations}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
