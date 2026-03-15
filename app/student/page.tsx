"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { Mic, Clock, CheckCircle, Calendar, ArrowLeft, Video, MessageSquare, Send, Award, FileText, User, Building, MapPin, ExternalLink, Download, BarChart3, TrendingUp, Loader2, Info } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { RecitationRecorder } from '@/components/student/RecitationRecorder'

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

        const certRes = await fetch(`/api/certificate?t=${Date.now()}`)
        if (certRes.ok) {
          const certData = await certRes.json()
          if (certData.certificate) setCertificate(certData.certificate)
        }

        const meRes = await fetch('/api/auth/me')
        if (meRes.ok) {
          const meData = await meRes.json()
          setStudentStatus(meData.user?.student_status || 'active')
        }

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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const rawStatus = recitation?.status || 'no_recitation'
  const isSuspended = studentStatus === 'suspended'
  
  let state: 'new' | 'review' | 'waiting' | 'booked' | 'suspended' = 'new'
  if (isSuspended) state = 'suspended'
  else if (rawStatus === 'no_recitation') state = 'new'
  else if (['pending', 'in_review'].includes(rawStatus)) state = 'review'
  else if (rawStatus === 'needs_session') state = 'waiting'
  else if (rawStatus === 'session_booked') state = 'booked'

  return (
    <div className="max-w-[1400px] mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Dynamic Header with Status Indicator */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/60">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-2 flex items-center gap-3">
            {t.student.dashboard}
            <span className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-widest border border-primary/20">
              {studentStatus === 'active' ? (locale === 'ar' ? 'فعال' : 'Active') : (locale === 'ar' ? 'معلق' : 'Suspended')}
            </span>
          </h1>
          <p className="text-muted-foreground font-medium">{t.student.fatihaStatus}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-card/50 backdrop-blur-sm border border-border px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm">
            <Info className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-bold text-foreground">
              {locale === 'ar' ? 'آخر تحديث: مؤخراً' : 'Last activity: Recently'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* RIGHT COLUMN: MAIN CONTENT (STATUS & APPOINTMENT) */}
        <div className="xl:col-span-7 space-y-8 order-2 xl:order-1">
          <div className="bg-card/40 backdrop-blur-md border border-border/80 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden h-full">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full blur-3xl -ml-24 -mb-24" />

            {/* State Management Section */}
            <div className="relative z-10 h-full flex flex-col justify-center">
              
              {/* STATE 1: NEW */}
              {state === 'new' && (
                <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="bg-primary/10 border border-primary/20 rounded-3xl p-8 max-w-lg mx-auto">
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/30">
                      <Mic className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black text-primary mb-3">{t.student.stateNew}</h2>
                    <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                      {t.student.noRecitationDesc || (locale === 'ar' ? 'ابدأ رحلتك بتسجيل سورة الفاتحة ليقوم المقرئ بمراجعتها.' : 'Start your journey by recording Surah Al-Fatiha for review.')}
                    </p>
                  </div>
                  <RecitationRecorder onSuccess={() => window.location.reload()} />
                </div>
              )}

              {/* STATE 2: REVIEW */}
              {state === 'review' && (
                <div className="text-center space-y-8 py-10">
                  <div className="w-24 h-24 bg-amber-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-amber-500/20 transform rotate-3 shadow-lg shadow-amber-500/5">
                    <Clock className="w-12 h-12 text-amber-600 animate-pulse" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-black text-amber-600">{t.student.stateReview}</h2>
                    <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-sm mx-auto">
                      {t.student.recitationReceivedDesc}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-3 bg-amber-500/10 text-amber-600 px-6 py-3 rounded-2xl border border-amber-500/20 text-xs font-black">
                     <span className="w-2 h-2 bg-amber-600 rounded-full animate-ping" />
                     {t.student.reviewTakesTime}
                  </div>
                </div>
              )}

              {/* STATE 3: WAITING */}
              {state === 'waiting' && (
                <div className="text-center space-y-10 py-10 animate-in fade-in zoom-in duration-500">
                  <div className="w-24 h-24 bg-blue-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-blue-500/20 transform -rotate-3 shadow-lg shadow-blue-500/5">
                    <Calendar className="w-12 h-12 text-blue-600" />
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-3xl font-black text-foreground">{t.student.stateWaiting}</h2>
                    <p className="text-blue-600 font-black text-xs uppercase tracking-widest bg-blue-500/10 px-4 py-2 rounded-full inline-block border border-blue-500/20">
                      {t.student.slotsRemaining} {recitation?.assigned_reader_name || ''}
                    </p>
                  </div>
                  <Link href="/student/booking" className="inline-flex items-center gap-4 bg-primary text-primary-foreground font-black py-5 px-12 rounded-[1.5rem] transition-all shadow-2xl shadow-primary/30 transform hover:-translate-y-1 group">
                    <Calendar className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="text-lg">{t.student.bookSessionBtnBase || 'حجز موعد'}</span>
                  </Link>
                </div>
              )}

              {/* STATE 4: BOOKED */}
              {state === 'booked' && booking && (
                <div className="space-y-8 animate-in fade-in duration-700">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-black text-foreground flex items-center gap-3">
                       <Video className="w-6 h-6 text-primary" />
                       {t.student.appointmentDetails}
                    </h2>
                    <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black border border-primary/20 uppercase tracking-widest">
                       {t.student.bookedStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-card/50 border border-border p-6 rounded-3xl group hover:border-primary/30 transition-all shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-background rounded-2xl shadow-inner flex items-center justify-center shrink-0 border border-border group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                          <Calendar className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{t.student.sessionDate}</p>
                          <p className="text-sm font-bold text-foreground leading-tight">
                            {new Date(booking.slot_start).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-card/50 border border-border p-6 rounded-3xl group hover:border-primary/30 transition-all shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-background rounded-2xl shadow-inner flex items-center justify-center shrink-0 border border-border group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                          <Clock className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{t.student.sessionTime}</p>
                          <p className="text-sm font-bold text-foreground leading-tight">
                            {new Date(booking.slot_start).toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Join Action Card */}
                  <div className="bg-primary rounded-[2rem] p-8 text-primary-foreground relative overflow-hidden group shadow-2xl shadow-primary/20">
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
                    <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                       <div className="text-center md:text-right space-y-1">
                          <p className="text-primary-foreground/70 text-xs font-bold uppercase tracking-widest">{t.student.sessionLinkLabel}</p>
                          <p className="text-2xl font-black">جاهز للبدء؟</p>
                       </div>
                       {booking.meeting_link ? (
                         <a
                           href={booking.meeting_link.startsWith('http') ? booking.meeting_link : `https://${booking.meeting_link}`}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="w-full md:w-auto flex items-center justify-center gap-3 bg-white text-primary hover:bg-white/90 font-black py-5 px-10 rounded-2xl transition-all shadow-xl transform hover:-translate-y-1 active:scale-95"
                         >
                           <Video className="w-6 h-6" />
                           <span className="text-lg">{t.student.joinSessionBtn}</span>
                         </a>
                       ) : (
                         <div className="flex items-center gap-3 text-white/60 bg-white/10 px-6 py-4 rounded-2xl border border-white/20">
                           <Clock className="w-5 h-5 animate-pulse" />
                           <span className="text-sm font-black uppercase tracking-tight">{t.student.linkPendingMsg}</span>
                         </div>
                       )}
                    </div>
                  </div>

                  {/* Comments Sub-section */}
                  <div className="pt-6 border-t border-border">
                    <div className="flex items-center gap-3 mb-6">
                      <MessageSquare className="w-5 h-5 text-muted-foreground" />
                      <h3 className="text-xs font-black text-foreground uppercase tracking-[0.2em]">{t.student.commentLabel}</h3>
                    </div>
                    <CommentBox bookingId={booking.id} />
                  </div>
                </div>
              )}

              {/* STATE 5: SUSPENDED */}
              {state === 'suspended' && (
                <div className="text-center space-y-8 py-10">
                   <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto border border-destructive/20 shadow-lg shadow-destructive/5">
                      <ArrowLeft className="w-12 h-12 text-destructive" />
                   </div>
                   <div className="space-y-4">
                      <h2 className="text-3xl font-black text-destructive">{t.student.stateSuspended}</h2>
                      <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-sm mx-auto">
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
                     className="inline-flex items-center gap-3 bg-card border-2 border-destructive/20 hover:bg-destructive hover:text-white text-destructive font-black py-5 px-10 rounded-[1.5rem] transition-all transform hover:-translate-y-1 shadow-lg"
                   >
                     <Send className="w-5 h-5" />
                     <span>{locale === 'ar' ? "طلب موعد جديد" : "Request new slot"}</span>
                   </button>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* LEFT COLUMN: STATISTICS & SIDEBAR */}
        <div className="xl:col-span-5 space-y-8 order-1 xl:order-2">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-card/40 backdrop-blur-md border border-border/80 rounded-[2rem] p-6 shadow-sm group hover:border-primary/30 transition-all overflow-hidden relative">
               <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />
               <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20 group-hover:scale-110 transition-transform">
                  <Award className="w-6 h-6 text-primary" />
               </div>
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2">{t.admin?.studentStats?.masteryRate}</p>
               <div className="flex items-baseline gap-2">
                 <p className="text-4xl font-black text-foreground">{stats?.masteryRate || 0}</p>
                 <span className="text-xl font-bold text-primary">%</span>
               </div>
            </div>
            
            <div className="bg-card/40 backdrop-blur-md border border-border/80 rounded-[2rem] p-6 shadow-sm group hover:border-blue-500/30 transition-all overflow-hidden relative">
               <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/20" />
               <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
               </div>
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2">{t.admin?.studentStats?.completedSessions}</p>
               <div className="flex items-baseline gap-1">
                 <p className="text-4xl font-black text-foreground">{stats?.completedSessions || 0}</p>
               </div>
            </div>
          </div>

          {/* Progress Chart Card */}
          <div className="bg-card/40 backdrop-blur-md border border-border/80 rounded-[2rem] p-8 shadow-sm h-full max-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-black text-foreground uppercase tracking-[0.15em]">{t.admin?.studentStats?.progress}</h3>
               </div>
               <Link href="/student/recitations" className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter">
                  {locale === 'ar' ? 'عرض السجل' : 'View History'}
               </Link>
            </div>
            
            <div className="flex-1 w-full min-h-[220px]">
               {stats?.progress?.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={stats.progress} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                     <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="0%" stopColor="var(--primary)" stopOpacity={1} />
                           <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.4} />
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
                     <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10, fontWeight: 700 }} 
                        axisLine={false} 
                        tickLine={false}
                        dy={10}
                     />
                     <YAxis hide />
                     <Tooltip 
                        cursor={{ fill: 'var(--primary)', opacity: 0.05 }}
                        contentStyle={{ 
                           borderRadius: '16px', 
                           border: '1px solid var(--border)', 
                           backgroundColor: 'rgba(var(--card), 0.8)',
                           backdropFilter: 'blur(12px)',
                           WebkitBackdropFilter: 'blur(12px)',
                           boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                           fontSize: '11px',
                           fontWeight: '800'
                        }} 
                     />
                     <Bar dataKey="count" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={20} />
                   </BarChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center">
                       <BarChart3 className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground">{t.admin?.studentStats?.noData}</p>
                 </div>
               )}
            </div>
          </div>

          {/* Quick Shortcuts / Info Card */}
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-border/80 rounded-[2rem] p-6 shadow-sm">
             <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center shadow-sm border border-border">
                   <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                   <h4 className="text-xs font-black text-foreground uppercase tracking-widest">{locale === 'ar' ? 'رحلتك التعليمية' : 'Learning Journey'}</h4>
                   <p className="text-[10px] text-muted-foreground font-medium">{locale === 'ar' ? 'استمر في التقدم نحو الإتقان' : 'Keep progressing towards mastery'}</p>
                </div>
             </div>
             <div className="space-y-3">
                <Link href="/student/recitations" className="flex items-center justify-between p-4 bg-card/60 rounded-2xl border border-border/40 hover:border-primary/30 transition-all group">
                   <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-xs font-black">{locale === 'ar' ? 'تلاواتي الأخيرة' : 'Last Recitations'}</span>
                   </div>
                   <ArrowLeft className="w-3 h-3 text-muted-foreground group-hover:-translate-x-1 transition-transform" />
                </Link>
                <Link href="/student/certificates" className="flex items-center justify-between p-4 bg-card/60 rounded-2xl border border-border/40 hover:border-primary/30 transition-all group">
                   <div className="flex items-center gap-3">
                      <Award className="w-4 h-4 text-primary" />
                      <span className="text-xs font-black">{locale === 'ar' ? 'شهاداتي' : 'Certificates'}</span>
                   </div>
                   <ArrowLeft className="w-3 h-3 text-muted-foreground group-hover:-translate-x-1 transition-transform" />
                </Link>
             </div>
          </div>
        </div>

      </div>
    </div>
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
                <span className="text-[10px] font-black text-foreground bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10">{c.user_name}</span>
                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">
                  {new Date(c.created_at).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: 'numeric',
                    month: 'short'
                  })}
                </span>
              </div>
              <div className="bg-card/50 border border-border/80 rounded-[1.5rem] rounded-tr-none p-5 shadow-sm">
                <p className="text-sm text-foreground leading-relaxed font-bold">{c.comment_text}</p>
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
          className="w-full bg-card/60 backdrop-blur-sm border border-border rounded-[1.5rem] pl-16 pr-6 py-5 text-sm text-foreground focus:bg-card focus:ring-8 focus:ring-primary/5 focus:border-primary/30 transition-all outline-none resize-none placeholder:text-muted-foreground min-h-[64px] max-h-40 font-bold shadow-inner"
        />
        <button
          onClick={handleSend}
          disabled={!newComment.trim() || sending}
          className="absolute left-4 bottom-3 w-12 h-12 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 transition-all shadow-xl shadow-primary/20 active:scale-90"
        >
          {sending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5 p-0.5" />}
        </button>
      </div>
    </div>
  )
}
