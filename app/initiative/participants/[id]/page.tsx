"use client"

import useSWR from "swr"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowRight, CheckCircle2, Clock, Loader2, XCircle,
  User, Mail, BookOpen, Award, BarChart3, CalendarDays, ChevronDown, ChevronUp
} from "lucide-react"
import { useState } from "react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  mastered: { label: "متقن", color: "text-green-700 bg-green-50", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  in_review: { label: "قيد المراجعة", color: "text-blue-700 bg-blue-50", icon: <Clock className="w-3.5 h-3.5" /> },
  pending: { label: "بانتظار التعيين", color: "text-amber-700 bg-amber-50", icon: <Clock className="w-3.5 h-3.5" /> },
  needs_session: { label: "يحتاج جلسة", color: "text-orange-700 bg-orange-50", icon: <CalendarDays className="w-3.5 h-3.5" /> },
  rejected: { label: "مرفوضة", color: "text-red-700 bg-red-50", icon: <XCircle className="w-3.5 h-3.5" /> },
}

interface RecitationRow {
  id: string
  status: string
  readerName: string | null
  studentNotes: string | null
  qiraah: string | null
  score: number | null
  createdAt: string
  reviewedAt: string | null
  durationSeconds: number | null
}

interface StudentData {
  student: {
    id: string
    name: string
    email: string
    gender: string | null
    emailVerified: boolean
    joinedAt: string
  }
  summary: {
    total: number
    mastered: number
    inReview: number
    pending: number
    masteryRate: number
  }
  recitations: RecitationRow[]
}

function formatDuration(s: number | null) {
  if (!s) return "—"
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, "0")}`
}

export default function StudentProgressPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useSWR<StudentData>(`/api/initiative/participants/${id}`, fetcher)
  const [expanded, setExpanded] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div dir="rtl" className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground">جارٍ تحميل بيانات الطالب...</p>
      </div>
    )
  }

  if (!data?.student) {
    return (
      <div dir="rtl" className="flex flex-col items-center justify-center py-32 gap-4">
        <XCircle className="w-10 h-10 text-destructive/60" />
        <p className="font-bold text-foreground">الطالب غير موجود في مبادرتك</p>
        <Link href="/initiative/participants" className="text-sm text-primary font-bold underline">
          العودة للمشاركين
        </Link>
      </div>
    )
  }

  const { student, summary, recitations } = data

  return (
    <div dir="rtl" className="space-y-8">
      {/* رأس الصفحة */}
      <div className="flex items-center gap-4">
        <Link
          href="/initiative/participants"
          className="w-10 h-10 rounded-2xl border border-border flex items-center justify-center hover:bg-muted/60 transition-colors shrink-0"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">{student.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">تقدم الطالب في المبادرة</p>
        </div>
      </div>

      {/* بطاقة الطالب */}
      <div className="bg-card border border-border rounded-3xl p-6 flex flex-col sm:flex-row gap-6 items-start">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <User className="w-7 h-7" />
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InfoItem icon={<Mail className="w-4 h-4" />} label="البريد الإلكتروني" value={student.email} ltr />
          <InfoItem
            icon={<CheckCircle2 className="w-4 h-4" />}
            label="حالة الحساب"
            value={student.emailVerified ? "مفعّل" : "غير مفعّل"}
          />
          <InfoItem
            icon={<CalendarDays className="w-4 h-4" />}
            label="تاريخ الانضمام"
            value={new Date(student.joinedAt).toLocaleDateString("ar-EG")}
          />
        </div>
      </div>

      {/* ملخص الإحصائيات */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard icon={<BookOpen className="w-5 h-5" />} label="إجمالي التلاوات" value={summary.total} />
        <SummaryCard icon={<Award className="w-5 h-5" />} label="تلاوات متقنة" value={summary.mastered} accent="green" />
        <SummaryCard icon={<Clock className="w-5 h-5" />} label="قيد المراجعة" value={summary.inReview} accent="blue" />
        <SummaryCard icon={<BarChart3 className="w-5 h-5" />} label="نسبة الإتقان" value={`${summary.masteryRate}%`} accent="purple" />
      </div>

      {/* شريط تقدم الإتقان */}
      <div className="bg-card border border-border rounded-3xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-black text-foreground">مستوى الإتقان</p>
          <p className="text-sm font-black text-primary">{summary.masteryRate}%</p>
        </div>
        <div className="w-full h-3 bg-muted/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${summary.masteryRate}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground font-bold">
          {summary.mastered} تلاوة متقنة من {summary.total}
        </p>
      </div>

      {/* جدول تاريخ التلاوات */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-black text-foreground">تاريخ التلاوات</h2>
          <p className="text-xs text-muted-foreground mt-0.5">جميع التلاوات المرسلة مرتبة من الأحدث</p>
        </div>

        {recitations.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-bold text-muted-foreground">لم يرسل الطالب أي تلاوة بعد</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recitations.map((r, idx) => {
              const statusInfo = STATUS_LABELS[r.status] || { label: r.status, color: "text-muted-foreground bg-muted/40", icon: null }
              const isOpen = expanded === r.id
              return (
                <div key={r.id}>
                  <button
                    className="w-full text-right px-5 py-4 flex items-center gap-4 hover:bg-muted/20 transition-colors"
                    onClick={() => setExpanded(isOpen ? null : r.id)}
                  >
                    <span className="w-7 h-7 rounded-full bg-muted/60 flex items-center justify-center text-xs font-black text-muted-foreground shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${statusInfo.color}`}>
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>
                      <span className="text-sm text-muted-foreground font-bold">
                        {new Date(r.createdAt).toLocaleDateString("ar-EG")}
                      </span>
                      {r.readerName && (
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          المقرئ: {r.readerName}
                        </span>
                      )}
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/10">
                      <Detail label="المقرئ" value={r.readerName || "غير محدد"} />
                      <Detail label="القراءة" value={r.qiraah || "—"} />
                      <Detail label="المدة" value={formatDuration(r.durationSeconds)} />
                      <Detail label="التقييم" value={r.score != null ? `${r.score}/10` : "—"} />
                      {r.studentNotes && (
                        <div className="col-span-2 sm:col-span-4">
                          <p className="text-xs font-black text-muted-foreground mb-1">ملاحظات الطالب</p>
                          <p className="text-sm text-foreground bg-card rounded-xl p-3 border border-border">{r.studentNotes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoItem({ icon, label, value, ltr }: { icon: React.ReactNode; label: string; value: string; ltr?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
        {icon} {label}
      </p>
      <p className={`text-sm font-bold text-foreground mt-0.5 ${ltr ? "ltr:text-left font-mono" : ""}`} dir={ltr ? "ltr" : undefined}>
        {value}
      </p>
    </div>
  )
}

function SummaryCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent?: string }) {
  const colors: Record<string, string> = {
    green: "bg-green-50 text-green-700",
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-primary/10 text-primary",
  }
  const cls = accent ? colors[accent] || "bg-primary/10 text-primary" : "bg-muted/60 text-muted-foreground"
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cls}`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-foreground">{value}</p>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="pt-3">
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-foreground mt-0.5">{value}</p>
    </div>
  )
}
