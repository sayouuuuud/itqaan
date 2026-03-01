"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Award, Search, FileText, CheckCircle, ExternalLink, Loader2, Clock } from "lucide-react"

interface CertificateApplication {
  id: string
  student_id: string
  university?: string
  college?: string
  city?: string
  gender?: string
  pdf_file_url?: string
  certificate_issued: boolean
  certificate_url?: string
  certificate_pdf_url?: string
  student_name: string
  student_email: string
  ceremony_date?: string
  effective_ceremony_date?: string
  effective_ceremony_message?: string
  is_custom_ceremony?: boolean
  recitation_status?: string
  created_at: string
  updated_at?: string
}

export default function CertificatesDashPage() {
    const { t } = useI18n()
    const isAr = t.locale === "ar"
    const [applications, setApplications] = useState<CertificateApplication[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<"pending" | "issued" | "all">("pending")
    const [issuingId, setIssuingId] = useState<string | null>(null)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [globalCeremony, setGlobalCeremony] = useState<{ date: string | null, message: string }>({ date: null, message: "" })
    const [settingGlobal, setSettingGlobal] = useState(false)

    useEffect(() => {
        async function loadCerts() {
            setLoading(true)
            try {
                const res = await fetch(`/api/admin/certificates?status=${filter}`)
                if (res.ok) {
                    const data = await res.json()
                    setApplications(data.applications || [])
                    setGlobalCeremony(data.globalCeremony || { date: null, message: "" })
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        loadCerts()
    }, [filter])

    const handleIssue = async (id: string) => {
        if (!confirm(isAr ? "تأكيد إصدار الشهادة لهذا الطالب؟ سيتم إرسال بريد إلكتروني تلقائياً للمستخدم." : "Confirm issuing certificate? An email will be sent automatically.")) return

        setIssuingId(id)
        try {
            const res = await fetch("/api/admin/certificates", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, action: "issue" })
            })

            if (res.ok) {
                const data = await res.json()
                setApplications(prev => prev.map(a =>
                    a.id === id ? { ...a, certificate_issued: true, certificate_url: data.certificateUrl } : a
                ))
            } else {
                const errData = await res.json()
                alert(errData.error || "حدث خطأ أثناء الإصدار")
            }
        } catch {
            alert("تعذر الاتصال بالخادم")
        } finally {
            setIssuingId(null)
        }
    }

    const handleSetGlobalCeremony = async () => {
        setSettingGlobal(true)
        try {
            const res = await fetch("/api/admin/certificates", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "set_global_ceremony", date: globalCeremony.date, message: globalCeremony.message })
            })

            if (!res.ok) {
                const errData = await res.json()
                alert(errData.error || "حدث خطأ أثناء الحفظ")
            } else {
                alert(isAr ? "تم حفظ التاريخ الموحد بنجاح" : "Unified date saved successfully")
            }
        } catch {
            alert("تعذر الاتصال بالخادم")
        } finally {
            setSettingGlobal(false)
        }
    }

    const handleSetIndividualCeremony = async (id: string, ceremony_date: string | null) => {
        try {
            const res = await fetch("/api/admin/certificates", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "set_ceremony_date", id, ceremony_date })
            })

            if (!res.ok) {
                const errData = await res.json()
                alert(errData.error || "حدث خطأ أثناء الحفظ")
            } else {
                alert(isAr ? "تم حفظ التاريخ المخصص بنجاح" : "Custom date saved successfully")
            }
        } catch {
            alert("تعذر الاتصال بالخادم")
        }
    }

    const counts = {
        pending: applications.filter(a => !a.certificate_issued).length,
        issued: applications.filter(a => a.certificate_issued).length,
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">{isAr ? "طلبات الشهادات" : "Certificate Requests"}</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {isAr ? "مراجعة واعتماد طلبات إصدار الشهادة للمتقنين" : "Review and approve certificate requests for mastered students"}
                    </p>
                </div>

            </div>

            {/* Global Ceremony Date Management */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">{isAr ? "إدارة حفل الختام الموحد" : "Unified Graduation Ceremony Management"}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{isAr ? "تاريخ الحفل" : "Ceremony Date"}</label>
                        <input
                            type="datetime-local"
                            value={globalCeremony.date || ""}
                            onChange={(e) => setGlobalCeremony(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B3D2E] focus:border-transparent text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{isAr ? "رسالة إضافية (اختياري)" : "Additional Message (Optional)"}</label>
                        <input
                            type="text"
                            value={globalCeremony.message}
                            onChange={(e) => setGlobalCeremony(prev => ({ ...prev, message: e.target.value }))}
                            placeholder={isAr ? "مثل: الموقع أو التفاصيل الإضافية" : "e.g., Location or additional details"}
                            className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B3D2E] focus:border-transparent text-sm"
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleSetGlobalCeremony}
                        disabled={settingGlobal}
                        className="bg-[#0B3D2E] hover:bg-[#0A3528] disabled:bg-slate-300 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2"
                    >
                        {settingGlobal ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {isAr ? "حفظ التاريخ الموحد" : "Save Unified Date"}
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setFilter("pending")}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all border ${filter === "pending"
                            ? "border-[#0B3D2E] bg-[#0B3D2E] text-white shadow-md"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                >
                    {isAr ? "بانتظار الإصدار" : "Pending Issue"}
                </button>
                <button
                    onClick={() => setFilter("issued")}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all border ${filter === "issued"
                            ? "border-[#0B3D2E] bg-[#0B3D2E] text-white shadow-md"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                >
                    {isAr ? "تم الإصدار" : "Issued"}
                </button>
                <button
                    onClick={() => setFilter("all")}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all border ${filter === "all"
                            ? "border-[#0B3D2E] bg-[#0B3D2E] text-white shadow-md"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                >
                    {isAr ? "الكل" : "All"}
                </button>
            </div>

            {/* Applications List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 flex justify-center shadow-sm">
                        <Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" />
                    </div>
                ) : applications.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                        <Award className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">{isAr ? "لا توجد طلبات في هذه الفئة" : "No applications in this category"}</p>
                    </div>
                ) : applications.map((app) => {
                    const isExpanded = expandedId === app.id

                    return (
                        <div key={app.id} className={`bg-white rounded-2xl border transition-all shadow-sm overflow-hidden ${isExpanded ? "border-[#0B3D2E]/30 ring-1 ring-[#0B3D2E]/10" : "border-slate-200 hover:border-slate-300"}`}>
                            {/* Summary Row */}
                            <div
                                className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer select-none"
                                onClick={() => setExpandedId(isExpanded ? null : app.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${app.certificate_issued ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                        <Award className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{app.student_name}</h3>
                                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-1 font-medium">
                                            <span className="flex items-center gap-1.5">{app.university || "جهة غير محددة"}</span>
                                            {app.recitation_status === 'mastered' && (
                                                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                    {isAr ? "متقن" : "Mastered"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {app.certificate_issued ? (
                                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            {isAr ? "تم الإصدار" : "Issued"}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                            <Clock className="w-3.5 h-3.5" />
                                            {isAr ? "قيد المراجعة" : "Pending"}
                                        </span>
                                    )}

                                    {!app.certificate_issued && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleIssue(app.id); }}
                                            disabled={issuingId === app.id}
                                            className="bg-[#0B3D2E] hover:bg-[#0A3528] disabled:bg-slate-300 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2"
                                        >
                                            {issuingId === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                                            {isAr ? "إصدار الشهادة" : "Issue"}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="border-t border-slate-100 bg-slate-50/50">
                                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium mb-1">{isAr ? "البريد الإلكتروني" : "Email"}</p>
                                            <p className="text-sm font-bold text-slate-800 dir-ltr text-left">{app.student_email}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium mb-1">{isAr ? "المدينة" : "City"}</p>
                                            <p className="text-sm font-bold text-slate-800">{app.city || "---"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium mb-1">{isAr ? "الكلية / التخصص" : "College"}</p>
                                            <p className="text-sm font-bold text-slate-800">{app.college || "---"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium mb-1">{isAr ? "الجنس" : "Gender"}</p>
                                            <p className="text-sm font-bold text-slate-800">{app.gender === 'male' ? (isAr ? "ذكر" : "Male") : (app.gender === 'female' ? (isAr ? "أنثى" : "Female") : "---")}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium mb-1">{isAr ? "تاريخ حفل الختام (المطبق)" : "Ceremony Date (Applied)"}</p>
                                            <p className="text-sm font-bold text-slate-800 mb-2">{app.effective_ceremony_date ? new Date(app.effective_ceremony_date).toLocaleString(isAr ? 'ar-SA' : 'en-US') : (isAr ? "غير محدد" : "Not set")}</p>
                                            {app.is_custom_ceremony ? (
                                                <span className="text-xs text-amber-600 font-medium">{isAr ? "مخصص لهذا الطالب" : "Custom for this student"}</span>
                                            ) : (
                                                <span className="text-xs text-slate-500 font-medium">{isAr ? "من التاريخ الموحد" : "From global date"}</span>
                                            )}
                                            <div className="mt-2">
                                                <p className="text-xs text-slate-500 font-medium mb-1">{isAr ? "تاريخ مخصص (اختياري)" : "Custom Date (Optional)"}</p>
                                                <input
                                                    type="datetime-local"
                                                    value={app.ceremony_date || ""}
                                                    onChange={(e) => {
                                                        const newDate = e.target.value
                                                        setApplications(prev => prev.map(a =>
                                                            a.id === app.id ? { ...a, ceremony_date: newDate } : a
                                                        ))
                                                    }}
                                                    className="w-full pl-4 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0B3D2E] focus:border-transparent text-sm"
                                                />
                                                <button
                                                    onClick={() => handleSetIndividualCeremony(app.id, app.ceremony_date)}
                                                    className="mt-2 text-xs bg-[#0B3D2E] hover:bg-[#0A3528] text-white px-3 py-1 rounded-lg font-bold"
                                                >
                                                    {isAr ? "حفظ التاريخ المخصص" : "Save Custom Date"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-6 pb-6 pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        {app.pdf_file_url ? (
                                            <a
                                                href={app.pdf_file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-4 py-2 rounded-lg border border-blue-100"
                                            >
                                                <FileText className="w-4 h-4" />
                                                {isAr ? "إثبات الانتماء للجهة المرفق" : "Attached Proof File"}
                                                <ExternalLink className="w-3.5 h-3.5 ml-1 rtl:mr-1 rtl:ml-0" />
                                            </a>
                                        ) : (
                                            <span className="text-sm text-slate-500 bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
                                                {isAr ? "لا توجد مرفقات مع هذا الطلب" : "No attachments provided"}
                                            </span>
                                        )}

                                        {app.certificate_issued && app.certificate_url && (
                                            <a
                                                href={app.certificate_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-800 font-bold bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100"
                                            >
                                                <Award className="w-4 h-4" />
                                                {isAr ? "الشهادة الرقمية المصدرة" : "Digital Certificate Link"}
                                                <ExternalLink className="w-3.5 h-3.5 ml-1 rtl:mr-1 rtl:ml-0" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
