"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { useAuth } from "@/lib/better-auth-client"
import { BookOpen, Loader2, Play, Clock, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

interface Course {
  id: string
  title: string
  description: string
  lessonsCount: number
}

export default function StudentDashboard() {
  const { t } = useI18n()
  const { data: session } = useAuth()
  const { toast } = useToast()
  const isAr = t.locale === "ar"

  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/lms/courses")
      if (res.ok) {
        const data = await res.json()
        setCourses(data.data || [])
      }
    } catch (error) {
      console.error("Error:", error)
      toast({ title: "خطأ", description: "فشل في تحميل الدورات", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>
  }

  return (
    <div className="space-y-6 pb-10" dir={isAr ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t.student?.dashboard || "لوحة الطالب"}</h1>
        <p className="text-muted-foreground mt-1">{t.student?.learnMore || "تعلم واتقدم"}</p>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">{t.student?.myCourses || "دوراتي"}</h2>
        {courses.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground">{t.student?.noCourses || "لا توجد دورات حالياً"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <div key={course.id} className="border border-border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">{course.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{course.description}</p>
                <Link href={`/student/courses/${course.id}`}>
                  <Button className="w-full" variant="outline">{t.student?.start || "ابدأ"}</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
