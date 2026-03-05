import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Globe, Users, BookOpen, Shield, LogIn, UserPlus, KeyRound,
  LayoutDashboard, Mic, FileText, Calendar, Clock, Bell, User,
  ClipboardList, MessageSquare, Settings, BarChart3
} from 'lucide-react'

type SitemapSection = {
  title: string
  icon: React.ElementType
  color: string
  links: { href: string; label: string; description: string }[]
}

const sections: SitemapSection[] = [
  {
    title: 'الصفحات العامة',
    icon: Globe,
    color: 'bg-primary/10 text-primary',
    links: [
      { href: '/', label: 'الصفحة الرئيسية', description: 'صفحة الهبوط مع نظرة عامة عن المنصة' },
      { href: '/about', label: 'من نحن', description: 'معلومات عن المنصة ورؤيتها ورسالتها' },
      { href: '/contact', label: 'تواصل معنا', description: 'نموذج التواصل والدعم الفني' },
    ],
  },
  {
    title: 'المصادقة',
    icon: Shield,
    color: 'bg-accent/10 text-accent-foreground',
    links: [
      { href: '/login', label: 'تسجيل الدخول', description: 'صفحة تسجيل الدخول بالبريد وكلمة المرور' },
      { href: '/register', label: 'إنشاء حساب', description: 'تسجيل حساب جديد كطالب أو قارئ' },
      { href: '/reset-password', label: 'استعادة كلمة المرور', description: 'إرسال رابط إعادة تعيين كلمة المرور' },
    ],
  },
  {
    title: 'لوحة الطالب',
    icon: Users,
    color: 'bg-success/10 text-success',
    links: [
      { href: '/student', label: 'لوحة التحكم', description: 'نظرة عامة على حالة التلاوات والجلسات' },
      { href: '/student/submit', label: 'تسجيل تلاوة', description: 'تسجيل تلاوة صوتية أو رفع ملف mp3' },
      { href: '/student/recitations', label: 'تلاواتي', description: 'قائمة جميع التلاوات مع الفلاتر' },
      { href: '/student/recitations/101', label: 'تفاصيل التلاوة', description: 'عرض تفاصيل تلاوة محددة مع ملاحظات القارئ' },
      { href: '/student/booking', label: 'حجز جلسة', description: 'حجز جلسة مراجعة مع قارئ متاح' },
      { href: '/student/sessions', label: 'جلساتي', description: 'قائمة الجلسات المحجوزة مع روابط الانضمام' },
      { href: '/student/notifications', label: 'الإشعارات', description: 'جميع الإشعارات والتنبيهات' },
      { href: '/student/profile', label: 'الملف الشخصي', description: 'إدارة بيانات الحساب وكلمة المرور' },
    ],
  },
  {
    title: 'لوحة القارئ',
    icon: BookOpen,
    color: 'bg-primary/10 text-primary',
    links: [
      { href: '/reader', label: 'لوحة التحكم', description: 'نظرة عامة على التلاوات المعلقة والجلسات' },
      { href: '/reader/recitations', label: 'مراجعة التلاوات', description: 'قائمة التلاوات للمراجعة مع البحث والفلاتر' },
      { href: '/reader/recitations/101', label: 'تفاصيل المراجعة', description: 'مشغل صوتي وأدوات التقييم والملاحظات' },
      { href: '/reader/schedule', label: 'إدارة المواعيد', description: 'إضافة وحذف المواعيد المتاحة' },
      { href: '/reader/sessions', label: 'الجلسات', description: 'إدارة الجلسات وإضافة روابط الاجتماع' },
      { href: '/reader/chat', label: 'المحادثات', description: 'التواصل مع الطلاب وإرسال الروابط' },
      { href: '/reader/profile', label: 'الملف الشخصي', description: 'إدارة بيانات الحساب' },
    ],
  },
  {
    title: 'لوحة المدير',
    icon: Shield,
    color: 'bg-destructive/10 text-destructive',
    links: [
      { href: '/admin', label: 'لوحة التحكم', description: 'إحصائيات شاملة وشارتات ومؤشرات أداء' },
      { href: '/admin/users', label: 'إدارة المستخدمين', description: 'إدارة الطلاب والقراء وتغيير الأدوار' },
      { href: '/admin/recitations', label: 'إدارة التلاوات', description: 'قائمة كاملة مع إعادة تعيين وإجراءات جماعية' },
      { href: '/admin/settings', label: 'إعدادات النظام', description: 'إعدادات SMTP والتخزين وسير العمل والأمان' },
      { href: '/admin/reports', label: 'التقارير', description: 'تقارير وإحصائيات وتصدير البيانات' },
    ],
  },
]

export default function SitemapPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-12 lg:py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground text-balance">خريطة الموقع</h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto text-pretty">
            جميع صفحات منصة حنا لازن مرتبة حسب الأقسام والأدوار
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((section) => (
            <Card key={section.title} className="border-border/60">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${section.color}`}>
                    <section.icon className="w-5 h-5" />
                  </div>
                  {section.title}
                  <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    {section.links.length} صفحة
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {section.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="group flex items-start gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0 group-hover:scale-125 transition-transform" />
                      <div>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {link.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{link.description}</p>
                        <p className="text-[10px] text-muted-foreground/60 font-mono mt-1" dir="ltr">{link.href}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-6 p-4 bg-secondary rounded-xl">
            {[
              { label: 'أقسام', count: sections.length },
              { label: 'صفحة', count: sections.reduce((sum, s) => sum + s.links.length, 0) },
              { label: 'أدوار', count: 3 },
            ].map((item) => (
              <div key={item.label} className="text-center px-4">
                <p className="text-2xl font-bold text-primary">{item.count}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
