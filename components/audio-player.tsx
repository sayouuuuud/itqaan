'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Play, Pause, RotateCcw, Volume2, VolumeX, Copy, Download } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { toast } from 'sonner'

interface AudioPlayerProps {
  src: string
  className?: string
}

export function AudioPlayer({ src, className }: AudioPlayerProps) {
  const { locale } = useI18n()
  const isAr = locale === 'ar'
  const audioRef = useRef<HTMLAudioElement>(null)

  // Route audio through our proxy to ensure Safari/iOS Range Request support
  const proxiedSrc = src ? `/api/audio-proxy?url=${encodeURIComponent(src)}` : src

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
    }
    const onEnded = () => setIsPlaying(false)

    const onLoadedMetadata = () => {
      console.log('[Audio] loadedmetadata', {
        src: audio.currentSrc,
        duration: audio.duration
      })
      updateDuration()
    }

    const onCanPlay = () => {
      console.log('[Audio] canplay', {
        src: audio.currentSrc
      })
    }

    const onError = () => {
      console.error('[Audio] error', {
        src: audio.currentSrc,
        networkState: audio.networkState,
        readyState: audio.readyState,
        code: audio.error?.code,
        message: audio.error?.message
      })

      setError(isAr ? 'فشل تشغيل الملف الصوتي' : 'Failed to play audio')
      setIsPlaying(false)
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('durationchange', updateDuration)
    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)

    setError(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)

    audio.load()

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('durationchange', updateDuration)
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }, [src, isAr])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
      } else {
        setError(null)
        await audio.play()
        setIsPlaying(true)
      }
    } catch (err: any) {
      console.error('[Audio] play failed', {
        name: err?.name,
        message: err?.message,
        src: audio.currentSrc
      })
      setError(isAr ? 'فشل تشغيل الملف الصوتي' : 'Failed to play audio')
      setIsPlaying(false)
    }
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = value[0]
    setCurrentTime(value[0])
  }

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const newVolume = value[0]
    audio.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    const newMuted = !isMuted
    audio.muted = newMuted
    setIsMuted(newMuted)
  }

  const reset = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = 0
    audio.pause()
    setCurrentTime(0)
    setIsPlaying(false)
  }

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '00:00'
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const copyLink = () => {
    navigator.clipboard.writeText(src)
    toast.success('تم نسخ رابط التلاوة')
  }

  return (
    <div className={`bg-slate-50 dark:bg-card border border-slate-200 dark:border-border rounded-2xl p-4 shadow-sm w-full ${className}`}>
      <audio
        key={proxiedSrc}
        ref={audioRef}
        src={proxiedSrc}
        playsInline
        preload="metadata"
      />

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-12 h-12 bg-[#0B3D2E] dark:bg-primary text-white dark:text-primary-foreground hover:bg-[#0B3D2E]/90 dark:hover:bg-primary/90 hover:text-white dark:hover:text-primary-foreground shrink-0 shadow-lg shadow-[#0B3D2E]/20 dark:shadow-primary/20"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </Button>

          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-widest tabular-nums">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 group relative">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-500 dark:text-muted-foreground hover:text-[#0B3D2E] dark:hover:text-primary h-8 w-8"
              onClick={toggleMute}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>

            <div className="w-20 hidden group-hover:block absolute -top-10 left-1/2 -translate-x-1/2 bg-white dark:bg-card p-2 rounded-lg shadow-xl border border-slate-100 dark:border-border transition-all">
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="cursor-pointer"
              />
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 dark:text-muted-foreground hover:text-slate-600 dark:hover:text-foreground h-8 w-8"
            onClick={reset}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {error && (
          <div className="mt-2 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl text-xs space-y-3 animate-in fade-in slide-in-from-top-1">
             <div className="flex items-start gap-2 text-amber-800 dark:text-amber-200">
               <span className="font-bold flex-1 leading-relaxed">
                 {error}
               </span>
             </div>
             
             <div className="flex gap-2">
               <a 
                 href={src} 
                 download 
                 className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition-colors"
               >
                 <Download className="w-3.5 h-3.5" />
                 تحميل الملف
               </a>
               <Button
                 variant="outline"
                 size="sm"
                 onClick={copyLink}
                 className="flex-1 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 font-bold"
               >
                 <Copy className="w-3.5 h-3.5 ml-1" />
                 نسخ الرابط
               </Button>
             </div>
          </div>
        )}
      </div>
    </div>
  )
}
