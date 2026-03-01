import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Home, Search, ChevronLeft, CalendarDays, Play, Download, ChevronLeft as ChevronLeftIcon } from "lucide-react"
import { SafeHtml } from "@/components/ui/safe-html"
import { BookCoverImage } from "@/components/book-cover-image"
import { AudioPlayer } from "@/components/audio-player"
import { SheikhProfileCard } from "@/components/sheikh-profile-card"
import { NewsletterCard } from "@/components/newsletter-card"
import { ArticleInteractions } from "@/components/articles/article-interactions"
import { LessonInteractions } from "@/components/lessons/lesson-interactions"
import { stripHtml } from "@/lib/utils/strip-html"
import { getSermonOgImage } from "@/lib/utils/og-images"

import { Metadata } from "next"
import { JsonLd } from "@/components/json-ld"
import { generateArticleSchema, generateAudioSchema, generateBreadcrumbSchema, formatDurationToISO } from "@/lib/schema-generator"

interface PageProps {
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params
    const supabase = await createClient()
    const { data: sermon } = await supabase.from("sermons").select("title, description").eq("id", id).single()

    if (!sermon) return { title: "الخطبة غير موجودة" }

    const ogImage = getSermonOgImage(sermon)

    return {
        title: `${sermon.title} | الشيخ السيد مراد سلامة`,
        description: sermon.description ? sermon.description.replace(/<[^>]*>/g, '').slice(0, 160) : undefined,
        openGraph: {
            title: sermon.title,
            description: sermon.description ? sermon.description.replace(/<[^>]*>/g, '').slice(0, 160) : undefined,
            images: [ogImage],
            type: "article",
        },
        twitter: {
            card: "summary_large_image",
            title: sermon.title,
            description: sermon.description ? sermon.description.replace(/<[^>]*>/g, '').slice(0, 160) : undefined,
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

const getAudioUrl = (sermon: any) => {
    if (sermon.audio_file_path?.startsWith("uploads/")) {
        return `/api/download?key=${encodeURIComponent(sermon.audio_file_path)}`
    }
    return sermon.audio_url || sermon.audio_file_path
}

const getThumbnailPath = (sermon: any) => {
    if (sermon.thumbnail_path?.startsWith("uploads/")) {
        return sermon.thumbnail_path
    }
    if (sermon.thumbnail?.startsWith("uploads/")) {
        return sermon.thumbnail
    }
    if (sermon.thumbnail_path?.startsWith("http")) {
        return sermon.thumbnail_path
    }
    if (sermon.thumbnail?.startsWith("http")) {
        return sermon.thumbnail
    }
    return sermon.thumbnail_path || sermon.thumbnail
}

const parseDurationToSeconds = (durationStr: string | null | undefined): number => {
    if (!durationStr) return 0;
    const parts = durationStr.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
}

export default async function KhutbaDetailPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    // Parallel data fetching
    const [sermonResponse, relatedSermonsResponse] = await Promise.all([
        supabase.from("sermons").select("*").eq("id", id).eq("publish_status", "published").single(),
        supabase.from("sermons").select("id, title, thumbnail_path, created_at, views_count").eq("publish_status", "published").neq("id", id).limit(3).order("created_at", { ascending: false })
    ])

    const sermon = sermonResponse.data

    if (!sermon) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <div className="text-center max-w-md">
                    <div className="text-8xl font-bold text-primary/20 mb-4">404</div>
                    <h1 className="text-3xl font-bold text-foreground mb-4 font-serif">الخطبة غير موجودة</h1>
                    <p className="text-muted-foreground mb-8">عذراً، الخطبة التي تبحث عنها غير موجودة أو تم حذفها.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/">
                            <button className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg font-medium transition-colors">
                                <Home className="h-4 w-4" />
                                الرئيسية
                            </button>
                        </Link>
                        <Link href="/khutba">
                            <button className="flex items-center gap-2 bg-muted hover:bg-accent text-foreground px-6 py-3 rounded-lg font-medium transition-colors border border-border">
                                <Search className="h-4 w-4" />
                                تصفح الخطب
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // Increment views
    await supabase.from("sermons").update({ views_count: (sermon.views_count || 0) + 1 }).eq("id", id)

    const relatedSermons = relatedSermonsResponse.data || []
    const audioUrl = getAudioUrl(sermon)
    const thumbnailPath = getThumbnailPath(sermon)

    const articleSchema = generateArticleSchema({
        title: sermon.title,
        description: sermon.description ? stripHtml(sermon.description) : undefined,
        url: `/khutba/${sermon.id}`,
        image: thumbnailPath,
        datePublished: sermon.created_at,
        dateModified: sermon.created_at, // Assuming no update time available
    })

    const audioSchema = audioUrl ? generateAudioSchema({
        title: sermon.title,
        description: sermon.description ? stripHtml(sermon.description) : undefined,
        uploadDate: sermon.created_at,
        contentUrl: audioUrl.startsWith('http') ? audioUrl : `https://elsayed-mourad.online${audioUrl}`,
        duration: formatDurationToISO(sermon.duration),
    }) : null

    const breadcrumbSchema = generateBreadcrumbSchema([
        { name: 'الرئيسية', item: '/' },
        { name: 'الخطب المنبرية', item: '/khutba' },
        { name: sermon.title, item: `/khutba/${sermon.id}` },
    ])

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-display antialiased transition-colors duration-300">
            <style>{`
          @media print {
            body * { visibility: hidden; }
            #sermon-content, #sermon-content * { visibility: visible; }
            #sermon-content {
              position: absolute; left: 0; top: 0; width: 100%; color: #000000 !important;
            }
            #sermon-content * {
              color: #000000 !important; background: #ffffff !important;
            }
            #sermon-content h1, #sermon-content h2, #sermon-content h3,
            #sermon-content h4, #sermon-content h5, #sermon-content h6 {
              color: #000000 !important;
            }
            #sermon-content p, #sermon-content span, #sermon-content div {
              color: #000000 !important;
            }
            .no-print, header, footer, .lg\\:col-span-4 { display: none !important; }
          }
      `}</style>
            <div className="container mx-auto px-4 lg:px-8 py-10 min-h-screen">
                <JsonLd schema={[articleSchema, breadcrumbSchema, ...(audioSchema ? [audioSchema] : [])]} />

                {/* Breadcrumb */}
                <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-8 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <Link href="/" className="hover:text-primary dark:hover:text-secondary">الرئيسية</Link>
                    <ChevronLeft className="h-4 w-4 mx-2 text-gray-400" />
                    <Link href="/khutba" className="hover:text-primary dark:hover:text-secondary">الخطب المنبرية</Link>
                    <ChevronLeft className="h-4 w-4 mx-2 text-gray-400" />
                    <span className="text-primary dark:text-secondary font-medium">{sermon.title}</span>
                </nav>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Sermon Header Card */}
                        <div className="bg-card-light dark:bg-card-dark rounded-2xl p-8 border border-border-light dark:border-border-dark shadow-sm relative overflow-hidden">
                            <span className="material-icons-outlined absolute -left-10 -top-10 text-9xl text-gray-50 dark:text-gray-800/30 opacity-50 transform rotate-12">menu_book</span>
                            <div className="relative z-10">
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="px-3 py-1 bg-secondary/10 text-secondary text-xs rounded-full font-medium border border-secondary/20">خطبة جمعة</span>
                                    <span className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-full flex items-center gap-1">
                                        <CalendarDays className="h-3 w-3" />
                                        {formatDate(sermon.created_at)}
                                    </span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold font-serif text-foreground mb-6 leading-tight">
                                    {sermon.title}
                                </h1>
                                {sermon.description && (
                                    <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                                        {sermon.description.replace(/<[^>]*>/g, '')}
                                    </p>
                                )}

                                {/* Interactions (PDF, Print, Share) */}
                                <ArticleInteractions articleTitle={sermon.title} contentId="sermon-content" />

                            </div>
                        </div>

                        {/* Audio Player */}
                        {audioUrl && (
                            <AudioPlayer
                                src={audioUrl}
                                title={sermon.title || "خطبة"}
                                initialDuration={parseDurationToSeconds(sermon.duration)}
                                audioId={sermon.id}
                                table="sermons"
                            />
                        )}

                        {/* Content */}
                        {sermon.content && (
                            <article
                                id="sermon-content"
                                className="prose prose-lg dark:prose-invert prose-headings:font-display prose-p:font-body prose-p:text-foreground max-w-none bg-card-light dark:bg-card-dark p-8 md:p-12 rounded-2xl border border-border-light dark:border-border-dark shadow-sm prose-blockquote:border-r-4 prose-blockquote:border-secondary prose-blockquote:bg-secondary/5 prose-blockquote:text-foreground prose-blockquote:font-body prose-blockquote:text-xl prose-blockquote:leading-relaxed prose-blockquote:p-4 prose-blockquote:rounded-l-lg prose-blockquote:not-italic prose-blockquote:my-8 prose-strong:text-foreground prose-strong:font-bold prose-em:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground prose-li:mb-1 prose-a:text-primary prose-a:underline hover:prose-a:no-underline [&_.quran-verse]:text-foreground [&_.quran-verse_p]:text-foreground [&_.quran-verse_footer]:text-muted-foreground overflow-x-hidden break-words [overflow-wrap:anywhere]"
                            >
                                <SafeHtml html={sermon.content} />
                            </article>
                        )}

                        {/* Tags */}
                        {sermon.tags && sermon.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {sermon.tags.map((tag: string, index: number) => (
                                    <a key={index} className="px-4 py-2 bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground rounded-lg text-sm transition-colors border border-border" href="#">
                                        #{tag}
                                    </a>
                                ))}
                            </div>
                        )}

