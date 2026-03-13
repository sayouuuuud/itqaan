"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n/context'
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, ChevronDown } from 'lucide-react'

export default function RegisterPage() {
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [gender, setGender] = useState('')
  const router = useRouter()
  const { t } = useI18n()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password.length < 6) {
      setError(t.auth.passwordMinLength)
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, gender: gender || undefined }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t.auth.errorOccurred)
        setLoading(false)
        return
      }

      if (data.requiresVerification) {
        router.push(`/verify?email=${encodeURIComponent(email)}`)
      } else {
        router.push('/student')
      }
    } catch {
      setError(t.auth.connectionError)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden bg-[#0B3D2E]">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at top left, #145A3E 0%, #0B3D2E 40%, #072A1F 100%)' }} />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#D4A843]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#0B3D2E]/30 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 max-w-7xl mx-auto w-full">
        <Link href="/" className="text-3xl font-bold tracking-tighter text-[#D4A843] hover:opacity-80 transition-opacity">{t.appName}</Link>
        <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors flex items-center gap-2">
          <span>{t.auth.alreadyHaveAccount}</span>
          <span className="text-[#D4A843] font-bold">{t.login}</span>
        </Link>
      </nav>

      {/* Form */}
      <main className="relative z-10 w-full max-w-lg px-4 py-12">
        <div className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{t.auth.registerTitle}</h1>
            <p className="text-gray-500">{t.auth.joinCommunityDesc}</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 mb-1">{t.auth.fullName}</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input id="fullname" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.auth.enterFullName} className="w-full pr-10 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3D2E] focus:border-[#0B3D2E] transition-colors text-sm" required />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">{t.auth.email}</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" dir="ltr" className="w-full pr-10 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3D2E] focus:border-[#0B3D2E] transition-colors text-sm" required />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">{t.auth.password}</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input id="password" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.auth.passwordPlaceholder} dir="ltr" className="w-full pr-10 pl-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3D2E] focus:border-[#0B3D2E] transition-colors text-sm" required minLength={6} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label="toggle password">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">{t.auth.gender}</label>
              <div className="relative">
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)} className="w-full pr-4 pl-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3D2E] focus:border-[#0B3D2E] transition-colors text-sm appearance-none" required>
                  <option value="">{t.auth.selectGender}</option>
                  <option value="male">{t.auth.male}</option>
                  <option value="female">{t.auth.female}</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-[#D4A843] hover:bg-[#C49A3A] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t.auth.creatingAccount}
                </span>
              ) : (
                <>
                  <span>{t.auth.createAccount}</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      <footer className="absolute bottom-4 text-center w-full text-xs text-white/40 z-10">
        {'2026 '}{t.appName}{'. '}{t.footer.rights}
      </footer>
    </div>
  )
}
