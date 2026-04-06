"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { useAuth } from "@/lib/better-auth-client"
import { Plus, Loader2, Trash2, Edit2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

interface Course {
  id: string
  title: string
  description: string
  category: string
  status: string
  createdAt: string
  updatedAt: string
  studentCount?: number
  lessonsCount?: number
}

export default function TeacherCoursesPage() {
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
      console.error("Error loading courses:", error)
      toast({ title: "خطأ", description: "فشل في تحميل الدورات", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (courseId: string) => {
    if (!confirm(t.common?.confirmDelete || "هل تأكد من الحذف؟")) return

    try {
      const res = await fetch(`/api/lms/courses/${courseId}`, { method: "DELETE" })
      if (res.ok) {
        setCourses(courses.filter(c => c.id !== courseId))
        toast({ title: "نجح", description: "تم حذف الدورة بنجاح" })
      }
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في حذف الدورة", variant: "destructive" })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10" dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.teacher?.courses || "الدورات"}</h1>
          <p className="text-muted-foreground mt-1">{t.teacher?.manageCourses || "إدارة دوراتك"}</p>
        </div>
        <Link href="/teacher/courses/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            {t.teacher?.createCourse || "إنشاء دورة"}
          </Button>
        </Link>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">{t.teacher?.noCourses || "لا توجد دورات بعد"}</p>
          <Link href="/teacher/courses/new">
            <Button>{t.teacher?.createFirstCourse || "إنشاء أول دورة"}</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Card key={course.id} className="p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">{course.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{course.description}</p>

              <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{course.studentCount || 0} {t.teacher?.students || "طلاب"}</span>
                </div>
                <div className="text-xs text-muted-foreground/70">
                  {new Date(course.createdAt).toLocaleDateString(isAr ? "ar-SA" : "en-US")}
                </div>
              </div>

              <div className="flex gap-2">
                <Link href={`/teacher/courses/${course.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">{t.common?.view || "عرض"}</Button>
                </Link>
                <Link href={`/teacher/courses/${course.id}/edit`} className="flex-1">
                  <Button variant="ghost" className="w-full" size="icon">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(course.id)}
                  className="text-destructive hover:text-destructive/90"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
