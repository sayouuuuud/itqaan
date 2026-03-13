'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Calendar, MapPin, Award, CheckCircle2, Clock, Inbox, ExternalLink, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Certificate {
    id: string
    university: string
    college: string
    city: string
    certificate_issued: boolean
    pdf_file_url?: string
    certificate_url?: string
    certificate_pdf_url?: string
}

export default function StudentCertificates() {
    const { t, locale } = useI18n()
    const [certificates, setCertificates] = useState<Certificate[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/certificate?t=${Date.now()}`)
                if (res.ok) {
                    const data = await res.json()
                    console.log('API Response:', data)
                    if (data.certificate) {
                        console.log('Certificate data:', data.certificate)
                        console.log('Certificate issued status:', data.certificate.certificate_issued)
                        setCertificates([data.certificate])
                    } else {
                        console.log('No certificate found in response')
                    }
                } else {
                    console.log('API request failed with status:', res.status)
                }
            } catch (err) {
                console.error('Failed to load certificates', err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-[#0B3D2E]/20 border-t-[#0B3D2E] rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#0B3D2E] mb-2">{t.student.certificates}</h1>
                <p className="text-gray-500 font-medium max-w-2xl">{t.student.masteredDesc}</p>
            </div>

            {certificates.length === 0 ? (
                <Card className="border-none shadow-sm shadow-[#0B3D2E]/5 bg-white overflow-hidden rounded-3xl">
                    <CardContent className="p-12">
                        <div className="text-center space-y-5 max-w-md mx-auto">
                            <div className="w-24 h-24 bg-[#0B3D2E]/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Inbox className="w-12 h-12 text-[#0B3D2E]/40" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">
                                {locale === 'ar' ? 'لا توجد شهادات' : 'No Certificates'}
                            </h3>
                            <p className="text-gray-500 leading-relaxed">
                                {locale === 'ar' ? 'لم تقم بتقديم بيانات الشهادة بعد. قم باستكمال بياناتك لإصدار شهادة الإتقان.' : 'You have not submitted certificate data yet. Complete your details to receive your mastery certificate.'}
                            </p>
                            <div className="pt-4">
                                <Button asChild className="bg-[#0B3D2E] hover:bg-[#072a20] rounded-xl h-12 px-8 font-bold shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105 active:scale-95">
                                    <Link href="/student/certificate">{t.student.completeCertData}</Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="flex flex-col-reverse lg:flex-row gap-8">
                    {/* Left/Bottom Column: Certificate Details */}
                    <div className="flex-1 space-y-8">
                        {/* Status Alert */}
                        {!certificates[0].certificate_issued && (
                            <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/50 rounded-3xl p-6 shadow-sm flex items-start gap-4">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-[100px] pointer-events-none" />
                                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0 border border-amber-100">
                                    <Clock className="w-6 h-6 text-amber-500" />
                                </div>
                                <div className="pt-1">
                                    <h3 className="font-bold text-amber-900 text-lg mb-1">
                                        {locale === 'ar' ? 'جاري مراجعة الطلب' : 'Application Under Review'}
                                    </h3>
                                    <p className="text-amber-700/80 text-sm leading-relaxed max-w-lg">
                                        {locale === 'ar'
                                            ? 'لقد قمنا باستلام بياناتك وسيتم مراجعتها من قبل الإدارة لإصدار الشهادة الرسمية.'
                                            : 'We have received your details and they are being reviewed by the administration for official certificate issuance.'}
                                    </p>
                                </div>
                            </div>
                        )}

                        <Card className="border-none shadow-xl shadow-[#0B3D2E]/5 bg-white overflow-hidden rounded-3xl group transition-all duration-500 hover:shadow-2xl hover:shadow-[#0B3D2E]/10">
                            <CardContent className="p-0">
                                {/* Header Banner */}
                                <div className="bg-gradient-to-br from-[#0B3D2E] to-[#082A1F] h-40 relative px-8 flex items-end pb-8">
                                    <div className="absolute top-0 right-0 p-8 w-full h-full overflow-hidden opacity-10 pointer-events-none">
                                        <Award className="w-64 h-64 absolute -top-8 rtl:-left-16 ltr:-right-16 text-white transform -rotate-12" />
                                    </div>
                                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />

                                    <div className="relative z-10 w-full flex justify-between items-end">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                                                    <span className="text-white/90 text-xs font-bold tracking-wider uppercase">
                                                        {locale === 'ar' ? 'اعتماد المنصة' : 'Platform Certification'}
                                                    </span>
                                                </div>
                                                {certificates[0].certificate_issued && (
                                                    <div className="bg-emerald-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                                                        <span className="text-emerald-50 text-xs font-bold">{locale === 'ar' ? 'تم الإصدار' : 'Issued'}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <h2 className="text-3xl font-bold text-white tracking-tight">{t.student.certificate}</h2>
                                        </div>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
                                        {/* Divider line for desktop */}
                                        <div className="hidden sm:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-gray-100 via-gray-200 to-gray-50" />

                                        <div className="space-y-6 sm:pe-6">
                                            <div className="group/item">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 transition-colors group-hover/item:text-[#0B3D2E]">{t.student.universityLabel}</p>
                                                <p className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">{certificates[0].university}</p>
                                            </div>
                                            <div className="group/item">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 transition-colors group-hover/item:text-[#0B3D2E]">{t.common?.city || (locale === 'ar' ? 'المدينة' : 'City')}</p>
                                                <p className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">{certificates[0].city}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-6 sm:ps-6">
                                            <div className="group/item">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 transition-colors group-hover/item:text-[#0B3D2E]">{t.student.collegeLabel}</p>
                                                <p className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">{certificates[0].college}</p>
                                            </div>
                                            <div className="group/item">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 transition-colors group-hover/item:text-[#0B3D2E]">{locale === 'ar' ? 'تاريخ التقديم' : 'Submission Date'}</p>
                                                <p className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    {/* We could use created_at here if added to API, placeholder for now */}
                                                    {new Date().toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {certificates[0].certificate_issued && (
                                        <div className="mt-10 pt-8 border-t border-gray-100/80 flex flex-col sm:flex-row gap-4 items-center justify-center">
                                            {certificates[0].certificate_url && (
                                                <Button asChild variant="outline" className="w-full sm:w-auto border-2 border-[#0B3D2E]/20 text-[#0B3D2E] hover:bg-[#0B3D2E]/5 rounded-xl h-14 px-8 font-bold transition-all duration-300">
                                                    <a href={certificates[0].certificate_url} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
                                                        {locale === 'ar' ? 'عرض الشهادة الرقمية' : 'View Digital Certificate'}
                                                    </a>
                                                </Button>
                                            )}
                                            {certificates[0].certificate_url && (
                                                <Button asChild className="w-full sm:w-auto bg-[#D4A843] hover:bg-[#C29837] text-[#0B3D2E] rounded-xl h-14 px-8 font-extrabold shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border-b-4 border-[#B08A32] active:border-b-0 active:translate-y-1">
                                                    <a href={`${certificates[0].certificate_url}?print=1`} target="_blank" rel="noopener noreferrer">
                                                        <Printer className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0 opacity-80" />
                                                        {locale === 'ar' ? 'طباعة / تحميل PDF' : 'Print / Download PDF'}
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right/Top Column: Info Cards */}
                    <div className="lg:w-80 space-y-6 shrink-0">
                        {/* Ceremony Card */}
                        <Card className="border-none shadow-lg shadow-[#0B3D2E]/5 bg-gradient-to-b from-white to-gray-50/50 rounded-3xl overflow-hidden relative">
                            {/* Decorative top border */}
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#D4A843] to-[#FCD34D]" />

                            <CardContent className="p-6 pt-8">
                                <div className="flex flex-col items-center text-center space-y-4 mb-6">
                                    <div className="w-16 h-16 bg-[#D4A843]/10 rounded-full flex items-center justify-center">
                                        <Calendar className="w-8 h-8 text-[#D4A843]" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-[#0B3D2E]">{t.student.ceremonyTitle}</h3>
                                        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                                            {t.student.ceremonyDesc}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                            <Clock className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{locale === 'ar' ? 'التوقيت المتوقع' : 'Estimated Time'}</p>
                                            <p className="text-sm font-bold text-gray-800">{locale === 'ar' ? 'سيُعلن عنه قريباً' : 'To be announced'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                            <MapPin className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{locale === 'ar' ? 'الموقع' : 'Location'}</p>
                                            <p className="text-sm font-bold text-gray-800">{locale === 'ar' ? 'عن بُعد / سيُحدد' : 'Remote / TBA'}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Help / Support Mini Card */}
                        <div className="bg-[#0B3D2E]/5 rounded-3xl p-6 border border-[#0B3D2E]/10 flex gap-4">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
                                <Award className="w-5 h-5 text-[#0B3D2E]" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-[#0B3D2E] mb-1">{locale === 'ar' ? 'دعم الشهادات' : 'Certificate Support'}</h4>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    {locale === 'ar'
                                        ? 'إذا واجهت أي مشكلة في بيانات شهادتك أو التأخير في الإصدار، تواصل مع الدعم الفني.'
                                        : 'If you face issues with your certificate data or issuance delay, contact support.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
