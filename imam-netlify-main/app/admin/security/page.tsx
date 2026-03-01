"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, Shield, Key, Eye, EyeOff, User, Mail, Camera } from "lucide-react"
import Image from "next/image"

export default function SecurityPage() {
  const { user, refreshUser } = useAuth()
  const [saving, setSaving] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [showPasswords, setShowPasswords] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  })
  const [profile, setProfile] = useState({
    full_name: "",
    avatar_url: "",
  })
  const [newEmail, setNewEmail] = useState("")

  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.user_metadata?.full_name || "",
        avatar_url: user.user_metadata?.avatar_url || "",
      })
      setNewEmail(user.email || "")
      setLoading(false)
    }
  }, [user])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage({ type: "", text: "" })

    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `avatars/${user?.id || "admin"}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(fileName, file)

      if (uploadError) {
        if (
          uploadError.message.includes("Bucket not found") ||
          uploadError.message.includes("bucket")
        ) {
          throw new Error("يرجى إنشاء bucket باسم 'uploads' في Supabase Storage")
        }
        throw uploadError
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("uploads").getPublicUrl(fileName)

      setProfile((prev) => ({
        ...prev,
        avatar_url: publicUrl,
      }))

      setMessage({
        type: "success",
        text: "تم رفع الصورة بنجاح",
      })
    } catch (error: any) {
      console.error("[v0] Upload error:", error)
      setMessage({
        type: "error",
        text: "حدث خطأ أثناء رفع الصورة: " + error.message,
      })
    } finally {
      setUploading(false)
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    setMessage({ type: "", text: "" })

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        },
      })

      if (error) throw error

      // Refresh user data in context to update the header
      await refreshUser()

      setMessage({
        type: "success",
        text: "تم تحديث الملف الشخصي بنجاح",
      })
    } catch (error: any) {
      console.error("[v0] Profile update error:", error)
      setMessage({
        type: "error",
        text: error.message || "حدث خطأ أثناء تحديث الملف الشخصي",
      })
    }

    setSavingProfile(false)
  }

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault()
    setSavingEmail(true)
    setMessage({ type: "", text: "" })

    const emailToUpdate = newEmail.trim()

    if (emailToUpdate === user?.email) {
      setMessage({
        type: "error",
        text: "البريد الإلكتروني الجديد مطابق للحالي",
      })
      setSavingEmail(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        email: emailToUpdate,
      })

      if (error) throw error

      setMessage({
        type: "success",
        text: "تم إرسال رابط تأكيد إلى البريد الإلكتروني الجديد",
      })
    } catch (error: any) {
      console.error("[v0] Email update error:", error)
      setMessage({
        type: "error",
        text: error.message || "حدث خطأ أثناء تغيير البريد الإلكتروني",
      })
    }

    setSavingEmail(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: "", text: "" })

    if (passwords.new !== passwords.confirm) {
      setMessage({
        type: "error",
        text: "كلمة المرور الجديدة غير متطابقة",
      })
      setSaving(false)
      return
    }

    if (passwords.new.length < 6) {
      setMessage({
        type: "error",
        text: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
      })
      setSaving(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new,
      })

      if (error) throw error

      setMessage({
        type: "success",
        text: "تم تغيير كلمة المرور بنجاح",
      })

      setPasswords({
        current: "",
        new: "",
        confirm: "",
      })
    } catch (error: any) {
      console.error("[v0] Error changing password:", error)
      setMessage({
        type: "error",
        text: error.message || "حدث خطأ أثناء تغيير كلمة المرور",
      })
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground font-serif flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          إعدادات الأمان والملف الشخصي
        </h1>
        <p className="text-text-muted mt-2">
          إدارة ملفك الشخصي وكلمة المرور وإعدادات الأمان
        </p>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-xl text-center ${message.type === "error"
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
            }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Section */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">الملف الشخصي</h2>
              <p className="text-sm text-text-muted">
                تحديث معلوماتك الشخصية
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20 bg-muted">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url || "/placeholder.svg"}
                      alt="الصورة الشخصية"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-10 w-10 text-text-muted" />
                    </div>
                  )}
                </div>

                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-hover transition-colors"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4 text-white" />
                  )}
                </label>

                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </div>

              <p className="text-xs text-text-muted">
                اضغط على أيقونة الكاميرا لتغيير الصورة
              </p>
            </div>

            <div className="space-y-2">
              <Label>الاسم الكامل</Label>
              <Input
                value={profile.full_name}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    full_name: e.target.value,
                  })}
                placeholder="أدخل اسمك الكامل"
                className="bg-muted"
              />
            </div>

            <Button
              type="submit"
              disabled={savingProfile}
              className="w-full bg-primary hover:bg-primary-hover text-white"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                <>
                  <User className="h-4 w-4 ml-2" />
                  تحديث الملف الشخصي
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Email Change Section */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                البريد الإلكتروني
              </h2>
              <p className="text-sm text-text-muted">
                تغيير بريدك الإلكتروني
              </p>
            </div>
          </div>

          <form onSubmit={handleChangeEmail} className="space-y-4">
            <div className="space-y-2">
              <Label>البريد الإلكتروني الحالي</Label>
              <Input
                value={user?.email || ""}
                disabled
                className="bg-muted opacity-60"
              />
            </div>

            <div className="space-y-2">
              <Label>البريد الإلكتروني الجديد</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="أدخل البريد الإلكتروني الجديد"
                className="bg-muted"
                dir="ltr"
              />
            </div>

            <Button
              type="submit"
              disabled={savingEmail}
              className="w-full bg-primary hover:bg-primary-hover text-white"
            >
              {savingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 ml-2" />
                  تغيير البريد الإلكتروني
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Password Change Section */}
        <div className="bg-card rounded-2xl p-6 border border-border lg:col-span-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Key className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                تغيير كلمة المرور
              </h2>
              <p className="text-sm text-text-muted">
                تحديث كلمة مرور حسابك
              </p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label>كلمة المرور الحالية</Label>
              <div className="relative">
                <Input
                  type={showPasswords ? "text" : "password"}
                  value={passwords.current}
                  onChange={(e) =>
                    setPasswords({
                      ...passwords,
                      current: e.target.value,
                    })}
                  placeholder="••••••••"
                  className="bg-muted"
                />
                <button
                  type="button"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  onClick={() => setShowPasswords(!showPasswords)}
                >
                  {showPasswords ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>كلمة المرور الجديدة</Label>
              <Input
                type={showPasswords ? "text" : "password"}
                value={passwords.new}
                onChange={(e) =>
                  setPasswords({
                    ...passwords,
                    new: e.target.value,
                  })}
                placeholder="••••••••"
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label>تأكيد كلمة المرور</Label>
              <Input
                type={showPasswords ? "text" : "password"}
                value={passwords.confirm}
                onChange={(e) =>
                  setPasswords({
                    ...passwords,
                    confirm: e.target.value,
                  })}
                placeholder="••••••••"
                className="bg-muted"
              />
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-primary hover:bg-primary-hover text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 ml-2" />
                  تحديث كلمة المرور
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}