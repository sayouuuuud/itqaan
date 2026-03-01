"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { Mic, Clock, CheckCircle, Calendar, ArrowLeft, Video, MessageSquare, Send, Award, FileText, User, Building, MapPin } from 'lucide-react'

type FatihaStatus = 'no_recitation' | 'pending' | 'in_review' | 'mastered' | 'needs_session' | 'session_booked'

interface LatestRecitation {
  status: FatihaStatus
  created_at?: string
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

      } catch {
        setRecitation({ status: 'no_recitation' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { recitation, booking, certificate, hasCertData, loading }
}

export default function StudentDashboard() {
  const { t, locale } = useI18n()
  const { recitation, booking, certificate, hasCertData, loading } = useStudentData()

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0B3D2E]/20 border-t-[#0B3D2E] rounded-full animate-spin" />
      </div>
    )
  }

  const rawStatus = recitation?.status || 'no_recitation'
  // If they mastered BUT already submitted cert data, we treat it as if they are back to normal dashboard
  // but we can maybe show a different small banner or just hide the big widget.
  const status = (rawStatus === 'mastered' && hasCertData) ? 'no_recitation' : rawStatus

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-10 px-4">
      <div className="w-full max-w-xl mx-auto text-center space-y-8">
        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">{t.student.dashboard}</h1>
          <p className="text-gray-500">{t.student.fatihaStatus}</p>
        </div>

        {/* State: No recitation yet */}
        {status === 'no_recitation' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm text-center space-y-6">
            <div className="w-20 h-20 bg-[#D4A843]/10 rounded-full flex items-center justify-center mx-auto border border-[#D4A843]/20">
              <Mic className="w-10 h-10 text-[#D4A843]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-800">{t.student.noRecitationTitle}</h2>
              <p className="text-gray-500 text-sm leading-relaxed">{t.student.noRecitationDesc}</p>
            </div>
            <Link href="/student/submit" className="inline-flex items-center gap-2 bg-[#D4A843] hover:bg-[#C49A3A] text-white font-bold py-3.5 px-8 rounded-xl transition-colors shadow-lg shadow-[#D4A843]/20">
              <Mic className="w-5 h-5" />
              <span>{t.student.recordNowBtn}</span>
            </Link>
          </div>
        )}

        {/* State: Pending / In Review */}
        {(status === 'pending' || status === 'in_review') && (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm text-center space-y-6">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto border border-amber-100">
              <Clock className="w-10 h-10 text-amber-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-800">{t.student.recitationReceived}</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                {t.student.recitationReceivedDesc}
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-sm font-bold text-amber-700 mb-1">{t.student.statusInReviewBanner}</p>
              <p className="text-xs text-amber-600/80">
                {t.student.reviewTakesTime}
              </p>
            </div>
          </div>
        )}

        {/* State: Mastered */}
        {status === 'mastered' && (
          <div className="space-y-6">
            {/* Certificate Section */}
            {certificate ? (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-8 shadow-lg">
                <div className="text-center space-y-6">
                  {/* Certificate Badge */}
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center mx-auto shadow-xl border-4 border-white">
                      <Award className="w-12 h-12 text-white" />
                    </div>
                    {certificate.certificate_issued && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Certificate Title */}
                  <div className="space-y-3">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                      {certificate.certificate_issued
                        ? (locale === 'ar' ? '🎉 شهادتك مُصدَرة!' : '🎉 Your Certificate is Issued!')
                        : (locale === 'ar' ? '📋 بيانات شهادتك محفوظة' : '📋 Your Certificate Data is Saved')
                      }
                    </h2>
                    <p className="text-gray-600 text-base leading-relaxed max-w-md mx-auto">
                      {certificate.certificate_issued
                        ? (locale === 'ar' ? 'تهانينا! تم إصدار شهادة إتقان الفاتحة الرسمية لك. يمكنك الآن تحميلها والاحتفاظ بها.' : 'Congratulations! Your official Al-Fatiha Mastery Certificate has been issued. You can now download it and keep it.')
                        : (locale === 'ar' ? 'سيقوم المسؤولون بمراجعة البيانات وإصدار الشهادة قريباً. سنرسل لك إشعاراً عند الانتهاء.' : 'Administrators will review your data and issue the certificate soon. We\'ll notify you when it\'s ready.')
                      }
                    </p>
                  </div>

                  {/* Certificate Details Card */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-emerald-100">
                    <h3 className="text-lg font-bold text-emerald-800 mb-4 flex items-center justify-center gap-2">
                      <FileText className="w-5 h-5" />
                      {locale === 'ar' ? 'تفاصيل الشهادة' : 'Certificate Details'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-emerald-700" />
                          </div>
                          <div className="flex-1 text-right">
                            <p className="text-sm text-emerald-600 font-medium">{t.student.universityLabel}</p>
                            <p className="text-base font-bold text-emerald-800">{certificate.university}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                            <Building className="w-5 h-5 text-teal-700" />
                          </div>
                          <div className="flex-1 text-right">
                            <p className="text-sm text-teal-600 font-medium">{t.student.collegeLabel}</p>
                            <p className="text-base font-bold text-teal-800">{certificate.college}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-cyan-700" />
                          </div>
                          <div className="flex-1 text-right">
                            <p className="text-sm text-cyan-600 font-medium">{locale === 'ar' ? 'المدينة' : 'City'}</p>
                            <p className="text-base font-bold text-cyan-800">{certificate.city}</p>
                          </div>
                        </div>
                      </div>
                      <div className={`rounded-xl p-4 border-2 ${certificate.certificate_issued ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${certificate.certificate_issued ? 'bg-green-100' : 'bg-amber-100'}`}>
                            {certificate.certificate_issued ? (
                              <CheckCircle className="w-5 h-5 text-green-700" />
                            ) : (
                              <Clock className="w-5 h-5 text-amber-700" />
                            )}
                          </div>
                          <div className="flex-1 text-right">
                            <p className={`text-sm font-medium ${certificate.certificate_issued ? 'text-green-600' : 'text-amber-600'}`}>
                              {locale === 'ar' ? 'حالة الشهادة' : 'Certificate Status'}
                            </p>
                            <p className={`text-base font-bold ${certificate.certificate_issued ? 'text-green-800' : 'text-amber-800'}`}>
                              {certificate.certificate_issued
                                ? (locale === 'ar' ? 'مُصدَرة' : 'Issued')
                                : (locale === 'ar' ? 'بانتظار المراجعة' : 'Pending Review')
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Download Button */}
                  {certificate.certificate_issued && certificate.certificate_pdf_url && (
                    <div className="pt-2">
                      <a
                        href={certificate.certificate_pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/40 transform hover:scale-105"
                      >
                        <span className="text-lg">{locale === 'ar' ? 'تحميل الشهادة' : 'Download Certificate'}</span>
                        <ArrowLeft className="w-5 h-5" />
                      </a>
                    </div>
                  )}

                  {/* Ceremony Info */}
                  {certificate.certificate_issued && certificate.ceremony_date && (
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-6 mt-6 shadow-md">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-center">
                          <h4 className="text-lg font-bold text-purple-800">
                            {locale === 'ar' ? 'حفل التكريم' : 'Ceremony'}
                          </h4>
                          <p className="text-sm text-purple-600">
                            {locale === 'ar' ? 'موعد الحفل والتكريم' : 'Ceremony Date & Time'}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-purple-100">
                        <p className="text-center text-lg font-bold text-purple-800">
                          {new Date(certificate.ceremony_date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-center text-base font-semibold text-purple-700 mt-1">
                          {new Date(certificate.ceremony_date).toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                  <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-emerald-700">{t.student.congratsMastered}</h2>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {t.student.masteredDesc}
                  </p>
                </div>
                <Link href="/student/certificate" className="inline-flex items-center gap-2 bg-[#0B3D2E] hover:bg-[#0A3528] text-white font-bold py-3.5 px-8 rounded-xl transition-colors">
                  <span>{t.student.completeCertData}</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* State: Needs Session */}
        {status === 'needs_session' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm text-center space-y-6">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto border border-blue-100">
              <Calendar className="w-10 h-10 text-blue-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-800">{t.student.needsSessionTitle}</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                {t.student.needsSessionDesc}
              </p>
            </div>
            <Link href="/student/booking" className="inline-flex items-center gap-2 bg-[#D4A843] hover:bg-[#C49A3A] text-white font-bold py-3.5 px-8 rounded-xl transition-colors shadow-lg shadow-[#D4A843]/20">
              <Calendar className="w-5 h-5" />
              <span>{t.student.bookSessionBtnBase}</span>
            </Link>
          </div>
        )}

        {/* State: Session Booked */}
        {status === 'session_booked' && booking && (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm text-right overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-50 bg-gray-50/30 text-center">
              <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-100">
                <Video className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">{t.student.appointmentDetails}</h2>
              <div className="inline-flex items-center gap-2 mt-2 bg-purple-50 text-purple-700 px-4 py-1.5 rounded-full text-sm font-bold border border-purple-100">
                <span>{t.student.bookedStatus}</span>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-sm text-gray-500">{t.student.sessionDate}</span>
                <span className="text-sm font-bold text-gray-800">
                  {new Date(booking.slot_start).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-sm text-gray-500">{t.student.sessionTime}</span>
                <span className="text-sm font-bold text-gray-800">
                  {new Date(booking.slot_start).toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  {' - '}
                  {new Date(booking.slot_end).toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Meeting Link */}
              <div className="py-3 border-b border-gray-50">
                <span className="text-sm text-gray-500 block mb-2">{t.student.sessionLinkLabel}</span>
                {booking.meeting_link ? (
                  <a
                    href={booking.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#0B3D2E] hover:bg-[#0A3528] text-white font-bold py-2.5 px-6 rounded-xl transition-colors text-sm"
                  >
                    <Video className="w-4 h-4" />
                    <span>{t.student.joinSessionBtn}</span>
                  </a>
                ) : (
                  <p className="text-sm text-gray-400">{t.student.linkPendingMsg}</p>
                )}
              </div>

              {/* Comments Section */}
              <div className="py-3">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">{t.student.commentLabel}</span>
                </div>
                <CommentBox bookingId={booking.id} />
              </div>
            </div>
          </div>
        )}
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
    <div className="space-y-3">
      {comments.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {comments.map(c => (
            <div key={c.id} className="bg-gray-50 rounded-xl p-3 text-right border border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}</span>
                <span className="text-xs font-bold text-gray-600">{c.user_name}</span>
              </div>
              <p className="text-sm text-gray-700">{c.comment_text}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={handleSend}
          disabled={!newComment.trim() || sending}
          className="px-4 py-2.5 bg-[#0B3D2E] text-white rounded-xl text-sm font-medium hover:bg-[#0A3528] disabled:opacity-50 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
        <input
          type="text"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={t.student.writeCommentPlaceholder}
          className="flex-1 border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E] placeholder:text-gray-400 bg-gray-50/30"
        />
      </div>
    </div>
  )
}
