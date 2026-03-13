"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, Award, User, MapPin, Building, FileText, ArrowLeft, Loader2, Info, CheckCircle } from "lucide-react"

export default function CertificatePage() {
  const router = useRouter()
  const { t } = useI18n()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    university: "",
    college: "",
    city: "",
    gender: "",
    pdfFileUrl: ""
  })

  // Universities dictionary will come from t.student.universities

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/certificate?t=${Date.now()}`)
        if (res.ok) {
          const data = await res.json()
          console.log('Certificate page API response:', data)
          if (!data.isMastered || !data.certificateEnabled) {
            router.push("/student")
            return
          }
          if (data.certificate) {
            console.log('Certificate data found:', data.certificate)
            console.log('Certificate issued status:', data.certificate.certificate_issued)
            setFormData({
              university: data.certificate.university || "",
              college: data.certificate.college || "",
              city: data.certificate.city || "",
              gender: data.certificate.gender || "",
              pdfFileUrl: data.certificate.pdf_file_url || ""
            })
            // If they already have a certificate issued, maybe show success state
            if (data.certificate.certificate_issued) {
              console.log('Setting success to true - certificate is issued')
              setSuccess(true)
            } else {
              console.log('Certificate not issued yet')
            }
          } else {
            console.log('No certificate data found')
          }
        } else {
          setError(t.student.serverError)
        }
      } catch (err) {
        console.error("Failed to load certificate data", err)
        setError(t.student.serverError)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError(t.student.fileLimitHint)
      return
    }

    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'certificates')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: form
      })

      if (!res.ok) throw new Error("فشل رفع الملف")
      const data = await res.json()

      setFormData(prev => ({
        ...prev,
        pdfFileUrl: data.url || data.audioUrl || "" // Assuming upload API returns url or audioUrl
      }))
    } catch {
      setError(t.student.submitError)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setSuccess(true)
      } else {
        const data = await res.json()
        setError(data.error || t.student.submitError)
      }
    } catch {
      setError(t.student.serverError)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/student" className="hover:text-[#0B3D2E] transition-colors">{t.student.dashboard}</Link>
        <ChevronLeft className="w-3 h-3 rotate-180" />
        <span className="text-slate-800 font-medium">{t.student.certificate}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-[#D4A843]/10 rounded-xl">
          <Award className="w-8 h-8 text-[#D4A843]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t.student.certificateTitle}</h1>
          <p className="text-slate-500">{t.student.issueCertificateDesc}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {success ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">{t.student.certificateSuccessTitle}</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              {t.student.certificateSuccessDesc}
            </p>
            <div className="pt-6">
              <Link href="/student" className="inline-flex items-center gap-2 bg-[#0B3D2E] hover:bg-[#0A3528] text-white font-bold py-3 px-8 rounded-xl transition-colors">
                {t.student.backToDashboard}
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm mb-6 border border-red-200">
                {error}
              </div>
            )}

            <div className="bg-[#0B3D2E]/5 p-4 rounded-xl border border-[#0B3D2E]/10 flex items-start gap-3 mb-6">
              <Info className="w-5 h-5 text-[#0B3D2E] shrink-0 mt-0.5" />
              <p className="text-sm text-[#0B3D2E]/80">
                {t.student.certificateHint || t.student.issueCertificateDesc}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* University */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.student.universityLabel}</label>
                <div className="relative">
                  <Building className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <select
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                    required
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B3D2E] focus:border-transparent text-sm appearance-none"
                  >
                    <option value="">{t.student.selectUniversity}</option>
                    {t.student.universities.map((u: string) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* College / Major */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.student.collegeLabel}</label>
                <div className="relative">
                  <FileText className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                    placeholder={t.student.collegePlaceholder}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B3D2E] focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.student.cityLabel || t.student.city}</label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    placeholder={t.student.cityPlaceholder}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B3D2E] focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.student.genderLabel}</label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B3D2E] focus:border-transparent text-sm appearance-none"
                  >
                    <option value="">{t.student.genderSelect}</option>
                    <option value="male">{t.student.male}</option>
                    <option value="female">{t.student.female}</option>
                  </select>
                </div>
              </div>

              {/* PDF Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.student.proofLabel}</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-slate-600 justify-center">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-[#D4A843] hover:text-[#C49A3A] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#D4A843]">
                        <span className="px-1">{t.student.uploadPdf}</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf" onChange={handleFileUpload} />
                      </label>
                      <p className="pl-1">{t.student.orDragAndDrop}</p>
                    </div>
                    <p className="text-xs text-slate-500">
                      {t.student.fileLimitHint}
                    </p>
                  </div>
                </div>
                {formData.pdfFileUrl && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                    <CheckCircle className="w-4 h-4" />
                    <span>{t.student.submissionSuccess}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-[#D4A843]/20 text-white bg-[#D4A843] hover:bg-[#C49A3A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D4A843] font-bold transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> {t.student.savingData}</>
                ) : (
                  <>{t.student.saveData} <ArrowLeft className="w-5 h-5 rtl:rotate-180" /></>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
