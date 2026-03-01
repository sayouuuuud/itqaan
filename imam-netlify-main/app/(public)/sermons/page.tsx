import { createPublicClient } from "@/lib/supabase/public"
import Link from "next/link" 
export const metadata = { title: "الخطب المنبرية", description: "استمع إلى خطب الجمعة والأعياد والمناسبات الدينية", }

export default async function SermonsPage() {
 const supabase = createPublicClient() 
 const { data: sermons } = await supabase .from("sermons") .select("*") .eq("publish_status", "published") .order("created_at", { ascending: false }) 
  return ( <main className="min-h-screen py-12">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 {/* Header */} <div className="text-center mb-12">
<span className="inline-block bg-primary/10 text-primary px-4 py-1 rounded-full text-sm font-bold mb-4">
 الخطب المنبرية </span>
<h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-serif">
 خطب الجمعة والمناسبات </h1>
<p className="text-text-muted max-w-2xl mx-auto">
 استمع إلى خطب الجمعة والأعياد والمناسبات الدينية في أي وقت </p>
</div>

 {/* Sermons Grid */} {!sermons || sermons.length === 0 ? ( <div className="text-center py-16 bg-card rounded-2xl border border-border">
<span className="material-icons-outlined text-6xl text-text-muted mb-4">
mic_off</span>
<h3 className="text-xl font-bold text-foreground mb-2">
لا توجد خطب بعد</h3>
<p className="text-text-muted">
سيتم إضافة الخطب قريباً</p>
</div>

 ) : ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {sermons.map((sermon) => ( <Link key={sermon.id}
href={`/khutba/${sermon.id}`}
className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all group" >
 {sermon.thumbnail_path ? ( <div className="aspect-video relative overflow-hidden">
<img src={sermon.thumbnail_path || "/placeholder.svg"}
alt = {sermon.title}
className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
 {sermon.audio_file_path && ( <div className="absolute bottom-3 right-3 bg-primary text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
<span className="material-icons-outlined text-sm">
audiotrack</span>

 صوتي </div>

 )} {sermon.youtube_url && ( <div className="absolute bottom-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
<span className="material-icons-outlined text-sm">
smart_display</span>

 فيديو </div>

 )} </div>

 ) : ( <div className="aspect-video bg-primary/10 flex items-center justify-center">
<span className="material-icons-outlined text-6xl text-primary/30">
mic</span>
</div>

 )} <div className="p-5">
<h3 className="font-bold text-lg text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
 {sermon.title} </h3>
<div className="flex items-center gap-4 text-sm text-text-muted">
 <span className="flex items-center gap-1">
<span className="material-icons-outlined text-base">
calendar_today</span>

 {new Date(sermon.created_at).toLocaleDateString("ar-EG")} </span>
<span className="flex items-center gap-1">
 <span className="material-icons-outlined text-base">
visibility</span>

 {sermon.views_count || 0} </span>
</div>

 </div>
</Link>

 ))} </div>

 )} </div>
</main>

 ) }
