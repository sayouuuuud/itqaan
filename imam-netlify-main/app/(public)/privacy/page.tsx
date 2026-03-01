import Link from "next/link"
import { createPublicClient } from "@/lib/supabase/public"

export default async function PrivacyPage() {
  const supabase = createPublicClient()
  const { data: privacy } = await supabase.from("privacy_policy").select("*").single()

  return (
    <main className="min-h-screen py-12">
<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-text-muted mb-8">
<Link href="/" className="hover:text-primary">
            الرئيسية
          </Link>
<span className="material-icons-outlined text-xs rtl-flip">chevron_left</span>
<span className="text-primary font-medium">سياسة الخصوصية</span>
</div>

        <div className="bg-surface rounded-2xl shadow-sm border border-border p-8 lg:p-12">
<h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-8 font-serif">سياسة الخصوصية</h1>
<div className="prose prose-lg max-w-none text-text-muted">
            {privacy?.content ? (
              <div className="whitespace-pre-line">{privacy.content}</div>
            ) : (
              <p>لا توجد سياسة خصوصية متاحة حالياً.</p>
            )}
          </div>
</div>
      </div>
</main>
  )
}
