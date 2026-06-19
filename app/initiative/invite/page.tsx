"use client"

import useSWR, { mutate } from "swr"
import { useState } from "react"
import { Link2, Copy, Check, RefreshCw, Loader2, Power, QrCode, Mail, Send, Clock, CheckCircle2 } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface InviteRow {
  id: string
  email: string
  status: string
  created_at: string
  accepted_at: string | null
}

export default function InitiativeInvitePage() {
  const { data, isLoading } = useSWR<{ joinCode: string | null; joinEnabled: boolean }>(
    "/api/initiative/invite",
    fetcher
  )
  const { data: invitesData } = useSWR<{ invites: InviteRow[] }>("/api/initiative/invite/email", fetcher)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const invites = invitesData?.invites || []

  const joinCode = data?.joinCode || null
  const joinEnabled = data?.joinEnabled ?? false
  const inviteUrl = joinCode && typeof window !== "undefined" ? `${window.location.origin}/join/${joinCode}` : ""

  async function patch(body: Record<string, unknown>) {
    setBusy(true)
    try {
      await fetch("/api/initiative/invite", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      await mutate("/api/initiative/invite")
    } finally {
      setBusy(false)
    }
  }

  function copyLink() {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteMsg(null)
    setSending(true)
    try {
      const res = await fetch("/api/initiative/invite/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      const d = await res.json()
      if (!res.ok) {
        setInviteMsg({ type: "err", text: d.error || "تعذّر إرسال الدعوة" })
      } else {
        setInviteMsg({ type: "ok", text: `تم إرسال الدعوة إلى ${d.email}` })
        setInviteEmail("")
        await mutate("/api/initiative/invite/email")
      }
    } catch {
      setInviteMsg({ type: "err", text: "حدث خطأ غير متوقع" })
    } finally {
      setSending(false)
    }
  }

  return (
    <div dir="rtl" className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">رابط الدعوة</h1>
        <p className="text-sm text-muted-foreground mt-1">شارك هذا الرابط مع منسوبي مبادرتك للانضمام مباشرة.</p>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
          <p className="text-sm font-bold">جارٍ التحميل...</p>
        </div>
      ) : (
        <>
          <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Link2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-foreground">رابط الانضمام الخاص بمبادرتك</p>
                <p className="text-xs text-muted-foreground">كل من يفتح الرابط يسجّل كطالب ضمن مبادرتك تلقائياً.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <div className="flex-1 bg-muted/40 border border-border rounded-xl px-4 py-3 font-mono text-sm text-foreground overflow-x-auto" dir="ltr">
                {inviteUrl || "—"}
              </div>
              <button
                onClick={copyLink}
                disabled={!inviteUrl}
                className="inline-flex items-center justify-center gap-2 bg-primary text-white font-bold text-sm px-5 py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "تم النسخ" : "نسخ الرابط"}
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">رمز الدعوة:</span>
              <span className="font-mono font-black text-lg text-primary tracking-widest">{joinCode || "—"}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <button
              onClick={() => patch({ action: "regenerate" })}
              disabled={busy}
              className="bg-card border border-border rounded-2xl p-6 text-right flex items-center gap-4 hover:border-primary/40 transition-colors disabled:opacity-60"
            >
              <div className="w-11 h-11 rounded-xl bg-muted text-foreground flex items-center justify-center shrink-0">
                {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">إنشاء رابط جديد</p>
                <p className="text-xs text-muted-foreground mt-0.5">سيتوقف الرابط القديم عن العمل فوراً.</p>
              </div>
            </button>

            <button
              onClick={() => patch({ joinEnabled: !joinEnabled })}
              disabled={busy}
              className="bg-card border border-border rounded-2xl p-6 text-right flex items-center gap-4 hover:border-primary/40 transition-colors disabled:opacity-60"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${joinEnabled ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                <Power className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">{joinEnabled ? "الانضمام مفعّل" : "الانضمام موقوف"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{joinEnabled ? "اضغط لإيقاف استقبال طلبات جديدة." : "اضغط لإعادة تفعيل الرابط."}</p>
              </div>
            </button>
          </div>

          <div className="bg-muted/30 border border-dashed border-border rounded-2xl p-6 flex items-start gap-3">
            <QrCode className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
              يمكنك مشاركة هذا الرابط عبر الرسائل أو وسائل التواصل. عند انضمام الطلاب ستظهر بياناتهم في صفحة المشاركين تلقائياً.
            </p>
          </div>

          {/* دعوة عبر البريد الإلكتروني */}
          <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-foreground">دعوة طالب عبر البريد الإلكتروني</p>
                <p className="text-xs text-muted-foreground">يصل الطالب رابط تسجيل خاص، وعند إنشائه حسابه يُربط تلقائياً بمبادرتك.</p>
              </div>
            </div>

            <form onSubmit={sendInvite} className="flex flex-col sm:flex-row items-stretch gap-3">
              <div className="relative flex-1">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="student@example.com"
                  dir="ltr"
                  className="w-full pr-9 pl-4 py-3 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center justify-center gap-2 bg-primary text-white font-bold text-sm px-5 py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? "جارٍ الإرسال..." : "إرسال الدعوة"}
              </button>
            </form>

            {inviteMsg && (
              <div
                className={`text-sm font-bold rounded-xl px-4 py-3 ${
                  inviteMsg.type === "ok"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {inviteMsg.text}
              </div>
            )}

            {invites.length > 0 && (
              <div className="border-t border-border pt-5 space-y-2">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-2">الدعوات المُرسلة</p>
                {invites.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between gap-3 bg-muted/30 rounded-xl px-4 py-2.5">
                    <span className="text-sm text-foreground truncate" dir="ltr">{inv.email}</span>
                    {inv.status === "accepted" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> انضم
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full shrink-0">
                        <Clock className="w-3 h-3" /> بانتظار التسجيل
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
