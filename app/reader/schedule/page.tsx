"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Clock, Calendar as CalendarIcon, CheckCircle, Loader2, CalendarRange, Info } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogTrigger
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { useI18n } from "@/lib/i18n/context"
import { enUS } from "date-fns/locale"
import { cn } from "@/lib/utils"


type Slot = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
  specific_date?: string
  is_recurring?: boolean
}

export default function ScheduleManagementPage() {
  const { t, locale } = useI18n()
  const dateLocale = locale === 'ar' ? ar : enUS
  const daysOfWeek = t.reader.days

  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)

  // UI State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // New Slot State
  const [newSlotPeriods, setNewSlotPeriods] = useState([{ id: 1, start: "09:00", end: "09:30" }])
  const [newSlotDays, setNewSlotDays] = useState<number[]>([]) // Days for recurring
  const [isRecurring, setIsRecurring] = useState(false)

  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>()
  const [bulkTimes, setBulkTimes] = useState([{ id: 1, start: "09:00", end: "09:30" }])
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]) // Mon-Fri

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/reader/schedule")
        if (res.ok) {
          const data = await res.json()
          setSlots(data.slots || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleAddSlot = async () => {
    if (isRecurring && newSlotDays.length === 0) {
      alert(t.reader.applyOnDays)
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        periods: newSlotPeriods.map(p => ({ startTime: p.start, endTime: p.end })),
        isRecurring: isRecurring,
        daysOfWeek: isRecurring ? newSlotDays : [selectedDate.getDay()],
        specificDate: isRecurring ? undefined : format(selectedDate, "yyyy-MM-dd")
      }

      const res = await fetch("/api/reader/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const data = await res.json()
        const newSlots = data.slots || []
        setSlots([...slots, ...newSlots].sort((a, b) => {
          if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week
          return a.start_time.localeCompare(b.start_time)
        }))
        setDialogOpen(false)
        setNewSlotPeriods([{ id: Date.now(), start: "09:00", end: "09:30" }])
        setNewSlotDays([])
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
      } else {
        const errData = await res.json()
        alert(errData.error || t.student.bookingError)
      }
    } catch {
      alert(t.student.serverError)
    } finally {
      setSubmitting(false)
    }
  }

  const handleBulkAdd = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      alert(t.reader.selectPeriod)
      return
    }
    if (selectedDays.length === 0) {
      alert(t.reader.applyOnDays)
      return
    }

    setSubmitting(true)
    try {
      // Format as YYYY-MM-DD
      const formatLocalDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const res = await fetch("/api/reader/schedule/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: formatLocalDate(dateRange.from),
          endDate: formatLocalDate(dateRange.to),
          days: selectedDays,
          times: bulkTimes.map(t => ({ startTime: t.start, endTime: t.end }))
        })
      })

      if (res.ok) {
        const result = await res.json()

        // Refresh full list
        const listRes = await fetch("/api/reader/schedule")
        const listData = await listRes.json()
        setSlots(listData.slots || [])

        setBulkDialogOpen(false)
        setShowSuccess(true)
        if (result.message) {
          // result.message already contains a localized description of what happened (e.g., skips due to overlap)
          alert(result.message); 
        }
        setTimeout(() => setShowSuccess(false), 3000)
      } else {
        const data = await res.json()
        alert(data.error || t.student.bookingError)
      }
    } catch {
      alert(t.student.serverError)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSlot = async (id: string, isRecurring?: boolean) => {
    const confirmMsg = isRecurring ? t.reader.deleteRecurringConfirm : t.reader.deleteSlotConfirm
    if (!confirm(confirmMsg || t.reader.deleteSlotConfirm)) return

    try {
      const res = await fetch(`/api/reader/schedule?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setSlots(slots.filter(s => s.id !== id))
      } else {
        alert(t.student.serverError)
      }
    } catch {
      alert(t.student.serverError)
    }
  }

  const handleDeleteAll = async () => {
    if (currentDaySlots.length === 0) return
    if (!confirm(t.reader.deleteAllConfirm || "هل أنت متأكد من حذف جميع مواعيد هذا اليوم؟")) return

    const dateStr = format(selectedDate, "yyyy-MM-dd")
    const dayOfWeek = selectedDate.getDay()

    try {
      const res = await fetch(`/api/reader/schedule?type=all&date=${dateStr}&dayOfWeek=${dayOfWeek}`, { method: "DELETE" })
      if (res.ok) {
        // Refresh full list
        const listRes = await fetch("/api/reader/schedule")
        const listData = await listRes.json()
        setSlots(listData.slots || [])
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
      } else {
        alert(t.student.serverError)
      }
    } catch {
      alert(t.student.serverError)
    }
  }

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const addTimeSlot = () => {
    setBulkTimes([...bulkTimes, { id: Date.now(), start: "09:00", end: "09:30" }])
  }

  const removeTimeSlot = (id: number) => {
    if (bulkTimes.length > 1) {
      setBulkTimes(bulkTimes.filter(t => t.id !== id))
    }
  }

  const updateBulkTime = (id: number, field: 'start' | 'end', val: string) => {
    setBulkTimes(bulkTimes.map(t => t.id === id ? { ...t, [field]: val } : t))
  }

  const getSlotsForDate = (date: Date) => {
    const dayOfWeek = date.getDay()
    const dateStr = format(date, "yyyy-MM-dd")

    return slots.filter(slot => {
      if (slot.is_recurring || !slot.specific_date) {
        return slot.day_of_week === dayOfWeek
      } else {
        const slotDate = new Date(slot.specific_date)
        const slotDateStr = format(slotDate, "yyyy-MM-dd")
        return slotDateStr === dateStr
      }
    }).sort((a, b) => a.start_time.localeCompare(b.start_time))
  }

  const currentDaySlots = getSlotsForDate(selectedDate)

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.reader.manageScheduleTitle}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.reader.manageScheduleDesc}</p>
        </div>
      </div>

      {showSuccess && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold border border-emerald-200 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          {t.reader.scheduleUpdatedSuccess}
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Calendar & Add Buttons */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            <Card className="border-border rounded-2xl shadow-sm overflow-hidden">
              <CardHeader className="pb-2 border-b border-border bg-muted/20">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  {t.student.selectDate}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  locale={dateLocale}
                  className="w-full border-none shadow-none bg-transparent"
                  modifiers={{
                    hasSlots: (date) => {
                      const dow = date.getDay()
                      const dateStr = format(date, "yyyy-MM-dd")
                      return slots.some(s => 
                        (s.specific_date && format(new Date(s.specific_date), "yyyy-MM-dd") === dateStr) || 
                        ((s.is_recurring || !s.specific_date) && s.day_of_week === dow)
                      )
                    }
                  }}
                  modifiersClassNames={{
                    hasSlots: "font-bold text-primary underline decoration-2 decoration-[#D4A843] underline-offset-4"
                  }}
                />
              </CardContent>
            </Card>

            <Button 
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-sm"
              onClick={() => {
                setIsRecurring(false)
                setNewSlotDays([selectedDate.getDay()])
                setNewSlotPeriods([{ id: Date.now(), start: "09:00", end: "09:30" }])
                setDialogOpen(true)
              }}
            >
              <Plus className="w-4 h-4 ml-2 rtl:mr-2" />
              {t.reader.addNewSlotTitle}
            </Button>

            <Button 
              variant="outline"
              className="w-full h-12 rounded-xl border-[#D4A843] text-[#D4A843] hover:bg-[#D4A843]/10 font-bold"
              onClick={() => setBulkDialogOpen(true)}
            >
              <CalendarRange className="w-4 h-4 ml-2 rtl:mr-2" />
              {t.reader.addBulkScheduleBtn}
            </Button>
          </div>

          {/* Right Column: Time Slots List */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <Card className="border-border rounded-2xl shadow-sm min-h-[450px] flex flex-col bg-card">
              <CardHeader className="pb-3 border-b border-border bg-muted/30 dark:bg-muted/10">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      {format(selectedDate, "EEEE، d MMMM", { locale: dateLocale })}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.reader.availableSlots} ({currentDaySlots.length})
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentDaySlots.length > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        onClick={handleDeleteAll}
                        title={t.reader.deleteAll || "حذف الكل"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-primary hover:bg-primary/5 rounded-lg transition-colors"
                      onClick={() => {
                        setIsRecurring(false)
                        setNewSlotDays([selectedDate.getDay()])
                        setNewSlotPeriods([{ id: Date.now(), start: "09:00", end: "09:30" }])
                        setDialogOpen(true)
                      }}
                      title={t.reader.addSlot || "إضافة موعد"}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <span className={cn(
                      "text-[10px] sm:text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider",
                      currentDaySlots.length > 0 ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                    )}>
                      {currentDaySlots.length > 0 ? t.active : t.inactive}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 flex-1">
                {currentDaySlots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <CalendarIcon className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                    <p className="font-bold text-lg text-foreground/70">{t.reader.noWeeklySlots}</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">{t.reader.noWeeklySlotsDesc}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentDaySlots.map((slot) => {
                      const isRec = slot.is_recurring || !slot.specific_date
                      return (
                        <div 
                          key={slot.id} 
                          className={cn(
                            "group flex items-center justify-between p-4 rounded-xl border transition-all",
                            isRec ? "border-primary/20 bg-primary/[0.02]" : "border-border bg-card"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                              <Clock className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-base font-bold text-foreground font-mono tabular-nums leading-none">
                                {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                              </span>
                              <span className="text-[10px] uppercase font-bold tracking-wider mt-1 text-muted-foreground/60">
                                {isRec ? t.reader.weeklyRecurringTitle : t.reader.specificDatesTitle}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg group-hover:opacity-100 opacity-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteSlot(slot.id, isRec)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10 rounded-2xl shadow-sm">
              <CardContent className="pt-4 pb-4 flex gap-3">
                <Info className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-200">{t.reader.scheduleManagementTips}</p>
                  <p className="text-sm text-amber-800/70 dark:text-amber-300/60 leading-relaxed text-xs">
                    {t.reader.bulkAddTip}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Simplified Add Slot Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-border bg-card shadow-2xl">
          <div className="bg-primary p-6 text-primary-foreground">
            <DialogHeader>
              <DialogTitle className="text-xl text-primary-foreground">{t.reader.addNewSlotTitle}</DialogTitle>
              <DialogDescription className="text-primary-foreground/70">
                {t.reader.dayLabel}: {format(selectedDate, "PPPP", { locale: dateLocale })}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Multi-day Selection for Recurring */}
            {isRecurring && (
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.reader.applyOnDays}</Label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((dayName: string, idx: number) => {
                    const isSelected = newSlotDays.includes(idx)
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setNewSlotDays(prev => 
                            prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]
                          )
                        }}
                        className={cn(
                          "px-3 h-10 rounded-xl text-xs font-bold transition-all border shrink-0",
                          isSelected 
                            ? "bg-primary text-white border-primary shadow-md shadow-primary/20" 
                            : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30"
                        )}
                      >
                        {dayName}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Multi-period Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.reader.selectTime}</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setNewSlotPeriods([...newSlotPeriods, { id: Date.now(), start: "09:00", end: "09:30" }])}
                  className="h-7 text-[10px] font-black uppercase text-primary hover:bg-primary/5"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {t.reader.addPeriod || "إضافة فترة"}
                </Button>
              </div>

              <div className="space-y-3">
                {newSlotPeriods.map((period, idx) => (
                  <div key={period.id} className="flex items-center gap-3 group animate-in slide-in-from-top-1 duration-200">
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <Input
                        type="time"
                        value={period.start}
                        onChange={(e) => {
                          setNewSlotPeriods(prev => prev.map(p => p.id === period.id ? { ...p, start: e.target.value } : p))
                        }}
                        className="rounded-xl h-11 border-border focus:ring-primary/20 bg-muted/20"
                      />
                      <Input
                        type="time"
                        value={period.end}
                        onChange={(e) => {
                          setNewSlotPeriods(prev => prev.map(p => p.id === period.id ? { ...p, end: e.target.value } : p))
                        }}
                        className="rounded-xl h-11 border-border focus:ring-primary/20 bg-muted/20"
                      />
                    </div>
                    {newSlotPeriods.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setNewSlotPeriods(prev => prev.filter(p => p.id !== period.id))}
                        className="h-9 w-9 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div 
              className={cn(
                "flex items-center space-x-2 space-x-reverse p-4 rounded-xl border transition-all cursor-pointer",
                isRecurring ? "bg-primary/5 border-primary/20" : "bg-muted/10 border-border hover:bg-muted/20"
              )}
              onClick={() => setIsRecurring(!isRecurring)}
            >
              <Checkbox 
                id="recurring" 
                checked={isRecurring} 
                onCheckedChange={(checked) => setIsRecurring(!!checked)} 
                className="w-5 h-5 data-[state=checked]:bg-primary rounded-md"
              />
              <div className="grid gap-1.5 leading-none px-2">
                <Label
                  htmlFor="recurring"
                  className="text-sm font-bold leading-none cursor-pointer"
                >
                  {t.reader.weeklyRecurringTitle}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t.reader.weeklyRecurringExplanation}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-0">
            <Button 
              onClick={handleAddSlot} 
              disabled={submitting} 
              className="w-full bg-[#D4A843] hover:bg-[#C49A3A] text-white rounded-xl h-12 font-bold shadow-lg transition-all active:scale-[0.98]"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : t.reader.addSlotBtn}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog stays mostly same but visually enhanced */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-xl rounded-2xl p-0 overflow-hidden">
          <div className="bg-[#0B3D2E] p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl text-white">{t.reader.bulkAddTitle}</DialogTitle>
              <DialogDescription className="text-emerald-100/70">{t.reader.bulkAddDesc}</DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Date Range Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.reader.timeRangeLabel}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-right font-normal h-12 rounded-xl border-border bg-muted/10">
                    <CalendarIcon className="ml-2 h-4 w-4 text-primary" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "PPP", { locale: dateLocale })} - {format(dateRange.to, "PPP", { locale: dateLocale })}
                        </>
                      ) : (
                        format(dateRange.from, "PPP", { locale: dateLocale })
                      )
                    ) : (
                      <span>{t.reader.selectPeriod}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange as any}
                    numberOfMonths={2}
                    locale={dateLocale}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Day Selection */}
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.reader.applyOnDays}</Label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day: string, i: number) => (
                  <div
                    key={i}
                    onClick={() => toggleDay(i)}
                    className={cn(
                      "px-4 py-2 rounded-xl border text-sm cursor-pointer transition-all font-bold",
                      selectedDays.includes(i) 
                        ? "bg-[#0B3D2E] text-white border-[#0B3D2E] shadow-sm" 
                        : "bg-background text-foreground border-border hover:border-primary/50"
                    )}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.reader.timeSlotsHeader}</Label>
                <Button variant="ghost" size="sm" onClick={addTimeSlot} className="text-[#0B3D2E] font-bold h-8 hover:bg-emerald-50">
                  <Plus className="w-3 h-3 ml-1" />
                  {t.reader.addPeriodBtn}
                </Button>
              </div>
              <div className="space-y-3">
                {bulkTimes.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 bg-muted/10 p-4 rounded-xl border border-border group">
                    <div className="flex-1 grid grid-cols-2 gap-4 font-mono">
                      <Input type="time" value={t.start} onChange={e => updateBulkTime(t.id, 'start', e.target.value)} className="h-10 rounded-lg bg-background" />
                      <Input type="time" value={t.end} onChange={e => updateBulkTime(t.id, 'end', e.target.value)} className="h-10 rounded-lg bg-background" />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeTimeSlot(t.id)} className="h-10 w-10 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 border-t border-border bg-muted/5">
            <Button onClick={handleBulkAdd} disabled={submitting} className="w-full bg-[#0B3D2E] h-12 font-bold text-white rounded-xl shadow-lg hover:bg-[#0A3528]">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <CalendarRange className="w-5 h-5 ml-2 rtl:mr-2" />}
              {t.reader.saveAndInsertSchedule}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
