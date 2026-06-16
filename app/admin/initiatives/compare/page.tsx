"use client"

import useSWR from "swr"
import { useState } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts"
import { Users, BookOpen, Award, BarChart3, CheckCircle2, Loader2, GitCompare } from "lucide-react"
import { Button } from "@/components/ui/button"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Initiative {
  id: string
  name: string
  status: string
}

interface CompareRow {
  id: string
  name: string
  status: string
  participants: number
  verifiedParticipants: number
  totalRecitations: number
  mastered: number
  inReview: number
  masteryRate: number
  lastActivity: string | null
}

const COLORS = ["#16a34a", "#2563eb", "#d97706", "#7c3aed", "#db2777", "#0891b2"]
const STATUS_LABELS: Record<string, string> = {
  approved: "معتمدة",
  suspended: "موقوفة",
  pending: "قيد المراجعة",
  rejected: "مرفوضة",
}

export default function CompareInitiativesPage() {
  const { data: listData, isLoading: listLoading } = useSWR<{ initiatives: Initiative[] }>(
    "/api/admin/initiatives",
    fetcher
  )
  const [selected, setSelected] = useState<string[]>([])
  const [compareIds, setCompareIds] = useState<string[]>([])

  const { data: compareData, isLoading: compareLoading } = useSWR<{ initiatives: CompareRow[] }>(
    compareIds.length >= 2 ? `/api/admin/initiatives/compare?ids=${compareIds.join(",")}` : null,
    fetcher
  )

  const allInitiatives = listData?.initiatives || []
  const approvedOnes = allInitiatives.filter((i) => i.status === "approved" || i.status === "suspended")
  const results = compareData?.initiatives || []

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 6 ? [...prev, id] : prev
    )
  }

  // بيانات الـ BarChart
  const barData = [
    { metric: "المشاركون", ...Object.fromEntries(results.map((r) => [r.name, r.participants])) },
    { metric: "إجمالي التلاوات", ...Object.fromEntries(results.map((r) => [r.name, r.totalRecitations])) },
    { metric: "تلاوات متقنة", ...Object.fromEntries(results.map((r) => [r.name, r.mastered])) },
  ]

  // بيانات الـ Radar
  const radarData = [
    { subject: "المشاركون" },
    { subject: "التلاوات" },
    { subject: "الإتقان" },
    { subject: "التفعيل" },
  ].map((item) => {
    const maxP = Math.max(...results.map((r) => r.participants), 1)
    const maxR = Math.max(...results.map((r) => r.totalRecitations), 1)
    const row: Record<string, string | number> = { subject: item.subject }
    results.forEach((r) => {
      if (item.subject === "المشاركون") row[r.name] = Math.round((r.participants / maxP) * 100)
      if (item.subject === "التلاوات") row[r.name] = Math.round((r.totalRecitations / maxR) * 100)
      if (item.subject === "الإتقان") row[r.name] = r.masteryRate
      if (item.subject === "التفعيل") row[r.name] = r.participants > 0 ? Math.round((r.verifiedParticipants / r.participants) * 100) : 0
    })
    return row
  })

  return (
    <div dir="rtl" className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">مقارنة المبادرات</h1>
        <p className="text-sm text-muted-foreground mt-1">اختر من 2 إلى 6 مبادرات لعرض مقاييسها جنباً بجنب.</p>
      </div>

      {/* اختيار المبادرات */}
      <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-foreground text-sm">اختر المبادرات للمقارنة</h2>
          <span className="text-xs text-muted-foreground font-bold">{selected.length} / 6 محددة</span>
        </div>

        {listLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> جارٍ التحميل...
          </div>
        ) : approvedOnes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">لا توجد مبادرات معتمدة للمقارنة.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {approvedOnes.map((ini, idx) => {
              const isSelected = selected.includes(ini.id)
              const color = isSelected ? COLORS[selected.indexOf(ini.id) % COLORS.length] : undefined
              return (
                <button
                  key={ini.id}
                  onClick={() => toggleSelect(ini.id)}
                  className={`px-4 py-2.5 rounded-2xl text-sm font-bold border transition-all ${
                    isSelected
                      ? "border-transparent text-white"
                      : "border-border bg-muted/30 text-foreground hover:border-primary/50"
                  }`}
                  style={isSelected ? { backgroundColor: color } : undefined}
                >
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 inline ml-1.5" />}
                  {ini.name}
                </button>
              )
            })}
          </div>
        )}

        <Button
          disabled={selected.length < 2}
          onClick={() => setCompareIds([...selected])}
          className="rounded-2xl h-11 px-8 font-black gap-2"
        >
          <GitCompare className="w-4 h-4" />
          قارن الآن
        </Button>
      </div>

      {/* نتائج المقارنة */}
      {compareLoading && (
        <div className="flex flex-col items-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
          <p className="text-sm font-bold">جارٍ تحميل بيانات المقارنة...</p>
        </div>
      )}

      {results.length >= 2 && !compareLoading && (
        <div className="space-y-8">
          {/* بطاقات الأرقام الرئيسية */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {results.map((r, idx) => (
              <div
                key={r.id}
                className="bg-card border rounded-3xl p-6 space-y-4"
                style={{ borderColor: COLORS[idx % COLORS.length] + "40" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <p className="font-black text-foreground truncate">{r.name}</p>
                  <span className="text-xs font-bold text-muted-foreground mr-auto shrink-0">
                    {STATUS_LABELS[r.status] || r.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MiniStat icon={<Users className="w-3.5 h-3.5" />} label="مشاركون" value={r.participants} />
                  <MiniStat icon={<BookOpen className="w-3.5 h-3.5" />} label="تلاوات" value={r.totalRecitations} />
                  <MiniStat icon={<Award className="w-3.5 h-3.5" />} label="متقنة" value={r.mastered} />
                  <MiniStat icon={<BarChart3 className="w-3.5 h-3.5" />} label="نسبة الإتقان" value={`${r.masteryRate}%`} />
                </div>
                {/* شريط إتقان */}
                <div>
                  <div className="w-full h-2 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${r.masteryRate}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bar Chart */}
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
            <h2 className="font-black text-foreground">مقارنة المقاييس الرئيسية</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="metric" tick={{ fontSize: 12, fontFamily: "inherit" }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontFamily: "inherit", fontSize: 12, borderRadius: 12, border: "1px solid hsl(var(--border))" }}
                />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: "inherit" }} />
                {results.map((r, idx) => (
                  <Bar key={r.id} dataKey={r.name} fill={COLORS[idx % COLORS.length]} radius={[6, 6, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar Chart */}
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
            <h2 className="font-black text-foreground">الملف الشامل (نسبي %)</h2>
            <p className="text-xs text-muted-foreground">القيم منسوبة إلى أعلى مبادرة في كل محور.</p>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid className="stroke-border" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fontFamily: "inherit" }} />
                {results.map((r, idx) => (
                  <Radar
                    key={r.id}
                    name={r.name}
                    dataKey={r.name}
                    stroke={COLORS[idx % COLORS.length]}
                    fill={COLORS[idx % COLORS.length]}
                    fillOpacity={0.15}
                  />
                ))}
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: "inherit" }} />
                <Tooltip
                  contentStyle={{ fontFamily: "inherit", fontSize: 12, borderRadius: 12, border: "1px solid hsl(var(--border))" }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <div>
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wide">{label}</p>
        <p className="text-sm font-black text-foreground">{value}</p>
      </div>
    </div>
  )
}
