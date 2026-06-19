"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import { Building2, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react"

export default function AdminInvitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: initiativeId } = use(params)
  const router = useRouter()
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("يرجى تعبئة جميع الحقول")
      return
    }
    if (form.password !== form.confirm) {
      setError("كلمة المرور وتأكيدها غير متطابقتين")
      return
    }
    if (form.password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/admin-invite/${initiativeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "فشل التسجيل")
      setDone(true)
      setTimeout(() => router.push("/login-admin"), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <div className="bg-card border border-border rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-2">تم التسجيل بنجاح</h2>
          <p className="text-sm text-muted-foreground font-bold">جاري تحويلك لصفحة تسجيل الدخول...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <div className="bg-card border border-border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-primary/5 border-b border-border p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-foreground">إكمال بيانات المشرف</h1>
          <p className="text-sm text-muted-foreground font-bold mt-1">أنت مدعو لإدارة مبادرة على منصة إتقان</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-muted-foreground tracking-wide">الاسم الكامل *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="اسمك الكامل"
              autoFocus
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-muted-foreground tracking-wide">البريد الإلكتروني *</label>
            <input
              type="email"
              dir="ltr"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10 text-left"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-muted-foreground tracking-wide">كلمة المرور *</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="8 أحرف على الأقل"
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10 pl-12"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-muted-foreground tracking-wide">تأكيد كلمة المرور *</label>
            <input
              type="password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="أعد كتابة كلمة المرور"
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-destructive/10 text-destructive border border-destructive/20 px-4 py-3 rounded-xl text-sm font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-black text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            إكمال التسجيل
          </button>
        </form>
      </div>
    </div>
  )
}
