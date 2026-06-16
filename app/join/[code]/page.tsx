"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, ChevronDown, Building2, Loader2 } from "lucide-react"

export default function JoinInitiativePage() {
  const router = useRouter()
  const params = useParams()
  const code = String(params.code || "")

  const [resolving, setResolving] = useState(true)
  const [initiative, setInitiative] = useState<{ name: string; typeLabel: string | null } | null>(null)
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [gender, setGender] = useState("")

  useEffect(() => {
    let active = true
    async function resolve() {
      try {
        const res = await fetch(`/api/initiatives/join/${encodeURIComponent(code)}`)
        const data = await res.json()
        if (!active) return
        if (res.ok) setInitiative(data.initiative)
        else setError(data.error || "رابط الدعوة غير صالح")
      } catch {
        if (active) setError("تعذّر التحقق من رابط الدعوة")
      } finally {
        if (active) setResolving(false)
      }
    }
    resolve()
    return () => {
      active = false
    }
  }, [code])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل")
      setLoading(false)
      return
    }
    try {
      const res = await fetch(`/api/initiatives/join/${encodeURIComponent(code)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, gender: gender || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "حدث خطأ")
        setLoading(false)
        return
      }
      router.push(`/verify?email=${encodeURIComponent(email)}`)
    } catch {
      setError("تعذّر الاتصال بالخادم")
      setLoading(false)
    }
  }

  return (
    <div dir="rtl" className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden bg-[#0B3D2E]">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at top left, #145A3E 0%, #0B3D2E 40%, #072A1F 100%)" }} />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <nav className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 max-w-7xl mx-auto w-full">
        <Link href="/" className="text-3xl font-bold tracking-tighter text-[#D4A843] hover:opacity-80 transition-opacity">إتقان</Link>
        <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors flex items-center gap-2">
          <span>لديك حساب؟</span>
          <span className="text-[#D4A843] font-bold">تسجيل الدخول</span>
        </Link>
      </nav>

      <main className="relative z-10 w-full max-w-lg px-4 py-12">
        <div className="bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-8 md:p-10">
          {resolving ? (
            <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-bold">جارٍ التحقق من الدعوة...</p>
            </div>
          ) : !initiative ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-7 h-7" />
              </div>
              <h1 className="text-xl font-black text-foreground mb-2">رابط غير صالح</h1>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{error || "رابط الدعوة غير صالح أو منتهي الصلاحية."}</p>
              <Link href="/register" className="inline-flex items-center justify-center text-sm font-bold text-primary hover:underline">
                التسجيل كطالب عادي
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-black px-4 py-2 rounded-full mb-4">
                  <Building2 className="w-4 h-4" />
                  <span>دعوة للانضمام</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-foreground mb-2 text-balance">
                  انضم إلى مبادرة {initiative.name}
                </h1>
                <p className="text-sm text-muted-foreground text-pretty">
                  أنشئ حسابك للبدء في رحلة إتقان تلاوة سورة الفاتحة ضمن المبادرة.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="fullname" className="block text-sm font-medium text-foreground/80 mb-1">الاسم الكامل</label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <input id="fullname" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="أدخل اسمك الكامل" className="w-full pr-10 pl-4 py-3 bg-secondary/20 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground" required />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground/80 mb-1">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" dir="ltr" className="w-full pr-10 pl-4 py-3 bg-secondary/20 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground" required />
                  </div>
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-foreground/80 mb-1">كلمة المرور</label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <input id="password" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6 أحرف على الأقل" dir="ltr" className="w-full pr-10 pl-10 py-3 bg-secondary/20 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground" required minLength={6} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="إظهار كلمة المرور">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-foreground/80 mb-1">الجنس</label>
                  <div className="relative">
                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
                    <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)} className="w-full pr-4 pl-10 py-3 bg-secondary/20 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground appearance-none" required>
                      <option value="">اختر الجنس</option>
                      <option value="male">ذكر</option>
                      <option value="female">أنثى</option>
                    </select>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-60">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جارٍ إنشاء الحساب...
                    </span>
                  ) : (
                    <>
                      <span>انضم الآن</span>
                      <ArrowLeft className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
