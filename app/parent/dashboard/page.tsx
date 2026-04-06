"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { useAuth } from "@/lib/better-auth-client"
import { Users, Loader2, BarChart3, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

interface Child {
  id: string
  name: string
  email: string
  courseId?: string
  courseTitle?: string
  progressPercentage?: number
}

export default function ParentDashboard() {
  const { t } = useI18n()
  const { data: session } = useAuth()
  const { toast } = useToast()
  const isAr = t.locale === "ar"

  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChildren()
  }, [])

  const loadChildren = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/lms/parent-student")
      if (res.ok) {
        const data = await res.json()
        setChildren(data.data || [])
      }
    } catch (error) {
      console.error("Error:", error)
      toast({ title: "خطأ", description: "فشل في تحميل البيانات", variant: "destructive" })
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
        <h1 className="text-3xl font-bold text-foreground">{t.parent?.dashboard || "لوحة الولي"}</h1>
        <p className="text-muted-foreground mt-1">{t.parent?.monitorProgress || "راقب تقدم أبنائك"}</p>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">{t.parent?.myChildren || "أبنائي"}</h2>
        {children.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground">{t.parent?.noChildren || "لا توجد أبناء مرتبطين"}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {children.map((child) => (
              <div key={child.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{child.name}</h3>
                    <p className="text-sm text-muted-foreground">{child.email}</p>
                  </div>
                  <Link href={`/parent/children/${child.id}`}>
                    <Button variant="outline">{t.common?.view || "عرض"}</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
