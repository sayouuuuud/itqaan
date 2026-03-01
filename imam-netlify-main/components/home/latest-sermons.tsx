import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"

interface Sermon {
    id: string
    title: string
    description?: string
    created_at: string
}

interface LatestSermonsProps {
    sermons: Sermon[]
}

// Helper function to strip HTML tags from text
function stripHtml(html: string | undefined): string {
    if (!html) return ""
    // Remove HTML tags and decode HTML entities
    return html
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#\d+;/g, '') // Remove numeric HTML entities
        .trim()
}

export function LatestSermons({ sermons }: LatestSermonsProps) {
    return (
        <section className="py-16 bg-muted relative">
            {/* Smooth gradient blend overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-32 from-background via-muted/30 to-transparent pointer-events-none" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <span className="text-xs font-bold text-primary bg-accent px-3 py-1 rounded-full mb-3 inline-block">
                            خطب الجمعة
                        </span>
                        <h2 className="text-4xl font-bold font-serif text-foreground">أحدث الخطب</h2>
                    </div>
                    <Link
                        href="/khutba"
                        className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-primary bg-card px-4 py-2 rounded-lg text-sm border border-border transition-all duration-300 hover:shadow-md"
                    >
                        عرض كل الخطب
                        <span className="material-icons-outlined text-sm rtl-flip">arrow_right_alt</span>
                    </Link>
                </div>

                {sermons.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400 text-center py-12">لا توجد خطب حالياً</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {sermons.map((sermon) => (
                            <Link href={`/khutba/${sermon.id}`} key={sermon.id}>
                                <article className="bg-card rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl border-2 border-border group h-full transition-all duration-300 hover:-translate-y-1">
                                    {/* Icon Header */}
                                    <div className="aspect-video bg-primary/10 relative overflow-hidden flex items-center justify-center">
                                        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                            <span className="material-icons-outlined text-5xl text-primary">menu_book</span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        {/* Title */}
                                        <h3 className="text-xl font-bold mb-3 text-card-foreground group-hover:text-primary transition line-clamp-2">
                                            {sermon.title}
                                        </h3>

                                        {/* Description - stripped of HTML */}
                                        {sermon.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                                {stripHtml(sermon.description)}
                                            </p>
                                        )}

                                        {/* Date */}
                                        <div className="mt-3 pt-3 border-t border-border">
                                            <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                                <span className="material-icons-outlined text-sm">schedule</span>
                                                {formatDistanceToNow(new Date(sermon.created_at), { addSuffix: true, locale: ar })}
                                            </span>
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}
