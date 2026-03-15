'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react'

interface AudioPlayerProps {
  src: string
  className?: string
}

export function AudioPlayer({ src, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
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
    const updateDuration = () => setDuration(audio.duration)
    const onEnded = () => setIsPlaying(false)
    const onError = (e: any) => {
      const target = e.target as HTMLAudioElement
      console.error("Audio player error detail:", {
        code: target.error?.code,
        message: target.error?.message,
        src: target.src,
        networkState: target.networkState,
        readyState: target.readyState
      })
      
      if (target.error?.code === 4) { // MEDIA_ERR_SRC_NOT_SUPPORTED
        setError("تنسيق الصوت هذا غير مدعوم في متصفحك. يرجى محاولة تحميل الملف للاستماع إليه.")
      } else {
        setError("حدث خطأ أثناء تحميل الملف الصوتي.")
      }
      setIsPlaying(false)
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)

    // Force reload when src changes
    audio.load()
    setError(null)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }, [src])

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

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (audioRef.current) {
      const newMuted = !isMuted
      setIsMuted(newMuted)
      audioRef.current.muted = newMuted
    }
  }

  const reset = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00"
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`bg-slate-50 dark:bg-card border border-slate-200 dark:border-border rounded-2xl p-4 shadow-sm w-full ${className}`}>
      <audio ref={audioRef} playsInline preload="metadata">
        <source src={src} type={src.endsWith('.webm') ? 'audio/webm' : src.endsWith('.mp4') ? 'audio/mp4' : undefined} />
        {/* Fallback source without type for general compatibility */}
        <source src={src} />
      </audio>

      <div className="flex flex-col gap-4">
        {/* Controls and Progress */}
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
          <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1">
             <span className="font-bold flex-1">{error}</span>
             <a 
               href={src} 
               download 
               className="px-3 py-1 bg-destructive text-destructive-foreground rounded-lg font-bold hover:bg-destructive/90 transition-colors whitespace-nowrap"
             >
               تحميل الملف
             </a>
          </div>
        )}
      </div>
    </div>
  )
}
