"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import {
  Plus, Send, Link2, Video, VideoOff, Copy, Check, Loader2,
  MessageSquare, Calendar, Clock
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

type RescheduleRequest = {
  id: string
  requested_by_role: string
  proposed_slot_start: string
  proposed_slot_end: string
  status: string
  created_at: string
  requester_name: string
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
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Reschedule dialog state
  const [rescheduleSession, setRescheduleSession] = useState<Booking | null>(null)
  const [proposedDate, setProposedDate] = useState("")
  const [proposedTime, setProposedTime] = useState("")
  const [submittingReschedule, setSubmittingReschedule] = useState(false)

  // Pending reschedule requests (from student) state
  const [pendingRequests, setPendingRequests] = useState<Record<string, RescheduleRequest[]>>({})

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch("/api/bookings")
        if (res.ok) {
          const data = await res.json()
          const bookings: Booking[] = data.bookings || []
          setSessions(bookings)

          // Fetch pending reschedule requests for active sessions
          const active = bookings.filter(b => b.status !== "completed" && b.status !== "cancelled")
          const reqsMap: Record<string, RescheduleRequest[]> = {}
          await Promise.all(active.map(async (b) => {
            try {
              const r = await fetch(`/api/bookings/${b.id}/reschedule`)
              if (r.ok) {
                const d = await r.json()
                const pending = (d.requests || []).filter((req: RescheduleRequest) => req.status === "pending")
                if (pending.length > 0) reqsMap[b.id] = pending
              }
            } catch { }
          }))
          setPendingRequests(reqsMap)
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

  const handleRescheduleSubmit = async () => {
    if (!rescheduleSession || !proposedDate || !proposedTime) return
    setSubmittingReschedule(true)
    try {
      const proposedSlotStart = new Date(`${proposedDate}T${proposedTime}`).toISOString()
      const proposedSlotEnd = new Date(new Date(`${proposedDate}T${proposedTime}`).getTime() + 30 * 60000).toISOString()

      const res = await fetch(`/api/bookings/${rescheduleSession.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposedSlotStart, proposedSlotEnd }),
      })
      if (res.ok) {
        alert("تم إرسال طلب تعديل الموعد. سيتم إشعارك بعد رد الطالب.")
        setRescheduleSession(null)
        setProposedDate("")
        setProposedTime("")
      } else {
        const d = await res.json()
        alert(d.error || "حدث خطأ")
      }
    } finally {
      setSubmittingReschedule(false)
    }
  }

  const handleRespondToStudentRequest = async (bookingId: string, reqId: string, action: "accept" | "reject") => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/reschedule/${reqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        if (action === "accept") {
          // Refresh sessions to get new slot_start
          const refreshed = await fetch("/api/bookings")
          if (refreshed.ok) {
            const data = await refreshed.json()
            setSessions(data.bookings || [])
          }
        }
        setPendingRequests(prev => {
          const next = { ...prev }
          delete next[bookingId]
          return next
        })
        alert(action === "accept" ? "تم قبول طلب التعديل وتحديث الموعد." : "تم رفض طلب التعديل.")
      }
    } catch {
      alert("حدث خطأ")
    }
  }

  const avatarColors = [
    "bg-sky-100 text-sky-600",
    "bg-emerald-100 text-emerald-600",
    "bg-amber-100 text-amber-600",
    "bg-purple-100 text-purple-600",
  ]

  const filterButtons = [
    { key: "all" as const, label: t.admin.allSessions },
    { key: "upcoming" as const, label: t.admin.upcoming },
    { key: "completed" as const, label: t.admin.completed },
    { key: "pending" as const, label: t.admin.pendingLinks },
  ]

  const STATUS = {
    confirmed: { label: isAr ? "مؤكد" : "Confirmed", color: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100" },
    completed: { label: isAr ? "مكتمل" : "Completed", color: "bg-slate-100 text-slate-600 border-slate-200 ring-slate-100" },
    cancelled: { label: isAr ? "ملغي" : "Cancelled", color: "bg-red-50 text-red-600 border-red-200 ring-red-100" },
    pending: { label: isAr ? "قيد الانتظار" : "Pending", color: "bg-[#D4A843]/10 text-[#D4A843] border-[#D4A843]/30 ring-[#D4A843]/10" },
    rescheduled: { label: isAr ? "مُعاد جدولته" : "Rescheduled", color: "bg-sky-50 text-sky-700 border-sky-200 ring-sky-100" },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{t.reader.sessionManagementTitle}</h1>
        <p className="mt-2 text-slate-500 text-sm">{t.reader.sessionManagementDesc}</p>
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

      {/* Cards List */}
      {loading ? (
        <div className="flex justify-center items-center py-32"><Loader2 className="w-10 h-10 animate-spin text-[#0B3D2E]" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-[2rem] py-24 text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">{t.reader.noSessionsFound}</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filtered.map((session, idx) => {
            const st = STATUS[session.status as keyof typeof STATUS] || STATUS.pending
            const isExpanded = expandedId === session.id
            const isCancelled = session.status === "cancelled"
            const isCompleted = session.status === "completed"
            const isActive = !isCancelled && !isCompleted
            const hasLink = !!session.meeting_link
            const pendingReqs = pendingRequests[session.id] || []

            return (
              <div key={session.id} className={`bg-white border rounded-3xl overflow-hidden transition-all duration-300
                ${isExpanded ? 'border-[#0B3D2E]/20 shadow-xl shadow-emerald-900/5' : 'border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md'}`}>

                {/* Card Header (Clickable) */}
                <div
                  className={`p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 cursor-pointer bg-white relative overflow-hidden ${isCompleted ? 'grayscale-[0.5] opacity-70 hover:grayscale-0 hover:opacity-100' : ''}`}
                  onClick={() => setExpandedId(isExpanded ? null : session.id)}
                >
                  {/* Status indicator line */}
                  <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${st.color.split(' ')[0]}`} />

                  <div className="flex items-center gap-5 z-10">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border font-bold text-xl
                      ${isActive ? avatarColors[idx % avatarColors.length] : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                      {(session.student_name || "ط").charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-slate-800">{session.student_name}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg">
                          <Calendar className="w-4 h-4 text-[#D4A843]" />
                          {new Date(session.slot_start).toLocaleDateString(isAr ? "ar-SA" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </span>
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg">
                          <Clock className="w-4 h-4 text-[#0B3D2E]/60" />
                          {new Date(session.slot_start).toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                          {" - "}
                          {new Date(session.slot_end).toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-xl text-xs font-bold border ring-4 z-10 inline-flex items-center justify-center self-start md:self-auto ${st.color}`}>
                    {st.label}
                  </span>
                </div>

                {/* Pending Reschedule Request from Student */}
                {pendingReqs.length > 0 && (
                  <div className="mx-6 md:mx-8 mb-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-5 shadow-inner">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-5 h-5 text-amber-600" />
                      <p className="text-sm font-bold text-amber-900">{isAr ? "طلب تعديل موعد من الطالب:" : "Reschedule request from student:"}</p>
                    </div>
                    {pendingReqs.map(req => (
                      <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 p-4 rounded-xl border border-amber-100">
                        <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                          <Calendar className="w-4 h-4 opacity-70" />
                          {new Date(req.proposed_slot_start).toLocaleDateString(isAr ? "ar-SA" : "en-US", { weekday: "long", month: "long", day: "numeric" })}
                          <span className="mx-1 opacity-50">•</span>
                          {new Date(req.proposed_slot_start).toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleRespondToStudentRequest(session.id, req.id, "accept")}
                            className="flex-1 sm:flex-none px-6 py-2.5 bg-[#0B3D2E] text-white rounded-xl text-xs font-bold hover:bg-[#082e23] transition-colors shadow-sm"
                          >
                            {isAr ? "قبول وتأكيد" : "Accept"}
                          </button>
                          <button
                            onClick={() => handleRespondToStudentRequest(session.id, req.id, "reject")}
                            className="flex-1 sm:flex-none px-6 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                          >
                            {isAr ? "رفض الطلب" : "Reject"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Expanded Content Details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-6 md:p-8 space-y-8 animate-in slide-in-from-top-2 fade-in duration-200">

                    {/* Grid for Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      {/* Meeting Link Section */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.reader.meetingLinkLabel}</h4>
                        {isCompleted ? (
                          <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <VideoOff className="w-5 h-5 text-slate-400 shrink-0" />
                            <p className="text-sm font-medium text-slate-500">{t.reader.linkExpired}</p>
                          </div>
                        ) : hasLink ? (
                          <div className="space-y-3">
                            <div className="flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                              <Video className="w-5 h-5 text-emerald-600 shrink-0 mr-3 rtl:mr-0 rtl:ml-3" />
                              <input
                                className="w-full border-none bg-transparent p-0 text-sm font-bold text-emerald-700 focus:ring-0 focus:outline-none"
                                readOnly
                                value={session.meeting_link || ""}
                              />
                              <button
                                className="rounded p-2 border border-emerald-200 bg-white hover:bg-emerald-100 text-emerald-600 transition-colors shadow-sm"
                                onClick={() => handleCopy(session.id, session.meeting_link || "")}
                              >
                                {copiedId === session.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              </button>
                            </div>
                            <a
                              href={session.meeting_link!.startsWith('http') ? session.meeting_link! : `https://${session.meeting_link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full flex items-center justify-center gap-2 bg-[#0B3D2E] hover:bg-[#082e23] text-white px-6 py-3.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-[#0B3D2E]/10"
                            >
                              <Video className="w-5 h-5" />
                              بدء الجلسة
                            </a>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3">
                            <div className="flex w-full items-center rounded-xl border border-slate-300 bg-white px-4 py-2 focus-within:border-[#0B3D2E] focus-within:ring-1 focus-within:ring-[#0B3D2E] transition-all shadow-sm">
                              <Link2 className="w-5 h-5 text-slate-400 mr-2 rtl:mr-0 rtl:ml-2" />
                              <input
                                className="w-full h-10 border-none bg-transparent p-0 text-sm placeholder:text-slate-400 focus:ring-0 focus:outline-none text-slate-800 font-medium"
                                placeholder={t.reader.pasteMeetingLinkPlaceholder}
                                value={meetingLinks[session.id] || ""}
                                onChange={(e) => setMeetingLinks({ ...meetingLinks, [session.id]: e.target.value })}
                                onKeyDown={(e) => { if (e.key === "Enter") handleSaveLink(session.id) }}
                              />
                            </div>
                            <button
                              onClick={() => handleSaveLink(session.id)}
                              disabled={!meetingLinks[session.id] || savingLink === session.id}
                              className="w-full h-12 rounded-xl bg-[#0B3D2E] text-white font-bold hover:bg-[#082e23] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md"
                            >
                              {savingLink === session.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                              حفظ الرابط
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Controls Section */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3 flex flex-col justify-center">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isAr ? "إدارة الجلسة" : "Session Management"}</h4>
                        <div className="flex flex-col gap-3">
                          <a
                            href={isCompleted ? undefined : `/reader/chat?with=${session.student_id}`}
                            className={`w-full flex items-center justify-center gap-2 rounded-xl border-2 px-6 py-3 text-sm font-bold transition-all ${isCompleted
                              ? "border-transparent bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none"
                              : "border-[#D4A843]/20 bg-white text-slate-700 hover:border-[#D4A843] hover:bg-[#FAF8F4]"
                              }`}
                          >
                            <MessageSquare className="w-5 h-5 text-[#D4A843]" />
                            {t.reader.contactBtn}
                          </a>

                          <div className="flex gap-3">
                            {!isCompleted && session.status !== "cancelled" && (
                              <button
                                onClick={() => setRescheduleSession(session)}
                                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-slate-600 px-4 py-3 text-sm font-bold hover:bg-slate-50 transition-all font-medium"
                              >
                                <Calendar className="w-4 h-4 opacity-70" />
                                {isAr ? "تعديل الميعاد" : "Reschedule"}
                              </button>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                            <span className="text-sm font-bold text-slate-700">{isAr ? "اكتمال الجلسة" : "Session Completed"}</span>
                            <Switch
                              checked={isCompleted}
                              onCheckedChange={() => handleToggleStatus(session.id, isCompleted)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Integrated Comment Box */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-[#0B3D2E]/5 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-[#0B3D2E]" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">{isAr ? "التعليقات والملاحظات" : "Comments & Notes"}</h4>
                      </div>
                      <CommentBox bookingId={session.id} locale={locale} />
                    </div>

                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleSession} onOpenChange={() => setRescheduleSession(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>📅 {isAr ? "اقتراح تعديل الموعد" : "Propose Reschedule"}</DialogTitle>
          </DialogHeader>
          {rescheduleSession && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-slate-500">
                {isAr ? `الطالب: ${rescheduleSession.student_name}` : `Student: ${rescheduleSession.student_name}`}
              </p>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> {isAr ? "التاريخ الجديد" : "New Date"}
                </label>
                <input
                  type="date"
                  value={proposedDate}
                  onChange={e => setProposedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full h-10 border border-slate-300 rounded-xl px-3 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> {isAr ? "الوقت" : "Time"}
                </label>
                <input
                  type="time"
                  value={proposedTime}
                  onChange={e => setProposedTime(e.target.value)}
                  className="w-full h-10 border border-slate-300 rounded-xl px-3 text-sm"
                />
              </div>
              <p className="text-xs text-slate-400">
                {isAr
                  ? "سيتلقى الطالب إشعاراً بالموعد المقترح ويحتاج موافقته قبل تعديل الحجز."
                  : "The student will be notified and must approve before the booking is changed."}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleSession(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button
              onClick={handleRescheduleSubmit}
              disabled={!proposedDate || !proposedTime || submittingReschedule}
              className="bg-[#0B3D2E] text-white"
            >
              {submittingReschedule ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isAr ? "إرسال الطلب" : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CommentBox({ bookingId, locale }: { bookingId: string, locale: string }) {
  const [comments, setComments] = useState<Array<{ id: string; author_name: string; comment_text: string; created_at: string }>>([])
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetch(`/api/bookings/${bookingId}/comments`)
      .then(r => r.ok ? r.json() : { comments: [] })
      .then(d => setComments(d.comments || []))
      .catch(() => { })
  }, [bookingId])

  const send = async () => {
    if (!text.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      if (res.ok) {
        const d = await res.json()
        setComments(p => [...p, d.comment])
        setText("")
      }
    } finally { setSending(false) }
  }

  const isAr = locale === "ar"

  return (
    <div className="space-y-4">
      {comments.length > 0 && (
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {comments.map((c, i) => (
            <div key={c.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm">{c.author_name}</span>
                <span className="text-[10px] font-medium text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                  <Clock className="w-3 h-3 inline-block mr-1 rtl:ml-1 rtl:mr-0 opacity-50" />
                  {new Date(c.created_at).toLocaleString(locale === "ar" ? "ar-SA" : "en-US", { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-medium mt-1">{c.comment_text}</p>
            </div>
          ))}
        </div>
      )}

      <div className="relative group">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder={isAr ? "اكتب تعليقاً أو ملاحظة..." : "Write a comment..."}
          className="w-full border-2 border-slate-100 bg-slate-50 rounded-2xl pl-16 pr-6 rtl:pr-16 rtl:pl-6 py-4 text-sm text-slate-700 focus:bg-white focus:ring-4 focus:ring-[#0B3D2E]/10 focus:border-[#0B3D2E] placeholder:text-slate-400 transition-all font-medium"
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="absolute left-3 top-3 bottom-3 rtl:right-3 rtl:left-auto px-4 bg-[#0B3D2E] text-white rounded-xl text-sm font-bold hover:bg-[#082e23] disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-500 transition-all group-focus-within:shadow-lg shadow-emerald-900/20"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 rtl:rotate-180" />}
        </button>
      </div>
    </div>
  )
}
