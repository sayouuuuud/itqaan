"use client"

import type React from "react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function NewsletterSection() {
  const [whatsapp, setWhatsapp] = useState("")
  const [telegram, setTelegram] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!whatsapp && !telegram) {
      setMessage("يرجى إدخال رقم الواتساب أو معرف التليجرام (أحدهما على الأقل)")
      setStatus("error")
      return
    }
    setStatus("loading")
    setMessage("")
    try {
      const supabase = createClient()
      const { error } = await supabase.from("subscribers").insert({
        whatsapp_number: whatsapp.trim() || null,
        telegram_username: telegram.trim() || null,
        subscribed_at: new Date().toISOString(),
        active: true,
      })
      if (error) {
        if (error.code === "23505") {
          setMessage("هذا الرقم أو المعرف مسجل بالفعل")
        } else {
          console.error("[v0] Subscription error:", error)
          setMessage("حدث خطأ، يرجى المحاولة مرة أخرى")
        }
        setStatus("error")
        return
      }
      setMessage("تم الاشتراك بنجاح! سيتم إضافتك للجروب قريباً")
      setStatus("success")
      setWhatsapp("")
      setTelegram("")
    } catch (err) {
      console.error("[v0] Subscription catch error:", err)
      setMessage("حدث خطأ، يرجى المحاولة مرة أخرى")
      setStatus("error")
    }
  } 
  return ( <section className="py-16 bg-primary relative overflow-hidden">

      {/* Background Pattern */} <div className="absolute inset-0 opacity-10 pointer-events-none">
<svg width="100%" height="100%">
 <pattern id="pattern-circles" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
<circle cx="20" cy="20" r="2" fill="currentColor" className="text-white" />
 </pattern>
<rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-circles)" />
 </svg>
</div>

 <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
<div className="inline-flex items-center gap-2 bg-primary/20 dark:bg-primary/30 px-3 py-1 rounded-full text-xs font-medium mb-4 backdrop-blur-sm text-primary-foreground">
  <span className="material-icons-outlined text-sm">
    group</span>
  <span>
    انضم للمجموعة</span>
</div>

 <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white font-serif">
ابق على اطلاع بكل جديد</h2>
<p className="text-green-100 dark:text-green-300 mb-8 max-w-xl mx-auto">
 سجل بياناتك لتتم إضافتك لمجموعة الواتساب أو التليجرام وتصلك الدروس والمقالات الجديدة. </p>
<form onSubmit={handleSubmit}
className="space-y-4 max-w-md mx-auto">
 <div className="flex flex-col gap-3">
<p className="text-white/80 text-sm mb-2">
أدخل رقم الواتساب أو معرف التليجرام (أحدهما فقط كافٍ)</p>
<div className="relative">
 <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60">
<span className="material-icons-outlined text-lg">
phone</span>
</span>

 <input type="tel" value={whatsapp}
onChange = {(e) =>
 setWhatsapp(e.target.value)}
placeholder = "رقم الواتساب (مثال: 01012345678)" disabled={status === "loading"}
          className="w-full bg-background/80 border-border text-foreground placeholder-muted-foreground px-4 py-3 pr-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary backdrop-blur-sm disabled:opacity-50" dir="ltr" /> </div>
<div className="flex items-center gap-2 text-muted-foreground text-sm">
  <span className="flex-1 h-px bg-border">
  </span>
  <span>
    أو</span>
  <span className="flex-1 h-px bg-border">
  </span>
</div>

 <div className="relative">
<span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60">
 <span className="material-icons-outlined text-lg">
send</span>
</span>

 <input type="text" value={telegram}
onChange = {(e) =>
 setTelegram(e.target.value)}
placeholder = "معرف التليجرام (مثال: @username)" disabled={status === "loading"}
className="w-full bg-background/80 border-border text-foreground placeholder-muted-foreground px-4 py-3 pr-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary backdrop-blur-sm disabled:opacity-50" dir="ltr" /> </div>
</div>

 <button type="submit" disabled={status === "loading"}
className="w-full bg-secondary hover:bg-secondary-hover text-primary font-bold px-6 py-3 rounded-lg transition-colors disabled:opacity-50" >
 {status === "loading" ? "جاري الاشتراك..." : "اشترك الآن"} </button>
</form>

 {message && ( <p className={`text-sm mt-4 ${status === "success" ? "text-green-200" : "text-red-200"}`}>
{message}</p>

 )} <p className="text-xs text-green-200 mt-4 opacity-80">
نحترم خصوصيتك. لن نشارك بياناتك مع أي طرف ثالث.</p>
</div>

 </section>

 ) }
