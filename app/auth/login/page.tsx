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
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Mail, Lock } from "lucide-react"

export default function LoginPage() {
  const { t } = useI18n()
  const router = useRouter()
  const { toast } = useToast()
  const isAr = t.locale === "ar"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await authClient.signIn.email({
        email,
        password,
      })

      if (response.data?.user) {
        toast({ title: "مرحبا", description: "تم تسجيل الدخول بنجاح" })
        router.push(response.data.user.role === "TEACHER" ? "/teacher/dashboard" : "/student/courses")
      }
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في تسجيل الدخول", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-accent/5">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t.auth?.loginTitle || "تسجيل الدخول"}</h1>
          <p className="text-muted-foreground">{t.auth?.loginDescription || "ادخل إلى حسابك"}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-foreground">{t.auth?.email || "البريد الإلكتروني"}</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t.auth?.login || "دخول"}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            {t.auth?.noAccount || "ليس لديك حساب؟"}{" "}
            <Link href="/register" className="text-primary font-medium hover:underline">
              {t.auth?.registerNow || "سجل الآن"}
            </Link>
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <Link href="/forgot-password" className="text-center block text-sm text-primary hover:underline">
            {t.auth?.forgotPassword || "هل نسيت كلمة المرور؟"}
          </Link>
        </div>
      </Card>
    </div>
  )
}
