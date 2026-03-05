"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { StatusBadge } from "@/components/status-badge"
import { Search, Clock, Timer, Calendar, ChevronLeft, ChevronRight, CheckCircle, Play, Loader2 } from "lucide-react"

type TabFilter = "new" | "in_review" | "reviewed"

const avatarColors = [
  "bg-indigo-100 text-indigo-600",
  "bg-orange-100 text-orange-600",
  "bg-purple-100 text-purple-600",
  "bg-blue-100 text-blue-600",
  "bg-emerald-100 text-emerald-600",
]

interface Recitation {
  id: string
  student_id: string
  student_name: string
  surah_name: string
  ayah_from: number
  ayah_to: number
  created_at: string
  audio_duration_seconds: number
  status: "pending" | "in_review" | "mastered" | "needs_session" | "session_booked"
}

export default function ReaderRecitationsPage() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<TabFilter>("new")
  const [recitations, setRecitations] = useState<Recitation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/recitations?limit=100")
        if (res.ok) {
          const data = await res.json()
          setRecitations(data.recitations || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const tabStatusMap: Record<TabFilter, string[]> = {
    new: ["pending"],
    in_review: ["in_review"],
    reviewed: ["mastered", "needs_session", "session_booked"],
  }

  const filtered = recitations.filter((rec) => tabStatusMap[activeTab].includes(rec.status))

  const tabs = [
    { key: "new" as const, label: t.reader.new, count: recitations.filter((r) => r.status === "pending").length },
    { key: "in_review" as const, label: t.reader.inReview, count: recitations.filter((r) => r.status === "in_review").length },
    { key: "reviewed" as const, label: t.reader.done, count: recitations.filter((r) => ["mastered", "needs_session", "session_booked"].includes(r.status)).length },
  ]

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "00:00"
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.reader.reviewList}</h1>
          <p className="text-gray-500">
            {t.reader.reviewListDesc}<span className="font-bold text-[#0B3D2E] mx-1">{recitations.filter((r) => r.status === "pending").length}</span>
            {t.reader.newRecitationsAwaitingReview}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 min-w-[140px]">
            <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl border border-emerald-100">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs text-gray-500">{t.reader.reviewed}</span>
              <span className="font-bold text-gray-800">
                {recitations.filter(r => ["mastered", "needs_session", "session_booked"].includes(r.status)).length} {t.reader.recitationsCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === tab.key
                ? "bg-[#0B3D2E] text-white shadow-md font-bold"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`}
            >
              <span>{tab.label}</span>
              <span className={`text-xs py-0.5 px-2 rounded-full ${activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                }`}>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-[#0B3D2E]/5 border-b border-gray-100 text-gray-500 text-xs uppercase font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">{t.reader.student}</th>
                  <th className="px-6 py-4">{t.reader.surahPassage}</th>
                  <th className="px-6 py-4">{t.reader.submissionDate}</th>
                  <th className="px-6 py-4">{t.reader.recordingDuration}</th>
                  <th className="px-6 py-4">{t.reader.status}</th>
                  <th className="px-6 py-4 text-center">{t.reader.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      {t.reader.noRecitationsInCategory}
                    </td>
                  </tr>
                )}
                {filtered.map((rec, i) => {
                  const colorClass = avatarColors[i % avatarColors.length]
                  const initial = (rec.student_name || "طالب").charAt(0)
                  const isReviewed = ["mastered", "needs_session", "session_booked"].includes(rec.status)
                  return (
                    <tr key={rec.id} className={`hover:bg-gray-50/50 transition-colors group ${isReviewed ? "opacity-75" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${colorClass}`}>
                            {initial}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{rec.student_name || t.student.user}</p>
                            <p className="text-xs text-gray-500">{t.reader.student}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{t.reader.surah} {rec.surah_name}</p>
                        <p className="text-xs text-gray-500">{t.reader.ayahs} {rec.ayah_from}-{rec.ayah_to}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">{new Date(rec.created_at).toLocaleDateString(t.locale === 'ar' ? "ar-SA" : "en-US")}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Timer className="w-4 h-4" />
                          <span className="text-sm font-mono">{formatDuration(rec.audio_duration_seconds)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={rec.status as any} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isReviewed ? (
                          <Link href={`/reader/recitations/${rec.id}`} className="text-[#0B3D2E] hover:underline text-sm font-medium inline-flex items-center gap-1">
                            {t.reader.viewDetails}
                          </Link>
                        ) : (
                          <Link
                            href={`/reader/recitations/${rec.id}`}
                            className="bg-[#D4A843] hover:bg-[#C49A3A] text-white text-sm font-bold py-2 px-5 rounded-lg transition-colors shadow-sm inline-flex items-center gap-2"
                          >
                            <Play className="w-4 h-4 rtl:rotate-180" />
                            {t.reader.startReview}
                          </Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
