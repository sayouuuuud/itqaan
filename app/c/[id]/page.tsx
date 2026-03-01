"use client"

import { useState, useEffect, use } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Loader2, Download, Award, ShieldCheck, Calendar, MapPin, Building } from "lucide-react"

type CertificateData = {
    student_name: string
    university: string
    city: string
    issued_date: string
    platform_seal_url?: string
}

export default function PublicCertificatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const { locale } = useI18n()
    const isAr = locale === "ar"

    const [cert, setCert] = useState<CertificateData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        async function fetchCert() {
            try {
                const res = await fetch(`/api/c/${id}`)
                if (res.ok) {
                    const data = await res.json()
                    setCert(data.certificate)
                } else {
                    setError(isAr ? "الشهادة غير موجودة أو لم يتم إصدارها بعد" : "Certificate not found or not yet issued")
                }
            } catch (err) {
                setError(isAr ? "حدث خطأ أثناء تحميل الشهادة" : "Error loading certificate")
            } finally {
                setLoading(false)
            }
        }
        fetchCert()
    }, [id, isAr])

    const handlePrint = () => {
        window.print()
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-[#0B3D2E]" />
            </div>
        )
    }

    if (error || !cert) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award className="w-8 h-8 opacity-50" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 mb-2">{isAr ? "عذراً" : "Oops"}</h1>
                    <p className="text-slate-500 mb-6">{error || (isAr ? "لا تتوفر شهادة لهذا المستخدم" : "No certificate available for this user")}</p>
                    <a href="/" className="inline-block bg-[#0B3D2E] text-white px-6 py-2 rounded-xl font-bold transition-all hover:bg-[#0A3528]">
                        {isAr ? "العودة للمنصة" : "Back to Platform"}
                    </a>
                </div>
            </div>
        )
    }

    const formattedDate = new Date(cert.issued_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center py-12 px-6 print:bg-white print:p-0 print:py-0">

            {/* The Certificate A4 Container */}
            <div className="certificate-container relative bg-white shadow-2xl overflow-hidden print:shadow-none print:m-0"
                style={{ width: '210mm', height: '297mm', minWidth: '210mm' }}>

                {/* Decorative Border */}
                <div className="absolute inset-8 border-[12px] border-double border-[#D4A843]/30 pointer-events-none"></div>
                <div className="absolute inset-12 border border-[#D4A843]/20 pointer-events-none"></div>

                {/* Content */}
                <div className="relative h-full flex flex-col items-center pt-24 px-24 text-center">
                    {/* Header Logo/Icon */}
                    <div className="mb-12 relative">
                        <div className="w-24 h-24 bg-[#0B3D2E] rounded-2xl flex items-center justify-center shadow-xl rotate-45 mx-auto">
                            <Award className="w-12 h-12 text-[#D4A843] -rotate-45" />
                        </div>
                        <div className="mt-8">
                            <h1 className="text-4xl font-extrabold text-[#0B3D2E] tracking-tight">{isAr ? "منصة إتقان الفاتحة" : "Itqaan Al-Fatiha Platform"}</h1>
                            <p className="text-[#D4A843] font-bold text-xl mt-2 tracking-widest">{isAr ? "مبادرة تصحيح وذكر" : "Recitation & Mastery Initiative"}</p>
                        </div>
                    </div>

                    <div className="w-32 h-1 bg-[#D4A843]/20 mb-16"></div>

                    {/* Main Text */}
                    <div className="space-y-8">
                        <h2 className="text-3xl font-serif text-slate-700 italic">{isAr ? "يُمنح هذا التبرير لـ" : "This certificate is awarded to"}</h2>

                        <div className="py-2">
                            <h3 className="text-6xl font-black text-[#0B3D2E] underline underline-offset-[16px] decoration-[#D4A843]/40">
                                {cert.student_name}
                            </h3>
                        </div>

                        <p className="text-2xl text-slate-600 leading-relaxed max-w-2xl mt-12">
                            {isAr
                                ? "وذلك تقديراً لإتمامه إتقان قراءة سورة الفاتحة على الوجه المطلوب والمجاز من قبل اللجان العلمية بالمنصة."
                                : "In recognition of achieving full mastery in the recitation of Surah Al-Fatiha as approved by our scientific committee."}
                        </p>
                    </div>

                    {/* Details Bar */}
                    <div className="grid grid-cols-2 gap-x-20 gap-y-12 mt-20 text-right rtl:text-right ltr:text-left w-full max-w-xl">
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Building className="w-4 h-4" /> {isAr ? "الجهة التابع لها" : "Affiliation"}
                            </span>
                            <span className="text-xl font-bold text-slate-800">{cert.university || (isAr ? "غير محدد" : "Not specified")}</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> {isAr ? "المدينة" : "City"}
                            </span>
                            <span className="text-xl font-bold text-slate-800">{cert.city || (isAr ? "غير محدد" : "Not specified")}</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> {isAr ? "تاريخ الإصدار" : "Issue Date"}
                            </span>
                            <span className="text-xl font-bold text-slate-800">{formattedDate}</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" /> {isAr ? "رمز الموثوقية" : "Verification Code"}
                            </span>
                            <span className="text-xl font-mono font-bold text-slate-800">{id.slice(0, 8).toUpperCase()}</span>
                        </div>
                    </div>

                    {/* Footer Seals */}
                    <div className="mt-auto mb-20 w-full flex justify-between items-end">
                        <div className="text-center">
                            {cert.platform_seal_url ? (
                                <div className="w-24 h-24 mb-2 mx-auto">
                                    <img src={cert.platform_seal_url} alt="Platform Seal" className="w-full h-full object-contain drop-shadow-sm" />
                                </div>
                            ) : (
                                <div className="w-24 h-24 border-2 border-slate-200 rounded-full flex items-center justify-center mb-2 mx-auto opacity-50 grayscale">
                                    <img src="/logo.png" alt="Platform Seal" className="w-12 h-12 grayscale" />
                                </div>
                            )}
                            <p className="text-xs font-bold text-slate-400">{isAr ? "ختم المنصة" : "Platform Seal"}</p>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="mb-4">
                                <p className="text-xl font-serif text-[#0B3D2E] font-bold border-b border-[#D4A843] pb-1 px-4">{isAr ? "إدارة مبادرة إتقان" : "Itqaan Management"}</p>
                            </div>
                            <div className="flex gap-1 text-[#D4A843]">
                                {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-2 h-2 rounded-full bg-current" />)}
                            </div>
                        </div>
                    </div>

                    {/* Signature/Watermark Background */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] rotate-12 pointer-events-none">
                        <Award className="w-[500px] h-[500px]" />
                    </div>
                </div>
            </div>

            <style jsx global>{`
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .min-h-screen {
            min-height: auto !important;
            background: white !important;
            padding: 0 !important;
          }
          .certificate-container {
            width: 100% !important;
            height: 100vh !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
           @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
        </div>
    )
}
