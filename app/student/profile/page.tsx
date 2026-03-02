'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AvatarUpload } from '@/components/avatar-upload'
import { User, Lock, CheckCircle, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  avatar_url: string | null
  phone: string | null
  gender: string | null
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Password change state
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setProfile(d.user)
          setName(d.user.name || '')
          setPhone(d.user.phone || '')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleAvatarUploaded = async (url: string) => {
    await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_url: url }),
    })
    setProfile(p => p ? { ...p, avatar_url: url } : p)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      })
      if (res.ok) {
        const d = await res.json()
        setProfile(p => p ? { ...p, name: d.user.name } : p)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    if (newPw !== confirmPw) { setPwError(t.profile.passwordsNotMatching); return }
    if (newPw.length < 6) { setPwError(t.profile.passwordMinLength); return }

    setPwSaving(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      if (res.ok) {
        setPwSaved(true)
        setCurrentPw(''); setNewPw(''); setConfirmPw('')
        setTimeout(() => setPwSaved(false), 3000)
      } else {
        const d = await res.json()
        setPwError(d.error || t.profile.passwordChangeFailed)
      }
    } finally {
      setPwSaving(false)
    }
  }

  const { t } = useI18n()
  const roleLabel = profile?.role === 'student' ? t.profile.roles.student : profile?.role === 'reader' ? t.profile.roles.reader : t.profile.roles.admin

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.profile.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{t.profile.subtitle}</p>
      </div>

      {/* Avatar Section */}
      <Card className="border-gray-100 rounded-2xl shadow-sm bg-white">
        <CardContent className="pt-6">
          <div className="flex items-center gap-5">
            <AvatarUpload
              currentUrl={profile?.avatar_url}
              name={profile?.name}
              size="lg"
              onUploaded={handleAvatarUploaded}
            />
            <div>
              <p className="text-xl font-bold text-gray-900">{profile?.name}</p>
              <p className="text-sm text-gray-500">{roleLabel}</p>
              <p className="text-xs text-gray-400 mt-1">{profile?.email}</p>
              <p className="text-xs text-[#0B3D2E] mt-2 font-medium">{t.profile.clickToChangeAvatar}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Info */}
      <Card className="border-gray-100 rounded-2xl shadow-sm bg-white">
        <CardHeader className="bg-gray-50/30 border-b border-gray-50 pb-4">
          <CardTitle className="text-base flex items-center gap-2 font-bold text-gray-800">
            <User className="w-4 h-4 text-[#0B3D2E]" />
            {t.profile.personalInfo}
          </CardTitle>
          <CardDescription className="text-gray-500">{t.profile.personalInfoDesc}</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-semibold text-xs text-gray-500 uppercase tracking-wider">{t.auth.fullName}</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} required className="border-gray-100 bg-gray-50/30 rounded-xl focus:ring-[#0B3D2E]/20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold text-xs text-gray-500 uppercase tracking-wider">{t.auth.email}</Label>
              <Input id="email" type="email" value={profile?.email || ''} dir="ltr" className="text-start bg-gray-100 border-gray-100 rounded-xl" readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="font-semibold text-xs text-gray-500 uppercase tracking-wider">{t.profile.phone}</Label>
              <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} dir="ltr" className="text-start border-gray-100 bg-gray-50/30 rounded-xl focus:ring-[#0B3D2E]/20" placeholder={t.profile.phonePlaceholder} />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving} className="bg-[#0B3D2E] hover:bg-[#0A3528] rounded-xl font-bold">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t.profile.saveChanges}
              </Button>
              {saved && (
                <span className="flex items-center gap-1 text-sm text-emerald-600 font-medium">
                  <CheckCircle className="w-4 h-4" /> {t.profile.saved}
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="border-gray-100 rounded-2xl shadow-sm bg-white">
        <CardHeader className="bg-gray-50/30 border-b border-gray-50 pb-4">
          <CardTitle className="text-base flex items-center gap-2 font-bold text-gray-800">
            <Lock className="w-4 h-4 text-[#0B3D2E]" />
            {t.profile.changePassword}
          </CardTitle>
          <CardDescription className="text-gray-500">{t.profile.changePasswordDesc}</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password" className="font-semibold text-xs text-gray-500 uppercase tracking-wider">{t.profile.currentPassword}</Label>
              <Input id="current-password" type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} dir="ltr" className="text-start border-gray-100 bg-gray-50/30 rounded-xl focus:ring-[#0B3D2E]/20" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password" className="font-semibold text-xs text-gray-500 uppercase tracking-wider">{t.profile.newPassword}</Label>
              <Input id="new-password" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} dir="ltr" className="text-start border-gray-100 bg-gray-50/30 rounded-xl focus:ring-[#0B3D2E]/20" required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="font-semibold text-xs text-gray-500 uppercase tracking-wider">{t.profile.confirmPassword}</Label>
              <Input id="confirm-password" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} dir="ltr" className="text-start border-gray-100 bg-gray-50/30 rounded-xl focus:ring-[#0B3D2E]/20" required />
            </div>
            {pwError && <p className="text-sm text-red-600">{pwError}</p>}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={pwSaving} className="bg-[#0B3D2E] hover:bg-[#0A3528] rounded-xl font-bold">
                {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t.profile.updatePassword}
              </Button>
              {pwSaved && (
                <span className="flex items-center gap-1 text-sm text-emerald-600 font-medium">
                  <CheckCircle className="w-4 h-4" /> {t.profile.passwordUpdated}
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
