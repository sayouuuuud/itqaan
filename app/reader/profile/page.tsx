'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AvatarUpload } from '@/components/avatar-upload'
import { User, Lock, CheckCircle, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

interface UserProfile {
  id: string; name: string; email: string; role: string
  avatar_url: string | null; phone: string | null; gender: string | null
}

export default function ReaderProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState('')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) { setProfile(d.user); setName(d.user.name || ''); setPhone(d.user.phone || '') }
    }).finally(() => setLoading(false))
  }, [])

  const handleAvatarUploaded = async (url: string) => {
    await fetch('/api/auth/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatar_url: url }) })
    setProfile(p => p ? { ...p, avatar_url: url } : p)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch('/api/auth/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, phone }) })
      if (res.ok) { const d = await res.json(); setProfile(p => p ? { ...p, name: d.user.name } : p); setSaved(true); setTimeout(() => setSaved(false), 3000) }
    } finally { setSaving(false) }
  }

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault(); setPwError('')
    if (newPw !== confirmPw) { setPwError(t.profile.passwordsNotMatching); return }
    if (newPw.length < 6) { setPwError(t.profile.passwordMinLength); return }
    setPwSaving(true)
    try {
      const res = await fetch('/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }) })
      if (res.ok) { setPwSaved(true); setCurrentPw(''); setNewPw(''); setConfirmPw(''); setTimeout(() => setPwSaved(false), 3000) }
      else { const d = await res.json(); setPwError(d.error || t.profile.passwordChangeFailed) }
    } finally { setPwSaving(false) }
  }

  const { t } = useI18n()
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#1B5E3B]" /></div>

  return (
    <div className="min-h-screen relative pb-20">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-emerald-50/50 to-transparent -z-10" />
      <div className="absolute top-20 right-[10%] w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute top-40 left-[15%] w-72 h-72 bg-amber-100/20 rounded-full blur-3xl -z-10 animate-pulse delay-700" />

      <div className="max-w-4xl mx-auto px-4 pt-10 space-y-8 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
              <User className="w-3 h-3" />
              {t.profile.title}
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-none">
              {t.profile.title}
            </h1>
            <p className="text-slate-500 font-medium max-w-md">
              {t.profile.subtitle}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Avatar & Summary */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-white/40 shadow-2xl shadow-emerald-900/5 bg-white/70 backdrop-blur-xl rounded-3xl overflow-hidden border">
              <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-tr from-[#1B5E3B] to-[#C9A227] rounded-full blur opacity-20 group-hover:opacity-40 transition duration-500" />
                  <AvatarUpload
                    currentUrl={profile?.avatar_url}
                    name={profile?.name}
                    size="lg"
                    onUploaded={handleAvatarUploaded}
                  />
                </div>
                
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-slate-800">{profile?.name}</h2>
                  <p className="text-sm font-bold text-[#1B5E3B] bg-emerald-50 px-3 py-1 rounded-full inline-block">
                    {t.shell.certifiedReader}
                  </p>
                  <p className="text-sm text-slate-400 font-medium pt-2 break-all">{profile?.email}</p>
                </div>

                <div className="w-full pt-4 border-t border-slate-100">
                   <p className="text-xs text-slate-400 font-medium leading-relaxed">
                     {t.profile.clickToChangeAvatar}
                   </p>
                </div>
              </CardContent>
            </Card>

            <div className="bg-amber-50/50 border border-amber-100/50 p-6 rounded-3xl space-y-3">
              <h3 className="font-bold text-amber-800 flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4" />
                {t.locale === 'ar' ? "حساب موثق" : "Verified Account"}
              </h3>
              <p className="text-xs text-amber-700/70 leading-relaxed font-medium">
                {t.locale === 'ar' ? "بياناتك الشخصية محمية ومشفرة. لا نشارك معلوماتك مع أي جهة خارجية." : "Your personal data is protected and encrypted. We do not share your information with third parties."}
              </p>
            </div>
          </div>

          {/* Right Column: Forms */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="border-white/40 shadow-2xl shadow-emerald-900/5 bg-white/70 backdrop-blur-xl rounded-3xl overflow-hidden border">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-[#1B5E3B]">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">{t.profile.personalInfo}</CardTitle>
                    <CardDescription className="text-slate-500 font-medium text-sm">{t.profile.personalInfoDesc}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="reader-name" className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">{t.auth.fullName}</Label>
                      <Input id="reader-name" value={name} onChange={e => setName(e.target.value)} required className="h-12 border-slate-200 bg-white/50 rounded-2xl focus:ring-2 focus:ring-[#1B5E3B]/20 transition-all border font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reader-phone" className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">{t.profile.phone}</Label>
                      <Input id="reader-phone" value={phone} onChange={e => setPhone(e.target.value)} dir="ltr" className="h-12 border-slate-200 bg-white/50 rounded-2xl focus:ring-2 focus:ring-[#1B5E3B]/20 transition-all border font-medium" placeholder={t.profile.phonePlaceholder} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reader-email" className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">{t.auth.email}</Label>
                    <Input id="reader-email" value={profile?.email || ''} readOnly className="h-12 bg-slate-100 border-transparent text-slate-500 rounded-2xl cursor-not-allowed font-medium" dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reader-bio" className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">{t.locale === 'ar' ? "نبذة مختصرة" : "Bio"}</Label>
                    <Textarea id="reader-bio" value={bio} onChange={e => setBio(e.target.value)} rows={3} className="border-slate-200 bg-white/50 rounded-2xl focus:ring-2 focus:ring-[#1B5E3B]/20 transition-all border font-medium" placeholder={t.locale === 'ar' ? "أكتب نبذة عن تخصصك..." : "Write a short bio..."} />
                  </div>
                  <div className="pt-4 flex items-center justify-end gap-4 border-t border-slate-100 mt-6">
                    <Button type="submit" disabled={saving} className="h-12 px-8 bg-gradient-to-r from-[#1B5E3B] to-[#2D8C5B] hover:shadow-lg hover:shadow-emerald-900/20 text-white rounded-2xl font-bold transition-all transform active:scale-95">
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : t.profile.saveChanges}
                    </Button>
                    {saved && <span className="flex items-center gap-2 text-sm text-emerald-600 font-bold animate-in fade-in slide-in-from-right-2"><CheckCircle className="w-5 h-5" /> {t.profile.saved}</span>}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border-white/40 shadow-2xl shadow-emerald-900/5 bg-white/70 backdrop-blur-xl rounded-3xl overflow-hidden border">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-[#C9A227]">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">{t.profile.changePassword}</CardTitle>
                    <CardDescription className="text-slate-500 font-medium text-sm">{t.profile.changePasswordDesc}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <form onSubmit={handleChangePw} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">{t.profile.currentPassword}</Label>
                    <Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} dir="ltr" required className="h-12 border-slate-200 bg-white/50 rounded-2xl focus:ring-2 focus:ring-amber-500/20 transition-all border font-medium" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">{t.profile.newPassword}</Label>
                      <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} dir="ltr" required minLength={6} className="h-12 border-slate-200 bg-white/50 rounded-2xl focus:ring-2 focus:ring-amber-500/20 transition-all border font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">{t.profile.confirmPassword}</Label>
                      <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} dir="ltr" required className="h-12 border-slate-200 bg-white/50 rounded-2xl focus:ring-2 focus:ring-amber-500/20 transition-all border font-medium" />
                    </div>
                  </div>
                  {pwError && <p className="text-sm text-red-600 font-bold bg-red-50 p-3 rounded-xl border border-red-100">{pwError}</p>}
                  <div className="pt-4 flex items-center justify-end gap-4 border-t border-slate-100 mt-6">
                    <Button type="submit" disabled={pwSaving} className="h-12 px-8 bg-gradient-to-r from-slate-700 to-slate-800 hover:shadow-lg text-white rounded-2xl font-bold transition-all transform active:scale-95">
                      {pwSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : t.profile.updatePassword}
                    </Button>
                    {pwSaved && <span className="flex items-center gap-2 text-sm text-emerald-600 font-bold animate-in fade-in slide-in-from-right-2"><CheckCircle className="w-5 h-5" /> {t.profile.passwordUpdated}</span>}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
