"use client"

import { RecitationRecorder } from "@/components/student/RecitationRecorder"
import { useI18n } from "@/lib/i18n/context"

export default function StudentDashboard() {
  const { t } = useI18n()

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar h-full min-h-[80vh] md:min-h-[85vh]">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t.student.submitTitleFatiha}</h1>
        <p className="text-sm md:text-base text-muted-foreground px-4">{t.student.submitDescFatiha}</p>
      </div>

      <RecitationRecorder />
    </div>
  )
}
