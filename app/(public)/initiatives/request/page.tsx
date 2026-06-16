'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Building2, CheckCircle, Send, GraduationCap, Landmark, UtensilsCrossed, Coffee, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

const TYPES = [
  { value: 'university', label: 'جامعة', icon: GraduationCap },
  { value: 'ministry', label: 'وزارة / جهة حكومية', icon: Landmark },
  { value: 'restaurant', label: 'مطعم', icon: UtensilsCrossed },
  { value: 'cafe', label: 'مقهى', icon: Coffee },
  { value: 'other', label: 'أخرى', icon: Sparkles },
]

export default function InitiativeRequestPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState('university')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const payload = {
      name: formData.get('name'),
      type,
      description: formData.get('description'),
      contactName: formData.get('contactName'),
      contactEmail: formData.get('contactEmail'),
      contactPhone: formData.get('contactPhone'),
      targetStudentsCount: formData.get('targetStudentsCount'),
    }

    try {
      const res = await fetch('/api/initiatives/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        setSubmitted(true)
      } else {
        toast.error(data.error || 'حدث خطأ، يرجى المحاولة مرة أخرى')
      }
    } catch {
      toast.error('تعذّر الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <main dir="rtl" className="min-h-screen bg-background flex items-center justify-center px-4 py-24">
        <Card className="max-w-lg w-full text-center rounded-3xl border-border shadow-xl">
          <CardContent className="pt-12 pb-10 px-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3 text-balance">تم استلام طلبك بنجاح</h1>
            <p className="text-muted-foreground leading-relaxed mb-8 text-pretty">
              شكراً لاهتمامكم بالانضمام كمبادرة في منصة إتقان. ستقوم الإدارة بمراجعة طلبكم والتواصل معكم عبر البريد الإلكتروني المسجَّل.
            </p>
            <Button asChild className="rounded-xl">
              <Link href="/">العودة للصفحة الرئيسية</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main dir="rtl" className="min-h-screen bg-background px-4 py-16 md:py-24">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 text-balance">انضم كمبادرة إلى منصة إتقان</h1>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed text-pretty">
            خصِّص تجربة تعليمية لتحسين التلاوة لمنسوبي جهتكم (جامعة، وزارة، مطعم، مقهى أو غيرها). قدِّم طلبكم وسنتواصل معكم بعد المراجعة.
          </p>
        </div>

        <Card className="rounded-3xl border-border shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">بيانات المبادرة</CardTitle>
            <CardDescription>جميع الحقول المعلَّمة بـ * مطلوبة</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">اسم الجهة / المبادرة *</Label>
                <Input id="name" name="name" required placeholder="مثال: جامعة الملك سعود" className="rounded-xl" />
              </div>

              <div className="flex flex-col gap-3">
                <Label>نوع الجهة *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {TYPES.map((opt) => {
                    const Icon = opt.icon
                    const active = type === opt.value
                    return (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setType(opt.value)}
                        className={`flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                          active
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/40'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{opt.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="contactName">اسم مسؤول التواصل *</Label>
                  <Input id="contactName" name="contactName" required placeholder="الاسم الكامل" className="rounded-xl" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="contactEmail">البريد الإلكتروني *</Label>
                  <Input id="contactEmail" name="contactEmail" type="email" required dir="ltr" placeholder="name@example.com" className="rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="contactPhone">رقم الجوال</Label>
                  <Input id="contactPhone" name="contactPhone" type="tel" dir="ltr" placeholder="+966 5x xxx xxxx" className="rounded-xl" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="targetStudentsCount">العدد المتوقّع للمشاركين</Label>
                  <Input id="targetStudentsCount" name="targetStudentsCount" type="number" min={0} placeholder="مثال: 200" className="rounded-xl" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="description">نبذة عن المبادرة وأهدافها</Label>
                <Textarea id="description" name="description" rows={4} placeholder="اكتب وصفاً موجزاً عن المبادرة..." className="rounded-xl resize-none" />
              </div>

              <Button type="submit" disabled={loading} className="rounded-xl h-12 text-base font-bold gap-2">
                {loading ? (
                  <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    إرسال الطلب
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
