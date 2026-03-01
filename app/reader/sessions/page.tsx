"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Plus, Search, Send, Link2, Video, VideoOff, Copy, Check, Loader2
} from "lucide-react"

type Booking = {
  id: string
  student_id: string
  student_name: string
  student_email: string
  reader_id: string
  reader_name: string
  slot_start: string
  slot_end: string
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show" | "rescheduled"
  meeting_link: string | null
}

export default function ReaderSessionsPage() {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  const [sessions, setSessions] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed" | "pending">("all")
  const [meetingLinks, setMeetingLinks] = useState<Record<string, string>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [savingLink, setSavingLink] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch("/api/bookings")
        if (res.ok) {
          const data = await res.json()
          setSessions(data.bookings || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchSessions()
  }, [])

  const filtered = sessions.filter((s) => {
    if (filter === "upcoming") return s.status === "confirmed"
    if (filter === "completed") return s.status === "completed"
    if (filter === "pending") return !s.meeting_link && s.status !== "completed"
    return true
  })

  const filterButtons = [
    { key: "all" as const, label: t.admin.allSessions, icon: "list" },
    { key: "upcoming" as const, label: t.admin.upcoming, icon: "schedule" },
    { key: "completed" as const, label: t.admin.completed, icon: "check" },
    { key: "pending" as const, label: t.admin.pendingLinks, icon: "link" },
  ]

  const handleCopy = (id: string, link: string) => {
    navigator.clipboard.writeText(link)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSaveLink = async (id: string) => {
    const link = meetingLinks[id]
    if (!link) return

    setSavingLink(id)
    try {
      const res = await fetch(`/api/bookings/${id}/meeting-link`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingLink: link }),
      })

      if (res.ok) {
        setSessions(sessions.map(s => s.id === id ? { ...s, meeting_link: link } : s))
      } else {
        alert(t.reader.saveLinkError)
      }
    } catch {
      alert(t.student.serverError)
    } finally {
      setSavingLink(null)
    }
  }

  const handleToggleStatus = async (id: string, isCompleted: boolean) => {
    const newStatus = isCompleted ? "pending" : "completed" // In UI, pending actually means confirmed conceptually
    // we toggle to completed or back to confirmed
    const targetStatus = isCompleted ? "confirmed" : "completed"

    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      })

      if (res.ok) {
        setSessions(sessions.map(s => s.id === id ? { ...s, status: targetStatus } : s))
      }
    } catch {
      console.error("Failed to update status")
    }
  }

  const avatarColors = [
    "bg-sky-100 text-sky-600",
    "bg-emerald-100 text-emerald-600",
    "bg-amber-100 text-amber-600",
    "bg-purple-100 text-purple-600",
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            {t.reader.sessionManagementTitle}
          </h1>
          <p className="mt-2 text-slate-500 text-sm">
            {t.reader.sessionManagementDesc}
          </p>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {filterButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key)}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all border ${filter === btn.key
              ? "border-[#0B3D2E] bg-[#0B3D2E] text-white shadow-md"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-right">
              <thead className="bg-[#FAF8F4] border-b border-slate-200">
                <tr>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t.reader.studentInfoLabel}
                  </th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t.reader.dateTimeLabel}
                  </th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t.reader.meetingLinkLabel}
                  </th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t.reader.actionsLabel}
                  </th>
                  <th className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t.reader.statusLabel}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-500">
                      {t.reader.noSessionsFound}
                    </td>
                  </tr>
                )}
                {filtered.map((session, idx) => {
                  const isCompleted = session.status === "completed"
                  const hasLink = !!session.meeting_link

                  return (
                    <tr
                      key={session.id}
                      className={`group transition-all hover:bg-slate-50/50 ${isCompleted
                        ? "bg-slate-50/80 opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0"
                        : ""
                        }`}
                    >
                      {/* Student */}
                      <td className="p-4 relative">
                        {isCompleted && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r-md"></div>}
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${avatarColors[idx % avatarColors.length]}`}
                          >
                            {(session.student_name || "ط").charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">
                              {session.student_name}
                            </p>
                            <p className="text-xs text-slate-500 font-medium">
                              {session.status === "cancelled" ? t.reader.cancelledBooking : t.reader.confirmedBooking}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">
                            {new Date(session.slot_start).toLocaleDateString(
                              isAr ? "ar-SA" : "en-US",
                              { month: "short", day: "numeric", year: "numeric", weekday: "long" }
                            )}
                          </span>
                          <span className="text-sm text-slate-500 font-mono mt-0.5">
                            {new Date(session.slot_start).toLocaleTimeString(
                              isAr ? "ar-SA" : "en-US",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                            {" - "}
                            {new Date(session.slot_end).toLocaleTimeString(
                              isAr ? "ar-SA" : "en-US",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Meeting Link */}
                      <td className="p-4">
                        {isCompleted ? (
                          <div className="flex w-full max-w-[280px] items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                            <VideoOff className="w-4 h-4 text-slate-400 ml-2 rtl:mr-2 rtl:ml-0" />
                            <span className="w-full text-sm font-medium text-slate-500">
                              {t.reader.linkExpired}
                            </span>
                          </div>
                        ) : hasLink ? (
                          <div className="flex w-full max-w-[280px] items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                            <Video className="w-4 h-4 text-emerald-600 ml-2 rtl:mr-2 rtl:ml-0" />
                            <input
                              className="w-full border-none bg-transparent p-0 text-sm font-bold text-emerald-700 focus:ring-0 focus:outline-none"
                              readOnly
                              value={session.meeting_link || ""}
                            />
                            <button
                              className="rounded p-1.5 hover:bg-emerald-100 text-emerald-600 transition-colors"
                              onClick={() =>
                                handleCopy(
                                  session.id,
                                  session.meeting_link || ""
                                )
                              }
                            >
                              {copiedId === session.id ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="flex w-full max-w-[280px] items-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 focus-within:border-[#0B3D2E] focus-within:ring-1 focus-within:ring-[#0B3D2E] transition-all shadow-sm">
                            <Link2 className="w-5 h-5 text-slate-400 ml-2 rtl:mr-2 rtl:ml-0" />
                            <input
                              className="w-full h-8 border-none bg-transparent p-0 text-sm placeholder:text-slate-400 focus:ring-0 focus:outline-none text-slate-800 font-medium"
                              placeholder={t.reader.pasteMeetingLinkPlaceholder}
                              value={meetingLinks[session.id] || ""}
                              onChange={(e) =>
                                setMeetingLinks({
                                  ...meetingLinks,
                                  [session.id]: e.target.value,
                                })
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveLink(session.id)
                              }}
                            />
                            {meetingLinks[session.id] && (
                              <button
                                onClick={() => handleSaveLink(session.id)}
                                disabled={savingLink === session.id}
                                className="rounded p-1.5 bg-[#0B3D2E] text-white hover:bg-[#0A3528]"
                              >
                                {savingLink === session.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <a
                          href={isCompleted ? undefined : `mailto:${session.student_email}`}
                          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition-all ${isCompleted
                            ? "border-transparent bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none"
                            : "border-[#0B3D2E]/20 bg-white text-[#0B3D2E] hover:border-[#0B3D2E] hover:bg-[#FAF8F4] shadow-sm"
                            }`}
                        >
                          <Send className="w-4 h-4" />
                          {t.reader.contactBtn}
                        </a>
                      </td>

                      {/* Status Toggle */}
                      <td className="p-4 text-center">
                        <Switch
                          checked={isCompleted}
                          onCheckedChange={() => handleToggleStatus(session.id, isCompleted)}
                        />
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
