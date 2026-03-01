"use client"

import { useState, use, useEffect, useRef } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { tajweedTags } from "@/lib/mock-data"
import {
  Mic, Pause, Play, SkipBack, SkipForward,
  Send, BookOpen, Plus, Loader2, CheckCircle
} from "lucide-react"

export default function RecitationReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: recitationId } = use(params)
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'

  const [recitation, setRecitation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [notes, setNotes] = useState("")

  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState("1.0x")
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const waveformHeights = [8, 12, 16, 24, 10, 20, 14, 8, 6, 16, 28, 18, 10, 14, 20, 12, 8, 8, 12, 16, 24, 10, 20, 14, 8, 6, 16, 28, 18, 10, 14, 20, 12, 8]

  useEffect(() => {
    async function fetchRecitation() {
      try {
        const res = await fetch(`/api/recitations/${recitationId}`)
        if (!res.ok) throw new Error("Failed to fetch recitation")
        const data = await res.json()
        setRecitation(data.recitation)
        setDuration(data.recitation.audio_duration_seconds || 0)
      } catch (err) {
        setError(t.student.serverError)
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchRecitation()
  }, [recitationId])

  useEffect(() => {
    if (audioRef.current && recitation?.audio_url) {
      const speed = parseFloat(playbackSpeed.replace("x", ""))
      audioRef.current.playbackRate = speed
    }
  }, [playbackSpeed, recitation])



  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "00:00"
    const m = Math.floor(time / 60)
    const s = Math.floor(time % 60)
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newTime = percentage * duration
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (error || !recitation) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl text-center">
        {error || t.reader.recitationNotFound}
      </div>
    )
  }

  if (submitted || recitation.status !== 'pending') {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">{t.reader.reviewSubmittedSuccessfully}</h2>
        <p className="text-muted-foreground mb-6">{t.reader.studentWillBeNotified}</p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/reader/recitations" className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">{t.reader.backToRecitations}</Link>
          <Link href="/reader" className="px-6 py-2.5 border border-border rounded-lg font-medium text-foreground hover:bg-muted transition-colors">{t.reader.dashboard}</Link>
        </div>
      </div>
    )
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="space-y-6">
      <audio
        ref={audioRef}
        src={recitation.audio_url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={(e) => {
          if (!duration) setDuration(e.currentTarget.duration)
        }}
      />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">{t.reader.newRecitationBadge}</span>
              <h2 className="text-2xl font-bold text-foreground">{t.reader.studentNameLabel} {recitation.student_name}</h2>
            </div>
            <p className="text-muted-foreground flex items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1"><Mic className="w-4 h-4" /> {t.reader.surah} {recitation.surah_name}</span>
              <span className="text-slate-300">|</span>
              <span>{new Date(recitation.created_at).toLocaleDateString(locale === 'ar' ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-start">
          {/* Main Content: Audio & Text */}
          <div className="lg:col-span-12 space-y-6">
            {/* Simple Audio Container */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-8">
                  <button onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 5 }} className="text-slate-400 hover:text-primary transition-colors"><SkipBack className="w-8 h-8 rtl:rotate-180" /></button>
                  <button onClick={togglePlay} className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all">
                    {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1 rtl:mr-1 rtl:ml-0" />}
                  </button>
                  <button onClick={() => { if (audioRef.current) audioRef.current.currentTime += 5 }} className="text-slate-400 hover:text-primary transition-colors"><SkipForward className="w-8 h-8 rtl:rotate-180" /></button>
                </div>

                <div className="w-full space-y-2">
                  <div className="relative w-full h-3 bg-muted rounded-full cursor-pointer overflow-hidden" onClick={handleSeek}>
                    <div className="absolute top-0 left-0 h-full bg-primary" style={{ width: `${progressPercentage}%` }} />
                  </div>
                  <div className="flex justify-between text-sm font-mono text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assessment & Notes */}
          <aside className="lg:col-span-12 flex flex-col">
            <div className="bg-card rounded-2xl shadow-sm border border-border p-8 space-y-8">
              <h3 className="text-2xl font-bold text-foreground border-b border-border pb-6">{isAr ? "الملاحظات التعليمية" : "Educational Notes"}</h3>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-foreground">{t.student.readerNotes}</label>
                <textarea
                  className="w-full min-h-[300px] p-6 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-lg text-foreground leading-relaxed"
                  placeholder={t.reader.notesPlaceholder}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  readOnly={submitted || recitation.status !== 'pending'}
                />
              </div>

              {!submitted && recitation.status === 'pending' && (
                <div className="pt-6 border-t border-border flex justify-center">
                  <button
                    onClick={async () => {
                      setSubmitting(true)
                      try {
                        const res = await fetch(`/api/recitations/${recitationId}/review`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            verdict: 'mastered',
                            feedback: notes,
                          }),
                        })
                        if (res.ok) setSubmitted(true)
                        else throw new Error("Save failed")
                      } catch (err) {
                        alert(isAr ? "حدث خطأ أثناء الحفظ" : "Error saving notes")
                      } finally {
                        setSubmitting(false)
                      }
                    }}
                    disabled={submitting}
                    className="w-full max-w-md py-4 px-8 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                    {submitting ? t.reader.savingNow : (isAr ? "إرسال الملاحظات" : "Send Notes")}
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

