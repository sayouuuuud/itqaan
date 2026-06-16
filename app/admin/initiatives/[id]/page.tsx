"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Building2, Clock, CheckCircle, XCircle, PauseCircle, Users, Mail, Phone,
  ArrowRight, Loader2, ShieldCheck, User as UserIcon, Target, PlayCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { InitiativeAnalytics } from "@/components/admin/initiative-analytics"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type Status = "pending" | "approved" | "rejected" | "suspended"

type Initiative = {
  id: string
  name: string
  type: string | null
  description: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  target_students_count: number | null
  status: Status
  admin_email: string | null
  admin_name: string | null
  rejection_reason: string | null
  students_count: number
  approved_at: string | null
  created_at: string
}

const TYPE_LABELS: Record<string, string> = {
  university: "جامعة", ministry: "وزارة / جهة حكومية", restaurant: "مطعم", cafe: "مقهى", other: "أخرى",
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: { label: "بانتظار المراجعة", color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", icon: <Clock className="w-4 h-4" /> },
  approved: { label: "معتمدة", color: "text-primary", bg: "bg-primary/10 border-primary/20", icon: <CheckCircle className="w-4 h-4" /> },
  rejected: { label: "مرفوضة", color: "text-destructive", bg: "bg-destructive/10 border-destructive/20", icon: <XCircle className="w-4 h-4" /> },
  suspended: { label: "موقوفة", color: "text-muted-foreground", bg: "bg-muted border-border", icon: <PauseCircle className="w-4 h-4" /> },
}

export default function InitiativeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [initiative, setInitiative] = useState<Initiative | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/initiatives/${id}`)
        if (res.ok) {
          const data = await res.json()
          setInitiative(data.initiative)
        } else {
          toast.error("تعذّر تحميل المبادرة")
        }
      } catch {
        toast.error("تعذّر الاتصال بالخادم")
      } finally {
        setLoading(false)
      }
    }
    if (id) load()
  }, [id])

  async function handleApprove() {
    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/initiatives/${id}/approve`, { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        toast.success("تمت الموافقة وإنشاء حساب مشرف المبادرة وإرسال بيانات الدخول")
        setInitiative((prev) => prev ? { ...prev, status: "approved" } : prev)
      } else {
        toast.error(data.error || "تعذّر اعتماد المبادرة")
      }
    } catch {
      toast.error("تعذّر الاتصال بالخادم")
    } finally {
      setProcessing(false)
    }
  }

  async function handlePatch(action: "reject" | "suspend" | "reactivate", reason?: string) {
    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/initiatives/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("تم تحديث حالة المبادرة")
        setInitiative((prev) => prev ? { ...prev, status: data.status, rejection_reason: action === "reject" ? (reason || null) : prev.rejection_reason } : prev)
      } else {
        toast.error(data.error || "تعذّر تحديث المبادرة")
      }
    } catch {
      toast.error("تعذّر الاتصال بالخادم")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return <div dir="rtl" className="space-y-6"><div className="h-12 w-48 bg-muted/40 rounded-xl animate-pulse" /><div className="h-64 bg-muted/30 rounded-3xl animate-pulse" /></div>
  }

  if (!initiative) {
    return (
      <div dir="rtl" className="py-24 text-center">
        <p className="text-muted-foreground font-bold">المبادرة غير موجودة</p>
        <Link href="/admin/initiatives" className="text-primary font-bold mt-4 inline-block">العودة للقائمة</Link>
      </div>
    )
  }

  const status = STATUS_CONFIG[initiative.status]

  return (
    <div dir="rtl" className="space-y-8 max-w-4xl">
      <Link href="/admin/initiatives" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
        <ArrowRight className="w-4 h-4" />
        العودة لقائمة المبادرات
      </Link>

      {/* Hero */}
      <div className="bg-card border border-border rounded-[32px] p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-primary" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5 min-w-0">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center text-3xl font-black shrink-0">
              {initiative.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl font-black text-foreground tracking-tight truncate">{initiative.name}</h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="text-xs font-bold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  {TYPE_LABELS[initiative.type || "other"] || "أخرى"}
                </span>
                <span className={cn("flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-lg border", status.bg, status.color)}>
                  {status.icon}
                  {status.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {initiative.description && (
          <p className="text-muted-foreground leading-relaxed mt-6 text-pretty">{initiative.description}</p>
        )}
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <InfoCard icon={<UserIcon className="w-5 h-5" />} label="مسؤول التواصل" value={initiative.contact_name || "—"} />
        <InfoCard icon={<Mail className="w-5 h-5" />} label="البريد الإلكتروني" value={initiative.contact_email || "—"} ltr />
        <InfoCard icon={<Phone className="w-5 h-5" />} label="رقم الجوال" value={initiative.contact_phone || "—"} ltr />
        <InfoCard icon={<Target className="w-5 h-5" />} label="العدد المتوقّع" value={initiative.target_students_count ? `${initiative.target_students_count} مشارك` : "—"} />
        <InfoCard icon={<Users className="w-5 h-5" />} label="المشاركون الحاليون" value={`${initiative.students_count}`} />
        {initiative.admin_email && (
          <InfoCard icon={<ShieldCheck className="w-5 h-5" />} label="حساب مشرف المبادرة" value={initiative.admin_email} ltr />
        )}
      </div>

      {initiative.status === "rejected" && initiative.rejection_reason && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5">
          <p className="text-xs font-black text-destructive uppercase tracking-wide mb-1">سبب الرفض</p>
          <p className="text-sm text-foreground/80">{initiative.rejection_reason}</p>
        </div>
      )}

      {/* Actions */}
      <div className="bg-card border border-border rounded-3xl p-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
        {initiative.status === "pending" && (
          <>
            <RejectDialog onConfirm={(reason) => handlePatch("reject", reason)} reason={rejectReason} setReason={setRejectReason} processing={processing} />
            <Button onClick={handleApprove} disabled={processing} className="rounded-2xl h-12 px-8 font-black gap-2">
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              اعتماد المبادرة
            </Button>
          </>
        )}

        {initiative.status === "approved" && (
          <Button
            onClick={() => handlePatch("suspend")}
            disabled={processing}
            variant="outline"
            className="rounded-2xl h-12 px-8 font-black border-amber-500/30 text-amber-600 hover:bg-amber-500/10 gap-2"
          >
            {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <PauseCircle className="w-5 h-5" />}
            إيقاف المبادرة
          </Button>
        )}

        {initiative.status === "suspended" && (
          <Button onClick={() => handlePatch("reactivate")} disabled={processing} className="rounded-2xl h-12 px-8 font-black gap-2">
            {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
            إعادة تفعيل المبادرة
          </Button>
        )}

        {initiative.status === "rejected" && (
          <p className="text-sm text-muted-foreground font-bold">تم رفض هذا الطلب.</p>
        )}
      </div>
    </div>
  )
}

function InfoCard({ icon, label, value, ltr }: { icon: React.ReactNode; label: string; value: string; ltr?: boolean }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className={cn("text-sm font-bold text-foreground truncate", ltr && "[direction:ltr] text-right")}>{value}</p>
      </div>
    </div>
  )
}

function RejectDialog({
  onConfirm, reason, setReason, processing,
}: { onConfirm: (reason: string) => void; reason: string; setReason: (v: string) => void; processing: boolean }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={processing} className="rounded-2xl h-12 px-8 font-black border-destructive/20 text-destructive hover:bg-destructive/10 gap-2">
          <XCircle className="w-5 h-5" />
          رفض الطلب
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent dir="rtl" className="rounded-[32px] max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-black text-destructive flex items-center gap-2">
            <XCircle className="w-6 h-6" />
            رفض طلب المبادرة
          </AlertDialogTitle>
          <AlertDialogDescription className="font-bold leading-relaxed pt-1">
            يمكنك توضيح سبب الرفض ليصل للجهة. هذا الإجراء قابل للتغيير لاحقاً.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="سبب الرفض (اختياري)"
          className="rounded-xl resize-none"
        />
        <AlertDialogFooter className="pt-4 gap-3">
          <AlertDialogCancel className="rounded-2xl h-11 font-black">إلغاء</AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm(reason)} className="rounded-2xl h-11 bg-destructive text-destructive-foreground font-black hover:bg-destructive/90">
            تأكيد الرفض
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
