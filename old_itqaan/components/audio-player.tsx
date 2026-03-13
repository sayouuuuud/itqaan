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

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const onEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', onEnded)
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
    <div className={`bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm w-full ${className}`}>
      <audio ref={audioRef} src={src} />

      <div className="flex flex-col gap-4">
        {/* Controls and Progress */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-12 h-12 bg-[#0B3D2E] text-white hover:bg-[#0B3D2E]/90 hover:text-white shrink-0 shadow-lg shadow-[#0B3D2E]/20"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </Button>

          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest tabular-nums">
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
              className="text-slate-500 hover:text-[#0B3D2E] h-8 w-8"
              onClick={toggleMute}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <div className="w-20 hidden group-hover:block absolute -top-10 left-1/2 -translate-x-1/2 bg-white p-2 rounded-lg shadow-xl border border-slate-100 transition-all">
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
            className="text-slate-400 hover:text-slate-600 h-8 w-8"
            onClick={reset}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
