import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"

interface Article {
  id: string
  title: string
  content: string
  author: string
  thumbnail?: string
  created_at: string
  views_count: number
}

interface ArticleWithImageUrls extends Article {
  thumbnailUrl?: string
  featuredImageUrl?: string
  primaryImageUrl?: string
}

interface LatestArticlesProps {
  articles: ArticleWithImageUrls[]
}

export function LatestArticles({ articles }: LatestArticlesProps) {

  return (
    <section className="py-16 bg-muted relative">
      {/* Smooth gradient blend overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32  from-background via-muted/30 to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-xs font-bold text-primary bg-accent px-3 py-1 rounded-full mb-3 inline-block">
              المقالات العلمية
            </span>
            <h2 className="text-4xl font-bold font-serif text-foreground">أحدث المقالات</h2>
          </div>
          <Link
            href="/articles"
            className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-primary bg-card px-4 py-2 rounded-lg text-sm border border-border transition-all duration-300 hover:shadow-md"
          >
            عرض كل المقالات
            <span className="material-icons-outlined text-sm rtl-flip">arrow_right_alt</span>
          </Link>
        </div>

        {articles.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-center py-12">لا توجد مقالات حالياً</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link href={`/articles/${article.id}`} key={article.id}>
                <article className="bg-card rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl border-2 border-border group h-full transition-all duration-300 hover:-translate-y-1">
                  {/* Thumbnail */}
                  <div className="aspect-video bg-primary/10 relative overflow-hidden">
                    {article.primaryImageUrl ? (
                      <img
                        src={article.primaryImageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted/50">
                        <div className="text-center text-gray-500 dark:text-gray-400">
                          <svg className="h-8 w-8 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-xs">لا توجد صورة</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Title */}
                    <h3 className="text-xl font-bold mb-3 text-card-foreground group-hover:text-primary transition line-clamp-2">
                      {article.title}
                    </h3>

                    {/* Author */}
                    <div className="flex items-center gap-2 text-sm text-secondary font-medium">
                      <span className="material-icons-outlined text-sm">person</span>
                      <span>{article.author}</span>
                    </div>

                    {/* Date */}
                    <div className="mt-3 pt-3">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {formatDistanceToNow(new Date(article.created_at), { addSuffix: true, locale: ar })}
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
