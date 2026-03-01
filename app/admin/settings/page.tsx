"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, User, Settings2, Loader2, CheckCircle } from "lucide-react"
import { AvatarUpload } from "@/components/avatar-upload"

export default function AdminSettingsPage() {
    const { t } = useI18n()
    const isAr = t.locale === "ar"

    /* ──────────────── Profile ──────────────── */
    const [profile, setProfile] = useState({ name: "", email: "", password: "", avatar_url: "" })
    const [profileSaving, setProfileSaving] = useState(false)
    const [profileSaved, setProfileSaved] = useState(false)

    /* ──────────────── Assignment Strategy ──────────────── */
    const [strategy, setStrategy] = useState("least_booked_today")
    const [strategySaving, setStrategySaving] = useState(false)
    const [strategySaved, setStrategySaved] = useState(false)

    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            try {
                const [profileRes, settingsRes] = await Promise.all([
                    fetch("/api/admin/profile"),
                    fetch("/api/admin/settings"),
                ])
                if (profileRes.ok) {
                    const d = await profileRes.json()
                    if (d.user) setProfile(p => ({ ...p, name: d.user.name, email: d.user.email, avatar_url: d.user.avatar_url || "" }))
                }
                if (settingsRes.ok) {
                    const d = await settingsRes.json()
                    const raw = d.settings?.reader_assignment_strategy
                    if (raw) {
                        const parsed = typeof raw === "string" ? raw.replace(/^"|"$/g, "") : raw
                        setStrategy(parsed)
                    }
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    const handleProfileSave = async () => {
        setProfileSaving(true)
        try {
            const res = await fetch("/api/admin/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profile),
            })
            if (res.ok) {
                setProfileSaved(true)
                setProfile(p => ({ ...p, password: "" }))
                setTimeout(() => setProfileSaved(false), 3000)
            } else {
                const d = await res.json()
                alert(d.error || "Error")
            }
        } catch {
            alert("Error")
        } finally {
            setProfileSaving(false)
        }
    }

    const handleStrategySave = async () => {
        setStrategySaving(true)
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ settings: { reader_assignment_strategy: strategy } }),
            })
            if (res.ok) {
                setStrategySaved(true)
                setTimeout(() => setStrategySaved(false), 3000)
            } else {
                alert(isAr ? "خطأ في الحفظ" : "Error saving")
            }
        } catch {
            alert("Error")
        } finally {
            setStrategySaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    const strategyOptions = [
        {
            value: "least_booked_today",
            icon: "🔁",
            label: isAr ? "الأقل جلسات اليوم" : "Fewest Sessions Today",
            desc: isAr ? "يختار المقرئ ذو أقل جلسات اليوم (توزيع عادل)" : "Pick the reader with fewest sessions today (load balancing)",
        },
        {
            value: "least_total_bookings",
            icon: "📊",
            label: isAr ? "الأقل إجمالاً" : "Fewest Total Bookings",
            desc: isAr ? "يختار المقرئ ذو أقل عدد جلسات على مدار التاريخ" : "Pick the reader with the fewest all-time bookings",
        },
        {
            value: "random",
            icon: "🎲",
            label: isAr ? "عشوائي" : "Random",
            desc: isAr ? "يختار مقرئاً عشوائياً من المتاحين في الوقت المطلوب" : "Pick a random available reader for the slot",
        },
    ]

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-6" dir={isAr ? 'rtl' : 'ltr'}>

            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 bg-[#0B3D2E]/5 rounded-2xl border border-[#0B3D2E]/10 shadow-sm">
                    <Settings2 className="w-8 h-8 text-[#0B3D2E]" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{isAr ? "الإعدادات" : "Settings"}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {isAr ? "تحكم في إعدادات النظام وبياناتك الشخصية" : "Control system settings and personal info"}
                    </p>
                </div>
            </div>

            {/* ── Admin Profile ── */}
            <Card className="border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardHeader className="bg-gray-50/30 border-b border-gray-50 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#0B3D2E]/10 rounded-xl">
                            <User className="w-5 h-5 text-[#0B3D2E]" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-gray-800">
                                {isAr ? "الحساب الشخصي" : "My Account"}
                            </CardTitle>
                            <CardDescription className="text-xs font-medium text-gray-500 mt-0.5">
                                {isAr ? "تعديل بياناتك الشخصية وكلمة المرور" : "Update your personal info and password"}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                        <AvatarUpload
                            currentUrl={profile.avatar_url}
                            name={profile.name}
                            size="md"
                            onUploaded={async (url) => {
                                setProfile(p => ({ ...p, avatar_url: url }))
                                await fetch("/api/auth/me", {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ avatar_url: url }),
                                })
                            }}
                        />
                        <div>
                            <p className="text-sm font-semibold text-foreground">{isAr ? "الصورة الشخصية" : "Profile Photo"}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{isAr ? "اضغط على الصورة لتغييرها" : "Click the photo to update"}</p>
                        </div>
                    </div>

                    {/* Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="admin-name" className="font-bold text-xs text-gray-500 uppercase tracking-widest">{isAr ? "الاسم" : "Name"}</Label>
                            <Input
                                id="admin-name"
                                value={profile.name}
                                onChange={e => setProfile({ ...profile, name: e.target.value })}
                                placeholder={isAr ? "الاسم الكامل" : "Full name"}
                                className="h-11 border-gray-100 bg-gray-50/50 rounded-xl focus:ring-[#0B3D2E]/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="admin-email" className="font-bold text-xs text-gray-500 uppercase tracking-widest">{isAr ? "البريد الإلكتروني" : "Email"}</Label>
                            <Input
                                id="admin-email"
                                type="email"
                                dir="ltr"
                                value={profile.email}
                                onChange={e => setProfile({ ...profile, email: e.target.value })}
                                placeholder="admin@example.com"
                                className="h-11 border-gray-100 bg-gray-50/50 rounded-xl focus:ring-[#0B3D2E]/20"
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="admin-pass" className="font-bold text-xs text-gray-500 uppercase tracking-widest">{isAr ? "كلمة المرور الجديدة" : "New Password"}</Label>
                            <Input
                                id="admin-pass"
                                type="password"
                                dir="ltr"
                                value={profile.password}
                                onChange={e => setProfile({ ...profile, password: e.target.value })}
                                placeholder={isAr ? "اتركه فارغاً إذا لا تريد تغييره" : "Leave blank to keep current password"}
                                className="h-11 border-gray-100 bg-gray-50/50 rounded-xl focus:ring-[#0B3D2E]/20"
                            />
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <Button
                            onClick={handleProfileSave}
                            disabled={profileSaving}
                            className="bg-[#0B3D2E] hover:bg-[#0A3527] text-white font-bold px-8 h-11 rounded-xl shadow-sm transition-all duration-200"
                        >
                            {profileSaving
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : profileSaved
                                    ? <CheckCircle className="w-4 h-4" />
                                    : <Save className="w-4 h-4" />}
                            <span className="mx-2">
                                {profileSaved
                                    ? (isAr ? "تم الحفظ ✓" : "Saved ✓")
                                    : (isAr ? "حفظ التغييرات" : "Save Changes")}
                            </span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* ── Reader Assignment Strategy ── */}
            <Card className="border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardHeader className="bg-gray-50/30 border-b border-gray-50 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#0B3D2E]/10 rounded-xl">
                            <Settings2 className="w-5 h-5 text-[#0B3D2E]" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-gray-800">
                                {isAr ? "معيار توزيع المقرئين" : "Reader Assignment Strategy"}
                            </CardTitle>
                            <CardDescription className="text-xs font-medium text-gray-500 mt-0.5">
                                {isAr ? "كيف يختار النظام المقرئ تلقائياً عند حجز جلسة" : "How the system automatically assigns a reader when a session is booked"}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {strategyOptions.map((opt) => {
                            const selected = strategy === opt.value
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setStrategy(opt.value)}
                                    className={`relative text-right p-5 rounded-2xl border-2 transition-all duration-200 ${selected
                                        ? "border-[#0B3D2E] bg-[#0B3D2E]/5 shadow-sm"
                                        : "border-gray-100 hover:border-[#0B3D2E]/20 hover:bg-gray-50/50"
                                        }`}
                                >
                                    {selected && (
                                        <span className="absolute top-3 left-3 rtl:right-3 rtl:left-auto text-[10px] bg-[#0B3D2E] text-white font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                            {isAr ? "نشط" : "Active"}
                                        </span>
                                    )}
                                    <div className="text-3xl mb-3">{opt.icon}</div>
                                    <p className={`text-sm font-bold mb-1 transition-colors ${selected ? "text-[#0B3D2E]" : "text-gray-800"}`}>
                                        {opt.label}
                                    </p>
                                    <p className="text-[11px] text-gray-400 leading-relaxed font-medium">{opt.desc}</p>
                                </button>
                            )
                        })}
                    </div>

                    <div className="flex justify-end border-t border-gray-50 pt-5">
                        <Button
                            onClick={handleStrategySave}
                            disabled={strategySaving}
                            className="bg-[#0B3D2E] hover:bg-[#0A3527] text-white font-bold px-8 h-11 rounded-xl shadow-sm transition-all duration-200"
                        >
                            {strategySaving
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : strategySaved
                                    ? <CheckCircle className="w-4 h-4" />
                                    : <Save className="w-4 h-4" />}
                            <span className="mx-2">
                                {strategySaved
                                    ? (isAr ? "تم الحفظ ✓" : "Saved ✓")
                                    : (isAr ? "حفظ الاستراتيجية" : "Save Strategy")}
                            </span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
