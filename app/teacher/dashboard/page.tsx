"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { useAuth } from "@/lib/better-auth-client"
import {
  BookOpen, Users, TrendingUp, Plus, Loader2, BarChart3, Calendar,
  Eye, Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"

interface Course {
  id: string
  title: string
  description: string
  teacher_id: string
  status: string
  createdAt: string
  updatedAt: string
  studentCount?: number
  progressPercentage?: number
}

export default function TeacherDashboard() {
  const { t } = useI18n()
  const { data: session, loading: sessionLoading } = useAuth()
  const { toast } = useToast()
  const isAr = t.locale === "ar"

  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState({ totalCourses: 0, totalStudents: 0, avgProgress: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionLoading && session?.user?.id) {
      loadCourses()
    }
  }, [session, sessionLoading])

  const loadCourses = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/lms/courses")
      if (res.ok) {
        const data = await res.json()
        setCourses(data.data || [])
        
        // Calculate stats
        const totalStudents = data.data?.reduce((sum: number, course: Course) => 
          sum + (course.studentCount || 0), 0) || 0
        const avgProgress = data.data?.length > 0 
          ? (data.data.reduce((sum: number, course: Course) => 
              sum + (course.progressPercentage || 0), 0) / data.data.length).toFixed(0)
          : 0

        setStats({
          totalCourses: data.data?.length || 0,
          totalStudents,
          avgProgress: parseFloat(avgProgress as string) || 0
        })
      }
    } catch (error) {
      console.error("Error loading courses:", error)
      toast({ title: "خطأ", description: "فشل في تحميل الدورات", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (sessionLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (session?.user?.role !== "TEACHER" && session?.user?.role !== "ADMIN") {
    return <div className="text-center py-10">{t.auth.unauthorized}</div>
  }

  return (
    <div className="space-y-6 pb-10" dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.teacher?.dashboard || "لوحة المعلم"}</h1>
          <p className="text-muted-foreground mt-1">{t.teacher?.welcomeBack || "أهلاً وسهلاً بك"}</p>
        </div>
        <Link href="/teacher/courses/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            {t.teacher?.createCourse || "إنشاء دورة"}
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{stats.totalCourses}</p>
          <p className="text-sm text-muted-foreground">{t.teacher?.totalCourses || "إجمالي الدورات"}</p>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-accent" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{stats.totalStudents}</p>
          <p className="text-sm text-muted-foreground">{t.teacher?.enrolledStudents || "الطلاب المسجلين"}</p>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{stats.avgProgress}%</p>
          <p className="text-sm text-muted-foreground">{t.teacher?.avgProgress || "متوسط التقدم"}</p>
        </Card>
      </div>

      {/* Courses Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">{t.teacher?.myCourses || "دوراتي"}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t.teacher?.manageCourses || "إدارة دوراتك"}</p>
          </div>
          <Link href="/teacher/courses">
            <Button variant="ghost" className="gap-2">
              <Eye className="w-4 h-4" />
              {t.common?.viewAll || "عرض الكل"}
            </Button>
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{t.teacher?.noCourses || "لا توجد دورات بعد"}</p>
            <Link href="/teacher/courses/new">
              <Button>{t.teacher?.createFirstCourse || "إنشاء أول دورة"}</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.slice(0, 6).map((course) => (
              <div key={course.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-foreground mb-2 line-clamp-2">{course.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{course.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{course.studentCount || 0} {t.teacher?.students || "طلاب"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>{course.progressPercentage || 0}%</span>
                  </div>
                </div>
                <Link href={`/teacher/courses/${course.id}`}>
                  <Button variant="outline" className="w-full">{t.common?.view || "عرض"}</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">{t.teacher?.recentActivity || "النشاط الأخير"}</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">{t.teacher?.activityPlaceholder || "لا يوجد نشاط بعد"}</p>
              <p className="text-xs text-muted-foreground">{t.teacher?.startByCreatingCourse || "ابدأ بإنشاء دورة جديدة"}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
