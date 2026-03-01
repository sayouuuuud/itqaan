"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Mic, Square, Play, Pause, RotateCcw, Send } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

const MAX_SECONDS = 180 // 3 minutes

type RecordingState = "idle" | "recording" | "saved"

export default function SubmitRecitationPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [recordingState, setRecordingState] = useState<RecordingState>("idle")
  const [timer, setTimer] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [qiraah, setQiraah] = useState("hafs")
  const [holdTimer, setHoldTimer] = useState<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioBlobRef = useRef<Blob | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const waveformBars = [
    3.2, 5.1, 2.8, 6.4, 4.2, 7.8, 3.5, 5.9,
    2.1, 6.7, 4.5, 3.8, 7.1, 2.9, 5.4, 4.1,
    6.2, 3.7, 5.8, 2.4, 7.5, 4.8, 3.1, 6.9,
    5.2, 2.7, 7.3, 4.6, 3.9, 6.1, 2.5, 5.5
  ]

  // Timer + auto-stop at 3 minutes
  useEffect(() => {
    if (recordingState === "recording") {
      intervalRef.current = setInterval(() => {
        setTimer((t) => {
          if (t + 1 >= MAX_SECONDS) {
            // Auto-stop at 3 minutes
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
              mediaRecorderRef.current.stop()
            }
            setRecordingState("saved")
            return MAX_SECONDS
          }
          return t + 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [recordingState])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
  }

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        audioBlobRef.current = blob
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
        audioUrlRef.current = URL.createObjectURL(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setRecordingState("recording")
      setTimer(0)
    } catch {
      alert(t.student.allowMicAlert)
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
      setRecordingState("saved")
    }
  }, [])

  // Press and hold handlers
  const handlePointerDown = useCallback(() => {
    if (recordingState !== "idle") return
    const t = setTimeout(() => {
      startRecording()
    }, 200)
    setHoldTimer(t)
  }, [recordingState, startRecording])

  const handlePointerUp = useCallback(() => {
    if (holdTimer) {
      clearTimeout(holdTimer)
      setHoldTimer(null)
    }
    if (recordingState === "recording") {
      stopRecording()
    }
  }, [holdTimer, recordingState, stopRecording])

  const resetAll = () => {
    setRecordingState("idle")
    setTimer(0)
    setIsPlaying(false)
    audioBlobRef.current = null
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
    audioUrlRef.current = null
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }

  const togglePlayback = () => {
    if (!audioUrlRef.current) return
    if (isPlaying && audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }
    const audio = new Audio(audioUrlRef.current)
    audioRef.current = audio
    audio.onended = () => setIsPlaying(false)
    audio.play()
    setIsPlaying(true)
  }

  const handleSubmit = async () => {
    if (!audioBlobRef.current) return
    setSubmitting(true)
    try {
      // 1. Upload audio file
      const formData = new FormData()
      const timestamp = Date.now()
      formData.append("audio", audioBlobRef.current, `recitation_${timestamp}.webm`)
      formData.append("folder", "recitations")

      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
      const uploadData = await uploadRes.json()

      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed")

      // 2. Create recitation record (surah_name, ayah_from, ayah_to defaults set server-side)
      const recRes = await fetch("/api/recitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioUrl: uploadData.audioUrl || uploadData.url,
          audioDuration: timer,
          qiraah: t.qiraat[qiraah]
        }),
      })

      if (!recRes.ok) {
        const errData = await recRes.json()
        // Handle duplicate submission (409 Conflict)
        if (recRes.status === 409) {
          alert(errData.error)
          router.push('/student')
          return
        }
        throw new Error(errData.error || "Create recitation failed")
      }

      setSubmitted(true)
    } catch (err) {
      console.error("Submit error:", err)
      alert(t.student.submitError)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-10 px-4">
        <div className="w-full max-w-md mx-auto text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
            <Send className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">{t.student.recitationReceived}</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            {t.student.recitationReceivedDesc}
          </p>
          <p className="text-slate-400 text-xs leading-relaxed">
            {t.student.reviewTakesTime}
          </p>
          <button onClick={() => router.push('/student')} className="bg-[#0B3D2E] hover:bg-[#0A3528] text-white font-bold py-3 px-8 rounded-xl transition-colors">
            {t.student.backToDashboard}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar h-full min-h-[85vh]">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">{t.student.submitTitleFatiha}</h1>
        <p className="text-gray-500 dark:text-gray-400">{t.student.submitDescFatiha}</p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto lg:h-[calc(100vh-14rem)] min-h-[600px]">
        {/* Right Side: Fatiha Verses */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8 relative flex flex-col items-center justify-center overflow-hidden order-1 lg:order-none">
          <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-[#D4AF37]/30 rounded-tr-xl"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-[#D4AF37]/30 rounded-bl-xl"></div>

          <div className="text-center w-full max-w-lg mx-auto px-2 pt-2 pb-2 h-full flex flex-col justify-center" style={{ direction: 'rtl' }}>
            <h3 className="text-[#D4AF37] font-bold text-base md:text-lg mb-2 shrink-0" style={{ fontFamily: "var(--font-sans)" }}>سورة الفاتحة</h3>
            <div className="space-y-[0.6rem] text-lg md:text-xl lg:text-[1.35rem] leading-[1.9] text-gray-800 dark:text-gray-200 grow flex flex-col justify-center" style={{ fontFamily: "var(--font-quran)" }}>
              <p className="text-center">
                <span className="text-[#1A4D2E] dark:text-green-400">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</span>
                <span className="text-[#D4AF37] text-sm md:text-base inline-block mr-2 align-middle opacity-80">&#xFD3F;١&#xFD3E;</span>
              </p>
              <p className="text-center">
                ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ
                <span className="text-[#D4AF37] text-base inline-block mr-2 align-middle">&#xFD3F;٢&#xFD3E;</span>
              </p>
              <p className="text-center">
                ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                <span className="text-[#D4AF37] text-base inline-block mr-2 align-middle">&#xFD3F;٣&#xFD3E;</span>
              </p>
              <p className="text-center">
                مَـٰلِكِ يَوْمِ ٱلدِّينِ
                <span className="text-[#D4AF37] text-base inline-block mr-2 align-middle">&#xFD3F;٤&#xFD3E;</span>
              </p>
              <p className="text-center">
                إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ
                <span className="text-[#D4AF37] text-base inline-block mr-2 align-middle">&#xFD3F;٥&#xFD3E;</span>
              </p>
              <p className="text-center">
                ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ
                <span className="text-[#D4AF37] text-base inline-block mr-2 align-middle">&#xFD3F;٦&#xFD3E;</span>
              </p>
              <p className="text-center !leading-[2]">
                صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ
                <span className="text-[#D4AF37] text-base inline-block mr-2 align-middle">&#xFD3F;٧&#xFD3E;</span>
              </p>
            </div>
          </div>
        </div>

        {/* Left Side: Recording Controls */}
        <div className="flex flex-col gap-6 h-full order-0 lg:order-none">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1 p-8 flex flex-col items-center justify-center relative">
            <div className="mb-8 text-center">
              <div className="text-6xl font-mono font-light tracking-widest text-gray-800 dark:text-white mb-2">
                {formatTime(timer)}
              </div>
              <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">
                {recordingState === "idle" && t.student.readyToRecord}
                {recordingState === "recording" && t.student.recordingStatus}
                {recordingState === "saved" && t.student.recordingSavedStatus}
              </span>
            </div>



            <div className="h-16 w-full max-w-sm flex items-center justify-center gap-[3px] mb-12">
              {waveformBars.map((h, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full bg-slate-400 transition-all duration-300 ${recordingState === "recording" ? "animate-pulse opacity-100" : "opacity-40"}`}
                  style={{
                    height: recordingState === "recording" ? `${h * 5}px` : `${h * 4}px`,
                    animationDelay: `${i * 40}ms`,
                  }}
                />
              ))}
            </div>

            <div className="flex items-end justify-center gap-10">
              <div className="flex flex-col items-center gap-2 group">
                <button
                  disabled={recordingState === "idle"}
                  onClick={resetAll}
                  className={`w-12 h-12 rounded-full border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 flex items-center justify-center transition-all ${recordingState === "idle" ? "cursor-not-allowed opacity-50" : "hover:bg-slate-50 hover:text-slate-600 cursor-pointer"}`}
                >
                  <RotateCcw className="w-6 h-6" />
                </button>
                <span className="text-xs text-gray-400 dark:text-gray-500 font-bold">{t.student.resetBtn}</span>
              </div>

              <div className="flex flex-col items-center gap-3 relative -top-4">
                {recordingState === "idle" && (
                  <button
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    className="w-24 h-24 rounded-full bg-[#D4AF37] text-white shadow-lg hover:shadow-xl hover:bg-yellow-500 hover:scale-105 active:scale-95 transition-all flex items-center justify-center ring-4 ring-[#D4AF37]/20 select-none touch-none"
                  >
                    <Mic className="w-12 h-12" />
                  </button>
                )}
                {recordingState === "recording" && (
                  <button
                    onPointerUp={handlePointerUp}
                    className="w-24 h-24 rounded-full bg-red-500 text-white shadow-lg animate-pulse hover:shadow-xl flex items-center justify-center ring-4 ring-red-500/20 select-none touch-none"
                  >
                    <Square className="w-10 h-10" />
                  </button>
                )}
                {recordingState === "saved" && (
                  <button
                    disabled
                    className="w-24 h-24 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center select-none touch-none"
                  >
                    <Mic className="w-12 h-12" />
                  </button>
                )}
                <span className="text-sm font-bold text-[#1A4D2E] dark:text-[#D4AF37]">
                  {recordingState === "recording" ? t.student.releaseToStop : t.student.holdToRecord}
                </span>
              </div>

              <div className="flex flex-col items-center gap-2 group">
                <button
                  disabled={recordingState !== "saved"}
                  onClick={togglePlayback}
                  className={`w-12 h-12 rounded-full border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 flex items-center justify-center transition-all ${recordingState !== "saved" ? "cursor-not-allowed opacity-50" : "hover:bg-slate-50 hover:text-slate-600 cursor-pointer"}`}
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                </button>
                <span className="text-xs text-gray-400 dark:text-gray-500 font-bold">{isPlaying ? t.student.stopBtn : t.student.playBtn}</span>
              </div>
            </div>

            {/* Qira'ah Selection below the buttons */}
            <div className="w-full max-w-sm mt-8 opacity-90">
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-1.5 mr-1">{t.student.selectedQiraahLabel}</label>
              <select
                value={qiraah}
                onChange={(e) => setQiraah(e.target.value)}
                disabled={recordingState === "recording"}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/10 transition-all appearance-none cursor-pointer"
                style={{ direction: 'rtl' }}
              >
                <option value="hafs">{t.qiraat.hafs}</option>
                <option value="warsh">{t.qiraat.warsh}</option>
                <option value="qaloon">{t.qiraat.qaloon}</option>
                <option value="duri_abu_amr">{t.qiraat.duri_abu_amr}</option>
                <option value="shuba">{t.qiraat.shuba}</option>
                <option value="bazzi">{t.qiraat.bazzi}</option>
                <option value="qunbul">{t.qiraat.qunbul}</option>
                <option value="hisham">{t.qiraat.hisham}</option>
                <option value="ibn_dhakwan">{t.qiraat.ibn_dhakwan}</option>
                <option value="khalaf">{t.qiraat.khalaf}</option>
                <option value="khallad">{t.qiraat.khallad}</option>
                <option value="abi_al_harith">{t.qiraat.abi_al_harith}</option>
                <option value="duri_kisai">{t.qiraat.duri_kisai}</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => router.push('/student')}
              className="flex-1 bg-white dark:bg-slate-800 border border-transparent text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 py-4 px-6 rounded-xl font-bold shadow-sm transition-colors text-center"
            >
              {t.student.cancelBtn}
            </button>
            <button
              disabled={recordingState !== "saved" || submitting}
              onClick={handleSubmit}
              className="flex-[2] bg-[#D4AF37] disabled:opacity-50 disabled:cursor-not-allowed text-white hover:bg-yellow-600 py-4 px-6 rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>{submitting ? t.student.submittingStatus : t.student.submitBtn}</span>
              {!submitting && <Send className="w-5 h-5 rtl:-scale-x-100 transform rotate-180" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
