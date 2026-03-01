import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Home, Search, ChevronLeft, Clock, Eye, Music, BookOpen, History, School } from "lucide-react"
import { SafeHtml } from "@/components/ui/safe-html"
import { BookCoverImage } from "@/components/book-cover-image"
import { AudioPlayer } from "@/components/audio-player"
import { SheikhProfileCard } from "@/components/sheikh-profile-card"
import { NewsletterCard } from "@/components/newsletter-card"
import { LessonInteractions } from "@/components/lessons/lesson-interactions"
import { stripHtml } from "@/lib/utils/strip-html"
import { getLessonOgImage } from "@/lib/utils/og-images"
import { Metadata } from "next"
import { JsonLd } from "@/components/json-ld"
import { generateArticleSchema, generateVideoSchema, generateAudioSchema, generateBreadcrumbSchema, formatDurationToISO } from "@/lib/schema-generator"

interface PageProps {
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params
    const supabase = await createClient()
    const { data: lesson } = await supabase.from("lessons").select("title, description, thumbnail, thumbnail_path").eq("id", id).single()

    if (!lesson) return { title: "الدرس غير موجود" }

    const ogImage = getLessonOgImage(lesson)

    return {
        title: `${lesson.title} | الشيخ السيد مراد سلامة`,
        description: lesson.description ? lesson.description.replace(/<[^>]*>/g, '').slice(0, 160) : undefined,
        openGraph: {
            title: lesson.title,
            description: lesson.description ? lesson.description.replace(/<[^>]*>/g, '').slice(0, 160) : undefined,
            images: [ogImage],
            type: "article",
        },
        twitter: {
            card: "summary_large_image",
            title: lesson.title,
            description: lesson.description ? lesson.description.replace(/<[^>]*>/g, '').slice(0, 160) : undefined,
            images: [ogImage.url],
        },
    }
}

// Helper functions
const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })
}

const getLessonTypeIcon = (type: string) => {
    switch (type) {
        case "fiqh":
            return <BookOpen className="h-5 w-5" />
        case "seerah":
            return <History className="h-5 w-5" />
        default:
            return <School className="h-5 w-5" />
    }
}

const getLessonTypeName = (type: string) => {
    switch (type) {
        case "fiqh":
            return "درس فقه"
        case "seerah":
            return "درس سيرة"
        default:
            return "درس علمي"
    }
}

const getAudioUrl = (lesson: any) => {
    if (lesson.media_url?.startsWith("uploads/")) {
        return lesson.media_url
    }
    return lesson.media_url || lesson.audio_url || lesson.audio_file_path
}

const getThumbnailPath = (lesson: any) => {
    if (lesson.thumbnail_path?.startsWith("uploads/")) {
        return lesson.thumbnail_path
    }
    if (lesson.thumbnail?.startsWith("uploads/")) {
        return lesson.thumbnail
    }
    if (lesson.thumbnail_path?.startsWith("http")) {
        return lesson.thumbnail_path
    }
    if (lesson.thumbnail?.startsWith("http")) {
        return lesson.thumbnail
    }
    return lesson.thumbnail_path || lesson.thumbnail
}

const parseDurationToSeconds = (durationStr: string | null | undefined): number => {
    if (!durationStr) return 0;
    const parts = durationStr.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
}

