"use client"

import useSWR from "swr"
import { Users, BookOpen, CheckCircle2, Percent, Loader2, Trophy } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface StatsResponse {
  initiative: { name: string; target: number | null }
  totals: {
    participants: number
    verifiedParticipants: number
    totalRecitations: number
    masteredCount: number
    pendingCount: number
    inReviewCount: number
    masteryRate: number
  }
  statusDistribution: { status: string; count: number }[]
  recitationsOverTime: { date: string; count: number }[]
  topParticipants: { name: string; mastered: number; total: number }[]
}

const PIE_COLORS = ["#0B7C4D", "#D4A843", "#3B82F6", "#F59E0B", "#8B5CF6", "#EF4444"]

export default function InitiativeStatsPage() {
  const { data, isLoading } = useSWR<StatsResponse>("/api/initiative/stats", fetcher)

  if (isLoading) {
    return (
      <div dir="rtl" className="py-24 flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-bold">جارٍ تحميل الإحصائيات...</p>
      </div>
    )
  }

  const t = data?.totals
  const hasData = (t?.totalRecitations ?? 0) > 0 || (t?.participants ?? 0) > 0

  return (
    <div dir="rtl" className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">إحصائيات المبادرة</h1>
        <p className="text-sm text-muted-foreground mt-1">{data?.initiative?.name}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={<Users className="w-5 h-5" />} label="المشاركون" value={`${t?.participants ?? 0}`} hint={data?.initiative?.target ? `الهدف ${data.initiative.target}` : undefined} />
        <StatCard icon={<BookOpen className="w-5 h-5" />} label="إجمالي التلاوات" value={`${t?.totalRecitations ?? 0}`} />
        <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="تلاوات متقنة" value={`${t?.masteredCount ?? 0}`} />
        <StatCard icon={<Percent className="w-5 h-5" />} label="نسبة الإتقان" value={`${t?.masteryRate ?? 0}%`} />
      </div>

      {!hasData ? (
        <div className="bg-muted/30 border border-dashed border-border rounded-3xl p-12 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-bold text-foreground">لا توجد بيانات بعد</p>
          <p className="text-sm text-muted-foreground mt-1">ستظهر الإحصائيات بمجرد انضمام الطلاب وإرسال تلاواتهم.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="التلاوات خلال آخر 30 يوماً">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data?.recitationsOverTime || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} reversed />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#0B7C4D" strokeWidth={2.5} dot={{ r: 3 }} name="تلاوات" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="توزيع حالات التلاوات">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={data?.statusDistribution || []} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label>
                    {(data?.statusDistribution || []).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <ChartCard title="أكثر المشاركين إتقاناً">
            {(data?.topParticipants?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">لا توجد بيانات كافية بعد.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data?.topParticipants || []} layout="vertical" margin={{ right: 16, left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="mastered" fill="#0B7C4D" radius={[0, 6, 6, 0]} name="متقن" />
                  <Bar dataKey="total" fill="#D4A843" radius={[0, 6, 6, 0]} name="إجمالي" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">{icon}</div>
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-foreground">{value}</p>
      {hint && <p className="text-[11px] font-bold text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-3xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Trophy className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-black text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  )
}
