'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Calendar, MapPin, Award, CheckCircle2, Clock, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Certificate {
    id: string
    university: string
    college: string
    city: string
    certificate_issued: boolean
    pdf_file_url?: string
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
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-[#0B3D2E] mb-2">{t.student.certificates}</h1>
                <p className="text-gray-600">{t.student.masteredDesc}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Certificate Card */}
                <Card className="md:col-span-2 border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="bg-[#0B3D2E] text-white py-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-xl">{t.student.certificate}</CardTitle>
                                <p className="text-[#F1F5F9]/80 text-sm mt-1">
                                    {(() => {
                                        const hasCertificates = certificates.length > 0;
                                        const isIssued = certificates[0]?.certificate_issued;
                                        console.log('Rendering certificate status:', { hasCertificates, isIssued, certificates });
                                        return hasCertificates && isIssued
                                            ? (locale === 'ar' ? 'تم إصدار الشهادة بنجاح' : 'Certificate issued successfully')
                                            : (locale === 'ar' ? 'بيانات الشهادة محفوظة - بانتظار الإصدار' : 'Data saved - Awaiting issuance');
                                    })()}
                                </p>
                            </div>
                            <Award className="w-10 h-10 opacity-80" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        {certificates.length > 0 ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-sm text-gray-500 mb-1">{t.student.universityLabel}</p>
                                        <p className="font-semibold text-gray-900">{certificates[0].university}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-sm text-gray-500 mb-1">{t.student.collegeLabel}</p>
                                        <p className="font-semibold text-gray-900">{certificates[0].college}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-sm text-gray-500 mb-1">{t.common?.city || (locale === 'ar' ? 'المدينة' : 'City')}</p>
                                        <p className="font-semibold text-gray-900">{certificates[0].city}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-sm text-gray-500 mb-1">{locale === 'ar' ? 'حالة الاعتماد' : 'Certification Status'}</p>
                                        <div className="flex items-center gap-2">
                                            {certificates[0].certificate_issued ? (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                    <span className="text-green-700 font-medium">{locale === 'ar' ? 'معتمد' : 'Certified'}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Clock className="w-4 h-4 text-amber-600" />
                                                    <span className="text-amber-700 font-medium">{locale === 'ar' ? 'بانتظار المراجعة' : 'Pending Review'}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {certificates[0].certificate_issued && certificates[0].pdf_file_url && (
                                    <div className="flex justify-center mt-4">
                                        <Button asChild className="bg-[#0B3D2E] hover:bg-[#072a20] px-8 rounded-full">
                                            <a href={certificates[0].pdf_file_url} target="_blank" rel="noopener noreferrer">
                                                {locale === 'ar' ? 'تحميل الشهادة' : 'Download Certificate'}
                                            </a>
                                        </Button>
                                    </div>
                                )}

                                {!certificates[0].certificate_issued && (
                                    <div className="text-center p-4 bg-amber-50 border border-amber-100 rounded-xl">
                                        <p className="text-amber-800 text-sm">
                                            {locale === 'ar'
                                                ? 'بياناتك محفوظة حالياً. سيقوم المسؤولون بمراجعة البيانات وإصدار الشهادة لك في أقرب وقت.'
                                                : 'Your data is saved. Administrators will review it and issue your certificate shortly.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-10 space-y-4">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                                    <Inbox className="w-10 h-10 text-gray-300" />
                                </div>
                                <p className="text-gray-500">
                                    {locale === 'ar' ? 'لم يتم العثور على شهادات بعد.' : 'No certificates found yet.'}
                                </p>
                                <Button asChild className="bg-[#0B3D2E] hover:bg-[#072a20] rounded-full">
                                    <Link href="/student/certificate">{t.student.completeCertData}</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Ceremony Card */}
                <Card className="border-none shadow-sm bg-white self-start">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2 text-[#0B3D2E]">
                            <Calendar className="w-5 h-5" />
                            {t.student.ceremonyTitle}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {t.student.ceremonyDesc}
                        </p>

                        <div className="pt-4 space-y-3 border-t border-gray-100">
                            <div className="flex items-start gap-3">
                                <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500">{locale === 'ar' ? 'التوقيت المتوقع' : 'Estimated Time'}</p>
                                    <p className="text-sm font-medium text-gray-800">{locale === 'ar' ? 'سيُعلن عنه قريباً' : 'To be announced'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500">{locale === 'ar' ? 'الموقع' : 'Location'}</p>
                                    <p className="text-sm font-medium text-gray-800">{locale === 'ar' ? 'عن بُعد / سيُحدد' : 'Remote / TBA'}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
