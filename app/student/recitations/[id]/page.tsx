"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowRight, Mic, Clock, CheckCircle, Calendar, Loader2, User, Volume2, BookOpen, Play, Pause } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"

type Recitation = {
  id: string
  surah_name: string
  ayah_from: number
  ayah_to: number
  status: string
  created_at: string
  audio_url: string | null
  audio_duration_seconds: number | null
  student_notes: string | null
  reader_name: string | null
}

type Review = {
  id: string
  detailed_feedback: string | null
  verdict: string
}

export default function RecitationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { t, locale } = useI18n()

  const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: t.student.statusPending, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    in_review: { label: t.student.statusInReview, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    mastered: { label: t.student.statusMastered, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
    needs_session: { label: t.student.statusNeedsSession, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
    session_booked: { label: t.student.statusBooked, color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  }
  const [recitation, setRecitation] = useState<Recitation | null>(null)
  const [review, setReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const handleDelete = async () => {
    if (!recitation) return
    if (!confirm(t.student.deleteRecitationConfirm)) return

    try {
      const res = await fetch(`/api/recitations/${recitation.id}`, { method: "DELETE" })
      if (res.ok) {
        router.push("/student/recitations")
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || t.student.bookingError)
      }
    } catch (err) {
      alert(t.student.serverError)
    }
  }

  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime
      const duration = audioRef.current.duration
      setCurrentTime(current)
      setProgress((current / duration) * 100 || 0)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = (Number(e.target.value) / 100) * audioRef.current.duration
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
      setProgress(Number(e.target.value))
    }
  }

  const formatSecs = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    if (!id) return
    fetch(`/api/recitations/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || !data.recitation) { setNotFound(true) } else {
          setRecitation(data.recitation)
          if (data.reviews && data.reviews.length > 0) setReview(data.reviews[0])
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  const formatDuration = (secs: number | null) => {
    if (!secs) return "—"
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`
  }

  if (loading) return (
    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" /></div>
  )

  if (notFound || !recitation) return (
    <div className="text-center py-20">
      <p className="text-slate-500">{t.student.recitationNotFound}</p>
      <Link href="/student/recitations" className="mt-4 inline-block text-[#0B3D2E] font-medium hover:underline">{t.student.back}</Link>
    </div>
  )

  const cfg = STATUS_CONFIG[recitation.status] || STATUS_CONFIG.pending

  return (
    <div className="max-w-3xl space-y-5">
      {/* Breadcrumb */}
      <Link href="/student/recitations" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors w-fit">
        <ArrowRight className="w-4 h-4 rtl:rotate-180" />
        {t.student.backToRecitationsHistory}
      </Link>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0B3D2E]/6 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-[#0B3D2E]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{recitation.surah_name}</h1>
              <p className="text-slate-500 text-sm mt-1">
                {t.student.ayah} {recitation.ayah_from} — {recitation.ayah_to} •{" "}
                {new Date(recitation.created_at).toLocaleDateString(locale === 'ar' ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
            {recitation.status !== 'pending' && recitation.status !== 'in_review' && (
              <button
                onClick={handleDelete}
                className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-full transition-colors font-medium border border-transparent hover:border-red-200"
                title={t.student.deleteRecitationBtn}
              >
                {t.student.deleteRecitationBtn} 🗑️
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Audio */}
      {recitation.audio_url && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Volume2 className="w-5 h-5 text-[#0B3D2E]" />
            <h2 className="font-bold text-slate-700">{t.student.audioRecording}</h2>
            {recitation.audio_duration_seconds && (
              <span className="text-xs text-slate-400 mr-auto flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />{formatDuration(recitation.audio_duration_seconds)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 p-4 rounded-xl">
            <audio
              ref={audioRef}
              src={recitation.audio_url}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />

            <button
              onClick={togglePlay}
              className="w-12 h-12 shrink-0 rounded-full bg-[#D4A843] hover:bg-[#C49A3A] hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-white shadow-md shadow-[#D4A843]/20"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1 rtl:mr-1 rtl:ml-0" />}
            </button>

            <div className="flex-1 flex flex-col gap-2 relative">
              <input
                type="range"
                min="0" max="100"
                value={progress}
                onChange={handleSeek}
                className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#D4A843]"
              />
              <div
                className="absolute top-0 left-0 h-2 bg-[#D4A843] rounded-full rtl:right-0 rtl:left-auto pointer-events-none"
                style={{ width: `${progress}%` }}
              />

              <div className="flex justify-between text-[11px] text-slate-400 font-mono font-medium px-1">
                <span>{formatSecs(currentTime)}</span>
                <span>{formatSecs(audioRef.current?.duration || recitation.audio_duration_seconds || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { icon: User, label: t.student.reviewByReaderLabel, value: recitation.reader_name || t.student.assignedAuto },
          { icon: Clock, label: t.student.recordingDurationLabel, value: formatDuration(recitation.audio_duration_seconds) },
          { icon: Calendar, label: t.student.sendingDateLabel, value: new Date(recitation.created_at).toLocaleDateString(locale === 'ar' ? "ar-SA" : "en-US") },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <Icon className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 font-medium">{label}</p>
              <p className="text-sm font-semibold text-slate-700">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Notes from Student */}
      {recitation.student_notes && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-slate-700 mb-3">{t.student.myNotesLabel}</h2>
          <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl">{recitation.student_notes}</p>
        </div>
      )}

      {/* Review from Reader */}
      {review && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-slate-700">{t.student.readerEvaluation}</h2>
          </div>

          {review.detailed_feedback && (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-emerald-700 mb-2">ملاحظات المقرئ</p>
              <p className="text-sm text-slate-700 leading-relaxed">{review.detailed_feedback}</p>
            </div>
          )}
        </div>
      )}

      {/* CTA for needs_session */}
      {recitation.status === "needs_session" && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-blue-600 shrink-0" />
              <div>
                <p className="font-bold text-blue-800">{t.student.detailNeedsSessionTitle}</p>
                <p className="text-sm text-blue-600 mt-0.5">{t.student.detailNeedsSessionDesc}</p>
              </div>
            </div>
            <Link href="/student/booking" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
              {t.student.bookSessionCTA}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
