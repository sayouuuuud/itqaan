import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Home, Search, ChevronLeft, Calendar, Clock, Eye, Play } from "lucide-react"
import { SafeHtml } from "@/components/ui/safe-html"
import { SheikhProfileCard } from "@/components/sheikh-profile-card"
import { NewsletterCard } from "@/components/newsletter-card"
import { VideoInteractions } from "@/components/videos/video-interactions"
import { stripHtml } from "@/lib/utils/strip-html"
import { getVideoOgImage } from "@/lib/utils/og-images"
import { Metadata } from "next"
import { JsonLd } from "@/components/json-ld"
import { generateVideoSchema, generateBreadcrumbSchema, formatDurationToISO } from "@/lib/schema-generator"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: video } = await supabase.from("media").select("title, description, thumbnail, source, url").eq("id", id).single()

  if (!video) return { title: "الفيديو غير موجود" }

  const ogImage = getVideoOgImage(video)

  return {
    title: `${video.title} | الشيخ السيد مراد سلامة`,
    description: video.description ? stripHtml(video.description).slice(0, 160) : undefined,
    openGraph: {
      title: video.title,
      description: video.description ? stripHtml(video.description).slice(0, 160) : undefined,
      images: [ogImage],
      type: "video.other",
    },
    twitter: {
      card: "summary_large_image",
      title: video.title,
      description: video.description ? stripHtml(video.description).slice(0, 160) : undefined,
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

const formatViews = (views: number): string => {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`
  }
  return views.toString()
}

const getYouTubeVideoId = (url: string | null): string | null => {
  if (!url) return null
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^"&?/\s]{11})/
  )
  return match ? match[1] : null
}

const getThumbnailUrl = (video: any) => {
  if (video.thumbnail?.startsWith("uploads/")) {
    return `/api/download?key=${encodeURIComponent(video.thumbnail)}`
  }
  if (video.source === "youtube" && video.url) {
    const videoId = getYouTubeVideoId(video.url)
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "/video-thumbnail.png"
  }
  return video.thumbnail || "/video-thumbnail.png"
}

export default async function VideoDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Parallel data fetching
  const [videoResponse, relatedVideosResponse] = await Promise.all([
    supabase.from("media").select("*").eq("id", id).eq("publish_status", "published").single(),
    supabase.from("media").select("id, title, thumbnail, created_at, views_count, duration").eq("publish_status", "published").neq("id", id).limit(2).order("created_at", { ascending: false })
  ])

  const video = videoResponse.data

  if (!video) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <div className="text-8xl font-bold text-primary/20 mb-4">404</div>
          <h1 className="text-3xl font-bold text-foreground mb-4 font-serif">الفيديو غير موجود</h1>
          <p className="text-muted-foreground mb-8">عذراً، الفيديو الذي تبحث عنه غير موجود أو تم حذفه.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <button className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg font-medium transition-colors">
                <Home className="h-4 w-4" />
                الرئيسية
              </button>
            </Link>
            <Link href="/videos">
              <button className="flex items-center gap-2 bg-muted hover:bg-accent text-foreground px-6 py-3 rounded-lg font-medium transition-colors border border-border">
                <Search className="h-4 w-4" />
                تصفح المرئيات
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Increment views
  await supabase.from("media").update({ views_count: (video.views_count || 0) + 1 }).eq("id", id)

  // Fetch category name
  let categoryName = null
  if (video.category_id) {
    const { data: category } = await supabase.from("categories").select("name").eq("id", video.category_id).single()
    categoryName = category?.name || null
  }

  const relatedVideos = relatedVideosResponse.data || []
  const thumbnailUrl = getThumbnailUrl(video)
  const videoId = video.source === "youtube" ? getYouTubeVideoId(video.url) : null

  const videoSchema = generateVideoSchema({
    title: video.title,
    description: video.description ? stripHtml(video.description) : video.title,
    uploadDate: video.created_at,
    thumbnailUrl: thumbnailUrl.startsWith('http') ? thumbnailUrl : `https://elsayed-mourad.online${thumbnailUrl}`,
    contentUrl: video.source !== "youtube" && video.url ? (video.url.startsWith('http') ? video.url : `https://elsayed-mourad.online${video.url}`) : undefined,
    embedUrl: video.source === "youtube" && videoId ? `https://www.youtube.com/embed/${videoId}` : undefined,
    duration: formatDurationToISO(video.duration),
  })

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'الرئيسية', item: '/' },
    { name: 'المرئيات', item: '/videos' },
    { name: video.title, item: `/videos/${video.id}` },
  ])

  return (
    <div className="min-h-screen bg-background">
      <JsonLd schema={[videoSchema, breadcrumbSchema]} />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-8 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <Link href="/" className="hover:text-primary dark:hover:text-secondary">الرئيسية</Link>
          <ChevronLeft className="h-4 w-4 mx-2 text-gray-400" />
          <Link href="/videos" className="hover:text-primary dark:hover:text-secondary">المرئيات</Link>
          <ChevronLeft className="h-4 w-4 mx-2 text-gray-400" />
          <span className="text-primary dark:text-secondary font-medium">{video.title}</span>
        </nav>

        {/* Video Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Main Video */}
          <div className="lg:col-span-2">
            <div className="bg-surface rounded-2xl overflow-hidden shadow-lg mb-6">
              {video.source === "youtube" && videoId ? (
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={video.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : video.url ? (
                <div className="aspect-video">
                  <video
                    controls
                    className="w-full h-full"
                    poster={thumbnailUrl}
                  >
                    <source src={video.url} type="video/mp4" />
                    <source src={video.url} type="video/webm" />
                    متصفحك لا يدعم تشغيل الفيديوهات
                  </video>
                </div>
              ) : (
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <Play className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">فيديو غير متوفر</p>
                  </div>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  {video.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(video.created_at)}</span>
                  </div>
                  {video.duration && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{video.duration}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>{formatViews(video.views_count || 0)} مشاهدة</span>
                  </div>
                  {categoryName && (
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                      {categoryName}
                    </span>
                  )}
                </div>

                <VideoInteractions title={video.title} />
              </div>

              {video.description && (
                <div className="bg-surface rounded-xl p-6 border border-border">
                  <h3 className="font-bold text-foreground mb-4 text-lg">
                    وصف الفيديو
                  </h3>
                  <div className="prose prose-lg max-w-none dark:prose-invert">
                    <SafeHtml html={video.description} />
                  </div>
                </div>
              )}

              {/* Share Section (legacy placeholder - now handled by VideoInteractions but kept structure if needed) */}
            </div>
          </div>

          {/* Sidebar - Related Videos + cards */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <SheikhProfileCard />
              <h3 className="text-xl font-bold text-foreground mb-6">
                فيديوهات ذات صلة
              </h3>

              {relatedVideos.length > 0 ? (
                <div className="space-y-4">
                  {relatedVideos.map((relatedVideo) => (
                    <Link
                      key={relatedVideo.id}
                      href={`/videos/${relatedVideo.id}`}
                      className="group block"
                    >
                      <div className="flex bg-surface rounded-xl overflow-hidden border border-border hover:border-primary hover:bg-surface-hover transition-colors h-24">
                        <div className="w-36 relative shrink-0 overflow-hidden">
                          <img
                            src={getThumbnailUrl(relatedVideo)}
                            alt={relatedVideo.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                              <Play className="h-4 w-4 text-white fill-white" />
                            </div>
                          </div>
                          {relatedVideo.duration && (
                            <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded">
                              {relatedVideo.duration}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 p-3 flex flex-col justify-between relative">
                          <h4 className="font-bold text-sm text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                            {relatedVideo.title}
                          </h4>
                          <div className="flex items-center justify-between text-[11px] text-text-muted mt-auto">
                            <span className="flex items-center gap-1">
                              {formatDate(relatedVideo.created_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {formatViews(relatedVideo.views_count || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-text-muted">
                  <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد فيديوهات ذات صلة</p>
                </div>
              )}
              <NewsletterCard />

              <div className="mt-8 text-center">
                <Link
                  href="/videos"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary-hover font-medium transition-colors"
                >
                  <span>عرض جميع الفيديوهات</span>
                  <span className="material-icons-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}