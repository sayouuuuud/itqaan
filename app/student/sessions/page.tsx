"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Video, Calendar, Clock, ExternalLink, MessageSquare, Loader2, Send } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { useMemo } from "react"

type Booking = {
  id: string
  slot_start: string
  slot_end: string
  status: string
  meeting_link: string | null
  reader_name: string
  reader_id: string
}

// STATUS config moved inside component to use translations

export default function StudentSessionsPage() {
  const { t, locale } = useI18n()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/bookings")
      .then(r => r.json())
      .then(d => setBookings(d.bookings || []))
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  const STATUS = useMemo(() => ({
    confirmed: { label: t.student.statusBooked, color: "bg-purple-50 text-purple-700 border-purple-200" },
    completed: { label: t.student.statusCompleted, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    cancelled: { label: t.student.statusCancelled, color: "bg-red-50 text-red-600 border-red-200" },
    pending: { label: t.student.statusPending, color: "bg-amber-50 text-amber-700 border-amber-200" },
  }), [t])

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t.student.mySessions}</h1>
          <p className="text-sm text-slate-500 mt-1">{t.student.mySessionsDesc}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" /></div>
      ) : bookings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">{t.student.noSessionsYet}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => {
            const st = STATUS[b.status as keyof typeof STATUS] || STATUS.pending
            const isExpanded = expandedId === b.id
            return (
              <div key={b.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : b.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                      <Video className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{b.reader_name || "مقرئ معتمد"}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(b.slot_start).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(b.slot_start).toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', { hour: "2-digit", minute: "2-digit" })}
                          {" – "}
                          {new Date(b.slot_end).toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${st.color}`}>{st.label}</span>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 p-5 space-y-4">
                    {/* Meeting Link */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-2">{t.student.sessionLinkLabel}</p>
                      {b.meeting_link ? (
                        <a
                          href={b.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-[#0B3D2E] hover:bg-[#0A3528] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          {t.student.joinSessionBtn}
                        </a>
                      ) : (
                        <p className="text-sm text-slate-400">{t.student.linkPendingMsg}</p>
                      )}
                    </div>

                    {/* Comment Box */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-slate-400" />
                        <p className="text-xs font-semibold text-slate-500">{t.student.chat || t.student.commentLabel}</p>
                      </div>
                      <CommentBox bookingId={b.id} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CommentBox({ bookingId }: { bookingId: string }) {
  const { t, locale } = useI18n()
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

  return (
    <div className="space-y-3">
      {comments.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {comments.map(c => (
            <div key={c.id} className="bg-slate-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400">{new Date(c.created_at).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}</span>
                <span className="text-xs font-bold text-slate-600">{c.author_name}</span>
              </div>
              <p className="text-sm text-slate-700 text-right">{c.comment_text}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="px-4 py-2.5 bg-[#0B3D2E] text-white rounded-xl text-sm font-medium hover:bg-[#0A3528] disabled:opacity-50 transition-colors"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder={t.student.writeCommentPlaceholder}
          className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-right text-slate-700 focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E] placeholder:text-slate-400"
        />
      </div>
    </div>
  )
}
