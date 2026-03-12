"use client"

import { useState, use, useEffect, useRef } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import {
  Mic, Pause, Play, SkipBack, SkipForward,
  SendHorizontal, Loader2, CheckCircle2,
  CalendarClock, Award, ChevronLeft, ChevronRight,
  Info
} from "lucide-react"

export default function RecitationReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: recitationId } = use(params)
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'

  const [recitation, setRecitation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [notes, setNotes] = useState("")
  const [verdict, setVerdict] = useState<"mastered" | "needs_session" | null>(null)
  const [mistakeWords, setMistakeWords] = useState<string[]>([])
  const [currentMistakeWord, setCurrentMistakeWord] = useState("")

  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState("1.0")
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const audioRef = useRef<HTMLAudioElement | null>(null)

  const serverErrorMsg = t.student?.serverError ?? (isAr ? "تعذّر الاتصال بالخادم" : "Server connection error")

  useEffect(() => {
    async function fetchRecitation() {
      try {
        const res = await fetch(`/api/recitations/${recitationId}`)
        if (!res.ok) throw new Error("Failed to fetch recitation")
        const data = await res.json()
        setRecitation(data.recitation)
        setDuration(data.recitation.audio_duration_seconds || 0)

        if (data.recitation.review?.detailed_feedback) {
          setNotes(data.recitation.review.detailed_feedback)
        }
        if (data.recitation.review?.verdict) {
          setVerdict(data.recitation.review.verdict)
        }
      } catch (err) {
        setError(serverErrorMsg)
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchRecitation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recitationId])

  useEffect(() => {
    if (audioRef.current && recitation?.audio_url) {
      audioRef.current.playbackRate = parseFloat(playbackSpeed)
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

  const handleSubmit = async () => {
    if (!verdict) {
      setSubmitError(isAr ? "يجب اختيار القرار أولاً" : "Please select a verdict first")
      return
    }
    setSubmitError("")
    setSubmitting(true)
    try {
      const res = await fetch(`/api/recitations/${recitationId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verdict,
          feedback: notes,
          mistakeWords,
        }),
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json()
        setSubmitError(data.error || (isAr ? "حدث خطأ أثناء الحفظ" : "Error saving review"))
      }
    } catch {
      setSubmitError(isAr ? "حدث خطأ أثناء الحفظ" : "Error saving review")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="w-10 h-10 text-[#1B5E3B] animate-spin" />
      </div>
    )
  }

  if (error || !recitation) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 bg-red-50 border border-red-100 rounded-3xl text-center shadow-sm">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Info className="w-8 h-8 text-red-600" />
        </div>
        <p className="text-red-700 font-bold mb-2">{error || t.reader.recitationNotFound}</p>
        <Link href="/reader/recitations" className="text-sm text-red-600 underline">
          {t.reader.backToRecitations}
        </Link>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-6">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-100
          ${verdict === 'mastered' ? 'bg-emerald-500 text-white' : 'bg-[#C9A227] text-white'}`}>
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">{t.reader.reviewSubmittedSuccessfully}</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">{t.reader.studentWillBeNotified}</p>
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-700 mb-10">
          {verdict === 'mastered' ? (
            <>
              <Award className="w-5 h-5 text-emerald-600" />
              <span>{isAr ? 'تم تقييم التلاوة: متقن' : 'Verdict: Mastered'}</span>
            </>
          ) : (
            <>
              <CalendarClock className="w-5 h-5 text-[#C9A227]" />
              <span>{isAr ? 'تم تقييم التلاوة: يحتاج جلسة' : 'Verdict: Needs Session'}</span>
            </>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/reader/recitations" className="w-full sm:w-auto px-8 py-3.5 bg-[#1B5E3B] text-white rounded-2xl font-bold shadow-lg shadow-emerald-900/10 hover:bg-[#124028] transition-all">
            {t.reader.backToRecitations}
          </Link>
          <Link href="/reader" className="w-full sm:w-auto px-8 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all">
            {t.reader.dashboard}
          </Link>
        </div>
      </div>
    )
  }

  const isPending = recitation.status === 'pending' || recitation.status === 'in_review' || recitation.status === 'session_booked'
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <audio
        ref={audioRef}
        src={recitation.audio_url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={(e) => {
          if (!duration) setDuration(e.currentTarget.duration)
        }}
      />

      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 mb-2">
        <Link href="/reader/recitations" className="text-xs font-bold text-slate-400 hover:text-[#1B5E3B] transition-colors flex items-center gap-1">
          {isAr ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          {t.reader.backToRecitations}
        </Link>
      </div>

      {/* Compact Header */}
      <header className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-[#1B5E3B]/5 flex items-center justify-center shrink-0 border border-[#1B5E3B]/10">
            <Mic className="w-8 h-8 text-[#1B5E3B]" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">{recitation.student_name}</h1>
              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider
                ${isPending ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                  recitation.status === 'mastered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                {isPending ? t.reader.newRecitationBadge : recitation.status === 'mastered' ? (isAr ? 'متقن' : 'Mastered') : (isAr ? 'يحتاج جلسة' : 'Needs Session')}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-[#C9A227]" /> {t.reader.surah} {recitation.surah_name}</span>
              <span className="w-1 h-1 bg-slate-200 rounded-full" />
              <span>{new Date(recitation.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { day: "numeric", month: "long" })}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {/* Modern Compact Audio Player */}
        <div className="bg-[#1B5E3B] rounded-2xl p-5 shadow-sm text-white relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-transparent opacity-50 pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 animate-pulse">
                  <div className="w-4 h-1 bg-white/40 rounded-full mx-0.5" />
                  <div className="w-4 h-3 bg-emerald-400 rounded-full mx-0.5" />
                  <div className="w-4 h-2 bg-white/40 rounded-full mx-0.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-none mb-1">{isAr ? 'تلاوة الطالب' : 'Student Recitation'}</span>
                  <span className="text-sm font-bold truncate max-w-[150px]">{recitation.surah_name}</span>
                </div>
              </div>

              {/* Refined Speed Selection */}
              <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-2xl border border-white/5">
                {["0.8", "1.0", "1.2", "1.5"].map(speed => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`text-[10px] px-2.5 py-1.5 rounded-xl font-bold transition-all
                      ${playbackSpeed === speed ? 'bg-white text-[#1B5E3B] shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-6 md:gap-8 px-4">
              <button
                onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 10 }}
                className="p-2 text-white/50 hover:text-white transition-colors"
              >
                <SkipBack className="w-6 h-6 rtl:rotate-180" />
              </button>

              <button
                onClick={togglePlay}
                className="w-12 h-12 bg-white text-[#1B5E3B] rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 active:scale-95 transition-all"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 ml-0.5 rtl:mr-0.5 rtl:ml-0 fill-current" />}
              </button>

              <button
                onClick={() => { if (audioRef.current) audioRef.current.currentTime += 10 }}
                className="p-2 text-white/50 hover:text-white transition-colors"
              >
                <SkipForward className="w-6 h-6 rtl:rotate-180" />
              </button>

              <div className="flex-1 space-y-2 mt-1">
                <div className="relative w-full h-2.5 bg-white/10 rounded-full cursor-pointer overflow-hidden backdrop-blur-md" onClick={handleSeek}>
                  <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-all duration-200" style={{ width: `${progressPercentage}%` }} />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-white/40 tracking-widest font-mono">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment & Feedback Section */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100">
              <Award className="w-4 h-4 text-[#C9A227]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{isAr ? "التقييم والقرار النهائي" : "Review & Final Decision"}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{isAr ? "قم بتقييم تلاوة الطالب بعناية" : "Provide careful assessment of the student recitation"}</p>
            </div>
          </div>

          {/* Verdict Selection */}
          {isPending ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setVerdict('mastered')}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all group/v
                  ${verdict === 'mastered'
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-50'
                    : 'border-slate-100 bg-slate-50/30 hover:border-emerald-200 hover:bg-emerald-50/20'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all
                  ${verdict === 'mastered' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-white border border-slate-100 text-slate-400 group-hover/v:border-emerald-200 group-hover/v:text-emerald-500'}`}>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className={`text-${isAr ? 'right' : 'left'}`}>
                  <h4 className={`font-bold text-sm mb-0.5 ${verdict === 'mastered' ? 'text-emerald-900' : 'text-slate-700 font-bold'}`}>
                    {isAr ? "متقن" : "Mastered"}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {isAr ? "الطالب أتقن التلاوة والأحكام بشكل سليم" : "Student mastered the recitation and tajweed"}
                  </p>
                </div>
              </button>

              <button
                onClick={() => setVerdict('needs_session')}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all group/v
                  ${verdict === 'needs_session'
                    ? 'border-[#C9A227] bg-amber-50/50 shadow-sm ring-2 ring-amber-50'
                    : 'border-slate-100 bg-slate-50/30 hover:border-[#C9A227]/30 hover:bg-amber-50/20'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all
                  ${verdict === 'needs_session' ? 'bg-[#C9A227] text-white shadow-sm' : 'bg-white border border-slate-100 text-slate-400 group-hover/v:border-amber-200 group-hover/v:text-[#C9A227]'}`}>
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div className={`text-${isAr ? 'right' : 'left'}`}>
                  <h4 className={`font-bold text-base mb-1 ${verdict === 'needs_session' ? 'text-amber-900' : 'text-slate-700 font-bold'}`}>
                    {isAr ? "يحتاج جلسة" : "Needs Session"}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {isAr ? "توجد أخطاء تتطلب جلسة تصحيح مباشرة" : "Errors found that require a live correction session"}
                  </p>
                </div>
              </button>
            </div>
          ) : (
            <div className={`p-5 rounded-3xl border flex items-center gap-4 
              ${recitation.status === 'mastered' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 
                ${recitation.status === 'mastered' ? 'bg-emerald-500 text-white' : 'bg-[#C9A227] text-white'}`}>
                {recitation.status === 'mastered' ? <CheckCircle2 className="w-5 h-5" /> : <CalendarClock className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm font-bold">
                  {isAr ? 'تم تقييم هذه التلاوة مسبقاً' : 'This recitation was already reviewed'}
                </p>
                <p className="text-xs opacity-80">
                  {isAr ? `الحالة: ${recitation.status === 'mastered' ? 'متقن' : 'يحتاج جلسة'}` : `Status: ${recitation.status}`}
                </p>
              </div>
            </div>
          )}

          {/* Feedback Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-slate-700">{t.reader.readerNotesLabel}</label>
              <div className="h-px flex-1 bg-slate-100 mx-4" />
              <Info className="w-4 h-4 text-slate-300" />
            </div>
            <textarea
              className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/10 resize-none text-sm text-slate-700 leading-relaxed placeholder:text-slate-300"
              placeholder={t.reader.notesPlaceholder}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              readOnly={!isPending}
            />
            {isPending && (
              <p className="text-[11px] text-[#1B5E3B]/70 font-medium px-2">
                {t.reader.readerNotesHint}
              </p>
            )}
          </div>

          {/* Word Mistakes Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-slate-700">{t.reader.mistakeWordsLabel}</label>
              <div className="h-px flex-1 bg-slate-100 mx-4" />
            </div>

            {isPending && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentMistakeWord}
                  onChange={(e) => setCurrentMistakeWord(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (currentMistakeWord.trim() !== '' && !mistakeWords.includes(currentMistakeWord.trim())) {
                        setMistakeWords([...mistakeWords, currentMistakeWord.trim()])
                        setCurrentMistakeWord("")
                      }
                    }
                  }}
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20"
                  placeholder={t.reader.mistakeWordsPlaceholder}
                />
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentMistakeWord.trim() !== '' && !mistakeWords.includes(currentMistakeWord.trim())) {
                      setMistakeWords([...mistakeWords, currentMistakeWord.trim()])
                      setCurrentMistakeWord("")
                    }
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-sm font-bold transition-colors"
                  type="button"
                >
                  {isAr ? "إضافة" : "Add"}
                </button>
              </div>
            )}
            
            {isPending && (
              <p className="text-[11px] text-amber-600 font-medium px-2">
                {t.reader.mistakeWordsHint}
              </p>
            )}

            {mistakeWords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {mistakeWords.map((word, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-100 px-3 py-1.5 rounded-lg text-sm font-medium">
                    <span>{word}</span>
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => setMistakeWords(mistakeWords.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-700 rounded-full w-5 h-5 flex items-center justify-center -mr-1 rtl:-mr-0 rtl:-ml-1"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {mistakeWords.length === 0 && !isPending && (
              <p className="text-sm text-slate-400">{isAr ? "لم يتم تسجيل كلمات خاطئة." : "No mispronounced words recorded."}</p>
            )}
          </div>

          {submitError && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 border border-red-100 animate-in fade-in slide-in-from-top-2">
              <Info className="w-4 h-4" />
              {submitError}
            </div>
          )}

          {/* Refined Submit Button */}
          {isPending && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={submitting || !verdict}
                className="w-full md:w-auto px-8 h-12 bg-[#1B5E3B] text-white rounded-xl font-bold text-sm hover:bg-[#124028] hover:scale-[1.01] active:scale-[0.99] transition-all shadow-sm disabled:opacity-40 disabled:grayscale disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <SendHorizontal className="w-5 h-5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />}
                {submitting ? t.reader.savingNow : (isAr ? "تأكيد وإرسال التقييم" : "Confirm & Send Review")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
