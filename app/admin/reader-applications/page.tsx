"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import {
  UserCheck, UserX, Clock, ChevronDown, GraduationCap,
  BookOpen, Phone, MapPin, CheckCircle, XCircle, AlertCircle, Loader2
} from "lucide-react"

type AppStatus = "pending_approval" | "approved" | "rejected"

type Application = {
  id: string
  name: string
  email: string
  gender: string
  approval_status: AppStatus
  created_at: string
  full_name_triple: string | null
  phone: string | null
  city: string | null
  qualification: string | null
  memorized_parts: string | null
  years_of_experience: number | null
  certificate_file_url: string | null
}

export default function ReaderApplicationsPage() {
  const { t } = useI18n()
  const isAr = t.locale === "ar"
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | AppStatus>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    async function loadApps() {
      try {
        const res = await fetch("/api/admin/reader-applications")
        if (res.ok) {
          const data = await res.json()
          setApplications(data.applications || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadApps()
  }, [])

  const filtered = applications.filter((app) => {
    if (filter === "all") return true
    return app.approval_status === filter
  })

  const counts = {
    all: applications.length,
    pending_approval: applications.filter(a => a.approval_status === "pending_approval").length,
    approved: applications.filter(a => a.approval_status === "approved").length,
    rejected: applications.filter(a => a.approval_status === "rejected").length,
  }

  const handleAction = async (userId: string, action: "approve" | "reject") => {
    if (!confirm(action === "approve" ? t.admin.confirmApproveReader : t.admin.confirmRejectApplication)) return

    setProcessingId(userId)
    try {
      const res = await fetch("/api/admin/reader-applications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action })
      })

      if (res.ok) {
        const data = await res.json()
        setApplications(prev => prev.map(a => a.id === userId ? { ...a, approval_status: data.status } : a))
      } else {
        alert(t.admin.errorProcessingApplication)
      }
    } catch {
      alert(t.auth.errorOccurred)
    } finally {
      setProcessingId(null)
    }
  }

  const statusConfig: Record<AppStatus, { label: string; color: string; icon: React.ReactNode }> = {
    pending_approval: {
      label: t.admin.pendingApproval,
      color: "bg-amber-100 text-amber-700",
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    approved: {
      label: t.approved,
      color: "bg-emerald-100 text-emerald-700",
      icon: <CheckCircle className="w-3.5 h-3.5" />,
    },
    rejected: {
      label: t.rejected,
      color: "bg-red-100 text-red-700",
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
  }

  const filterButtons = [
    { key: "all" as const, label: t.all, count: counts.all },
    { key: "pending_approval" as const, label: t.admin.pendingApproval, count: counts.pending_approval },
    { key: "approved" as const, label: t.approved, count: counts.approved },
    { key: "rejected" as const, label: t.rejected, count: counts.rejected },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.admin.readerApplications}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t.admin.readerApplicationsDesc}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
          <AlertCircle className="w-4 h-4" />
          {counts.pending_approval} {t.admin.pendingReviewLabel}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {filterButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all border ${filter === btn.key
              ? "border-[#0B3D2E] bg-[#0B3D2E] text-white shadow-md"
              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }`}
          >
            {btn.label}
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${filter === btn.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
              }`}>{btn.count}</span>
          </button>
        ))}
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 flex justify-center shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <UserCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">{t.admin.noApplicationsFound}</p>
          </div>
        ) : filtered.map((app) => {
          const status = statusConfig[app.approval_status as AppStatus]
          const isExpanded = expandedId === app.id

          return (
            <div key={app.id} className={`bg-white rounded-2xl border transition-all shadow-sm overflow-hidden ${isExpanded ? "border-[#0B3D2E]/30 ring-1 ring-[#0B3D2E]/10" : "border-gray-200 hover:border-gray-300"}`}>
              {/* Summary Row */}
              <div
                className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                onClick={() => setExpandedId(isExpanded ? null : app.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-lg shrink-0">
                    {(app.name || "م").charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{app.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1 font-medium">
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{app.city || "غير محدد"}</span>
                      <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" />{app.qualification || "غير محدد"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${status?.color || "bg-slate-100 text-slate-500"}`}>
                    {status?.icon || <Clock className="w-3.5 h-3.5" />}
                    {status?.label || t.unknown}
                  </span>
                  <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
                    <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50">
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 mt-0.5">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">{t.auth.fullNameTriple}</p>
                        <p className="text-sm font-bold text-slate-800">{app.full_name_triple || app.name}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 mt-0.5">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">{t.auth.phone}</p>
                        <p className="text-sm font-bold text-slate-800 dir-ltr text-left">{app.phone || "---"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 mt-0.5">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">{t.auth.memorizedParts}</p>
                        <p className="text-sm font-bold text-slate-800">{app.memorized_parts || "---"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 mt-0.5">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">{t.auth.yearsOfExperience}</p>
                        <p className="text-sm font-bold text-slate-800">{app.years_of_experience || 0} {t.years}</p>
                      </div>
                    </div>
                  </div>

                  {app.certificate_file_url && (
                    <div className="px-6 pb-2">
                      <a href={app.certificate_file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 underline font-medium">
                        عرض الشهادة / المرفقات
                      </a>
                    </div>
                  )}

                  {/* Actions */}
                  {app.approval_status === "pending_approval" && (
                    <div className="px-6 pb-6 pt-4 flex items-center gap-3">
                      <button
                        onClick={() => handleAction(app.id, "approve")}
                        disabled={processingId === app.id}
                        className="flex items-center gap-2 bg-[#0B3D2E] hover:bg-[#0A3528] disabled:bg-slate-300 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm"
                      >
                        {processingId === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                        {t.admin.approveReader}
                      </button>
                      <button
                        onClick={() => handleAction(app.id, "reject")}
                        disabled={processingId === app.id}
                        className="flex items-center gap-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm"
                      >
                        {processingId === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                        {t.admin.rejectApplication}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
