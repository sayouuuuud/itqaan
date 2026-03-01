import Link from "next/link"

interface ScheduleItem {
  id: string
  day_name: string
  time_text?: string
  time?: string
  title: string
  description: string | null
  is_active: boolean
  sort_order: number
  event_date?: string | null
  event_type?: string | null
}

interface WeeklyScheduleProps {
  schedule: ScheduleItem[]
}

const getEventTypeLabel = (type: string | null | undefined) => {
  switch (type?.toLowerCase()) {
    case "lesson": return "درس"
    case "khutba": return "خطبة"
    case "lecture": return "محاضرة"
    case "event": return "فعالية"
    case "fiqh": return "فقه"
    case "seerah": return "سيرة"
    case "aqeedah": return "عقيدة"
    case "tafsir": return "تفسير"
    case "hadith": return "حديث"
    case "arabic": return "لغة عربية"
    case "quran": return "قرآن"
    case "tajweed": return "تجويد"
    default: return type || ""
  }
}

export function WeeklySchedule({ schedule }: WeeklyScheduleProps) {
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="bg-yellow-100 text-yellow-700 p-2.5 rounded-xl shadow-sm">
            <span className="material-icons-outlined text-xl">calendar_today</span>
          </span>
          <h3 className="text-2xl font-bold font-serif text-foreground">جدول الدروس الأسبوعية</h3>
        </div>
        <span className="text-xs text-text-muted bg-muted px-3 py-1.5 rounded-full flex items-center gap-1">
          <span className="material-icons-outlined text-xs text-secondary">schedule</span>
          بتوقيت القاهرة
        </span>
      </div>

      {/* Card with dark mode contrast */}
      <div className="bg-card dark:bg-card/80 rounded-2xl p-4 sm:p-6 border-2 border-border dark:border-border/50 shadow-lg dark:shadow-xl space-y-4 sm:space-y-5">
        {schedule.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-icons-outlined text-5xl text-text-muted mb-4">event_busy</span>
            <p className="text-text-muted">لا يوجد جدول حالياً</p>
          </div>
        ) : (
          schedule.map((item, index) => (
            <div key={item.id}>
              {index > 0 && <div className="border-t border-border dark:border-border/50 mb-4 sm:mb-5" />}
              <div className="flex items-start gap-3 sm:gap-4 group transition-all duration-300 hover:-translate-y-0.5 p-2 sm:p-3 rounded-xl hover:bg-muted/50 dark:hover:bg-white/5">
                {/* Day & Time Box */}
                <div className="bg-gradient-to-br from-primary/15 to-primary/5 dark:from-primary/25 dark:to-primary/10 border-2 border-primary/30 dark:border-primary/40 rounded-xl p-2 sm:p-3 text-center min-w-[70px] sm:min-w-[85px] shadow-sm group-hover:border-primary/50 transition-colors duration-300">
                  <span className="block text-xs text-primary font-bold">{item.day_name}</span>
                  <span className="block text-lg sm:text-xl font-bold text-primary mt-1">{item.time_text || item.time || ""}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2">
                      {item.title}
                    </h4>
                    {/* Date - Plain text */}
                    {item.event_date && (
                      <span className="flex-shrink-0 text-xs text-text-muted">
                        {formatDate(item.event_date)}
                      </span>
                    )}
                  </div>
                  {/* Description - visible on all screens */}
                  {item.description && (
                    <p className="text-sm text-text-muted mt-1 line-clamp-2">{item.description}</p>
                  )}
                  {/* Event Type/Category Badge */}
                  {item.event_type && (
                    <span className="inline-block text-xs text-secondary font-medium bg-secondary/15 dark:bg-secondary/25 px-2 py-0.5 rounded-full mt-2">
                      {getEventTypeLabel(item.event_type)}
                    </span>
                  )}
                </div>

                {/* Arrow - Hidden on mobile */}
                <div className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="material-icons-outlined text-primary text-sm">arrow_back</span>
                </div>
              </div>
            </div>
          ))
        )}

        <div className="pt-4 border-t border-border dark:border-border/50">
          <Link
            href="/schedule"
            className="flex items-center justify-center gap-2 text-sm text-text-muted hover:text-primary py-2 rounded-lg hover:bg-muted dark:hover:bg-white/5 transition-all duration-300"
          >
            <span className="material-icons-outlined text-sm text-primary">calendar_month</span>
            عرض الجدول الشهري الكامل
            <span className="material-icons-outlined text-sm text-primary rtl-flip">arrow_back</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

