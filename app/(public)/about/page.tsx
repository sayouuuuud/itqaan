import type { Metadata } from 'next'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Target, Heart, Eye } from 'lucide-react'

export const metadata: Metadata = {
  title: 'من نحن | حنا لازن',
  description: 'تعرّف على منصة حنا لازن لتعلم التلاوة والتجويد مع قراء متخصصين',
}

const values = [
  { icon: Target, title: 'الإتقان', description: 'نسعى لمساعدة كل طالب على الوصول إلى أعلى مستويات الإتقان في التلاوة' },
  { icon: Heart, title: 'الإخلاص', description: 'نعمل بإخلاص لخدمة كتاب الله وتسهيل تعلمه للجميع' },
  { icon: Eye, title: 'الشفافية', description: 'نقدم تقييمات واضحة وبنّاءة تساعد على التطور المستمر' },
]

const team = [
  { name: 'د. عبدالرحمن السعيد', role: 'مؤسس المنصة', bio: 'حاصل على إجازة في القراءات العشر مع خبرة ١٥ عامًا في تعليم التجويد' },
  { name: 'م. سارة المنصور', role: 'مديرة التطوير', bio: 'مهندسة برمجيات متخصصة في تطبيقات التعليم الإلكتروني' },
  { name: 'الشيخ محمد الأحمد', role: 'مستشار شرعي', bio: 'حافظ للقرآن مع إجازة في رواية حفص عن عاصم وخبرة تعليمية واسعة' },
]

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-secondary border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:py-24 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <BookOpen className="w-4 h-4" />
              من نحن
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight text-balance">
              نُسهّل رحلة إتقان التلاوة
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              حنا لازن هي منصة رقمية متكاملة تربط طلاب القرآن الكريم بقراء متخصصين، لتوفير تجربة تعليمية فريدة تجمع بين التقنية الحديثة والتعليم الأصيل.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-background py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">رسالتنا</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                نؤمن بأن كل مسلم يستحق الوصول إلى تعليم قرآني عالي الجودة. من هنا جاءت فكرة حنا لازن — منصة تُمكّن الطلاب من تسجيل تلاواتهم والحصول على تقييم متخصص من قراء معتمدين.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                لا نكتفي بالتقييم المكتوب فقط، بل نوفر إمكانية حجز جلسات مباشرة مع القراء للحصول على توجيه شخصي ومتابعة مستمرة.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                نسعى لبناء مجتمع متعلّم يتشارك حب القرآن الكريم ويسعى لإتقان تلاوته بأحكام التجويد الصحيحة.
              </p>
            </div>
            <div className="bg-secondary rounded-2xl p-8 border border-border">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold">+</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">تسجيل سهل</p>
                    <p className="text-sm text-muted-foreground">سجّل من المتصفح مباشرة بدون أي تطبيقات إضافية</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold">+</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">تقييم دقيق</p>
                    <p className="text-sm text-muted-foreground">ملاحظات مفصّلة من قراء ذوي خبرة وإجازات معتمدة</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold">+</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">متابعة مستمرة</p>
                    <p className="text-sm text-muted-foreground">تتبّع تقدمك واحجز جلسات للتحسين المستمر</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-secondary py-16 lg:py-24 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">قيمنا</h2>
            <p className="mt-3 text-muted-foreground">المبادئ التي نسير عليها في كل ما نقدمه</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((v) => (
              <Card key={v.title} className="text-center border-border/60">
                <CardContent className="pt-8 pb-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <v.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-background py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">فريقنا</h2>
            <p className="mt-3 text-muted-foreground">نخبة من المتخصصين يعملون لخدمتكم</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {team.map((member) => (
              <Card key={member.name} className="border-border/60">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-primary text-xl font-bold">{member.name[0]}{member.name.split(' ')[1]?.[0]}</span>
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-foreground">{member.name}</h3>
                    <p className="text-sm text-primary font-medium mb-2">{member.role}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{member.bio}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
