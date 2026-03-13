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

  // Single slot state
  const [newSlotDay, setNewSlotDay] = useState(0)
  const [newSlotStart, setNewSlotStart] = useState("09:00")
  const [newSlotEnd, setNewSlotEnd] = useState("09:30")
  const [dialogOpen, setDialogOpen] = useState(false)

  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>()
  const [bulkTimes, setBulkTimes] = useState([{ id: 1, start: "09:00", end: "09:30" }])
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]) // Mon-Fri

  // Pagination for Specific Dates Tab
  const [visibleDatesCount, setVisibleDatesCount] = useState(6)

  const [showSuccess, setShowSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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
    setSubmitting(true)
    try {
      const res = await fetch("/api/reader/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek: newSlotDay,
          startTime: newSlotStart,
          endTime: newSlotEnd,
        })
      })

      if (res.ok) {
        const data = await res.json()
        setSlots([...slots, data.slot].sort((a, b) => {
          if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week
          return a.start_time.localeCompare(b.start_time)
        }))
        setDialogOpen(false)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
      } else {
        alert(t.student.bookingError)
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
          alert(result.message); // Inform user if some slots were skipped due to overlaps
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

  const handleDeleteSlot = async (id: string) => {
    if (!confirm(t.reader.deleteSlotConfirm)) return

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

  const recurringSlots = slots.filter(s => s.is_recurring || !s.specific_date)
  const groupedRecurringSlots = daysOfWeek.reduce((acc: Record<string, Slot[]>, dayName: string, i: number) => {
    const daySlots = recurringSlots.filter(s => s.day_of_week === i)
    if (daySlots.length > 0) acc[dayName] = daySlots
    return acc
  }, {} as Record<string, Slot[]>)

  const specificDateSlots = slots.filter(s => s.specific_date && !s.is_recurring)
  const groupedSpecificDateSlots = specificDateSlots.reduce((acc, slot) => {
    const dateStr = slot.specific_date as string
    if (!acc[dateStr]) acc[dateStr] = []
    acc[dateStr].push(slot)
    return acc
  }, {} as Record<string, Slot[]>)

  // Sort dates descending or ascending
  const sortedDateKeys = Object.keys(groupedSpecificDateSlots).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.reader.manageScheduleTitle}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.reader.manageScheduleDesc}</p>
        </div>
        <div className="flex gap-2">
          {/* Bulk Add Button */}
          <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-[#D4A843] text-[#D4A843] hover:bg-[#D4A843]/10">
                <CalendarRange className="w-4 h-4 ml-2 rtl:mr-2 rtl:ml-0" />
                {t.reader.addBulkScheduleBtn}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>{t.reader.bulkAddTitle}</DialogTitle>
                <DialogDescription>{t.reader.bulkAddDesc}</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Date Range Selection */}
                <div className="space-y-2">
                  <Label>{t.reader.timeRangeLabel}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-right font-normal h-12 rounded-xl">
                        <CalendarIcon className="ml-2 h-4 w-4 text-[#0B3D2E]" />
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
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Day Selection */}
                <div className="space-y-3">
                  <Label>{t.reader.applyOnDays}</Label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day: string, i: number) => (
                      <div
                        key={i}
                        onClick={() => toggleDay(i)}
                        className={`px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${selectedDays.includes(i) ? "bg-[#0B3D2E] text-white border-[#0B3D2E]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Time Slots */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>{t.reader.timeSlotsHeader}</Label>
                    <Button variant="ghost" size="sm" onClick={addTimeSlot} className="text-[#0B3D2E] font-bold h-7">
                      {t.reader.addPeriodBtn}
                    </Button>
                  </div>
                  <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                    {bulkTimes.map((t) => (
                      <div key={t.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="flex-1 grid grid-cols-2 gap-3 font-mono">
                          <Input type="time" value={t.start} onChange={e => updateBulkTime(t.id, 'start', e.target.value)} className="h-9" />
                          <Input type="time" value={t.end} onChange={e => updateBulkTime(t.id, 'end', e.target.value)} className="h-9" />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeTimeSlot(t.id)} className="h-9 w-9 text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleBulkAdd} disabled={submitting} className="w-full bg-[#0B3D2E] h-12 font-bold text-white rounded-xl">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <CalendarRange className="w-4 h-4 ml-2 rtl:mr-2 rtl:ml-0" />}
                  {t.reader.saveAndInsertSchedule}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Single Add Button */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#0B3D2E] hover:bg-[#0A3528] text-white">
                <Plus className="w-4 h-4 ml-2 rtl:mr-2 rtl:ml-0" />
                {t.reader.addRecurringScheduleBtn}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t.reader.addNewSlotTitle}</DialogTitle>
                <DialogDescription>{t.reader.addNewSlotDesc}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="day">{t.reader.dayLabel}</Label>
                  <select
                    id="day"
                    value={newSlotDay}
                    onChange={(e) => setNewSlotDay(Number(e.target.value))}
                    className="w-full h-10 rounded-xl border border-gray-100 bg-white px-3 text-sm text-gray-800 focus:ring-2 focus:ring-[#0B3D2E]/20"
                  >
                    {daysOfWeek.map((day: string, i: number) => (
                      <option key={i} value={i}>{day}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-time">{t.reader.fromLabel}</Label>
                    <Input id="start-time" type="time" value={newSlotStart} onChange={(e) => setNewSlotStart(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-time">{t.reader.toLabel}</Label>
                    <Input id="end-time" type="time" value={newSlotEnd} onChange={(e) => setNewSlotEnd(e.target.value)} />
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button onClick={handleAddSlot} disabled={submitting} className="w-full bg-[#D4A843] hover:bg-[#C49A3A] text-white rounded-xl h-11">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t.reader.addSlotBtn}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {showSuccess && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold border border-emerald-200 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          {t.reader.scheduleUpdatedSuccess}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <Card className="border-slate-200 rounded-2xl">
            <CardContent className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Tabs defaultValue="recurring" className="space-y-6">
          <TabsList className="bg-gray-50 p-1 border border-gray-100 h-auto rounded-xl">
            <TabsTrigger value="recurring" className="rounded-lg h-9 px-4 lg:px-8 data-[state=active]:bg-white data-[state=active]:text-[#0B3D2E] data-[state=active]:shadow-sm font-medium">
              {t.reader.weeklyRecurringTitle}
            </TabsTrigger>
            <TabsTrigger value="specific" className="rounded-lg h-9 px-4 lg:px-8 data-[state=active]:bg-white data-[state=active]:text-[#0B3D2E] data-[state=active]:shadow-sm font-medium">
              {t.reader.specificDatesTitle}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recurring" className="space-y-4">
            {Object.entries(groupedRecurringSlots).length === 0 ? (
              <Card className="border-gray-100 rounded-2xl shadow-sm">
                <CardContent className="py-20 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="w-10 h-10 text-gray-200" />
                  </div>
                  <p className="text-gray-500 font-bold text-lg">{t.reader.noWeeklySlots}</p>
                  <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">{t.reader.noWeeklySlotsDesc}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(Object.entries(groupedRecurringSlots) as [string, Slot[]][]).map(([day, daySlots]) => (
                  <Card key={day} className="border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <CardHeader className="pb-3 bg-gray-50/30 border-b border-gray-100">
                      <CardTitle className="text-base flex items-center justify-between text-gray-800 font-bold">
                        <span className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-[#0B3D2E]" />
                          {day}
                        </span>
                        <span className="text-xs bg-[#0B3D2E]/10 text-[#0B3D2E] px-2 py-1 rounded-full">{daySlots.length} {t.reader.periodsCount}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 flex-1">
                      <div className="space-y-3">
                        {daySlots.map((slot: Slot) => {
                          const startShort = slot.start_time.substring(0, 5)
                          const endShort = slot.end_time.substring(0, 5)
                          return (
                            <div key={slot.id} className="group flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white hover:border-[#0B3D2E]/20 hover:bg-[#0B3D2E]/[0.02] transition-all">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors">
                                  <Clock className="w-4 h-4 text-gray-400 group-hover:text-[#0B3D2E]" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-gray-700 font-mono tabular-nums leading-none mt-1.5">
                                    {startShort} - {endShort}
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost" size="icon"
                                className="h-8 w-8 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg group-hover:opacity-100 opacity-0 transition-opacity"
                                onClick={() => handleDeleteSlot(slot.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="specific" className="space-y-4">
            {sortedDateKeys.length === 0 ? (
              <Card className="border-gray-100 rounded-2xl shadow-sm">
                <CardContent className="py-20 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarRange className="w-10 h-10 text-gray-200" />
                  </div>
                  <p className="text-gray-500 font-bold text-lg">{t.reader.noSpecificDates}</p>
                  <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">{t.reader.noSpecificDatesDesc}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sortedDateKeys.slice(0, visibleDatesCount).map(dateStr => {
                    const daySlots = groupedSpecificDateSlots[dateStr]
                    const dateObj = new Date(dateStr)
                    const dayName = daysOfWeek[dateObj.getDay()]
                    return (
                      <Card key={dateStr} className="border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                        <CardHeader className="pb-3 bg-gray-50/30 border-b border-gray-100">
                          <CardTitle className="text-base flex items-center justify-between text-gray-800 font-bold">
                            <span className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4 text-[#0B3D2E]" />
                              {dayName}، {format(dateObj, locale === 'ar' ? "d MMMM yyyy" : "d MMMM yyyy", { locale: dateLocale })}
                            </span>
                            <span className="text-xs bg-[#0B3D2E]/10 text-[#0B3D2E] px-2 py-1 rounded-full">{daySlots.length} {t.reader.periodsCount}</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 flex-1">
                          <div className="space-y-3">
                            {daySlots.map((slot: Slot) => {
                              const startShort = slot.start_time.substring(0, 5)
                              const endShort = slot.end_time.substring(0, 5)
                              return (
                                <div key={slot.id} className="group flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white hover:border-[#0B3D2E]/20 hover:bg-[#0B3D2E]/[0.02] transition-all">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors">
                                      <Clock className="w-4 h-4 text-gray-400 group-hover:text-[#0B3D2E]" />
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-sm font-bold text-gray-700 font-mono tabular-nums leading-none mt-1.5">
                                        {startShort} - {endShort}
                                      </span>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost" size="icon"
                                    className="h-8 w-8 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg group-hover:opacity-100 opacity-0 transition-opacity"
                                    onClick={() => handleDeleteSlot(slot.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
                {visibleDatesCount < sortedDateKeys.length && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setVisibleDatesCount(prev => prev + 6)}
                      className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl px-8 font-medium"
                    >
                      {t.reader.showMoreDates.replace('{count}', (sortedDateKeys.length - visibleDatesCount).toString())}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <Card className="border-amber-100 bg-amber-50/50 rounded-2xl">
        <CardContent className="pt-6 flex gap-3">
          <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-amber-900">{t.reader.scheduleManagementTips}</p>
            <p className="text-sm text-amber-800/70 leading-relaxed">
              {t.reader.bulkAddTip}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
