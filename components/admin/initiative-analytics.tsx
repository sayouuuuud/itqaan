"use client"

import useSWR from "swr"
import { BarChart3, Loader2, Users, BookOpen, CheckCircle2, Percent } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const PIE_COLORS = ["#0B7C4D", "#D4A843", "#3B82F6", "#F59E0B", "#8B5CF6", "#EF4444"]

interface Stats {
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

export function InitiativeAnalytics({ initiativeId }: { initiativeId: string }) {
  const { data, isLoading } = useSWR<Stats>(`/api/admin/initiatives/${initiativeId}/stats`, fetcher)

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-3xl p-12 flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <p className="text-sm font-bold">جارٍ تحميل تحليلات المبادرة...</p>
      </div>
    )
  }

  const t = data?.totals
  const hasData = (t?.totalRecitations ?? 0) > 0 || (t?.participants ?? 0) > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-black text-foreground">تحليلات المبادرة</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStat icon={<Users className="w-4 h-4" />} label="المشاركون" value={`${t?.participants ?? 0}`} />
        <MiniStat icon={<BookOpen className="w-4 h-4" />} label="التلاوات" value={`${t?.totalRecitations ?? 0}`} />
        <MiniStat icon={<CheckCircle2 className="w-4 h-4" />} label="متقنة" value={`${t?.masteredCount ?? 0}`} />
        <MiniStat icon={<Percent className="w-4 h-4" />} label="نسبة الإتقان" value={`${t?.masteryRate ?? 0}%`} />
      </div>

      {!hasData ? (
        <div className="bg-muted/30 border border-dashed border-border rounded-2xl p-10 text-center">
          <p className="text-sm font-bold text-foreground">لا توجد بيانات بعد</p>
          <p className="text-sm text-muted-foreground mt-1">ستظهر التحليلات بمجرد انضمام الطلاب وإرسال تلاواتهم.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-card border border-border rounded-3xl p-6">
            <h3 className="text-sm font-black text-foreground mb-4">التلاوات خلال آخر 30 يوماً</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data?.recitationsOverTime || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} reversed />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#0B7C4D" strokeWidth={2.5} dot={{ r: 3 }} name="تلاوات" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6">
            <h3 className="text-sm font-black text-foreground mb-4">توزيع حالات التلاوات</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data?.statusDistribution || []} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
                  {(data?.statusDistribution || []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {(data?.topParticipants?.length ?? 0) > 0 && (
            <div className="bg-card border border-border rounded-3xl p-6 lg:col-span-2">
              <h3 className="text-sm font-black text-foreground mb-4">أكثر المشاركين إتقاناً</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data?.topParticipants || []} layout="vertical" margin={{ right: 16, left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="mastered" fill="#0B7C4D" radius={[0, 6, 6, 0]} name="متقن" />
                  <Bar dataKey="total" fill="#D4A843" radius={[0, 6, 6, 0]} name="إجمالي" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-xl font-black text-foreground">{value}</p>
      </div>
    </div>
  )
}
