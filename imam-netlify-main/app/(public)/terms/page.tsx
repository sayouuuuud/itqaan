import Link from "next/link"
import { createPublicClient } from "@/lib/supabase/public"

export default async function TermsPage() {
  const supabase = createPublicClient()
  const { data: terms } = await supabase.from("terms_conditions").select("*").single()

  return (
    <main className="min-h-screen py-12">
<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-text-muted mb-8">
<Link href="/" className="hover:text-primary">
            الرئيسية
          </Link>
<span className="material-icons-outlined text-xs rtl-flip">chevron_left</span>
<span className="text-primary font-medium">شروط الاستخدام</span>
</div>

        <div className="bg-surface rounded-2xl shadow-sm border border-border p-8 lg:p-12">
<h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-8 font-serif">شروط الاستخدام</h1>
<div className="prose prose-lg max-w-none text-text-muted">
            {terms?.content ? (
              <div className="whitespace-pre-line">{terms.content}</div>
            ) : (
              <p>لا توجد شروط استخدام متاحة حالياً.</p>
            )}
          </div>
</div>
      </div>
</main>
  )
}
