import Link from "next/link"
import { createPublicClient } from "@/lib/supabase/public"
import type { Metadata } from "next"
import { Calendar, ChevronRight, ChevronLeft, CalendarDays, CalendarRange, Clock, MapPin } from "lucide-react"


export const metadata: Metadata = {
  title: "الجدول الزمني",
  description: "الجدول الشهري للدروس والمحاضرات والخطب للشيخ السيد مراد",
}

interface ScheduleEvent {
  id: string
  title: string
  description: string | null
  event_type: string
  type: "weekly" | "one_time"
  day_of_week: string | null
  event_date: string | null
  event_time: string | null
  location: string | null
  is_live: boolean
  is_active: boolean
}

// Helper function to get Arabic day name
function getArabicDayName(dayIndex: number): string {
  const days = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"]
  return days[dayIndex]
}

// Helper to get Arabic month name
function getArabicMonthName(month: number): string {
  const months = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
  ]
  return months[month]
}

// Get event type styles
function getEventTypeStyles(type: string) {
  switch (type) {
    case "fiqh":
      return { bg: "bg-blue-100/50 dark:bg-blue-900/30", border: "border-blue-400", text: "text-blue-600 dark:text-blue-400" }
    case "seerah":
      return { bg: "bg-orange-100/50 dark:bg-orange-900/30", border: "border-orange-400", text: "text-orange-600 dark:text-orange-400" }
    case "friday":
      return { bg: "bg-green-100/50 dark:bg-green-900/30", border: "border-green-500", text: "text-green-700 dark:text-green-400" }
    case "aqeedah":
      return { bg: "bg-purple-100/50 dark:bg-purple-900/30", border: "border-purple-400", text: "text-purple-600 dark:text-purple-400" }
    default:
      return { bg: "bg-muted", border: "border-border", text: "text-muted-foreground" }
  }
}

// Get event type label
function getEventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    fiqh: "مجلس الفقه",
    seerah: "دروس السيرة",
    friday: "خطبة الجمعة",
    aqeedah: "عقيدة",
    general: "درس عام",
  }
  return labels[type] || "درس"
}

// Get Arabic day name from date
function getDayNameFromDate(dateStr: string | null): string {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
  return days[date.getDay()]
}