export default async function DarsDetailPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    // Parallel data fetching
    const [lessonResponse, relatedLessonsResponse] = await Promise.all([
        supabase.from("lessons").select("*").eq("id", id).eq("publish_status", "published").single(),
        supabase.from("lessons").select("id, title, thumbnail_path, created_at, views_count, lesson_type").eq("publish_status", "published").neq("id", id).order("created_at", { ascending: false }).limit(4)
    ])

    const lesson = lessonResponse.data

    if (!lesson) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <div className="text-center max-w-md">
                    <div className="text-8xl font-bold text-primary/20 mb-4">404</div>
                    <h1 className="text-3xl font-bold text-foreground mb-4 font-serif">الدرس غير موجود</h1>
                    <p className="text-muted-foreground mb-8">عذراً، الدرس الذي تبحث عنه غير موجود أو تم حذفه.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/">
                            <button className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg font-medium transition-colors">
                                <Home className="h-4 w-4" />
                                الرئيسية
                            </button>
                        </Link>
                        <Link href="/dars">
                            <button className="flex items-center gap-2 bg-muted hover:bg-accent text-foreground px-6 py-3 rounded-lg font-medium transition-colors border border-border">
                                <Search className="h-4 w-4" />
                                تصفح الدروس
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // Increment views
    await supabase.from("lessons").update({ views_count: (lesson.views_count || 0) + 1 }).eq("id", id)

    const relatedLessons = relatedLessonsResponse.data || []
    const audioUrl = getAudioUrl(lesson)
    const thumbnailPath = getThumbnailPath(lesson)

    const articleSchema = generateArticleSchema({
        title: lesson.title,
        description: lesson.description ? stripHtml(lesson.description) : undefined,
        url: `/dars/${lesson.id}`,
        image: thumbnailPath,
        datePublished: lesson.created_at,
        dateModified: lesson.created_at,
    })

    const isVideo = lesson.youtube_url || (lesson.type === 'video' && audioUrl);

    const mediaSchema = isVideo ? generateVideoSchema({
        title: lesson.title,
        description: lesson.description ? stripHtml(lesson.description) : lesson.title,
        uploadDate: lesson.created_at,
        thumbnailUrl: thumbnailPath ? (thumbnailPath.startsWith('http') ? thumbnailPath : `https://elsayed-mourad.online${thumbnailPath}`) : 'https://elsayed-mourad.online/video-thumbnail.png',
        contentUrl: !lesson.youtube_url && audioUrl ? (audioUrl.startsWith('http') ? audioUrl : `https://elsayed-mourad.online${audioUrl}`) : undefined,
        embedUrl: lesson.youtube_url ? `https://www.youtube.com/embed/${lesson.youtube_url.split("v=")[1]?.split("&")[0] || lesson.youtube_url.split("/").pop()}` : undefined,
        duration: formatDurationToISO(lesson.duration),
    }) : (audioUrl ? generateAudioSchema({
        title: lesson.title,
        description: lesson.description ? stripHtml(lesson.description) : undefined,
        uploadDate: lesson.created_at,
        contentUrl: audioUrl.startsWith('http') ? audioUrl : `https://elsayed-mourad.online${audioUrl}`,
        duration: formatDurationToISO(lesson.duration),
    }) : null);

    const breadcrumbSchema = generateBreadcrumbSchema([
        { name: 'الرئيسية', item: '/' },
        { name: 'الدروس العلمية', item: '/dars' },
        { name: lesson.title, item: `/dars/${lesson.id}` },
    ])

    return (
        <div className="min-h-screen bg-background">
            <JsonLd schema={[articleSchema, breadcrumbSchema, ...(mediaSchema ? [mediaSchema] : [])]} />
            <div className="max-w-6xl mx-auto px-4 py-12">
                <style>{`
          @media print {
            body * { visibility: hidden; }
            #print-content, #print-content * { visibility: visible; }
            #print-content {
              position: absolute; left: 0; top: 0; width: 100%; max-width: none;
            }
            .no-print { display: none !important; }
          }
        `}</style>

                <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-8 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] print:hidden">
                    <Link href="/" className="hover:text-primary dark:hover:text-secondary">الرئيسية</Link>
                    <ChevronLeft className="h-4 w-4 mx-2 text-gray-400" />
                    <Link href="/dars" className="hover:text-primary dark:hover:text-secondary">الدروس العلمية</Link>
                    <ChevronLeft className="h-4 w-4 mx-2 text-gray-400" />
                    <span className="text-primary dark:text-secondary font-medium">{lesson.title}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <article className="lg:col-span-2">

                        {/* Print Content */}
                        <div id="print-content" className="hidden print:block print:p-8 print:max-w-none print:text-black print:bg-white">
                            <div className="print:text-center print:mb-8 print:border-b-2 print:border-gray-300 print:pb-4">
                                <h1 className="print:text-3xl print:font-bold print:mb-4 print:text-gray-900">{lesson.title}</h1>
                                <div className="print:flex print:justify-between print:text-sm print:text-gray-600">
                                    <span>التاريخ: {formatDate(lesson.created_at)}</span>
                                    {lesson.duration && <span>المدة: {lesson.duration} دقيقة</span>}
                                </div>
                            </div>
                            {lesson.description && (
                                <div className="print:text-gray-600 print:mb-4 print:italic">
                                    {lesson.description.replace(/<[^>]*>/g, '')}
                                </div>
                            )}
                            <div className="print:text-gray-800 print:leading-relaxed">
                                <SafeHtml html={lesson.content || lesson.description || ""} className="print:text-base print:leading-8 print:text-gray-900" />
                            </div>
                        </div>

                        {thumbnailPath && (
                            <div className="mb-8 rounded-2xl overflow-hidden shadow-lg">
                                <BookCoverImage
                                    coverImagePath={thumbnailPath}
                                    title={lesson.title}
                                    variant="detail"
                                    showFallback={false}
                                />
                            </div>
                        )}

                        <div className="mb-8">
                            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-serif leading-tight">
                                {lesson.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-4 text-text-muted no-print">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>{formatDate(lesson.created_at)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Eye className="h-4 w-4" />
                                    <span>{lesson.views_count || 0} مشاهدة</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getLessonTypeIcon(lesson.lesson_type)}
                                    <span>{getLessonTypeName(lesson.lesson_type)}</span>
                                </div>
                            </div>
                        </div>

                        {lesson.description && (
                            <div className="mb-6 text-lg text-text-muted">
                                {lesson.description.replace(/<[^>]*>/g, '')}
                            </div>
                        )}

                        {/* Audio Player */}
                        {audioUrl && lesson.type === "audio" && (
                            <div className="mb-8 no-print">
                                <div className="bg-surface rounded-xl p-6 border border-border">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Music className="h-5 w-5 text-primary" />
                                        <h3 className="font-bold text-foreground">استمع إلى الدرس</h3>
                                    </div>
                                    <AudioPlayer
                                        src={audioUrl}
                                        title={lesson.title}
                                        initialDuration={parseDurationToSeconds(lesson.duration)}
                                        audioId={lesson.id}
                                        table="lessons"
                                    />
                                </div>
                            </div>
                        )}

                        {/* YouTube Video */}
                        {(lesson.youtube_url || (lesson.type === 'video' && audioUrl)) && (
                            <div className="mb-8 no-print">
                                <div className="bg-surface rounded-xl p-6 border border-border">
                                    <div className="aspect-video rounded-lg overflow-hidden">
                                        {lesson.youtube_url ? (
                                            <iframe
                                                src={`https://www.youtube.com/embed/${lesson.youtube_url.split("v=")[1]?.split("&")[0] || lesson.youtube_url.split("/").pop()}`}
                                                title={lesson.title}
                                                className="w-full h-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        ) : (
                                            <video controls className="w-full h-full">
                                                <source src={audioUrl} type="video/mp4" />
                                                متصفحك لا يدعم تشغيل الفيديوهات
                                            </video>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Content */}
                        {lesson.content && (
                            <SafeHtml
                                html={lesson.content}
                                className="prose prose-lg max-w-none mb-12 prose-headings:text-foreground prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-4 prose-strong:text-foreground prose-strong:font-bold prose-em:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground prose-li:mb-1 prose-blockquote:text-foreground prose-blockquote:border-primary prose-blockquote:bg-muted prose-blockquote:p-4 prose-blockquote:rounded-lg prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg prose-a:text-primary prose-a:underline hover:prose-a:no-underline dark:prose-headings:text-white dark:prose-p:text-gray-300 dark:prose-strong:text-white dark:prose-li:text-gray-300 dark:prose-blockquote:text-white dark:prose-code:text-blue-400 dark:prose-pre:text-gray-200"
                            />
                        )}

                        {/* Transcript */}
                        {lesson.transcript && (
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-foreground mb-4">نص الدرس</h2>
                                <SafeHtml
                                    html={lesson.transcript}
                                    className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-p:leading-relaxed"
                                />
                            </div>
                        )}

                        {/* Interactions (Share/Download) */}
                        <LessonInteractions
                            audioUrl={audioUrl}
                            title={lesson.title}
                            description={lesson.description}
                            lessonId={lesson.id}
                            table="lessons"
                        />

                        {/* Latest Lessons Mobile (Grid Style) */}
                        {relatedLessons.length > 0 && (
                            <div className="no-print lg:hidden mt-12">
                                <h2 className="text-2xl font-bold text-foreground mb-6">آخر الدروس</h2>
                                <div className="grid md:grid-cols-3 gap-6">
                                    {relatedLessons.map((relatedLesson) => (
                                        <Link key={relatedLesson.id} href={`/dars/${relatedLesson.id}`} className="group">
                                            <div className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary transition-colors">
                                                <BookCoverImage
                                                    coverImagePath={getThumbnailPath(relatedLesson)}
                                                    title={relatedLesson.title}
                                                    variant="card"
                                                    showFallback={false}
                                                />
                                                <div className="p-4">
                                                    <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                                        {relatedLesson.title}
                                                    </h3>
                                                    <p className="text-sm text-text-muted">{formatDate(relatedLesson.created_at)}</p>
                                                    <div className="flex items-center gap-2 text-xs text-text-muted mt-2">
                                                        <Eye className="h-3 w-3" />
                                                        <span>{relatedLesson.views_count || 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </article>

                    {/* Sidebar */}
                    <aside className="space-y-6 print:hidden flex flex-col">
                        <div className="order-2 lg:order-1">
                            <SheikhProfileCard />
                        </div>

                        {/* Sidebar Latest Lessons - Hidden on Mobile, Shown on Desktop */}
                        {relatedLessons.length > 0 && (
                            <div className="hidden lg:block bg-card rounded-xl p-5 border border-border">
                                <h3 className="text-lg font-bold text-foreground mb-4">آخر الدروس</h3>
                                <div className="space-y-4">
                                    {relatedLessons.map((relatedLesson) => (
                                        <Link key={relatedLesson.id} href={`/dars/${relatedLesson.id}`} className="group flex gap-3">
                                            <div className="w-24 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                                <BookCoverImage
                                                    coverImagePath={getThumbnailPath(relatedLesson)}
                                                    title={relatedLesson.title}
                                                    variant="detail"
                                                    showFallback={false}
                                                    className="h-full"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                                    {relatedLesson.title}
                                                </h4>
                                                <p className="text-xs text-text-muted mt-1">{formatDate(relatedLesson.created_at)}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="order-3">
                            <NewsletterCard />
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}
