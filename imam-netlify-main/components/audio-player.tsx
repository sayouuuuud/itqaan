"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Clock, Headphones, Loader2 } from "lucide-react"

interface AudioPlayerProps {
    src: string
    title?: string
    className?: string
    initialDuration?: number
    audioId?: string | number
    table?: string
}

export function AudioPlayer({ src, title, className, initialDuration, audioId, table }: AudioPlayerProps) {
    // Always use the proxy API which handles both regular and split files seamlessly
    // The API now acts as a "Virtual File System" supporting Range Requests
    const audioUrl = `/api/download-audio?url=${encodeURIComponent(src || '')}`

    const audioRef = useRef<HTMLAudioElement>(null)

    // Player State
    const [isPlaying, setIsPlaying] = useState(false)
    const [isBuffering, setIsBuffering] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(initialDuration || 0)
    const [volume, setVolume] = useState(1)
    const [playbackRate, setPlaybackRate] = useState(1)

    const [error, setError] = useState<string | null>(null)
    const [seekErrors, setSeekErrors] = useState<number>(0) // Track consecutive seek errors

    // UI State for seeking
    const [isDragging, setIsDragging] = useState(false)
    const [sliderValue, setSliderValue] = useState(0)

    // Standard HTML5 Audio Events
    const onTimeUpdate = () => {
        if (audioRef.current && !isDragging) {
            setCurrentTime(audioRef.current.currentTime)
            setSliderValue(audioRef.current.currentTime)
        }
    }

    const onLoadedMetadata = () => {
        if (audioRef.current) {
            const browserDuration = audioRef.current.duration
            console.log('🎧 Audio Metadata Loaded:', { browserDuration, initialDuration })

            // Use initialDuration if provided (from API), otherwise use browser duration
            if (initialDuration && initialDuration > 0) {
                setDuration(initialDuration)
                console.log('📏 Using API Duration:', initialDuration)
            } else if (browserDuration && !isNaN(browserDuration) && browserDuration !== Infinity) {
                setDuration(browserDuration)
                console.log('📏 Using Browser Duration:', browserDuration)
            } else {
                setDuration(0)
            }
        }
        setIsBuffering(false)
    }

    const togglePlayPause = () => {
        if (!audioRef.current) return

        if (isPlaying) {
            audioRef.current.pause()
        } else {
            audioRef.current.play().catch(e => {
                console.error("Play error:", e)
                setError("Failed to play")
            })
        }
    }

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onWaiting = () => setIsBuffering(true)
    const onPlaying = () => setIsBuffering(false)
    const onSeeked = () => setIsBuffering(false)

    const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const sliderPercentage = parseFloat(e.target.value) / (duration || 1)
        const targetTime = sliderPercentage * (duration || 0)

        // Update visual feedback immediately
        setSliderValue(targetTime)
        setCurrentTime(targetTime)

        // If it's a click (not dragging), seek immediately
        if (!isDragging) {
            if (audioRef.current && duration > 0) {
                const seekTime = sliderPercentage * duration
                console.log(`🎯 Seek Click: ${seekTime.toFixed(2)}s (${(sliderPercentage * 100).toFixed(1)}%)`)
                audioRef.current.currentTime = seekTime
            }
        }
    }

    const handleSeekStart = () => {
        setIsDragging(true)
    }

    const handleSeekEnd = () => {
        if (audioRef.current && duration > 0) {
            const sliderPercentage = sliderValue / duration
            const targetTime = sliderPercentage * duration

            // Validate seek time
            if (targetTime < 0 || targetTime > duration) {
                console.warn(`Invalid seek time: ${targetTime}s (duration: ${duration}s)`)
                setSeekErrors(prev => prev + 1)
                setIsDragging(false)
                return
            }

            console.log(`🎯 Seek End: ${targetTime.toFixed(2)}s (${(sliderPercentage * 100).toFixed(1)}%)`)
            audioRef.current.currentTime = targetTime

            // Check if seek actually worked after a short delay
            setTimeout(() => {
                if (audioRef.current && Math.abs(audioRef.current.currentTime - targetTime) > 2) {
                    console.warn(`Seek failed: requested ${targetTime}s, got ${audioRef.current.currentTime}s`)
                    setSeekErrors(prev => prev + 1)

                    // If too many seek errors, show warning
                    if (seekErrors >= 3) {
                        setError("مشكلة في التقديم - جرب إعادة تحميل الصفحة")
                    }
                } else {
                    setSeekErrors(0) // Reset on successful seek
                }
            }, 500)
        }
        setIsDragging(false)
    }

    const skip = (seconds: number) => {
        if (!audioRef.current) return
        const newTime = Math.min(Math.max(audioRef.current.currentTime + seconds, 0), duration)

        // Validate skip time
        if (newTime < 0 || newTime > duration) {
            console.warn(`Invalid skip time: ${newTime}s (duration: ${duration}s)`)
            return
        }

        audioRef.current.currentTime = newTime
    }

    // Format time helper
    const formatTime = (time: number) => {
        if (!time || isNaN(time)) return "00:00"
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    if (!src) return null

    return (
        <div className={`bg-card/50 backdrop-blur border rounded-xl p-4 sm:p-6 ${className || ''}`} dir="rtl">
            <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={onLoadedMetadata}
                onPlay={onPlay}
                onPause={onPause}
                onWaiting={onWaiting}
                onPlaying={onPlaying}
                onSeeked={() => {
                    onSeeked()
                    setSeekErrors(0) // Reset seek errors on successful seek
                }}
                onError={(e) => {
                    console.error("Audio Error:", e)
                    setError("خطأ في تشغيل الملف")
                    setIsBuffering(false)
                }}
            />

            {/* Top Info */}
            <div className="flex items-center justify-between mb-4 w-full">
                <div className="flex items-center gap-2 text-primary overflow-hidden">
                    <Headphones className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium truncate max-w-[120px] sm:max-w-[300px]">{title || "تشغيل الصوت"}</span>
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground font-mono shrink-0" dir="ltr">
                    {formatTime(duration)} / {formatTime(currentTime)}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative w-full h-2 bg-secondary rounded-full mb-6 cursor-pointer group">
                <div
                    className="absolute right-0 top-0 h-full bg-primary rounded-full transition-all duration-100"
                    style={{ width: `${(sliderValue / (duration || 1)) * 100}%` }}
                />
                {isBuffering && (
                    <div className="absolute right-0 top-0 w-full h-full bg-white/20 animate-pulse rounded-full" />
                )}
                <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={sliderValue}
                    onMouseDown={handleSeekStart}
                    onChange={handleSeekChange}
                    onMouseUp={handleSeekEnd}
                    onTouchStart={handleSeekStart}
                    onTouchEnd={handleSeekEnd}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between w-full">

                {/* Volume */}
                <div className="hidden sm:flex items-center gap-2 w-1/4">
                    <button onClick={() => {
                        if (!audioRef.current) return
                        const newVol = volume > 0 ? 0 : 1
                        audioRef.current.volume = newVol
                        setVolume(newVol)
                    }}>
                        {volume === 0 ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    <input
                        type="range"
                        min={0} max={1} step={0.1}
                        value={volume}
                        onChange={(e) => {
                            const v = parseFloat(e.target.value)
                            setVolume(v)
                            if (audioRef.current) audioRef.current.volume = v
                        }}
                        className="w-16 h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                </div>

                {/* Main Controls */}
                <div className="flex items-center gap-4">
                    <button onClick={() => skip(-10)} className="text-muted-foreground hover:text-primary transition">
                        <SkipBack className="h-5 w-5" />
                    </button>

                    <button
                        onClick={togglePlayPause}
                        className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:scale-105 transition shadow-lg"
                    >
                        {isBuffering ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : isPlaying ? (
                            <Pause className="h-6 w-6 fill-current" />
                        ) : (
                            <Play className="h-6 w-6 fill-current ml-1" />
                        )}
                    </button>

                    <button onClick={() => skip(10)} className="text-muted-foreground hover:text-primary transition">
                        <SkipForward className="h-5 w-5" />
                    </button>
                </div>

                {/* Speed */}
                <div className="w-1/4 flex justify-end">
                    <button
                        onClick={() => {
                            const rates = [1, 1.25, 1.5, 2]
                            const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length]
                            setPlaybackRate(next)
                            if (audioRef.current) audioRef.current.playbackRate = next
                        }}
                        className="text-xs font-bold text-muted-foreground hover:text-primary transition px-2 py-1 rounded border border-transparent hover:border-border"
                    >
                        {playbackRate}x
                    </button>
                </div>
            </div>

            {error && (
                <div className="mt-4 p-2 bg-destructive/10 text-destructive text-xs rounded text-center">
                    {error}
                </div>
            )}
        </div>
    )
}