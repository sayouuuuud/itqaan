"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { authClient } from "@/lib/better-auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export default function RegisterPage() {
  const { t } = useI18n()
  const router = useRouter()
  const { toast } = useToast()
  const isAr = t.locale === "ar"

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "STUDENT",
    gender: "",
  })
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast({ title: "خطأ", description: "كلمات المرور غير متطابقة", variant: "destructive" })
      return
    }

    setLoading(true)

    try {
      const response = await authClient.signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      })

      if (response.data?.user) {
        toast({ title: "مرحبا", description: "تم الاشتراك بنجاح" })
        router.push("/auth/login")
      }
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في التسجيل", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-accent/5">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t.auth?.registerTitle || "إنشاء حساب"}</h1>
          <p className="text-muted-foreground">{t.auth?.registerDescription || "انضم إلينا"}</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-foreground">{t.auth?.fullName || "الاسم الكامل"}</Label>
            <Input
              id="name"
              type="text"
              placeholder="أحمد محمد"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="mt-1"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-foreground">{t.auth?.email || "البريد الإلكتروني"}</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="mt-1"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-foreground">{t.auth?.password || "كلمة المرور"}</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="mt-1"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-foreground">{t.auth?.confirmPassword || "تأكيد كلمة المرور"}</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              className="mt-1"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="role" className="text-foreground">{t.auth?.role || "نوع الحساب"}</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENT">{t.auth?.student || "طالب"}</SelectItem>
                <SelectItem value="TEACHER">{t.auth?.teacher || "معلم"}</SelectItem>
                <SelectItem value="PARENT">{t.auth?.parent || "ولي أمر"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t.auth?.register || "تسجيل"}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            {t.auth?.haveAccount || "هل لديك حساب بالفعل؟"}{" "}
            <Link href="/auth/login" className="text-primary font-medium hover:underline">
              {t.auth?.loginNow || "دخول"}
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}
