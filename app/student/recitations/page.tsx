"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Mic, FileText, Clock, CheckCircle, Calendar, Loader2, ChevronLeft } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { useMemo } from "react"

type Recitation = {
  id: string
  surah_name: string
  status: string
  created_at: string
  audio_duration_seconds: number | null
  audio_url: string | null
}

// Status config moved inside component to use translations

export default function StudentRecitationsPage() {
  const { t, locale } = useI18n()
  const [recitations, setRecitations] = useState<Recitation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetch("/api/recitations")
      .then(r => r.json())
      .then(d => setRecitations(d.recitations || []))
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = useMemo(() => ({
    pending: { label: t.student.statusPending, color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
    in_review: { label: t.student.statusInReview, color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
    mastered: { label: t.student.statusMastered, color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle },
    needs_session: { label: t.student.statusNeedsSession, color: "bg-blue-50 text-blue-700 border-blue-200", icon: Calendar },
    session_booked: { label: t.student.statusBooked, color: "bg-purple-50 text-purple-700 border-purple-200", icon: Calendar },
  }), [t])

  const filters = [
    { value: "all", label: t.all },
    { value: "pending", label: t.student.statusPending },
    { value: "mastered", label: t.student.statusMastered },
    { value: "needs_session", label: t.student.statusNeedsSession },
    { value: "session_booked", label: t.student.statusBooked },
  ]

  const filtered = filter === "all" ? recitations : recitations.filter(r =>
    filter === "pending" ? (r.status === "pending" || r.status === "in_review") : r.status === filter
  )

  const formatDuration = (secs: number | null) => {
    if (!secs) return ""
    const m = Math.floor(secs / 60), s = secs % 60
    return `${m}:${String(s).padStart(2, "0")}`
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.student.myRecitations}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.student.myRecitationsDesc}</p>
        </div>
        <Link
          href="/student/submit"
          className="flex items-center gap-2 bg-[#D4A843] hover:bg-[#C49A3A] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-md shadow-[#D4A843]/20"
        >
          <Mic className="w-4 h-4" />
          {t.student.newRecording}
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filter === f.value
              ? "bg-[#0B3D2E] text-white border-[#0B3D2E]"
              : "bg-white text-gray-600 border-gray-200 hover:border-[#0B3D2E]/40"
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl py-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <FileText className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">{t.noResults}</p>
          <p className="text-gray-400 text-sm mt-1">{t.student.noRecitationDesc}</p>
          <Link href="/student/submit" className="inline-flex items-center gap-2 mt-5 bg-[#D4A843] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#C49A3A] transition-colors">
            <Mic className="w-4 h-4" /> {t.student.recordNowBtn}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(rec => {
            const cfg = STATUS_CONFIG[rec.status] || STATUS_CONFIG.pending
            const Icon = cfg.icon
            return (
              <div key={rec.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:border-[#0B3D2E]/40 hover:shadow-md transition-all">

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-[#0B3D2E]/[0.06] flex items-center justify-center shrink-0">
                      <Mic className="w-5 h-5 text-[#0B3D2E]" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{rec.surah_name || t.student.surahFatiha}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                        <span>{new Date(rec.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { year: "numeric", month: "short", day: "numeric" })}</span>
                        {rec.audio_duration_seconds && <span>• {formatDuration(rec.audio_duration_seconds)}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </div>

                    <Link
                      href={`/student/recitations/${rec.id}`}
                      className="text-xs bg-[#0B3D2E] text-white hover:bg-[#0B3D2E]/90 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                    >
                      {t.student.viewRecitation}
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
