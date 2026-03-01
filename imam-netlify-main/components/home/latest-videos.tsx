import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"

interface Video {
    id: string
    title: string
    description?: string
    created_at: string
    duration?: string
    thumbnail?: string
    url?: string
}

interface LatestVideosProps {
    videos: Video[]
}

// Helper function to strip HTML tags from text
function stripHtml(html: string | undefined): string {
    if (!html) return ""
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#\d+;/g, '')
        .trim()
}

// Get YouTube thumbnail from URL
function getYouTubeThumbnail(url: string | undefined): string | null {
    if (!url) return null
    const match = url.match(
        /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^"&?/\s]{11})/
    )
    if (match && match[1]) {
        return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`
    }
    return null
}

export function LatestVideos({ videos }: LatestVideosProps) {
    return (
        <section className="py-16 bg-background relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <span className="text-xs font-bold text-red-500 bg-red-500/10 px-3 py-1 rounded-full mb-3 inline-block">
                            المرئيات
                        </span>
                        <h2 className="text-4xl font-bold font-serif text-foreground">أحدث المرئيات</h2>
                    </div>
                    <Link
                        href="/videos"
                        className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-red-500 bg-card px-4 py-2 rounded-lg text-sm border border-border transition-all duration-300 hover:shadow-md"
                    >
                        عرض كل المرئيات
                        <span className="material-icons-outlined text-sm rtl-flip">arrow_right_alt</span>
                    </Link>
                </div>

                {videos.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400 text-center py-12">لا توجد مرئيات حالياً</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {videos.map((video) => {
                            const thumbnailUrl = video.thumbnail || getYouTubeThumbnail(video.url)
                            return (
                                <Link href={`/videos/${video.id}`} key={video.id}>
                                    <article className="bg-card rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl border-2 border-border group h-full transition-all duration-300 hover:-translate-y-1">
                                        {/* Thumbnail */}
                                        <div className="aspect-video bg-red-500/10 relative overflow-hidden flex items-center justify-center">
                                            {thumbnailUrl ? (
                                                <img
                                                    src={thumbnailUrl}
                                                    alt={video.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                                    <span className="material-icons-outlined text-5xl text-red-500">play_circle</span>
                                                </div>
                                            )}
                                            {/* Play overlay */}
                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center">
                                                    <span className="material-icons-outlined text-3xl text-white">play_arrow</span>
                                                </div>
                                            </div>
                                            {video.duration && (
                                                <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                                    {video.duration}
                                                </span>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="p-4">
                                            {/* Title */}
                                            <h3 className="text-xl font-bold mb-3 text-card-foreground group-hover:text-red-500 transition line-clamp-2">
                                                {video.title}
                                            </h3>

                                            {/* Date */}
                                            <div className="mt-3 pt-3 border-t border-border">
                                                <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                                    <span className="material-icons-outlined text-sm">schedule</span>
                                                    {formatDistanceToNow(new Date(video.created_at), { addSuffix: true, locale: ar })}
                                                </span>
                                            </div>
                                        </div>
                                    </article>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </section>
    )
}
