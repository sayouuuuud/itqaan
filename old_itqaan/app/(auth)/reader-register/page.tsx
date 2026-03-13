"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, ChevronDown, BookOpen, Award, CheckCircle } from 'lucide-react'
import { SAUDI_CITIES } from '@/lib/mock-data'

export default function ReaderRegisterPage() {
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { t } = useI18n()

  const [form, setForm] = useState({
    full_name_triple: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    gender: '',
    qualification: '',
    memorized_parts: '',
    years_of_experience: '',
  })

  function updateField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (form.password.length < 6) {
      setError(t.auth.passwordMinLength)
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/reader-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          memorized_parts: form.memorized_parts ? parseInt(form.memorized_parts) : 0,
          years_of_experience: form.years_of_experience ? parseInt(form.years_of_experience) : 0,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t.auth.errorOccurred)
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch {
      setError(t.auth.connectionError)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden bg-[#0B3D2E]">
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#D4A843]/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#0B3D2E]/30 rounded-full blur-3xl" />
        </div>
        <main className="relative z-10 w-full max-w-lg px-4">
          <div className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-8 md:p-10 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">{t.readerRegister.requestReceived}</h1>
            <p className="text-gray-600 leading-relaxed mb-6">
              {t.readerRegister.requestReceivedDesc}
            </p>
            <Link href="/" className="inline-block bg-[#D4A843] hover:bg-[#C49A3A] text-white font-bold py-3 px-8 rounded-xl transition-colors">
              {t.readerRegister.backToHome}
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center relative overflow-hidden bg-[#0B3D2E]">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at top left, #145A3E 0%, #0B3D2E 40%, #072A1F 100%)' }} />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#D4A843]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#0B3D2E]/30 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="w-full p-6 flex justify-between items-center z-20 max-w-7xl mx-auto">
        <Link href="/" className="text-3xl font-bold tracking-tighter text-[#D4A843] hover:opacity-80 transition-opacity">{t.appName}</Link>
        <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors flex items-center gap-2">
          <span>{t.readerRegister.hasAccount}</span>
          <span className="text-[#D4A843] font-bold">{t.login}</span>
        </Link>
      </nav>

      {/* Form */}
      <main className="relative z-10 w-full max-w-2xl px-4 py-6 pb-16">
        <div className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.readerRegister.title}</h1>
            <p className="text-gray-500">{t.readerRegister.desc}</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Required Info */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[#0B3D2E]" />
                {t.readerRegister.basicInfo}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">{t.readerRegister.fullNameTriple}</label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input id="full_name" type="text" value={form.full_name_triple} onChange={(e) => updateField('full_name_triple', e.target.value)} placeholder={t.readerRegister.fullNamePlaceholder} className="w-full pr-10 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3D2E] focus:border-[#0B3D2E] transition-colors text-sm" required />
                  </div>
                </div>
                <div>
                  <label htmlFor="reader_email" className="block text-sm font-medium text-gray-700 mb-1">{t.readerRegister.email}</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input id="reader_email" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="name@example.com" dir="ltr" className="w-full pr-10 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3D2E] focus:border-[#0B3D2E] transition-colors text-sm" required />
                  </div>
                </div>
                <div>
                  <label htmlFor="reader_password" className="block text-sm font-medium text-gray-700 mb-1">{t.readerRegister.password}</label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input id="reader_password" type={showPw ? 'text' : 'password'} value={form.password} onChange={(e) => updateField('password', e.target.value)} placeholder={t.auth.passwordPlaceholder} dir="ltr" className="w-full pr-10 pl-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3D2E] focus:border-[#0B3D2E] transition-colors text-sm" required minLength={6} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label="toggle password">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="reader_phone" className="block text-sm font-medium text-gray-700 mb-1">{t.readerRegister.phone}</label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input id="reader_phone" type="tel" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder={t.readerRegister.phonePlaceholder} dir="ltr" className="w-full pr-10 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3D2E] focus:border-[#0B3D2E] transition-colors text-sm" required />
                  </div>
                </div>
                <div>
                  <label htmlFor="reader_city" className="block text-sm font-medium text-gray-700 mb-1">{t.readerRegister.city}</label>
                  <div className="relative">
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <select id="reader_city" value={form.city} onChange={(e) => updateField('city', e.target.value)} className="w-full pr-10 pl-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3D2E] focus:border-[#0B3D2E] transition-colors text-sm appearance-none" required>
                      <option value="">{t.readerRegister.selectCity}</option>
                      {SAUDI_CITIES.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="reader_gender" className="block text-sm font-medium text-gray-700 mb-1">{t.readerRegister.gender}</label>
                  <div className="relative">
                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <select id="reader_gender" value={form.gender} onChange={(e) => updateField('gender', e.target.value)} className="w-full pr-4 pl-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3D2E] focus:border-[#0B3D2E] transition-colors text-sm appearance-none" required>
                      <option value="">{t.auth.selectGender}</option>
                      <option value="male">{t.auth.male}</option>
                      <option value="female">{t.auth.female}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Professional Info */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#0B3D2E]" />
                {t.readerRegister.professionalInfo}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="qualification" className="block text-sm font-medium text-gray-700 mb-1">{t.readerRegister.qualification}</label>
                  <input id="qualification" type="text" value={form.qualification} onChange={(e) => updateField('qualification', e.target.value)} placeholder={t.readerRegister.qualificationPlaceholder} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3D2E] focus:border-[#0B3D2E] transition-colors text-sm" />
                </div>
                <div>
                  <label htmlFor="memorized_parts" className="block text-sm font-medium text-gray-700 mb-1">{t.readerRegister.memorizedParts}</label>
                  <input id="memorized_parts" type="number" min="0" max="30" value={form.memorized_parts} onChange={(e) => updateField('memorized_parts', e.target.value)} placeholder="30" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3D2E] focus:border-[#0B3D2E] transition-colors text-sm" />
                </div>
                <div>
                  <label htmlFor="years_exp" className="block text-sm font-medium text-gray-700 mb-1">{t.readerRegister.yearsOfExperience}</label>
                  <input id="years_exp" type="number" min="0" value={form.years_of_experience} onChange={(e) => updateField('years_of_experience', e.target.value)} placeholder="5" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B3D2E] focus:border-[#0B3D2E] transition-colors text-sm" />
                </div>
              </div>
            </div>

            {/* Section 3: Attachments */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#0B3D2E]" />
                {t.readerRegister.attachments}
              </h2>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#0B3D2E]/40 transition-colors">
                <Award className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">{t.readerRegister.uploadCert}</p>
                <p className="text-xs text-gray-400">{t.readerRegister.uploadCertDesc}</p>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" id="certificate_file" />
                <label htmlFor="certificate_file" className="inline-block mt-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 cursor-pointer transition-colors">
                  {t.readerRegister.chooseFile}
                </label>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-[#D4A843] hover:bg-[#C49A3A] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t.readerRegister.submitting}
                </span>
              ) : (
                t.readerRegister.submitRequest
              )}
            </button>
          </form>
        </div>
      </main>

      <footer className="relative z-10 py-4 text-center w-full text-xs text-white/40">
        {'2026 '}{t.appName}{'. '}{t.footer.rights}
      </footer>
    </div>
  )
}
