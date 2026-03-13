"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Clock, Calendar, Check, ArrowLeft, Info, Loader2 } from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"

// Removed static DAYS_AR, using t.days_short instead

interface AvailableSlot {
  id: string
  reader_id: string
  reader_name: string
  start_time: string
  end_time: string
  day_of_week: number
}

export default function BookingPage() {
  const router = useRouter()
  const { t, locale } = useI18n()
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfWeek = currentMonth.getDay() // 0=Sun

  // When date is selected, fetch available slots
  const fetchSlots = useCallback(async (date: Date) => {
    setLoadingSlots(true)
    setAvailableSlots([])
    setSelectedSlot(null)
    setError(null)
    try {
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      const res = await fetch(`/api/bookings/available-slots?date=${dateStr}`)
      if (res.ok) {
        const data = await res.json()
        setAvailableSlots(data.slots || [])
      } else {
        const data = await res.json()
        setError(data.error || t.student.fetchSlotsError)
      }
    } catch {
      setError(t.student.serverError)
    } finally {
      setLoadingSlots(false)
    }
  }, [])

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate)
    }
  }, [selectedDate, fetchSlots])

  const handleSelectDay = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    if (date < today) return
    setSelectedDate(date)
  }

  const prevMonth = () => {
    setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))
    setSelectedDate(null)
  }
  const nextMonth = () => {
    setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))
    setSelectedDate(null)
  }

  const formatTime = (t: string) => t?.slice(0, 5) // HH:MM

  const handleConfirm = async () => {
    if (!selectedSlot || !selectedDate) return
    setSubmitting(true)
    setError(null)
    try {
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateStr,
          startTime: selectedSlot.start_time,
          endTime: selectedSlot.end_time,
        }),
      })
      if (res.ok) {
        setSuccess(true)
      } else {
        const data = await res.json()
        setError(data.error || t.student.bookingError)
      }
    } catch {
      setError(t.student.serverError)
    } finally {
      setSubmitting(false)
    }
  }

  const monthName = currentMonth.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/student" className="hover:text-primary transition-colors">{t.student.dashboard}</Link>
        <ChevronLeft className="w-3 h-3 rotate-180 rtl:rotate-0" />
        <span className="text-foreground font-medium">{t.student.bookSessionBtnBase || t.student.booking}</span>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">{t.student.bookingTitle}</h1>
        <p className="text-muted-foreground">{t.student.bookingDesc}</p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 bg-[#C9A227]/10 border border-[#C9A227]/20 rounded-xl p-4">
        <Info className="w-5 h-5 text-[#C9A227] shrink-0 mt-0.5" />
        <p className="text-sm text-foreground/80 leading-relaxed">
          {t.student.autoAssignBanner}
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {success ? (
        <div className="bg-card border border-emerald-500/20 rounded-2xl p-10 shadow-sm text-center space-y-6 max-w-2xl mx-auto mt-8">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
            <Check className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">{t.student.bookingSuccessTitle}</h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              {t.student.bookingSuccessDesc}
            </p>
          </div>
          <div className="pt-6">
            <Link href="/student" className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 px-8 rounded-xl transition-colors shadow-lg shadow-primary/20">
              {t.student.backToDashboard}
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">{t.student.selectDateTitle}</h3>
                <div className="flex items-center gap-2 bg-muted rounded-xl p-1 border border-border">
                  <button onClick={prevMonth} className="p-1 hover:bg-card rounded-lg transition-colors text-foreground">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <span className="font-bold px-2 min-w-[140px] text-center text-sm text-foreground">{monthName}</span>
                  <button onClick={nextMonth} className="p-1 hover:bg-card rounded-lg transition-colors text-foreground">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {/* Day Headers */}
              <div className="grid grid-cols-7 mb-2">
                {['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((d) => (
                  <span key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">
                    {t.days_short[d]}
                  </span>
                ))}
              </div>
              {/* Day Grid */}
              <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <span key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                  const isPast = date < today
                  const isSelected = selectedDate?.getDate() === day &&
                    selectedDate?.getMonth() === currentMonth.getMonth() &&
                    selectedDate?.getFullYear() === currentMonth.getFullYear()
                  return (
                    <button
                      key={day}
                      onClick={() => handleSelectDay(day)}
                      disabled={isPast}
                      className={`aspect-square flex items-center justify-center rounded-full text-sm transition-all ${isSelected
                        ? "bg-primary text-primary-foreground font-bold shadow-lg"
                        : isPast
                          ? "text-muted-foreground/30 cursor-default"
                          : "text-foreground font-medium hover:bg-muted"
                        }`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time Slots */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
              <h3 className="text-lg font-bold text-foreground mb-1">{t.student.availableSlots}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {selectedDate
                  ? selectedDate.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                  : t.student.selectDayPrompt}
              </p>

              {loadingSlots ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="mr-2 text-sm text-muted-foreground">{t.student.loadingTimes}</span>
                </div>
              ) : !selectedDate ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  {t.student.selectDayPrompt}
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  {t.student.noTimesAvailable}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {availableSlots.map((slot) => {
                    const isActive = selectedSlot?.id === slot.id
                    return (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 border transition-all text-sm font-medium ${isActive
                          ? "border-primary bg-primary text-primary-foreground shadow-md"
                          : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5"
                          }`}
                      >
                        <Clock className={`w-4 h-4 ${isActive ? "text-white" : "text-muted-foreground"}`} />
                        {formatTime(slot.start_time)}
                        {isActive && <Check className="w-4 h-4" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6 sticky top-24">
              <h3 className="text-lg font-bold text-foreground mb-6 pb-4 border-b border-border">
                {t.student.bookingSummary}
              </h3>

              <div className="space-y-5 mb-8">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{t.student.dateLabel || t.student.date}</p>
                    <p className="font-bold text-foreground">
                      {selectedDate
                        ? selectedDate.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                        : t.student.notSelected}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{t.student.timeLabel}</p>
                    <p className="font-bold text-foreground">
                      {selectedSlot
                        ? `${formatTime(selectedSlot.start_time)} – ${formatTime(selectedSlot.end_time)}`
                        : t.student.notSelected}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-accent/10 rounded-xl text-accent">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{t.student.instructor || t.student.readerLabel}</p>
                    <p className="font-bold text-foreground">{t.student.assignedAuto}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleConfirm}
                  disabled={!selectedSlot || submitting}
                  className="w-full h-12 bg-accent hover:bg-accent/90 transition-all rounded-xl text-accent-foreground font-bold shadow-lg shadow-accent/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {t.student.submittingBooking}</>
                  ) : (
                    <><span>{t.student.confirmBooking}</span><ArrowLeft className="w-4 h-4 rtl:rotate-180" /></>
                  )}
                </button>
                <p className="text-xs text-center text-muted-foreground">
                  {t.student.cancelPolicy}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
