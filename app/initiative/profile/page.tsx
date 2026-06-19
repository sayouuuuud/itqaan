"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Loader2, CheckCircle, Settings2 } from "lucide-react"
import { AvatarUpload } from "@/components/avatar-upload"

export default function InitiativeProfilePage() {
  const [profile, setProfile] = useState({ name: "", email: "", password: "", avatar_url: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/admin/profile")
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            setProfile({
              name: data.user.name,
              email: data.user.email,
              password: "",
              avatar_url: data.user.avatar_url || "",
            })
          }
        }
      } catch (err) {
        console.error("Failed to load profile", err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      })
      if (res.ok) {
        setSaved(true)
        setProfile((p) => ({ ...p, password: "" }))
        setTimeout(() => setSaved(false), 3000)
      } else {
        const d = await res.json()
        setError(d.error || "تعذّر حفظ التغييرات")
      }
    } catch {
      setError("حدث خطأ غير متوقع")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div dir="rtl" className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
          <Settings2 className="w-3 h-3" />
          الملف الشخصي
        </div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">حسابي</h1>
        <p className="text-muted-foreground font-medium">أدر بيانات حساب مشرف المبادرة الخاص بك.</p>
      </div>

      <Card className="border-border shadow-xl shadow-primary/5 bg-card rounded-3xl overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <User className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-foreground">بيانات الحساب</CardTitle>
              <CardDescription className="text-muted-foreground font-medium text-sm">
                حدّث اسمك وبريدك الإلكتروني وكلمة المرور وصورتك.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6 px-8 pb-8">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-sm text-destructive text-center font-bold">
              {error}
            </div>
          )}

          <div className="flex items-center gap-4">
            <AvatarUpload
              currentUrl={profile.avatar_url}
              name={profile.name}
              size="md"
              onUploaded={async (url) => {
                setProfile((p) => ({ ...p, avatar_url: url }))
                await fetch("/api/auth/me", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ avatar_url: url }),
                })
              }}
            />
            <div>
              <p className="text-sm font-semibold text-foreground">صورة الحساب</p>
              <p className="text-xs text-muted-foreground mt-0.5">اضغط على الصورة لتحديثها.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="profile-name" className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">
                الاسم الكامل
              </Label>
              <Input
                id="profile-name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="الاسم الكامل"
                className="h-12 border-border bg-muted/30 rounded-2xl font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email" className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">
                البريد الإلكتروني
              </Label>
              <Input
                id="profile-email"
                type="email"
                dir="ltr"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="name@example.com"
                className="h-12 border-border bg-muted/30 rounded-2xl font-medium"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="profile-pass" className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">
                كلمة مرور جديدة
              </Label>
              <Input
                id="profile-pass"
                type="password"
                dir="ltr"
                value={profile.password}
                onChange={(e) => setProfile({ ...profile, password: e.target.value })}
                placeholder="اتركها فارغة إن لم ترغب في تغييرها"
                className="h-12 border-border bg-muted/30 rounded-2xl font-medium"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-4 border-t border-border mt-6">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-12 px-8 bg-primary text-primary-foreground hover:shadow-lg rounded-2xl font-bold"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "حفظ التغييرات"}
            </Button>
            {saved && (
              <span className="flex items-center gap-2 text-sm text-primary font-bold animate-in fade-in">
                <CheckCircle className="w-5 h-5" /> تم الحفظ بنجاح
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
