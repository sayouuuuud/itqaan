"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Building2, Clock, CheckCircle, XCircle, PauseCircle, Search,
  Users, Mail, Phone, ChevronLeft, AlertCircle, Plus, X, Loader2,
  UserCheck,
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

const TYPE_OPTIONS = [
  { value: "university", label: "جامعة" },
  { value: "ministry", label: "وزارة / جهة حكومية" },
  { value: "school", label: "مدرسة" },
  { value: "charity", label: "جمعية خيرية" },
  { value: "company", label: "شركة" },
  { value: "restaurant", label: "مطعم" },
  { value: "cafe", label: "مقهى" },
  { value: "other", label: "أخرى" },
]

export default function AdminInitiativesPage() {
  const router = useRouter()
  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | Status>("all")
  const [search, setSearch] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [form, setForm] = useState({
    name: "", type: "", description: "",
    contact_name: "", contact_email: "", contact_phone: "", target_students_count: "",
  })
  // مشرف المبادرة — اختيار من مشرفي المبادرات الموجودين فقط (اختياري)
  const [supervisors, setSupervisors] = useState<{ id: string; name: string; email: string; initiative_id: string | null; initiative_name: string | null }[]>([])
  const [existingUserId, setExistingUserId] = useState("")

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

  useEffect(() => {
    load()
  }, [])

  function openCreate() {
    setShowCreate(true)
    setExistingUserId("")
    setCreateError("")
    // جلب حسابات مشرفي المبادرات فقط لربط أحدهم بالمبادرة
    fetch("/api/admin/users?role=initiative_admin&limit=200")
      .then(r => r.json())
      .then(d => setSupervisors(d.users || []))
      .catch(() => {})
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setCreateError("اسم المبادرة مطلوب"); return }

    setCreating(true)
    setCreateError("")
    try {
      const res = await fetch("/api/admin/initiatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          target_students_count: form.target_students_count ? Number(form.target_students_count) : null,
          adminMode: existingUserId ? "existing" : "none",
          existingUserId: existingUserId || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "فشل إنشاء المبادرة")
      router.push(`/admin/initiatives/${data.id}`)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "فشل إنشاء المبادرة")
      setCreating(false)
    }
  }

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
        <div className="flex items-center gap-3">
          {counts.pending > 0 && (
            <div className="flex items-center gap-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest">
              <AlertCircle className="w-3.5 h-3.5" />
              {counts.pending} طلب بانتظار المراجعة
            </div>
          )}
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-2xl text-sm font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            إنشاء مبادرة جديدة
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => !creating && setShowCreate(false)}>
          <div
            className="bg-card border border-border rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card rounded-t-3xl">
              <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                إنشاء مبادرة جديدة
              </h2>
              <button onClick={() => !creating && setShowCreate(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <Field label="اسم المبادرة *">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="مثال: مبادرة جامعة الملك سعود"
                  className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10"
                  autoFocus
                />
              </Field>
              <Field label="نوع الجهة">
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10"
                >
                  <option value="">اختر النوع (اختياري)</option>
                  {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="وصف المبادرة">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="نبذة مختصرة عن المبادرة (اختياري)"
                  className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10 resize-none"
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="اسم المسؤول">
                  <input
                    value={form.contact_name}
                    onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10"
                  />
                </Field>
                <Field label="عدد الطلاب المستهدف">
                  <input
                    type="number"
                    min={0}
                    value={form.target_students_count}
                    onChange={(e) => setForm({ ...form, target_students_count: e.target.value })}
                    className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10"
                  />
                </Field>
                <Field label="البريد الإلكتروني">
                  <input
                    type="email"
                    dir="ltr"
                    value={form.contact_email}
                    onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10 text-right"
                  />
                </Field>
                <Field label="رقم الهاتف">
                  <input
                    dir="ltr"
                    value={form.contact_phone}
                    onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10 text-right"
                  />
                </Field>
              </div>

              {/* قسم تعيين مشرف المبادرة */}
              <div className="border border-border rounded-2xl overflow-hidden">
                <div className="bg-muted/30 px-4 py-3 border-b border-border">
                  <p className="text-[11px] font-black text-muted-foreground tracking-wide flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-primary" />
                    مشرف المبادرة (اختياري)
                  </p>
                </div>
                <div className="p-4 space-y-2">
                  <select
                    value={existingUserId}
                    onChange={e => setExistingUserId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/10"
                  >
                    <option value="">بدون مشرف الآن</option>
                    {supervisors.map(u => (
                      <option key={u.id} value={u.id} disabled={!!u.initiative_id}>
                        {u.name} — {u.email}{u.initiative_id ? ` (مرتبط بـ ${u.initiative_name || "مبادرة أخرى"})` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground font-bold leading-relaxed">
                    تظهر هنا حسابات مشرفي المبادرات فقط. لإنشاء حساب مشرف جديد توجّه إلى صفحة المستخدمين أولاً، ثم اربطه بالمبادرة من هنا.
                  </p>
                </div>
              </div>

              {createError && (
                <div className="flex items-center gap-2 bg-destructive/10 text-destructive border border-destructive/20 px-4 py-2.5 rounded-xl text-sm font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {createError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl text-sm font-black text-muted-foreground hover:text-foreground transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  إنشاء واستكمال البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-black text-muted-foreground tracking-wide">{label}</label>
      {children}
    </div>
  )
}
