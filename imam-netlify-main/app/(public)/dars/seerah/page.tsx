import Link from "next/link"
import { createPublicClient } from "@/lib/supabase/public"
import { ChevronLeft, History, Play, Headphones, Calendar, Eye } from "lucide-react"

export const metadata = {
  title: "دروس السيرة النبوية | الشيخ السيد مراد",
  description: "أرشيف دروس السيرة النبوية للشيخ السيد مراد",
}

export default async function SeerahLessonsPage() {
  const supabase = createPublicClient()
  // Fetch seerah lessons by lesson_type
  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("publish_status", "published")
    .eq("lesson_type", "seerah")
    .order("created_at", { ascending: false })
    .limit(8)
  return (<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    {/* Breadcrumb */} <nav className="flex items-center text-sm text-text-muted mb-8">
      <Link href="/" className="hover:text-primary">
        الرئيسية </Link>
      <ChevronLeft className="h-4 w-4 mx-2" />
      <Link href="/dars" className="hover:text-primary">
        الدروس </Link>
      <ChevronLeft className="h-4 w-4 mx-2" />
      <span className="text-primary font-medium">
        دروس السيرة</span>
    </nav>

    {/* Header */} <div className="text-center mb-16 relative">
      <div className="w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600 mx-auto mb-4">
        <History className="h-8 w-8" />
      </div>
      <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-6 font-serif">
        دروس السيرة النبوية </h1>
      <p className="text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
        وقفات تربوية مع أحداث السيرة النبوية العطرة، واستخلاص الدروس والعبر منها. </p>
      <div className="flex items-center justify-center gap-2 text-sm font-bold bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg mt-6 w-fit mx-auto">
        <Calendar className="h-4 w-4" />
        كل يوم أربعاء </div>
    </div>

    {/* Lessons Grid */} {!lessons || lessons.length === 0 ? (<div className="text-center py-16 text-text-muted">
      <History className="h-16 w-16 mx-auto mb-4 opacity-50" />
      <p className="text-lg">
        لا توجد دروس سيرة منشورة حالياً</p>
      <Link href="/dars" className="text-primary hover:underline mt-4 inline-block">
        العودة لجميع الدروس </Link>
    </div>

    ) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {lessons.map((lesson) => (<Link key={lesson.id}
        href={`/dars/${lesson.id}`}
        className="group bg-surface rounded-xl shadow-sm hover:shadow-lg border border-border transition-all duration-300 overflow-hidden" >
        {lesson.thumbnail_path && (<div className="aspect-video overflow-hidden">
          <img src={lesson.thumbnail_path || "/placeholder.svg"}
            alt={lesson.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>

        )} <div className="p-6">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4 bg-yellow-50 text-yellow-600">
            {lesson.type === "video" ? <Play className="h-5 w-5" />
              : <Headphones className="h-5 w-5" />
            } </div>
          <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
            {lesson.title} </h3>
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Calendar className="h-4 w-4" />
              {new Date(lesson.created_at).toLocaleDateString("ar-EG")} </div>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Eye className="h-4 w-4" />
              {lesson.views_count || 0} </div>
          </div>

        </div>
      </Link>

      ))} </div>

    )} </main>

  )
}
