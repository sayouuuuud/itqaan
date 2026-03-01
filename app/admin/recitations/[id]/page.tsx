"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import {
    ChevronRight, Calendar, User as UserIcon, Mic2,
    AlertCircle, FileAudio, Loader2, Info, MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { AudioPlayer } from "@/components/audio-player"
import Link from "next/link"

export default function AdminRecitationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { t } = useI18n()
    const router = useRouter()
    const isAr = t.locale === "ar"
    const { id } = use(params)

    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchRecitation() {
            try {
                const res = await fetch(`/api/admin/recitations/${id}`)
                if (!res.ok) throw new Error(t.admin.failedToLoadData || "Failed to load data")
                const json = await res.json()
                setData(json)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchRecitation()
    }, [id, t.admin.failedToLoadData])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#0B3D2E]" />
                <p className="text-gray-500 font-medium">{t.loading}</p>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-destructive">
                <AlertCircle className="w-12 h-12" />
                <p className="text-lg font-bold">{error || "لم يتم العثور على التلاوة"}</p>
                <Button onClick={() => router.back()} variant="outline">{t.back}</Button>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <button onClick={() => router.back()} className="hover:text-[#0B3D2E] transition-colors">
                        العودة
                    </button>
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                    <span className="font-bold text-gray-800">تفاصيل التلاوة #{id.substring(0, 8)}</span>
                </div>
                <div>
                    <StatusBadge status={data.status} className="px-3 py-1 text-sm" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Recitation Info Card */}
                    <Card className="border-none shadow-md overflow-hidden bg-white">
                        <div className="bg-[#0B3D2E] p-6 text-white flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <Mic2 className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black mb-1">
                                    سورة {data.surah_name}
                                </h2>
                                <p className="text-white/80 flex items-center gap-2 text-sm">
                                    <span>الآيات: {data.ayah_from} - {data.ayah_to}</span>
                                    <span>•</span>
                                    <span>{data.recitation_type === 'tilawa' ? 'تلاوة' : data.recitation_type === 'hifd' ? 'تسميع حفظ' : 'مراجعة'}</span>
                                </p>
                            </div>
                        </div>

                        <CardContent className="p-6 space-y-6">
                            {/* Audio Player */}
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-700">
                                    <FileAudio className="w-5 h-5 text-[#0B3D2E]" />
                                    {isAr ? "التسجيل الصوتي" : "Audio Recording"}
                                </h3>
                                {data.audio_url ? (
                                    <AudioPlayer src={data.audio_url} />
                                ) : (
                                    <div className="text-sm text-gray-500 italic p-4 bg-gray-100/50 rounded-xl text-center border border-dashed border-gray-200">
                                        {isAr ? "لا يوجد ملف صوتي متاح" : "No audio file available"}
                                    </div>
                                )}
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-sm text-gray-500 block mb-1">نوع التقديم</span>
                                    <span className="font-bold text-gray-800">{data.submission_type === 'recorded' ? 'تسجيل مباشر' : 'رفع ملف'}</span>
                                </div>
                            </div>

                            {/* Student Notes */}
                            {data.student_notes && (
                                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                    <h3 className="font-bold mb-2 flex items-center gap-2 text-blue-800">
                                        <MessageSquare className="w-4 h-4" />
                                        ملاحظات الطالب
                                    </h3>
                                    <p className="text-sm text-blue-900 leading-relaxed">{data.student_notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>


                </div>

                {/* Sidebar Cards */}
                <div className="space-y-6">
                    {/* Student Info */}
                    <Card className="border-gray-100 shadow-sm">
                        <CardHeader className="pb-3 border-b border-gray-50">
                            <CardTitle className="text-sm font-bold text-gray-500 uppercase">بيانات الطالب</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                    {data.student_avatar ? (
                                        <img src={data.student_avatar} alt={data.student_name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        data.student_name.charAt(0)
                                    )}
                                </div>
                                <div>
                                    <Link href={`/admin/users/${data.student_id || '#'}`} className="font-bold text-gray-800 hover:text-[#0B3D2E] hover:underline">
                                        {data.student_name}
                                    </Link>
                                    <p className="text-xs text-gray-500">{data.student_email}</p>
                                </div>
                            </div>
                            <div className="pt-3 border-t border-gray-50 text-sm">
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-500">تاريخ الرفع</span>
                                    <span className="font-medium">{new Date(data.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Evaluator Info */}
                    {(data.reader_name || data.assigned_reader_id) && (
                        <Card className="border-gray-100 shadow-sm">
                            <CardHeader className="pb-3 border-b border-gray-50">
                                <CardTitle className="text-sm font-bold text-gray-500 uppercase">الشيخ / المُقيّم</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                                        {data.reader_avatar ? (
                                            <img src={data.reader_avatar} alt={data.reader_name} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            data.reader_name ? data.reader_name.charAt(0) : '?'
                                        )}
                                    </div>
                                    <div>
                                        <Link href={`/admin/users/${data.assigned_reader_id || '#'}`} className="font-bold text-gray-800 hover:text-[#0B3D2E] hover:underline">
                                            {data.reader_name || "مُقيّم غير محدد"}
                                        </Link>
                                        {data.reader_email && <p className="text-xs text-gray-500">{data.reader_email}</p>}
                                    </div>
                                </div>
                                {data.reviewed_at && (
                                    <div className="pt-3 border-t border-gray-50 text-sm">
                                        <div className="flex justify-between py-1">
                                            <span className="text-gray-500">تاريخ التقييم</span>
                                            <span className="font-medium">{new Date(data.reviewed_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
