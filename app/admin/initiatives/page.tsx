"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Building2, Clock, CheckCircle, XCircle, PauseCircle, Search,
  Users, Mail, Phone, ChevronLeft, AlertCircle,
} from "lucide-react"

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
  students_count: number
  created_at: string
}

const TYPE_LABELS: Record<string, string> = {
  university: "جامعة",
  ministry: "وزارة / جهة حكومية",
  restaurant: "مطعم",
  cafe: "مقهى",
  other: "أخرى",
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: { label: "بانتظار المراجعة", color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", icon: <Clock className="w-3.5 h-3.5" /> },
  approved: { label: "معتمدة", color: "text-primary", bg: "bg-primary/10 border-primary/20", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  rejected: { label: "مرفوضة", color: "text-destructive", bg: "bg-destructive/10 border-destructive/20", icon: <XCircle className="w-3.5 h-3.5" /> },
  suspended: { label: "موقوفة", color: "text-muted-foreground", bg: "bg-muted border-border", icon: <PauseCircle className="w-3.5 h-3.5" /> },
}

export default function AdminInitiativesPage() {
  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | Status>("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/initiatives")
        if (res.ok) {
          const data = await res.json()
          setInitiatives(data.initiatives || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const counts = {
    all: initiatives.length,
    pending: initiatives.filter((i) => i.status === "pending").length,
    approved: initiatives.filter((i) => i.status === "approved").length,
    rejected: initiatives.filter((i) => i.status === "rejected").length,
    suspended: initiatives.filter((i) => i.status === "suspended").length,
  }

  const filtered = initiatives.filter((i) => {
    const matchesFilter = filter === "all" || i.status === filter
    const q = search.toLowerCase()
    const matchesSearch =
      i.name.toLowerCase().includes(q) ||
      (i.contact_name?.toLowerCase() || "").includes(q) ||
      (i.contact_email?.toLowerCase() || "").includes(q)
    return matchesFilter && matchesSearch
  })

  return (
    <div dir="rtl" className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            المبادرات
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-bold">مراجعة طلبات الجهات واعتمادها وإدارة المبادرات</p>
        </div>
        {counts.pending > 0 && (
          <div className="flex items-center gap-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest">
            <AlertCircle className="w-3.5 h-3.5" />
            {counts.pending} طلب بانتظار المراجعة
          </div>
        )}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {(["all", "pending", "approved", "rejected", "suspended"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-[11px] font-black tracking-wide transition-all whitespace-nowrap",
                filter === k ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted/50 text-muted-foreground hover:text-foreground"
              )}
            >
              {k === "all" ? "الكل" : STATUS_CONFIG[k].label} ({counts[k]})
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث عن مبادرة..."
            className="w-full pr-10 pl-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-44 bg-muted/30 rounded-3xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
            <Building2 className="w-8 h-8 text-muted-foreground opacity-20" />
          </div>
          <p className="text-muted-foreground text-xs font-black uppercase tracking-widest">لا توجد مبادرات</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((i) => {
            const status = STATUS_CONFIG[i.status]
            return (
              <Link
                key={i.id}
                href={`/admin/initiatives/${i.id}`}
                className="group bg-card border border-border rounded-3xl p-6 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
                      {i.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-foreground truncate group-hover:text-primary transition-colors">{i.name}</h3>
                      <p className="text-[11px] text-muted-foreground font-bold mt-0.5">{TYPE_LABELS[i.type || "other"] || "أخرى"}</p>
                    </div>
                  </div>
                  <span className={cn("flex items-center gap-1 text-[9px] font-black tracking-wide px-2.5 py-1 rounded-lg border shrink-0", status.bg, status.color)}>
                    {status.icon}
                    {status.label}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground font-bold">
                  {i.contact_email && (
                    <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-primary" />{i.contact_email}</span>
                  )}
                  {i.contact_phone && (
                    <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-primary" />{i.contact_phone}</span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-4 text-[11px] font-bold text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      {i.students_count} مشارك
                      {i.target_students_count ? ` / ${i.target_students_count}` : ""}
                    </span>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
