import Link from "next/link"
import { getSession } from "@/lib/auth"
import { queryOne } from "@/lib/db"
import { Building2, Users, Clock, Sparkles, AlertCircle, UserPlus, BarChart3, ArrowLeft } from "lucide-react"

const TYPE_LABELS: Record<string, string> = {
  university: "جامعة", ministry: "وزارة / جهة حكومية", restaurant: "مطعم", cafe: "مقهى", other: "أخرى",
}

export default async function InitiativeDashboardPage() {
  const session = await getSession()

  // Resolve the initiative this admin belongs to (admins viewing without an initiative see a generic state).
  const initiative = session
    ? await queryOne<{
        id: string
        name: string
        type: string | null
        status: string
        target_students_count: number | null
        students_count: number
      }>(
        `SELECT i.id, i.name, i.type, i.status, i.target_students_count,
                (SELECT COUNT(*) FROM users u WHERE u.initiative_id = i.id) AS students_count
         FROM initiatives i
         JOIN users me ON me.initiative_id = i.id
         WHERE me.id = $1
         LIMIT 1`,
        [session.sub]
      )
    : null

  // مشرف مبادرة غير مرتبط بأي مبادرة بعد — يظهر له حالة توضيحية بدلاً من لوحة فارغة.
  if (!initiative && session?.role === "initiative_admin") {
    return (
      <div dir="rtl" className="space-y-8">
        <div className="bg-card border border-border rounded-[32px] p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-amber-500" />
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground">لوحة تحكم المبادرة</p>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">لم يتم ربط حسابك بمبادرة بعد</h1>
            </div>
          </div>
        </div>

        <div className="bg-muted/30 border border-dashed border-border rounded-3xl p-8 text-center">
          <p className="text-sm font-bold text-foreground mb-2">حسابك جاهز، لكنه غير مرتبط بأي مبادرة حالياً</p>
          <p className="text-sm text-muted-foreground leading-relaxed text-pretty max-w-md mx-auto">
            بمجرد أن تقوم الإدارة بربط حسابك بمبادرة (عند إنشائها أو من صفحة تفاصيل المبادرة)، ستظهر لك هنا لوحة التحكم وأدوات إدارة المشاركين.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="space-y-8">
      <div className="bg-card border border-border rounded-[32px] p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-primary" />
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground">لوحة تحكم المبادرة</p>
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              {initiative?.name || "مبادرتك"}
            </h1>
            {initiative?.type && (
              <p className="text-xs font-bold text-muted-foreground mt-1">{TYPE_LABELS[initiative.type] || "أخرى"}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard icon={<Users className="w-5 h-5" />} label="المشاركون" value={`${initiative?.students_count ?? 0}`} />
        <StatCard icon={<Sparkles className="w-5 h-5" />} label="الهدف" value={initiative?.target_students_count ? `${initiative.target_students_count}` : "—"} />
        <StatCard icon={<Clock className="w-5 h-5" />} label="الحالة" value={initiative?.status === "approved" ? "معتمدة" : initiative?.status === "suspended" ? "موقوفة" : "—"} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <QuickLink href="/initiative/participants" icon={<Users />} title="إدارة المشاركين" description="عرض الطلاب ومتابعة تلاواتهم وتقدمهم." />
        <QuickLink href="/initiative/invite" icon={<UserPlus />} title="الدعوات والانضمام" description="إدارة كود الانضمام ودعوات البريد والاستيراد." />
        <QuickLink href="/initiative/stats" icon={<BarChart3 />} title="الإحصائيات" description="قياس النشاط ونسب الإتقان وأداء المبادرة." />
      </div>
    </div>
  )
}

function QuickLink({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <Link href={href} className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted/40">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold text-foreground">{title}</h2>
          <ArrowLeft className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-1" />
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </Link>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-foreground">{value}</p>
      </div>
    </div>
  )
}
