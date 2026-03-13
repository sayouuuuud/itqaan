"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ClipboardList, Calendar, CalendarCheck, CheckCircle, ArrowLeft, Loader2, ArrowRight, Power, Star, Users, BarChart3 } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

interface ReaderStats {
  pendingReviews: number
  todaySessions: number
  upcomingSessions: number
  masteredCount: number
}

interface NewSlotRequest {
  id: string
  student_id: string
  student_name: string
  recitation_id: string
  requested_at: string
}

export default function ReaderDashboard() {
  const { t, locale } = useI18n()
  const [stats, setStats] = useState<ReaderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(true)
  const [updatingActivity, setUpdatingActivity] = useState(false)
  const [slotRequests, setSlotRequests] = useState<NewSlotRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [performanceStats, setPerformanceStats] = useState<any>(null)

  useEffect(() => {
    // Fetch stats
    const fetchStats = fetch('/api/reader/stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setStats(data)
        else setStats({ pendingReviews: 0, todaySessions: 0, upcomingSessions: 0, masteredCount: 0 })
      })
      .catch(() => setStats({ pendingReviews: 0, todaySessions: 0, upcomingSessions: 0, masteredCount: 0 }))

    // Fetch profile for activity status
    const fetchProfile = fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user) {
          setIsAccepting(data.user.is_accepting_recitations)
        }
      })

    const fetchRequests = fetch('/api/recitations/new-slot-requests')
      .then(r => r.ok ? r.json() : { requests: [] })
      .then(data => setSlotRequests(data.requests || []))
      .catch(() => setSlotRequests([]))
      .finally(() => setLoadingRequests(false))

    const fetchPerformance = fetch('/api/stats?range=month')
      .then(r => r.ok ? r.json() : null)
      .then(data => setPerformanceStats(data))

    Promise.all([fetchStats, fetchProfile, fetchRequests, fetchPerformance]).finally(() => setLoading(false))
  }, [])

  const handleToggleActivity = async (checked: boolean) => {
    setUpdatingActivity(true)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_accepting_recitations: checked })
      })

      if (res.ok) {
        setIsAccepting(checked)
        toast.success(t.reader.statusUpdated)
      } else {
        toast.error("Failed to update status")
      }
    } catch (error) {
      toast.error("Error updating status")
    } finally {
      setUpdatingActivity(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1B5E3B]" />
      </div>
    )
  }

  const kpis = [
    {
      label: t.reader.pendingReviewsLabel,
      value: stats?.pendingReviews ?? 0,
      icon: ClipboardList,
      color: "text-[#C9A227]",
      bg: "bg-[#C9A227]/10",
      iconBig: "text-[#C9A227]",
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

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/recitations/new-slot-requests/${requestId}/accept`, { method: 'POST' });
      if (res.ok) {
        toast.success(locale === 'ar' ? 'تم قبول الطلب بنجاح' : 'Request accepted successfully');
        setSlotRequests(prev => prev.filter(r => r.id !== requestId));
        // Refresh stats
        fetch('/api/reader/stats').then(r => r.json()).then(data => setStats(data));
      } else {
        toast.error("Failed to accept request");
      }
    } catch (error) {
      toast.error("Error accepting request");
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t.reader.readerOverview}</h2>
        <p className="text-gray-500 mt-1">{t.reader.readerActivitySummary}</p>
      </div>

      {/* Activity Toggle Card */}
      <div className={`p-6 rounded-2xl border transition-all ${isAccepting ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${isAccepting ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
              <Power className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {t.reader.activityForEvaluation}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isAccepting ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-800"}`}>
                  {isAccepting ? t.reader.active : t.reader.inactive}
                </span>
              </h3>
              <p className="text-gray-600 text-sm mt-1 max-w-xl">
                {t.reader.activityForEvaluationDesc}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-semibold ${isAccepting ? "text-emerald-700" : "text-gray-500"}`}>
              {isAccepting ? t.reader.active : t.reader.inactive}
            </span>
            <Switch
              checked={isAccepting}
              onCheckedChange={handleToggleActivity}
              disabled={updatingActivity}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.label}
              className={`bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group ${kpi.urgent ? "border-[#C9A227]/40" : "border-gray-100"
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
                  <span className="absolute top-4 left-4 w-2.5 h-2.5 rounded-full bg-[#C9A227] animate-pulse" />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Performance Stats */}
      {performanceStats && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#1B5E3B]" />
            <h3 className="text-lg font-bold text-gray-900">{t.admin.readerStats.title}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100/50">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t.admin.readerStats.completionRate}</p>
                <p className="text-2xl font-black text-emerald-700">{performanceStats.completionRate}%</p>
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100/50">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t.admin.readerStats.studentCount}</p>
                <p className="text-2xl font-black text-blue-700">{performanceStats.studentCount}</p>
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100/50">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t.admin.readerStats.averageRating}</p>
                <p className="text-2xl font-black text-amber-700">{performanceStats.averageRating}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Slot Requests Recovery Flow */}
      {slotRequests.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-amber-900">{(t.reader as any).newSlotRequests || (locale === 'ar' ? 'طلبات مواعد جديدة' : 'New Slot Requests')}</h3>
              <p className="text-amber-700/70 text-sm font-bold">{(t.reader as any).requestsFromSuspendedDesc || (locale === 'ar' ? 'طلاب انتهت مهلتهم ويطلبون فرصة جديدة لحجز موعد.' : 'Students whose window expired and are asking for a new chance to book.')}</p>
            </div>
          </div>

          <div className="grid gap-4">
            {slotRequests.map((request) => (
              <div key={request.id} className="bg-white border border-amber-100 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 font-bold text-gray-400">
                    {request.student_name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{request.student_name}</h4>
                    <p className="text-xs text-gray-400">
                      {new Date(request.requested_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleAcceptRequest(request.id)}
                  className="w-full sm:w-auto bg-[#C9A227] hover:bg-[#A6841E] text-white px-6 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg shadow-[#C9A227]/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{(t.reader as any).acceptRequest || (locale === 'ar' ? 'قبول الطلب وتجديد الفرصة' : 'Accept & Renew Opportunity')}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State Message */}
      {stats?.pendingReviews === 0 && (
        <div className="text-center py-4 bg-[#F8FAF9] rounded-2xl border border-dashed border-[#1B5E3B]/20">
          <p className="text-[#1B5E3B]/70 font-medium">
            {(t.reader as any).noNewRecitationsForReview}
          </p>
        </div>
      )}

      {/* Quick Action Button */}
      <div className="flex justify-center">
        <Link
          href="/reader/recitations"
          className="group flex items-center gap-3 bg-[#1B5E3B] text-white px-8 py-4 rounded-2xl hover:bg-[#124028] transition-all shadow-sm hover:shadow-md font-bold text-lg"
        >
          <ClipboardList className="w-5 h-5" />
          <span>{t.reader.goToNewRecitationsLabel}</span>
          {(stats?.pendingReviews ?? 0) > 0 && (
            <span className="bg-[#C9A227] text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
              {stats!.pendingReviews}
            </span>
          )}
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
        </Link>
      </div>
    </div>
  )
}
