"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, Award, User, MapPin, Building, FileText, ArrowLeft, Loader2, Info, CheckCircle } from "lucide-react"

export default function CertificatePage() {
  const router = useRouter()
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    university: "",
    college: "",
    city: "",
    entity_id: ""
  })

  const [universities, setUniversities] = useState<string[]>([])
  const [entities, setEntities] = useState<{ id: string, name: string }[]>([])

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
              entity_id: data.certificate.entity_id || ""
            })
            if (data.universities) setUniversities(data.universities)
            if (data.entities) setEntities(data.entities)
            // If they already have a certificate issued, maybe show success state
            if (data.certificate.certificate_issued) {
              console.log('Setting success to true - certificate is issued')
              setSuccess(true)
            } else {
              console.log('Certificate not issued yet')
            }
          } else {
            if (data.universities) setUniversities(data.universities)
            if (data.entities) setEntities(data.entities)
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
        <Loader2 className="w-8 h-8 animate-spin text-[#1B5E3B]" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/student" className="hover:text-[#1B5E3B] transition-colors">{t.student.dashboard}</Link>
        <ChevronLeft className="w-3 h-3 rotate-180" />
        <span className="text-slate-800 font-medium">{t.student.certificate}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-[#C9A227]/10 rounded-xl">
          <Award className="w-8 h-8 text-[#C9A227]" />
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
              <Link href="/student" className="inline-flex items-center gap-2 bg-[#1B5E3B] hover:bg-[#124028] text-white font-bold py-3 px-8 rounded-xl transition-colors">
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

            <div className="bg-[#1B5E3B]/5 p-4 rounded-xl border border-[#1B5E3B]/10 flex items-start gap-3 mb-6">
              <Info className="w-5 h-5 text-[#1B5E3B] shrink-0 mt-0.5" />
              <p className="text-sm text-[#1B5E3B]/80">
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
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1B5E3B] focus:border-transparent text-sm appearance-none"
                  >
                    <option value="">{t.student.selectUniversity}</option>
                    {universities.length > 0 ? universities.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    )) : t.student.universities.map((u: string) => (
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
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1B5E3B] focus:border-transparent text-sm"
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
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1B5E3B] focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Authorized Entity */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{isAr ? "الجهة المعتمدة (اختياري)" : "Authorized Entity (Optional)"}</label>
                <div className="relative">
                  <Building className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <select
                    name="entity_id"
                    value={formData.entity_id}
                    onChange={handleChange}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1B5E3B] focus:border-transparent text-sm appearance-none"
                  >
                    <option value="">{isAr ? "اختر الجهة (اختياري)" : "Select Entity (Optional)"}</option>
                    {entities.map((e) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Button Section */}
              <div className="md:col-span-2 pt-6 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-[#C9A227]/20 text-white bg-[#C9A227] hover:bg-[#A6841E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C9A227] font-bold transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> {t.student.savingData}</>
                  ) : (
                    <>{t.student.saveData} <ArrowLeft className="w-5 h-5 rtl:rotate-180" /></>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
