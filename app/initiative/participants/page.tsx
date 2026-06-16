"use client"

import useSWR from "swr"
import { Users, CheckCircle2, Clock, Search, Loader2, Mail, BadgeCheck, ArrowLeft } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Participant {
  id: string
  name: string
  email: string
  gender: string | null
  emailVerified: boolean
  createdAt: string
  totalRecitations: number
  masteredCount: number
  lastActivity: string | null
}

export default function InitiativeParticipantsPage() {
  const { data, isLoading } = useSWR<{ participants: Participant[]; initiative: { name: string } }>(
    "/api/initiative/participants",
    fetcher
  )
  const [search, setSearch] = useState("")

  const participants = data?.participants || []
  const filtered = participants.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase())
  )
  const verifiedCount = participants.filter((p) => p.emailVerified).length
  const masteredTotal = participants.reduce((sum, p) => sum + p.masteredCount, 0)

  return (
    <div dir="rtl" className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">المشاركون</h1>
        <p className="text-sm text-muted-foreground mt-1">الطلاب المنضمون إلى مبادرتك ومستوى تقدمهم.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard icon={<Users className="w-5 h-5" />} label="إجمالي المشاركين" value={`${participants.length}`} />
        <StatCard icon={<BadgeCheck className="w-5 h-5" />} label="حسابات مفعّلة" value={`${verifiedCount}`} />
        <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="إجمالي الإتقان" value={`${masteredTotal}`} />
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو البريد..."
              className="w-full pr-9 pl-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
            <p className="text-sm font-bold">جارٍ تحميل المشاركين...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-bold text-foreground">لا يوجد مشاركون بعد</p>
            <p className="text-sm text-muted-foreground mt-1">شارك رابط الدعوة لانضمام الطلاب إلى مبادرتك.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-xs font-black text-muted-foreground uppercase border-b border-border bg-muted/30">
                  <th className="px-5 py-3 font-black">المشارك</th>
                  <th className="px-5 py-3 font-black">الحالة</th>
                  <th className="px-5 py-3 font-black">التلاوات</th>
                  <th className="px-5 py-3 font-black">الإتقان</th>
                  <th className="px-5 py-3 font-black">آخر نشاط</th>
                  <th className="px-5 py-3 font-black">التفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors cursor-pointer">
                    <td className="px-5 py-4">
                      <Link href={`/initiative/participants/${p.id}`} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0">
                          {p.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate" dir="ltr">
                            <Mail className="w-3 h-3 shrink-0" />
                            {p.email}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      {p.emailVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> مفعّل
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                          <Clock className="w-3 h-3" /> غير مفعّل
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-bold text-foreground">{p.totalRecitations}</td>
                    <td className="px-5 py-4 font-bold text-foreground">{p.masteredCount}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {p.lastActivity ? new Date(p.lastActivity).toLocaleDateString("ar-EG") : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/initiative/participants/${p.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                      >
                        عرض التقدم <ArrowLeft className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
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
