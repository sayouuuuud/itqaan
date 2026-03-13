"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { Mic, Clock, CheckCircle, Calendar, ArrowLeft, Video, MessageSquare, Send, Award, FileText, User, Building, MapPin, ExternalLink, Download, BarChart3, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type FatihaStatus = 'no_recitation' | 'pending' | 'in_review' | 'mastered' | 'needs_session' | 'session_booked'

interface LatestRecitation {
  status: FatihaStatus
  created_at?: string
  assigned_reader_name?: string
}

interface BookingInfo {
  id: string
  slot_start: string
  slot_end: string
  meeting_link?: string
  reader_name?: string
}

interface CertificateInfo {
  id: string
  university: string
  college: string
  city: string
  student_id?: string
  certificate_issued: boolean
  certificate_url?: string
  certificate_pdf_url?: string
  ceremony_date?: string
}

function useStudentData() {
  const [recitation, setRecitation] = useState<LatestRecitation | null>(null)
  const [booking, setBooking] = useState<BookingInfo | null>(null)
  const [certificate, setCertificate] = useState<CertificateInfo | null>(null)
  const [hasCertData, setHasCertData] = useState(false)
  const [studentStatus, setStudentStatus] = useState<string>('active')
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        // Fetch recitation data
        const res = await fetch('/api/recitations/my-latest')
        if (res.ok) {
          const data = await res.json()
          setHasCertData(data.has_cert_data || false)
          if (data.recitation) {
            setRecitation(data.recitation)
            if (data.recitation.status === 'session_booked') {
              const bookRes = await fetch('/api/bookings')
              if (bookRes.ok) {
                const bookData = await bookRes.json()
                const bookings = bookData.bookings || []
                const latestBooking = bookings.find(
                  (b: BookingInfo & { status: string }) =>
                    ['confirmed', 'pending'].includes(b.status)
                )
                if (latestBooking) setBooking(latestBooking)
              }
            }
          } else {
            setRecitation({ status: 'no_recitation' })
          }
        } else {
          setRecitation({ status: 'no_recitation' })
        }

        // Fetch certificate data
        const certRes = await fetch(`/api/certificate?t=${Date.now()}`)
        if (certRes.ok) {
          const certData = await certRes.json()
          if (certData.certificate) {
            setCertificate(certData.certificate)
          }
        }

        // Fetch user status
        const meRes = await fetch('/api/auth/me')
        if (meRes.ok) {
          const meData = await meRes.json()
          setStudentStatus(meData.user?.student_status || 'active')
        }

        // Fetch stats
        const statsRes = await fetch('/api/stats?range=month')
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }
      } catch {
        setRecitation({ status: 'no_recitation' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { recitation, booking, certificate, hasCertData, studentStatus, stats, loading }
}

export default function StudentDashboard() {
  const { t, locale } = useI18n()
  const { recitation, booking, certificate, hasCertData, studentStatus, stats, loading } = useStudentData()

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1B5E3B]/20 border-t-[#1B5E3B] rounded-full animate-spin" />
      </div>
    )
  }

  const rawStatus = recitation?.status || 'no_recitation'
  const isSuspended = studentStatus === 'suspended'
  
  // Literal states mapping for Part 3
  let state: 'new' | 'review' | 'waiting' | 'booked' | 'suspended' = 'new'
  
  if (isSuspended) {
    state = 'suspended'
  } else if (rawStatus === 'no_recitation') {
    state = 'new'
  } else if (['pending', 'in_review'].includes(rawStatus)) {
    state = 'review'
  } else if (rawStatus === 'needs_session') {
    state = 'waiting'
  } else if (rawStatus === 'session_booked') {
    state = 'booked'
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-10 px-4">
      <div className="w-full max-w-xl mx-auto text-center space-y-8">
        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">{t.student.dashboard}</h1>
          <p className="text-gray-500">{t.student.fatihaStatus}</p>
        </div>

        {/* State 1: New - لم يسجل تلاوة */}
        {state === 'new' && (
          <div className="bg-white border border-gray-100 rounded-3xl p-10 shadow-sm text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <Mic className="w-10 h-10 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-[#1B5E3B]">{t.student.stateNew}</h2>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                {t.student.noRecitationDesc || (locale === 'ar' ? 'ابدأ رحلتك بتسجيل سورة الفاتحة ليقوم المقرئ بمراجعتها.' : 'Start your journey by recording Surah Al-Fatiha for review.')}
              </p>
            </div>
            <Link href="/student/record" className="inline-flex items-center gap-2 bg-[#1B5E3B] hover:bg-[#124028] text-white font-black py-4 px-10 rounded-2xl transition-all shadow-xl shadow-[#1B5E3B]/20 transform hover:-translate-y-1">
              <Mic className="w-5 h-5" />
              <span>{t.student.recordNowBtn}</span>
            </Link>
          </div>
        )}

        {/* State 2: Review - قيد التقييم */}
        {state === 'review' && (
          <div className="bg-white border border-gray-100 rounded-3xl p-10 shadow-sm text-center space-y-6">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto border border-amber-100">
              <Clock className="w-10 h-10 text-amber-500 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-amber-700">{t.student.stateReview}</h2>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                {t.student.recitationReceivedDesc}
              </p>
            </div>
            <div className="bg-amber-50/50 border border-amber-100/50 rounded-2xl p-4">
              <p className="text-xs text-amber-700 font-bold">{t.student.reviewTakesTime}</p>
            </div>
          </div>
        )}

        {/* State 3: Waiting - ينتظر اختيار موعد */}
        {state === 'waiting' && (
          <div className="bg-white border border-gray-100 rounded-3xl p-10 shadow-sm text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto border border-blue-100">
              <Calendar className="w-10 h-10 text-blue-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-blue-900">{t.student.stateWaiting}</h2>
              <p className="text-blue-700/60 text-sm font-bold">
                {t.student.slotsRemaining} {recitation?.assigned_reader_name || ''}
              </p>
            </div>
            <Link href="/student/booking" className="inline-flex items-center gap-2 bg-[#C9A227] hover:bg-[#A6841E] text-white font-black py-4 px-10 rounded-2xl transition-all shadow-xl shadow-[#C9A227]/30 transform hover:-translate-y-1">
              <Calendar className="w-5 h-5" />
              <span>{t.student.bookSessionBtnBase || 'حجز موعد'}</span>
            </Link>
          </div>
        )}

        {/* State 4: Booked - موعد محجوز */}
        {state === 'booked' && booking && (
          <div className="bg-white border border-gray-100 rounded-[2rem] shadow-xl shadow-gray-200/50 overflow-hidden text-right">
            {/* Premium Header */}
            <div className="relative p-8 pb-10 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A227]/10 rounded-full -mr-16 -mt-16 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#C9A227]/10 rounded-full -ml-12 -mb-12 blur-2xl" />

              <div className="relative flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#C9A227] to-[#A6841E] rounded-3xl flex items-center justify-center shadow-lg shadow-[#C9A227]/30 mb-6 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                  <Video className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">{t.student.appointmentDetails}</h2>
                <div className="inline-flex items-center gap-2 bg-[#C9A227]/10 text-[#5c4718] px-5 py-2 rounded-full text-xs font-black border border-[#C9A227]/20 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-[#C9A227] rounded-full animate-pulse" />
                  {t.student.bookedStatus}
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="px-8 pb-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 p-5 rounded-2xl transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                      <Calendar className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{t.student.sessionDate}</p>
                      <p className="text-sm font-bold text-slate-800">
                        {new Date(booking.slot_start).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 p-5 rounded-2xl transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{t.student.sessionTime}</p>
                      <p className="text-sm font-bold text-slate-800">
                        {new Date(booking.slot_start).toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {new Date(booking.slot_end).toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Join Session Section */}
              <div className="bg-[#1B5E3B] rounded-[1.5rem] p-6 text-white relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-right">
                    <p className="text-white/70 text-xs font-bold mb-1">{t.student.sessionLinkLabel}</p>
                    <p className="text-white text-lg font-black">جاهز للبدء؟</p>
                  </div>
                  {booking.meeting_link ? (
                    <a
                      href={booking.meeting_link.startsWith('http') ? booking.meeting_link : `https://${booking.meeting_link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full md:w-auto flex items-center justify-center gap-3 bg-white text-[#1B5E3B] hover:bg-slate-50 font-black py-4 px-8 rounded-2xl transition-all shadow-xl shadow-black/20 transform hover:-translate-y-1 active:scale-95"
                    >
                      <Video className="w-5 h-5" />
                      <span>{t.student.joinSessionBtn}</span>
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 text-white/50 bg-black/10 px-4 py-3 rounded-xl">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-bold">{t.student.linkPendingMsg}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Modern Comments Section */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{t.student.commentLabel}</h3>
                </div>
                <CommentBox bookingId={booking.id} />
              </div>
            </div>
          </div>
        )}

        {/* State 5: Suspended - معلق */}
        {state === 'suspended' && (
          <div className="bg-red-50 border border-red-100 rounded-3xl p-10 shadow-sm text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-red-100">
              <Clock className="w-10 h-10 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-red-900">{t.student.stateSuspended}</h2>
              <p className="text-red-700/80 text-sm font-medium leading-relaxed max-w-sm mx-auto">
                {locale === 'ar' 
                  ? "لقد انتهت مهلة الـ 3 أيام الممنوحة لك لتحديد موعد الجلسة بعد تحويل تلاوتك للمراجعة."
                  : "The 3-day window to book your session after your recitation review has expired."}
              </p>
            </div>
            <button 
              onClick={async () => {
                const res = await fetch('/api/recitations/request-new-slot', { method: 'POST' });
                if (res.ok) window.location.reload();
              }}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-xl shadow-red-500/20 transform hover:-translate-y-1 active:scale-95"
            >
              <Send className="w-5 h-5" />
              <span>{locale === 'ar' ? "طلب موعد جديد من المقرئ" : "Request a new slot from the reader"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="w-full max-w-4xl mx-auto mt-16 space-y-8 px-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-6 h-6 text-[#1B5E3B]" />
            <h2 className="text-xl font-bold text-gray-900">{t.admin.studentStats.title}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 border border-emerald-100">
                  <Award className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t.admin.studentStats.masteryRate}</p>
                <p className="text-3xl font-black text-emerald-700">{stats.masteryRate}%</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4 border border-blue-100">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t.admin.studentStats.completedSessions}</p>
                <p className="text-3xl font-black text-blue-700">{stats.completedSessions}</p>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-bold text-gray-800">{t.admin.studentStats.progress}</p>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="h-[120px]">
                {stats.progress?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.progress}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '10px' }} />
                      <Bar dataKey="count" fill="#1B5E3B" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">{t.admin.studentStats.noData}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div >
  )
}

function CommentBox({ bookingId }: { bookingId: string }) {
  const { t, locale } = useI18n()
  const [comments, setComments] = useState<Array<{ id: string; user_name: string; comment_text: string; created_at: string }>>([])
  const [newComment, setNewComment] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetch(`/api/bookings/${bookingId}/comments`)
      .then(r => r.ok ? r.json() : { comments: [] })
      .then(d => setComments(d.comments || []))
      .catch(() => { })
  }, [bookingId])

  const handleSend = async () => {
    if (!newComment.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newComment }),
      })
      if (res.ok) {
        const data = await res.json()
        setComments(prev => [...prev, data.comment])
        setNewComment('')
      }
    } catch {
      // ignore
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {comments.length > 0 && (
        <div className="space-y-4 max-h-64 overflow-y-auto px-2 scrollbar-thin scrollbar-thumb-slate-200">
          {comments.map(c => (
            <div key={c.id} className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="text-[10px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">{c.user_name}</span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {new Date(c.created_at).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: 'numeric',
                    month: 'short'
                  })}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tr-none p-4 shadow-sm">
                <p className="text-sm text-slate-700 leading-relaxed">{c.comment_text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="relative group">
        <textarea
          rows={1}
          value={newComment}
          onChange={e => {
            setNewComment(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={t.student.writeCommentPlaceholder}
          className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] pl-16 pr-6 py-4 text-sm text-slate-800 focus:bg-white focus:ring-4 focus:ring-slate-100 focus:border-slate-200 transition-all outline-none resize-none placeholder:text-slate-400 min-h-[56px] max-h-32"
        />
        <button
          onClick={handleSend}
          disabled={!newComment.trim() || sending}
          className="absolute left-3 bottom-2.5 w-11 h-11 bg-[#C9A227] text-white rounded-xl flex items-center justify-center hover:bg-[#A6841E] disabled:opacity-30 transition-all shadow-md active:scale-90"
        >
          {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
