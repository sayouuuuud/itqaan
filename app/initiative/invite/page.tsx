"use client"

import useSWR, { mutate } from "swr"
import { useState } from "react"
import { Link2, Copy, Check, RefreshCw, Loader2, Power, QrCode } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function InitiativeInvitePage() {
  const { data, isLoading } = useSWR<{ joinCode: string | null; joinEnabled: boolean }>(
    "/api/initiative/invite",
    fetcher
  )
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

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
        </>
      )}
    </div>
  )
}
