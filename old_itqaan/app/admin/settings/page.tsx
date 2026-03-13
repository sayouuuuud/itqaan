"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, User, Settings2, Loader2, CheckCircle, Mail, Image as ImageIcon } from "lucide-react"
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

    /* ──────────────── Environment Settings ──────────────── */
    const [smtp, setSmtp] = useState({ host: "", port: "", user: "", password: "", secure: true, fromEmail: "", fromName: "" })
    const [smtpSaving, setSmtpSaving] = useState(false)
    const [smtpSaved, setSmtpSaved] = useState(false)

    const [cloudinary, setCloudinary] = useState({ cloudName: "", apiKey: "", apiSecret: "" })
    const [cloudinarySaving, setCloudinarySaving] = useState(false)
    const [cloudinarySaved, setCloudinarySaved] = useState(false)

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

                    // Parse Strategy
                    const rawStrategy = d.settings?.reader_assignment_strategy
                    if (rawStrategy) {
                        const parsed = typeof rawStrategy === "string" ? rawStrategy.replace(/^"|"$/g, "") : rawStrategy
                        setStrategy(parsed)
                    }

                    // Parse SMTP
                    if (d.settings?.smtp_config) {
                        try {
                            const parsedSmtp = typeof d.settings.smtp_config === 'string' ? JSON.parse(d.settings.smtp_config) : d.settings.smtp_config;
                            setSmtp(prev => ({ ...prev, ...parsedSmtp }));
                        } catch (e) { console.error("Could not parse SMTP settings", e) }
                    }

                    // Parse Cloudinary
                    if (d.settings?.cloudinary_config) {
                        try {
                            const parsedCloudinary = typeof d.settings.cloudinary_config === 'string' ? JSON.parse(d.settings.cloudinary_config) : d.settings.cloudinary_config;
                            setCloudinary(prev => ({ ...prev, ...parsedCloudinary }));
                        } catch (e) { console.error("Could not parse Cloudinary settings", e) }
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
                alert(d.error || t.admin.errorSaving)
            }
        } catch {
            alert(t.auth.errorOccurred)
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
                alert(t.admin.errorSaving)
            }
        } catch {
            alert(t.auth.errorOccurred)
        } finally {
            setStrategySaving(false)
        }
    }

    const handleSmtpSave = async () => {
        setSmtpSaving(true)
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ settings: { smtp_config: smtp } }),
            })
            if (res.ok) {
                setSmtpSaved(true)
                setTimeout(() => setSmtpSaved(false), 3000)
            } else { alert(t.admin.errorSaving) }
        } catch { alert(t.auth.errorOccurred) }
        finally { setSmtpSaving(false) }
    }

    const handleCloudinarySave = async () => {
        setCloudinarySaving(true)
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ settings: { cloudinary_config: cloudinary } }),
            })
            if (res.ok) {
                setCloudinarySaved(true)
                setTimeout(() => setCloudinarySaved(false), 3000)
            } else { alert(t.admin.errorSaving) }
        } catch { alert(t.auth.errorOccurred) }
        finally { setCloudinarySaving(false) }
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
            label: t.admin.strategyFewestSessionsToday,
            desc: t.admin.strategyFewestSessionsTodayDesc,
        },
        {
            value: "least_total_bookings",
            icon: "📊",
            label: t.admin.strategyFewestTotalBookings,
            desc: t.admin.strategyFewestTotalBookingsDesc,
        },
        {
            value: "random",
            icon: "🎲",
            label: t.admin.strategyRandom,
            desc: t.admin.strategyRandomDesc,
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
                    <h1 className="text-2xl font-bold text-gray-900">{t.admin.settings}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {t.admin.settingsDesc}
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
                                {t.admin.myAccount}
                            </CardTitle>
                            <CardDescription className="text-xs font-medium text-gray-500 mt-0.5">
                                {t.admin.myAccountDesc}
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
                            <p className="text-sm font-semibold text-foreground">{t.admin.profilePhoto}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{t.admin.clickToUpdatePhoto}</p>
                        </div>
                    </div>

                    {/* Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="admin-name" className="font-bold text-xs text-gray-500 uppercase tracking-widest">{t.auth.fullName}</Label>
                            <Input
                                id="admin-name"
                                value={profile.name}
                                onChange={e => setProfile({ ...profile, name: e.target.value })}
                                placeholder={t.auth.fullName}
                                className="h-11 border-gray-100 bg-gray-50/50 rounded-xl focus:ring-[#0B3D2E]/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="admin-email" className="font-bold text-xs text-gray-500 uppercase tracking-widest">{t.auth.email}</Label>
                            <Input
                                id="admin-email"
                                type="email"
                                dir="ltr"
                                value={profile.email}
                                onChange={e => setProfile({ ...profile, email: e.target.value })}
                                placeholder={t.auth.email}
                                className="h-11 border-gray-100 bg-gray-50/50 rounded-xl focus:ring-[#0B3D2E]/20"
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="admin-pass" className="font-bold text-xs text-gray-500 uppercase tracking-widest">{t.admin.newPassword}</Label>
                            <Input
                                id="admin-pass"
                                type="password"
                                dir="ltr"
                                value={profile.password}
                                onChange={e => setProfile({ ...profile, password: e.target.value })}
                                placeholder={t.admin.passwordLeaveBlank}
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
                                    ? t.admin.savedSuccess
                                    : t.profile.saveChanges}
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
                                {t.admin.readerAssignmentStrategy}
                            </CardTitle>
                            <CardDescription className="text-xs font-medium text-gray-500 mt-0.5">
                                {t.admin.readerAssignmentStrategyDesc}
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
                                            {t.active}
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
                                    ? t.admin.savedSuccess
                                    : t.admin.saveStrategy}
                            </span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* ── SMTP Email Settings ── */}
            <Card className="border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardHeader className="bg-gray-50/30 border-b border-gray-50 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#0B3D2E]/10 rounded-xl">
                            <Mail className="w-5 h-5 text-[#0B3D2E]" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-gray-800">
                                {isAr ? "إعدادات البريد الإلكتروني (SMTP)" : "Email Settings (SMTP)"}
                            </CardTitle>
                            <CardDescription className="text-xs font-medium text-gray-500 mt-0.5">
                                {isAr ? "بيانات الإرسال عبر البريد الإلكتروني للمنصة." : "Platform email sending credentials."}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-gray-500 uppercase tracking-widest">SMTP Host</Label>
                            <Input
                                dir="ltr"
                                value={smtp.host}
                                onChange={e => setSmtp({ ...smtp, host: e.target.value })}
                                placeholder="smtp.gmail.com"
                                className="h-11 border-gray-100 bg-gray-50/50 rounded-xl focus:ring-[#0B3D2E]/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-gray-500 uppercase tracking-widest">SMTP Port</Label>
                            <Input
                                dir="ltr"
                                type="number"
                                value={smtp.port}
                                onChange={e => setSmtp({ ...smtp, port: e.target.value })}
                                placeholder="465"
                                className="h-11 border-gray-100 bg-gray-50/50 rounded-xl focus:ring-[#0B3D2E]/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-gray-500 uppercase tracking-widest">{isAr ? "البريد الإلكتروني للإرسال" : "User Email"}</Label>
                            <Input
                                dir="ltr"
                                type="email"
                                value={smtp.user}
                                onChange={e => setSmtp({ ...smtp, user: e.target.value })}
                                placeholder="example@gmail.com"
                                className="h-11 border-gray-100 bg-gray-50/50 rounded-xl focus:ring-[#0B3D2E]/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-gray-500 uppercase tracking-widest">{isAr ? "كلمة المرور (App Password)" : "Password"}</Label>
                            <Input
                                dir="ltr"
                                type="password"
                                value={smtp.password}
                                onChange={e => setSmtp({ ...smtp, password: e.target.value })}
                                placeholder="********"
                                className="h-11 border-gray-100 bg-gray-50/50 rounded-xl focus:ring-[#0B3D2E]/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-gray-500 uppercase tracking-widest">{isAr ? "اسم المرسل" : "From Name"}</Label>
                            <Input
                                value={smtp.fromName}
                                onChange={e => setSmtp({ ...smtp, fromName: e.target.value })}
                                placeholder="إتقان الفاتحة"
                                className="h-11 border-gray-100 bg-gray-50/50 rounded-xl focus:ring-[#0B3D2E]/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-gray-500 uppercase tracking-widest">{isAr ? "بريد المرسل المعروض" : "From Email"}</Label>
                            <Input
                                dir="ltr"
                                type="email"
                                value={smtp.fromEmail}
                                onChange={e => setSmtp({ ...smtp, fromEmail: e.target.value })}
                                placeholder="noreply@example.com"
                                className="h-11 border-gray-100 bg-gray-50/50 rounded-xl focus:ring-[#0B3D2E]/20"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button
                            onClick={handleSmtpSave}
                            disabled={smtpSaving}
                            className="bg-[#0B3D2E] hover:bg-[#0A3527] text-white font-bold px-8 h-11 rounded-xl shadow-sm transition-all duration-200"
                        >
                            {smtpSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : smtpSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                            <span className="mx-2">{smtpSaved ? t.admin.savedSuccess : (isAr ? "حفظ إعدادات البريد" : "Save Email Settings")}</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* ── Cloudinary Settings ── */}
            <Card className="border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardHeader className="bg-gray-50/30 border-b border-gray-50 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#0B3D2E]/10 rounded-xl">
                            <ImageIcon className="w-5 h-5 text-[#0B3D2E]" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-gray-800">
                                {isAr ? "إعدادات تخزين الملفات والصور (Cloudinary)" : "Storage Settings (Cloudinary)"}
                            </CardTitle>
                            <CardDescription className="text-xs font-medium text-gray-500 mt-0.5">
                                {isAr ? "بيانات ربط خدمة Cloudinary لرفع الصور والتسجيلات." : "Cloudinary credentials for media upload."}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-gray-500 uppercase tracking-widest">Cloud Name</Label>
                            <Input
                                dir="ltr"
                                value={cloudinary.cloudName}
                                onChange={e => setCloudinary({ ...cloudinary, cloudName: e.target.value })}
                                placeholder="dnaq5..."
                                className="h-11 border-gray-100 bg-gray-50/50 rounded-xl focus:ring-[#0B3D2E]/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-gray-500 uppercase tracking-widest">API Key</Label>
                            <Input
                                dir="ltr"
                                value={cloudinary.apiKey}
                                onChange={e => setCloudinary({ ...cloudinary, apiKey: e.target.value })}
                                placeholder="8433..."
                                className="h-11 border-gray-100 bg-gray-50/50 rounded-xl focus:ring-[#0B3D2E]/20"
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label className="font-bold text-xs text-gray-500 uppercase tracking-widest">API Secret</Label>
                            <Input
                                dir="ltr"
                                type="password"
                                value={cloudinary.apiSecret}
                                onChange={e => setCloudinary({ ...cloudinary, apiSecret: e.target.value })}
                                placeholder="********"
                                className="h-11 border-gray-100 bg-gray-50/50 rounded-xl focus:ring-[#0B3D2E]/20"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button
                            onClick={handleCloudinarySave}
                            disabled={cloudinarySaving}
                            className="bg-[#0B3D2E] hover:bg-[#0A3527] text-white font-bold px-8 h-11 rounded-xl shadow-sm transition-all duration-200"
                        >
                            {cloudinarySaving ? <Loader2 className="w-4 h-4 animate-spin" /> : cloudinarySaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                            <span className="mx-2">{cloudinarySaved ? t.admin.savedSuccess : (isAr ? "حفظ إعدادات التخزين" : "Save Storage Settings")}</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