// Format time to 12-hour format
function formatTime12h(time: string | null): string {
  if (!time) return ""
  const [hours, minutes] = time.split(":")
  const hour = Number.parseInt(hours, 10)
  const ampm = hour >= 12 ? "م" : "ص"
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

// Get relative day description
function getRelativeDayDescription(dateStr: string | null): string {
  if (!dateStr) return ""
  const eventDate = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  eventDate.setHours(0, 0, 0, 0)

  const diffTime = eventDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "اليوم"
  if (diffDays === 1) return "غداً"
  if (diffDays === 2) return "بعد غد"
  if (diffDays > 0 && diffDays <= 6) {
    return getDayNameFromDate(dateStr)
  }
  if (diffDays < 0) {
    const absDays = Math.abs(diffDays)
    if (absDays === 1) return "أمس"
    if (absDays <= 6) {
      return `الأسبوع الماضي`
    }
  }

  return getDayNameFromDate(dateStr)
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; view?: string }>
}) {
  const params = await searchParams
  const supabase = createPublicClient()

  // Get current month/year or from params
  const now = new Date()
  const currentMonth = params.month ? Number.parseInt(params.month) : now.getMonth()
  const currentYear = params.year ? Number.parseInt(params.year) : now.getFullYear()
  const currentView = params.view || "month"

  // Get first and last day of month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)

  // Get all active events for the weekly section (first 3 by nearest date)
  const todayStr = now.toISOString().split("T")[0]

  const { data: allEvents } = await supabase
    .from("events")
    .select("*")
    .eq("is_active", true)
    .gte("event_date", todayStr)
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true })

  // Take first 3 events for weekly section
  const upcomingEvents = allEvents?.slice(0, 3) || []

  // Get events for current month
  const { data: monthlyEvents } = await supabase
    .from("events")
    .select("*")
    .eq("is_active", true)
    .gte("event_date", firstDayOfMonth.toISOString().split("T")[0])
    .lte("event_date", lastDayOfMonth.toISOString().split("T")[0])
    .order("event_date", { ascending: true })

  // Generate calendar grid
  const daysInMonth = lastDayOfMonth.getDate()

  // Adjust for Saturday start (0 = Saturday in our calendar)
  let firstDayIndex = firstDayOfMonth.getDay() + 1
  if (firstDayIndex === 7) firstDayIndex = 0

  // Previous month days
  const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate()

  // Create calendar days array
  const calendarDays: Array<{
    day: number
    isCurrentMonth: boolean
    isFriday: boolean
    events: ScheduleEvent[]
  }> = []

  // Add previous month days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarDays.push({
      day: prevMonthLastDay - i,
      isCurrentMonth: false,
      isFriday: false,
      events: [],
    })
  }

  // Add current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day)
    const dayOfWeek = date.getDay()
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

    // Get events for this date
    const dayEvents = (monthlyEvents || []).filter((e) => e.event_date === dateStr)

    calendarDays.push({
      day,
      isCurrentMonth: true,
      isFriday: dayOfWeek === 5,
      events: dayEvents,
    })
  }

  // Add next month days to complete the grid
  const remainingDays = 42 - calendarDays.length
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: false,
      isFriday: false,
      events: [],
    })
  }

  // Calculate navigation months
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear

  // Calculate week view days (7 days starting from today)
  const weekViewDays = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(now)
    date.setDate(now.getDate() + i)
    const dateStr = date.toISOString().split("T")[0]

    // Get events for this date from allEvents (which is already filtered >= today)
    const dayEvents = (allEvents || []).filter(e => e.event_date === dateStr)

    weekViewDays.push({
      date,
      dateStr,
      dayIndex: date.getDay(),
      dayName: getArabicDayName(date.getDay()),
      events: dayEvents
    })
  }

  return (<main className="min-h-screen bg-background">
    {/* Header */} <header className="bg-muted py-12 relative overflow-hidden">
      <div className="absolute -left-10 -top-10 opacity-5 text-primary pointer-events-none select-none">
        <Calendar className="h-72 w-72" />
      </div>
      <div className="container mx-auto px-4 relative z-10 text-center">
        <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs rounded-full mb-4 border border-primary/20">
          تنظيم الوقت </span>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-serif">
          الجدول الشهري للدروس والمحاضرات </h1>
        <p className="text-text-muted max-w-2xl mx-auto text-sm leading-relaxed">
          تابع مواعيد الدروس العلمية والمحاضرات العامة والخطب، وكن على اطلاع دائم بمجالس العلم والذكر. </p>
      </div>

    </header>
    <div className="container mx-auto px-4 py-12">
      {/* Month Navigation */} <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center bg-card rounded-xl shadow-sm p-2 border border-border">
          <Link href={`/schedule?month=${prevMonth}&year=${prevYear}`}
            className="p-2 hover:bg-muted rounded-lg text-text-muted transition" >
            <ChevronRight className="h-5 w-5" />
          </Link>
          <h2 className="px-6 font-bold text-lg text-primary">
            {getArabicMonthName(currentMonth)} {currentYear} </h2>
          <Link href={`/schedule?month=${nextMonth}&year=${nextYear}`}
            className="p-2 hover:bg-muted rounded-lg text-text-muted transition" >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/schedule?month=${currentMonth}&year=${currentYear}&view=month`}
            className={`px-4 py-2 rounded-lg text-sm shadow-sm flex items-center gap-2 transition ${currentView === "month"
              ? "bg-primary text-white"
              : "bg-card text-muted-foreground border border-border hover:bg-muted"
              }`}
          >
            <CalendarDays className="h-4 w-4" />
            شهر
          </Link>
          <Link
            href={`/schedule?month=${currentMonth}&year=${currentYear}&view=week`}
            className={`px-4 py-2 rounded-lg text-sm shadow-sm flex items-center gap-2 transition ${currentView === "week"
              ? "bg-primary text-white"
              : "bg-card text-muted-foreground border border-border hover:bg-muted"
              }`}
          >
            <CalendarRange className="h-4 w-4" />
            أسبوع
          </Link>
        </div>

      </div>

      {/* Calendar/Week View */}
      {currentView === "month" ? (
        <>
          {/* Mobile: Horizontal scroll wrapper */}
          <div className="bg-card rounded-2xl shadow-sm overflow-hidden border border-border">
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Day Headers */} <div className="grid grid-cols-7 border-b border-border bg-muted/50">
                  {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (<div key={dayIndex}
                    className={`py-3 sm:py-4 text-center text-xs sm:text-sm font-bold ${dayIndex === 6 ? "text-green-700 dark:text-green-400" : "text-text-muted"}`} >
                    {getArabicDayName(dayIndex)} </div>

                  ))} </div>

                {/* Calendar Days */} <div className="grid grid-cols-7 auto-rows-fr bg-border gap-px">
                  {calendarDays.map((calDay, index) => (<div key={index}
                    className={`min-h-[140px] p-2 relative group transition ${!calDay.isCurrentMonth ? "bg-card text-muted-foreground/30" : calDay.isFriday ? "bg-accent hover:bg-accent/80" : "bg-card hover:bg-muted"}`} >
                    <span className={`text-sm ${calDay.isFriday && calDay.isCurrentMonth ? "font-bold text-green-700" : calDay.isCurrentMonth ? "font-medium text-foreground" : ""}`} >
                      {calDay.day} </span>

                    {/* Events */} <div className="mt-2 space-y-1">
                      {calDay.events.map((event) => {
                        const styles = getEventTypeStyles(event.event_type)
                        return (<div key={event.id}
                          className={`p-2 rounded-lg ${styles.bg} border-r-2 ${styles.border} cursor-pointer hover:shadow-md transition relative overflow-hidden`} >
                          <div className={`text-[10px] ${styles.text} font-bold mb-1`}>
                            {getEventTypeLabel(event.event_type)} </div>
                          <div className="text-xs text-foreground font-medium line-clamp-2">
                            {event.title} </div>

                          {event.event_time && (<div className="flex items-center gap-1 mt-1 text-[10px] text-text-muted">
                            <Clock className="h-2.5 w-2.5" />
                            {formatTime12h(event.event_time)} </div>

                          )} {event.location && (<div className="flex items-center gap-1 mt-0.5 text-[10px] text-text-muted">
                            <MapPin className="h-2.5 w-2.5" />
                            {event.location} </div>

                          )} </div>

                        )
                      })} </div>
                  </div>

                  ))} </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-6">
            {/* Legend */}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full">
              </div>
              <span className="text-sm text-foreground">
                فقه</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full">
              </div>
              <span className="text-sm text-foreground">
                سيرة</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full">
              </div>
              <span className="text-sm text-foreground">
                خطبة الجمعة</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full">
              </div>
              <span className="text-sm text-foreground">
                عقيدة</span>
            </div>

          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <CalendarRange className="h-6 w-6 text-primary" />
            <h3 className="text-xl font-bold text-foreground">جدول الأسبوع الحالي</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {weekViewDays.map((day, index) => (
              <div key={day.dateStr} className={`bg-card rounded-xl border border-border overflow-hidden flex flex-col ${day.dayIndex === 5 ? 'ring-1 ring-primary/20' : ''}`}>

                {/* Date Header */}
                <div className={`p-3 text-center border-b border-border ${day.dayIndex === 5 ? 'bg-primary/5' : 'bg-muted/30'}`}>
                  <span className={`block font-bold text-sm ${day.dayIndex === 5 ? 'text-primary' : 'text-foreground'}`}>
                    {day.dayName}
                  </span>
                  <span className="block text-xs text-muted-foreground mt-1 font-medium">
                    {day.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                  </span>

                </div>

                {/* Events List */}
                <div className="p-2 flex-grow flex flex-col gap-2 min-h-[150px]">
                  {day.events.length > 0 ? (
                    <>
                      {day.events.map((event) => {
                        const styles = getEventTypeStyles(event.event_type)
                        return (
                          <div key={event.id} className={`flex flex-col gap-1.5 p-2 rounded-md border ${styles.border} ${styles.bg}`}>
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-background/50 ${styles.text} truncate max-w-[60px]`}>
                                {getEventTypeLabel(event.event_type)}
                              </span>
                              {event.event_time && (
                                <div className="flex-shrink-0 flex items-center gap-0.5 text-[10px] text-muted-foreground font-medium">
                                  {formatTime12h(event.event_time).split(' ')[0]}
                                </div>
                              )}
                            </div>

                            <h4 className="font-bold text-foreground text-xs line-clamp-2 leading-tight">{event.title}</h4>
                          </div>
                        )
                      })}
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 text-xs italic py-2">
                      <Calendar className="h-4 w-4 mb-1 opacity-20" />
                      <span>لا يوجد</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </main>

  )
}
