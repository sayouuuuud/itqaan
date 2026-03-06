"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import {
  UserCheck, UserX, Clock, ChevronRight, GraduationCap,
  BookOpen, Phone, MapPin, CheckCircle, XCircle, AlertCircle,
  Loader2, Mail, Calendar, FileText, ExternalLink, Globe,
  ShieldCheck, BadgeCheck, Search, Trash2
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

type AppStatus = "pending_approval" | "approved" | "rejected" | "auto_approved"

type Application = {
  id: string
  name: string
  email: string
  gender: string
  approval_status: AppStatus
  created_at: string
  full_name_triple: string | null
  phone: string | null
  city: string | null
  nationality: string | null
  qualification: string | null
  memorized_parts: string | null
  years_of_experience: number | null
  certificate_file_url: string | null
}

export default function ReaderApplicationsPage() {
  const { t } = useI18n()
  const isAr = t.locale === "ar"
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | AppStatus>("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    async function loadApps() {
      try {
        const res = await fetch("/api/admin/reader-applications")
        if (res.ok) {
          const data = await res.json()
          setApplications(data.applications || [])
          // Select the first pending application if any
          const firstPending = (data.applications || []).find((a: Application) => a.approval_status === "pending_approval")
          if (firstPending) setSelectedId(firstPending.id)
          else if (data.applications?.length > 0) setSelectedId(data.applications[0].id)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadApps()
  }, [])

  const filtered = applications.filter((app) => {
    const matchesFilter = filter === "all" ||
      (filter === "approved" ? (app.approval_status === "approved" || app.approval_status === "auto_approved") : app.approval_status === filter)
    const matchesSearch =
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.full_name_triple?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const counts = {
    all: applications.length,
    pending_approval: applications.filter(a => a.approval_status === "pending_approval").length,
    approved: applications.filter(a => ['approved', 'auto_approved'].includes(a.approval_status)).length,
    rejected: applications.filter(a => a.approval_status === "rejected").length,
  }

  const handleAction = async (userId: string, action: "approve" | "reject") => {
    setProcessingId(userId)
    try {
      const res = await fetch("/api/admin/reader-applications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action })
      })

      if (res.ok) {
        const data = await res.json()
        setApplications(prev => prev.map(a => a.id === userId ? { ...a, approval_status: data.status } : a))
      } else {
        alert(t.admin.errorProcessingApplication)
      }
    } catch {
      alert(t.auth.errorOccurred)
    } finally {
      setProcessingId(null)
    }
  }

  const handleDelete = async (userId: string) => {
    setProcessingId(userId)
    try {
      const res = await fetch("/api/admin/reader-applications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      })
      if (res.ok) {
        setApplications(prev => prev.filter(a => a.id !== userId))
        setSelectedId(null)
      } else {
        alert(isAr ? "حدث خطأ أثناء الحذف" : "Error deleting application")
      }
    } catch {
      alert(t.auth.errorOccurred)
    } finally {
      setProcessingId(null)
    }
  }

  const selectedApp = applications.find(a => a.id === selectedId)

  const statusConfig: Record<AppStatus, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
    pending_approval: {
      label: t.admin.pendingApproval,
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-100",
      icon: <Clock className="w-4 h-4" />,
    },
    approved: {
      label: t.approved,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-100",
      icon: <CheckCircle className="w-4 h-4" />,
    },
    auto_approved: {
      label: t.approved,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-100",
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    rejected: {
      label: t.rejected,
      color: "text-rose-600",
      bg: "bg-rose-50 border-rose-100",
      icon: <XCircle className="w-4 h-4" />,
    },
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden -m-4 md:-m-6">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-100 p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-[#0B3D2E] text-white rounded-xl shadow-lg shadow-[#0B3D2E]/20">
              <BadgeCheck className="w-6 h-6" />
            </span>
            {t.admin.readerApplications}
          </h1>
          <p className="text-sm text-gray-400 mt-1 font-medium">{t.admin.readerApplicationsDesc}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={isAr ? "البحث عن طلب..." : "Search applications..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0B3D2E]/20 outline-none transition-all w-64 font-medium"
            />
          </div>
          {counts.pending_approval > 0 && (
            <div className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 animate-pulse">
              <AlertCircle className="w-3 h-3" />
              {counts.pending_approval} {isAr ? "طلبات بانتظار المراجعة" : "Pending Reviews"}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar List */}
        <div className="w-full md:w-96 border-l border-gray-100 bg-white flex flex-col shrink-0 overflow-hidden relative">
          {/* Filter Tabs */}
          <div className="p-4 border-b border-gray-50 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
            {["all", "pending_approval", "approved", "rejected"].map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k as any)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                  filter === k
                    ? "bg-[#0B3D2E] text-white shadow-md"
                    : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                )}
              >
                {k === 'all' ? t.all : k === 'pending_approval' ? t.admin.pendingApproval : k === 'approved' ? t.approved : t.rejected}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse" />
              ))
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center">
                <UserCheck className="w-12 h-12 text-gray-100 mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-bold">{t.admin.noApplicationsFound}</p>
              </div>
            ) : filtered.map((app) => {
              const status = statusConfig[app.approval_status] || statusConfig.pending_approval
              return (
                <button
                  key={app.id}
                  onClick={() => setSelectedId(app.id)}
                  className={cn(
                    "group w-full p-4 rounded-2xl border transition-all text-right flex flex-col gap-2 relative",
                    selectedId === app.id
                      ? "bg-emerald-50/50 border-emerald-200 shadow-sm"
                      : "bg-white border-transparent hover:border-gray-100 hover:bg-gray-50/50"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <span className={cn("text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border", status.bg, status.color)}>
                      {status.label}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {new Date(app.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-transform group-hover:scale-105",
                      selectedId === app.id ? "bg-[#0B3D2E] text-white shadow-lg" : "bg-gray-100 text-gray-600"
                    )}>
                      {app.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm truncate">{app.name}</h3>
                      <p className="text-xs text-gray-400 truncate font-medium">{app.email}</p>
                    </div>
                  </div>
                  {selectedId === app.id && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <ChevronRight className={cn("w-4 h-4 text-emerald-400 transition-all", isAr ? "rotate-180" : "")} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Detail Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-gray-50/30 p-4 md:p-8">
          {selectedApp ? (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Hero Card */}
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-[#0B3D2E] to-emerald-500" />

                <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#0B3D2E] to-[#145A3E] rounded-[24px] flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-emerald-900/10">
                    {selectedApp.name.charAt(0)}
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap justify-between items-center gap-4">
                      <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">{selectedApp.full_name_triple || selectedApp.name}</h2>
                        <div className="flex flex-wrap items-center gap-4 mt-2">
                          <div className="flex items-center gap-1.5 text-gray-400 font-bold text-sm">
                            <Mail className="w-4 h-4" />
                            {selectedApp.email}
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-400 font-bold text-sm">
                            <Phone className="w-4 h-4" />
                            {selectedApp.phone || "---"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {selectedApp.approval_status === "pending_approval" ? (
                          <>
                            <button
                              onClick={() => handleAction(selectedApp.id, "reject")}
                              disabled={!!processingId}
                              className="px-6 py-3 rounded-2xl bg-white border-2 border-rose-100 text-rose-500 font-black text-sm hover:bg-rose-50 transition-all"
                            >
                              {processingId === selectedApp.id ? <Loader2 className="w-5 h-5 animate-spin" /> : isAr ? "رفض الطلب" : "Reject"}
                            </button>
                            <button
                              onClick={() => handleAction(selectedApp.id, "approve")}
                              disabled={!!processingId}
                              className="px-8 py-3 rounded-2xl bg-[#0B3D2E] text-white font-black text-sm shadow-xl shadow-[#0B3D2E]/20 hover:scale-105 transition-all"
                            >
                              {processingId === selectedApp.id ? <Loader2 className="w-5 h-5 animate-spin" /> : isAr ? "اعتماد القارئ" : "Approve Reader"}
                            </button>
                          </>
                        ) : (
                          (() => {
                            const status = statusConfig[selectedApp.approval_status] || statusConfig.pending_approval
                            return (
                              <div className={cn("px-6 py-3 rounded-2xl border-2 flex items-center gap-2 font-black text-sm", status.bg, status.color)}>
                                {status.icon}
                                {status.label}
                              </div>
                            )
                          })()
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              disabled={!!processingId}
                              className="p-3 rounded-2xl border-2 border-rose-100 text-rose-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all"
                              title={isAr ? "حذف الطلب" : "Delete Application"}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-rose-600 flex items-center gap-2">
                                <Trash2 className="w-5 h-5" />
                                {isAr ? "حذف طلب المقرئ" : "Delete Reader Application"}
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-600">
                                {isAr
                                  ? `هل أنت متأكد من حذف طلب التسجيل الخاص بـ "${selectedApp.full_name_triple || selectedApp.name}"? سيتم حذف الحساب وجميع البيانات المرتبطة نهائياً ولا يمكن التراجع عنه.`
                                  : `Are you sure you want to delete the application for "${selectedApp.full_name_triple || selectedApp.name}"? The account and all associated data will be permanently removed.`}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(selectedApp.id)}
                                className="bg-rose-600 hover:bg-rose-700 text-white"
                              >
                                {processingId === selectedApp.id
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : (isAr ? "حذف نهائياً" : "Delete Permanently")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats & Documents Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-4">
                <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-1 hover:shadow-md transition-shadow cursor-default">
                  <div className="p-2 bg-blue-50 text-blue-600 w-fit rounded-xl mb-2">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <span className="text-gray-400 text-xs font-bold">{t.readerRegister.qualification}</span>
                  <span className="text-gray-900 font-black text-lg leading-tight">{selectedApp.qualification || "---"}</span>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-1 cursor-default">
                  <div className="p-2 bg-emerald-50 text-emerald-600 w-fit rounded-xl mb-2">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="text-gray-400 text-xs font-bold">{t.readerRegister.memorizedParts}</span>
                  <span className="text-gray-900 font-black text-lg">{selectedApp.memorized_parts || "---"} {isAr ? "جزءاً" : "Parts"}</span>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-1 cursor-default">
                  <div className="p-2 bg-purple-50 text-purple-600 w-fit rounded-xl mb-2">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="text-gray-400 text-xs font-bold">{t.readerRegister.yearsOfExperience}</span>
                  <span className="text-gray-900 font-black text-lg">{selectedApp.years_of_experience || 0} {t.years}</span>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-1 cursor-default">
                  <div className="p-2 bg-amber-50 text-amber-600 w-fit rounded-xl mb-2">
                    <Globe className="w-5 h-5" />
                  </div>
                  <span className="text-gray-400 text-xs font-bold">{t.readerRegister.nationality}</span>
                  <span className="text-gray-900 font-black text-lg">{selectedApp.nationality || "---"}</span>
                </div>

                {/* Documents Section Integrated in Grid */}
                <div className="lg:col-span-3 bg-[#0B3D2E] text-white rounded-3xl p-6 shadow-xl shadow-emerald-900/10 flex flex-col justify-center">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-300" />
                      <h3 className="text-lg font-black">{isAr ? "الوثائق المرفقة" : "Documents"}</h3>
                    </div>

                    {selectedApp.certificate_file_url ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="w-full sm:w-auto flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl transition-all group text-right">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-emerald-500 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                                <FileText className="w-5 h-5 text-white" />
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-bold text-white">{isAr ? "صورة المؤهل / الإجازة" : "Certificate"}</p>
                                <p className="text-[10px] text-emerald-300 font-medium">{isAr ? "اضغط للعرض" : "Preview"}</p>
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-emerald-300 group-hover:text-white transition-colors mr-2" />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 overflow-hidden bg-white border-0 flex flex-col !inset-0 m-auto !translate-x-0 !translate-y-0">
                          <DialogHeader className="p-4 border-b bg-gray-50 shrink-0">
                            <DialogTitle className="flex items-center gap-2 text-gray-900 justify-end w-full pl-8" dir="ltr">
                              <span className="truncate text-right w-full font-cairo">
                                {selectedApp.full_name_triple || selectedApp.name}
                              </span>
                              <FileText className="w-5 h-5 text-[#0B3D2E] shrink-0" />
                            </DialogTitle>
                          </DialogHeader>
                          <div className="flex-1 overflow-auto bg-gray-100 min-h-0 p-4 flex flex-col items-center gap-8">
                            {(() => {
                              const urls = selectedApp.certificate_file_url!.split(',').filter(Boolean)

                              return urls.map((url, idx) => {
                                const isCloudinary = url.includes('cloudinary.com')
                                const isUploadThing = url.includes('utfs.io') || url.includes('uploadthing.com')

                                const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i) || false
                                const isPdf = url.toLowerCase().includes('.pdf') ||
                                  url.toLowerCase().includes('raw/upload') ||
                                  (isUploadThing && !isImage) // Fallback to PDF if not an explicit image

                                return (
                                  <div key={idx} className="w-full max-w-4xl flex flex-col items-center gap-2">
                                    <div className="w-full flex justify-between items-center px-4 py-2 bg-white rounded-lg shadow-sm">
                                      <span className="text-sm font-bold text-gray-700">{isAr ? `وثيقة ${idx + 1}` : `Document ${idx + 1}`}</span>
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-[#0B3D2E] font-bold flex items-center gap-1 hover:underline"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                        {isAr ? "افتح في تبويب" : "Open in Tab"}
                                      </a>
                                    </div>
                                    {isPdf ? (
                                      isCloudinary ? (
                                        <>
                                          {[1, 2, 3].map(pg => {
                                            const imgUrl = url.replace('/upload/', `/upload/pg_${pg},w_1200,q_auto/`)
                                            return (
                                              <img
                                                key={pg}
                                                src={imgUrl}
                                                alt={`Page ${pg}`}
                                                className="w-full rounded-lg shadow-lg bg-white"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                              />
                                            )
                                          })}
                                        </>
                                      ) : (
                                        <div className="w-full aspect-[1/1.4] flex flex-col" dir="ltr">
                                          <iframe
                                            src={`${url}#view=FitH`}
                                            className="w-full h-full border-0 rounded-lg shadow-xl bg-white flex-1"
                                            title={`Document ${idx + 1}`}
                                          />
                                        </div>
                                      )
                                    ) : (
                                      <img
                                        src={url}
                                        alt={`Document ${idx + 1}`}
                                        className="max-w-full object-contain rounded-lg shadow-xl bg-white"
                                      />
                                    )}
                                  </div>
                                )
                              })
                            })()}
                          </div>
                          <div className="p-4 border-t bg-gray-50 flex justify-end shrink-0">
                            <button
                              onClick={() => {
                                const urls = selectedApp.certificate_file_url!.split(',').filter(Boolean)
                                urls.forEach(u => window.open(u, '_blank'))
                              }}
                              className="px-4 py-2 bg-[#0B3D2E] text-white rounded-xl text-xs font-black flex items-center gap-2 hover:bg-emerald-900 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              {isAr ? "فتح جميع الوثائق" : "Open All Documents"}
                            </button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <div className="flex items-center gap-2 text-white/40 italic text-sm">
                        <AlertCircle className="w-5 h-5" />
                        <span>{isAr ? "لا توجد وثائق" : "No docs"}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Information - Full Width Bottom */}
              <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50/50 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
                <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-2 relative">
                  <ShieldCheck className="w-6 h-6 text-[#0B3D2E]" />
                  {isAr ? "معلومات الحساب" : "Account Information"}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                  <div className="space-y-1 group">
                    <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">{t.auth.nationality}</span>
                    <p className="text-gray-900 font-black text-base transition-colors group-hover:text-[#0B3D2E]">{selectedApp.nationality || "---"}</p>
                  </div>
                  <div className="space-y-1 group">
                    <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">{isAr ? "المدينة" : "City"}</span>
                    <p className="text-gray-900 font-black text-base transition-colors group-hover:text-[#0B3D2E]">{selectedApp.city || "---"}</p>
                  </div>
                  <div className="space-y-1 group">
                    <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">{t.readerRegister.gender}</span>
                    <p className="text-gray-900 font-black text-base transition-colors group-hover:text-[#0B3D2E]">{selectedApp.gender === 'male' ? t.auth.male : t.auth.female}</p>
                  </div>
                  <div className="space-y-1 group">
                    <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">{isAr ? "تاريخ التقديم" : "Applied At"}</span>
                    <p className="text-gray-900 font-black text-base transition-colors group-hover:text-[#0B3D2E]">{new Date(selectedApp.created_at).toLocaleString(isAr ? 'ar-SA' : 'en-US')}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-[40px] flex items-center justify-center text-gray-200 mb-4">
                <UserCheck className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-black text-gray-900">{isAr ? "اختر تطبيقاً للمراجعة" : "Select an application to review"}</h3>
              <p className="text-gray-400 text-sm max-w-xs mx-auto mt-2 font-medium">
                {isAr ? "سيتم عرض التفاصيل الكاملة والوثائق هنا بمجرد اختيار طلب من القائمة الجانبية." : "Detailed information and certificates will be displayed here."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
