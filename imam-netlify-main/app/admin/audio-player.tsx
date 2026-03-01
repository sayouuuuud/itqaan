"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Clock, Headphones, Loader2 } from "lucide-react"
import { useSignedUrl } from "@/hooks/use-signed-url"

interface AudioPlayerProps {
  src: string
  title?: string
  className?: string
}

export function AudioPlayer({ src, title, className }: AudioPlayerProps) {
  const { signedUrl, loading, error } = useSignedUrl(src)
  
  // For debugging: if src is a test URL, use it directly
  const finalUrl = src?.includes('test') ? src : signedUrl
  
  console.log('🎵 AudioPlayer Debug:', {
    originalSrc: src,
    signedUrl,
    finalUrl,
    loading,
    error
  })
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [volume, setVolume] = useState(1)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setIsLoaded(true)
    }
    const handleEnded = () => setIsPlaying(false)
    const handleCanPlay = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration)
        setIsLoaded(true)
      }
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("durationchange", handleLoadedMetadata)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("durationchange", handleLoadedMetadata)
    }
  }, [])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio || !finalUrl || finalUrl.trim() === '') {
      console.warn('Cannot play/pause: no valid audio source available');
      return
    }
    
    // Only attempt to play if the audio is ready
    if (audio.readyState < 2) { // HAVE_CURRENT_DATA
      console.log('Audio not ready yet, loading first...');
      audio.load()
      
      // Add a small delay to allow loading to start
      setTimeout(() => {
        if (isPlaying) {
          audio.pause()
        } else {
          audio.play().catch((err: any) => {
            console.error('Failed to play audio:', err);
          })
        }
        setIsPlaying(!isPlaying)
      }, 100)
    } else {
      if (isPlaying) {
        audio.pause()
      } else {
        audio.play().catch((err: any) => {
          console.error('Failed to play audio:', err);
        })
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    
    const newTime = Number.parseFloat(e.target.value)
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handlePlaybackRateChange = () => {
    const audio = audioRef.current
    if (!audio) return
    
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2]
    const currentIndex = rates.indexOf(playbackRate)
    const nextIndex = (currentIndex + 1) % rates.length
    const newRate = rates[nextIndex]
    audio.playbackRate = newRate
    setPlaybackRate(newRate)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    
    const newVolume = Number.parseFloat(e.target.value)
    audio.volume = newVolume
    setVolume(newVolume)
  }

  const skip = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds))
  }

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "00:00"
    
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }
    
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  // Show loading state
  if (loading) {
    return (
      <div className={`bg-primary/5 border border-primary/10 rounded-xl p-6 ${className || ''}`}>
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-text-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>جاري تحميل الملف الصوتي...</span>
          </div>
        </div>
      </div>
    )
  }

  // Show no source state
  if (!finalUrl || finalUrl.trim() === '') {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-xl p-6 ${className || ''}`}>
        <div className="flex items-center gap-2 text-yellow-600">
          <VolumeX className="h-5 w-5" />
          <span className="font-medium">لا يوجد مصدر صوتي صالح</span>
        </div>
        <p className="text-yellow-500 text-sm mt-2">يرجى التأكد من رفع الملف الصوتي بشكل صحيح</p>
      </div>
    )
  }

  // Validate URL format
  try {
    new URL(finalUrl)
  } catch (e) {
    console.error('Invalid URL format:', finalUrl, e);
    return (
      <div className={`bg-red-50 border border-red-200 rounded-xl p-6 ${className || ''}`}>
        <div className="flex items-center gap-2 text-red-600">
          <VolumeX className="h-5 w-5" />
          <span className="font-medium">رابط الملف الصوتي غير صالح</span>
        </div>
        <p className="text-red-500 text-sm mt-2">الرابط: {finalUrl}</p>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-2 text-red-600">
          <VolumeX className="h-5 w-5" />
          <span className="font-medium">خطأ في تحميل الملف الصوتي</span>
        </div>
        <p className="text-red-500 text-sm mt-2">{error}</p>
      </div>
    )
  }

  return (
    <div className={`bg-primary/5 border border-primary/10 rounded-xl p-6 ${className || ''}`}>
      {/* Only render audio element when we have a valid, non-empty URL */}
      {finalUrl && finalUrl.trim() !== '' && (
        <audio 
          ref={audioRef}
          src={finalUrl}
          preload="none" 
          onError={(e) => {
            console.error('Audio error:', e);
            console.error('Audio src:', finalUrl);
            console.error('Audio element:', audioRef.current);
            console.error('Error details:', (e.target as HTMLAudioElement)?.error);
          }}
          onLoadStart={() => {
            console.log('Audio load started, src:', finalUrl);
          }}
          onCanPlay={() => {
            console.log('Audio can play, duration:', audioRef.current?.duration);
          }}
          onLoadedData={() => {
            console.log('Audio loaded data, ready to play');
          }}
          onStalled={() => {
            console.warn('Audio stalled, trying to reload...');
          }}
        />
      )}
      
      <div className="flex items-center justify-between mb-4">
        {title && (
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Headphones className="h-4 w-4 text-primary" />
            <span>{title}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">
            {loading ? "جاري تحميل الملف..." : (isLoaded ? formatTime(duration) : "جاري التحميل...")}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <input 
          type="range" 
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary" 
        />
        <div className="flex justify-between text-xs text-text-muted mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Skip Back */}
          <button 
            onClick={() => skip(-10)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-background hover:bg-primary hover:text-white transition-colors text-text-muted disabled:opacity-50 disabled:cursor-not-allowed" 
            title="تراجع 10 ثواني"
            disabled={!signedUrl || loading}
          >
            <SkipBack className="h-5 w-5" />
          </button>

          {/* Play/Pause */}
          <button 
            onClick={togglePlayPause}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary-hover transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !signedUrl}
          >
            {isPlaying ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 mr-[-2px]" />}
          </button>

          {/* Skip Forward */}
          <button 
            onClick={() => skip(10)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-background hover:bg-primary hover:text-white transition-colors text-text-muted disabled:opacity-50 disabled:cursor-not-allowed" 
            title="تقدم 10 ثواني"
            disabled={!signedUrl || loading}
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Playback Speed */}
          <button 
            onClick={handlePlaybackRateChange}
            className="px-3 py-1 rounded-lg bg-background text-sm font-medium text-text-muted hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
            title="سرعة التشغيل"
            disabled={!signedUrl || loading}
          >
            {playbackRate}x
          </button>

          {/* Volume */}
          <div className="flex items-center gap-2">
            {volume === 0 ? (
              <VolumeX className="h-5 w-5 text-text-muted" />
            ) : (
              <Volume2 className="h-5 w-5 text-text-muted" />
            )}
            <input 
              type="range" 
              min={0}
              max={1}
              step={0.1}
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-border rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={!signedUrl || loading}
            />
          </div>
        </div>
      </div>
    </div>
  )
}


