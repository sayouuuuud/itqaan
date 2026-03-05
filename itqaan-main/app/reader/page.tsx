"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ClipboardList, Calendar, CalendarCheck, CheckCircle, ArrowLeft, Loader2, ArrowRight } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

interface ReaderStats {
  pendingReviews: number
  todaySessions: number
  upcomingSessions: number
  masteredCount: number
}

export default function ReaderDashboard() {
  const { t } = useI18n()
  const [stats, setStats] = useState<ReaderStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reader/stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setStats(data)
        else setStats({ pendingReviews: 0, todaySessions: 0, upcomingSessions: 0, masteredCount: 0 })
      })
      .catch(() => setStats({ pendingReviews: 0, todaySessions: 0, upcomingSessions: 0, masteredCount: 0 }))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" />
      </div>
    )
  }

  const kpis = [
    {
      label: t.reader.pendingReviewsLabel,
      value: stats?.pendingReviews ?? 0,
      icon: ClipboardList,
      color: "text-[#0B3D2E]",
      bg: "bg-[#0B3D2E]/10",
      iconBig: "text-[#0B3D2E]",
      urgent: (stats?.pendingReviews ?? 0) > 0,
    },
    {
      label: t.reader.todaySessionsLabel,
      value: stats?.todaySessions ?? 0,
      icon: Calendar,
      color: "text-blue-600",
      bg: "bg-blue-50",
      iconBig: "text-blue-500",
      urgent: false,
    },
    {
      label: t.reader.upcomingSessions7Days,
      value: stats?.upcomingSessions ?? 0,
      icon: CalendarCheck,
      color: "text-purple-600",
      bg: "bg-purple-50",
      iconBig: "text-purple-500",
      urgent: false,
    },
    {
      label: t.reader.masteredCasesCount,
      value: stats?.masteredCount ?? 0,
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      iconBig: "text-emerald-500",
      urgent: false,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t.reader.readerOverview}</h2>
        <p className="text-gray-500 mt-1">{t.reader.readerActivitySummary}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.label}
              className={`bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group ${kpi.urgent ? "border-[#D4A843]/40" : "border-gray-100"
                }`}
            >
              <div className="absolute -top-2 -right-2 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <Icon className={`w-20 h-20 ${kpi.iconBig}`} />
              </div>
              <div className="relative z-10">
                <div className={`p-3 ${kpi.bg} ${kpi.color} rounded-xl w-fit mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">{kpi.value}</h3>
                <p className="text-gray-500 text-sm">{kpi.label}</p>
                {kpi.urgent && (
                  <span className="absolute top-4 left-4 w-2.5 h-2.5 rounded-full bg-[#D4A843] animate-pulse" />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Action Button */}
      <div className="flex justify-center">
        <Link
          href="/reader/recitations"
          className="group flex items-center gap-3 bg-[#0B3D2E] text-white px-8 py-4 rounded-2xl hover:bg-[#0A3528] transition-all shadow-sm hover:shadow-md font-bold text-lg"
        >
          <ClipboardList className="w-5 h-5" />
          <span>{t.reader.goToNewRecitationsLabel}</span>
          {(stats?.pendingReviews ?? 0) > 0 && (
            <span className="bg-[#D4A843] text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
              {stats!.pendingReviews}
            </span>
          )}
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
        </Link>
      </div>
    </div>
  )
}
