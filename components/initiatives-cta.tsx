import Link from "next/link"
import { Building2, ArrowLeft, Users, BookOpen, Award } from "lucide-react"

// قسم CTA مشترك لدعوة الجهات والمؤسسات لتسجيل مبادرة
// يُستخدم في صفحة About والصفحة الرئيسية
export function InitiativesCTA() {
  return (
    <section className="bg-primary py-20 lg:py-28" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* النص */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-black px-4 py-2 rounded-full">
              <Building2 className="w-4 h-4" />
              للمؤسسات والجهات
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight text-balance">
              سجّل مبادرتك وانطلق
              <br />
              <span className="text-white/70">في تعليم القرآن الكريم</span>
            </h2>
            <p className="text-white/75 text-base leading-relaxed max-w-lg">
              هل تمثّل جامعة أو مدرسة أو شركة أو جمعية خيرية؟ سجّل مبادرتك وأدر تقدم طلابك بشكل مستقل عبر لوحة تحكم مخصصة — إحصائيات، روابط دعوة، وتقارير فردية لكل مشارك.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/initiatives/request"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary font-black px-7 py-3.5 rounded-2xl text-sm hover:bg-white/90 transition-colors"
              >
                سجّل مبادرتك الآن
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-black px-7 py-3.5 rounded-2xl text-sm hover:bg-white/10 transition-colors"
              >
                تواصل معنا
              </Link>
            </div>
          </div>

          {/* الأرقام */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
            <FeatureCard
              icon={<Users className="w-5 h-5" />}
              title="إدارة المشاركين"
              desc="تتبّع كل طالب في مبادرتك باستقلالية تامة"
            />
            <FeatureCard
              icon={<BookOpen className="w-5 h-5" />}
              title="نفس تجربة التعليم"
              desc="طلابك يستخدمون المنظومة الكاملة — تلاوة ومراجعة وتصحيح"
            />
            <FeatureCard
              icon={<Award className="w-5 h-5" />}
              title="إحصائيات مفصّلة"
              desc="تقارير مرئية عن التقدم والإتقان ونسب الإنجاز"
            />
          </div>

        </div>
      </div>
    </section>
  )
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 bg-white/10 rounded-2xl p-5">
      <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-black text-white text-sm">{title}</p>
        <p className="text-white/65 text-xs mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}
