import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"
import { FileText, Play, ArrowLeft, Clock, Mic, BookOpen, Video } from "lucide-react"
import { stripHtml } from "@/lib/utils/strip-html"

export const revalidate = 60

interface ContentItem {
  id: string
  title: string
  description?: string | null
  excerpt?: string | null
  content_type: "article" | "sermon" | "lesson" | "book" | "video"
  created_at: string
  thumbnail?: string | null
  read_time?: number | null
  duration?: string | null
  author?: string | null
}

interface LatestContentProps {
  content: ContentItem[]
}

const getYouTubeThumbnail = (url: string | undefined | null): string | null => {
  if (!url) return null
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^"&?/\s]{11})/
  )
  return match ? `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` : null
}

const getThumbnailUrl = (item: ContentItem) => {
  const thumbnail = item.thumbnail

  if (thumbnail?.startsWith("uploads/")) {
    return `/api/download?key=${encodeURIComponent(thumbnail)}`
  }

  if (item.content_type === "video" && !thumbnail && (item as any).url) {
    return getYouTubeThumbnail((item as any).url)
  }

  return thumbnail || null
}

export function LatestContent({ content }: LatestContentProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="bg-emerald-100 text-emerald-700 p-2.5 rounded-xl shadow-sm">
            <FileText className="h-5 w-5" />
          </span>
          <h3 className="text-2xl font-bold font-serif text-foreground">أحدث المحتويات</h3>
        </div>
        <Link href="/articles" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
          عرض المكتبة
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
      <div className="space-y-3">
        {content.length === 0 ? (
          <div className="text-center py-12 bg-card dark:bg-card/80 rounded-2xl border-2 border-border dark:border-border/50">
            <FileText className="h-12 w-12 mx-auto text-text-muted mb-4" />
            <p className="text-text-muted">لا توجد محتويات حالياً</p>
          </div>
        ) : (
          content.map((item) => {
            const getItemUrl = () => {
              switch (item.content_type) {
                case "article":
                  return `/articles/${item.id}`
                case "sermon":
                  return `/khutba/${item.id}`
                case "lesson":
                  return `/dars/${item.id}`
                case "book":
                  return `/books/${item.id}`
                case "video":
                  return `/videos/${item.id}`
                default:
                  return "#"
              }
            }

            const getItemIcon = () => {
              switch (item.content_type) {
                case "article":
                  return <FileText className="h-6 w-6 text-primary" />
                case "sermon":
                  return <Mic className="h-6 w-6 text-secondary" />
                case "lesson":
                  return <Play className="h-6 w-6 text-primary" />
                case "book":
                  return <BookOpen className="h-6 w-6 text-emerald-600" />
                case "video":
                  return <Video className="h-6 w-6 text-red-500" />
                default:
                  return <FileText className="h-6 w-6 text-primary" />
              }
            }

            const getItemTypeLabel = () => {
              switch (item.content_type) {
                case "article":
                  return "مقالة"
                case "sermon":
                  return "خطبة"
                case "lesson":
                  return "درس"
                case "book":
                  return "كتاب"
                case "video":
                  return "مرئي"
                default:
                  return ""
              }
            }

            const getItemTypeColor = () => {
              switch (item.content_type) {
                case "article":
                  return "bg-primary/10 dark:bg-primary/20 text-primary"
                case "sermon":
                  return "bg-secondary/10 dark:bg-secondary/20 text-secondary"
                case "lesson":
                  return "bg-primary/10 dark:bg-primary/20 text-primary"
                case "book":
                  return "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600"
                case "video":
                  return "bg-red-500/10 dark:bg-red-500/20 text-red-500"
                default:
                  return "bg-primary/10 dark:bg-primary/20 text-primary"
              }
            }

            const description = item.excerpt || item.description
            const cleanDescription = description ? stripHtml(description) : ""

            const thumbnailUrl = getThumbnailUrl(item)
            const showThumbnail = thumbnailUrl

            return (
              <Link
                key={`${item.content_type}-${item.id}`}
                href={getItemUrl()}
                className="block bg-card dark:bg-card/80 hover:bg-muted dark:hover:bg-white/5 border-2 border-border dark:border-border/50 rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
              >
                <div className="flex gap-4">
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center ${showThumbnail ? 'bg-muted' : getItemTypeColor()}`}
                  >
                    {showThumbnail ? (
                      <img
                        src={thumbnailUrl!}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      getItemIcon()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getItemTypeColor()}`}>
                        {getItemTypeLabel()}
                      </span>
                      <span className="text-xs text-text-muted">
                        {formatDistanceToNow(new Date(item.created_at), {
                          addSuffix: true,
                          locale: ar,
                        })}
                      </span>
                    </div>
                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {item.title}
                    </h4>

                    {/* Special Layout for Lessons: Author and 12h Time */}
                    {item.content_type === "lesson" && (
                      <div className="flex items-center justify-between mt-1 text-xs text-text-muted">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-foreground">{item.author || "السيد مراد سلامة"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {/* Time removed as requested */}
                        </div>
                      </div>
                    )}

                    {/* Default Layout for others */}
                    {item.content_type !== "lesson" && (
                      <>
                        {(item.content_type === "book" || item.content_type === "article") && item.author && (
                          <p className="text-sm text-text-muted font-medium mt-0.5">{item.author}</p>
                        )}
                        {cleanDescription && item.content_type !== "book" && (
                          <p className="text-sm text-text-muted line-clamp-1 mt-1">{cleanDescription}</p>
                        )}
                        {(item.read_time || item.duration) && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-text-muted">
                            <Clock className="h-3 w-3 text-secondary" />
                            <span>{item.read_time ? `${item.read_time} دقيقة قراءة` : item.duration}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}