                        {/* Bottom Interactions (Share & Download Audio) */}
                        <LessonInteractions
                            audioUrl={audioUrl}
                            title={sermon.title}
                            description={sermon.description}
                            lessonId={sermon.id}
                            table="sermons"
                        />

                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-8">
                        <SheikhProfileCard />

                        {/* Related Sermons */}
                        {relatedSermons.length > 0 && (
                            <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-border-light dark:border-border-dark shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-lg text-card-foreground flex items-center gap-2">
                                        <span className="w-1 h-6 bg-primary rounded-full"></span>
                                        خطب ذات صلة
                                    </h3>
                                </div>
                                <div className="space-y-4">
                                    {relatedSermons.map((relatedSermon) => (
                                        <Link key={relatedSermon.id} href={`/khutba/${relatedSermon.id}`} className="group block">
                                            <div className="flex gap-4 items-start">
                                                <div className="w-20 h-20 rounded-lg bg-muted shrink-0 overflow-hidden relative">
                                                    <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/40 transition-colors flex items-center justify-center">
                                                        <Play className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                    <BookCoverImage
                                                        coverImagePath={getThumbnailPath(relatedSermon)}
                                                        title={relatedSermon.title}
                                                        variant="card"
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-card-foreground group-hover:text-primary transition-colors text-sm leading-snug mb-1">
                                                        {relatedSermon.title}
                                                    </h4>
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <CalendarDays className="h-3 w-3" />
                                                        {formatDate(relatedSermon.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                <Link href="/khutba" className="block text-center text-primary dark:text-secondary text-sm font-bold mt-6 hover:underline">
                                    عرض المزيد من الخطب
                                </Link>
                            </div>
                        )}

                        <NewsletterCard />
                    </div>
                </div>

                {/* Legacy Print Content (Hidden) */}
                <div className="hidden">
                    <div id="print-content" className="hidden print:block print:p-8 print:max-w-none print:text-black print:bg-white">
                        <div className="print:text-center print:mb-8 print:border-b-2 print:border-gray-300 print:pb-4">
                            <h1 className="print:text-3xl print:font-bold print:mb-4 print:text-gray-900">{sermon.title}</h1>
                            {/* ... (simplified print view) ... */}
                        </div>
                        <div className="print:text-gray-800 print:leading-relaxed">
                            <SafeHtml html={sermon.content || ""} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
