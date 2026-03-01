import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Home, Search, ChevronLeft, CalendarDays, Play } from "lucide-react"
import { SafeHtml } from "@/components/ui/safe-html"
import { BookCoverImage } from "@/components/book-cover-image"
import { SheikhProfileCard } from "@/components/sheikh-profile-card"
import { NewsletterCard } from "@/components/newsletter-card"
import { ArticleInteractions } from "@/components/articles/article-interactions"
import { stripHtml } from "@/lib/utils/strip-html"
import { getArticleOgImage } from "@/lib/utils/og-images"
import { Metadata } from "next"
import { JsonLd } from "@/components/json-ld"
import { generateArticleSchema, generateBreadcrumbSchema } from "@/lib/schema-generator"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: article } = await supabase.from("articles").select("title, content, thumbnail, featured_image").eq("id", id).single()

  if (!article) return { title: "المقال غير موجود" }

  const ogImage = getArticleOgImage(article)

  return {
    title: `${article.title} | الشيخ السيد مراد سلامة`,
    description: article.content ? stripHtml(article.content).slice(0, 160) : undefined,
    openGraph: {
      title: article.title,
      description: article.content ? stripHtml(article.content).slice(0, 160) : undefined,
      images: [ogImage],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.content ? stripHtml(article.content).slice(0, 160) : undefined,
      images: [ogImage.url],
    },
  }
}

// Helper functions (Server Side)
function getPrimaryImageUrl(thumbnail: string | null, featuredImage: string | null): string | null {
  const isFeaturedPlaceholder = !featuredImage || featuredImage.includes('placeholder')
  const isThumbnailPlaceholder = !thumbnail || thumbnail.includes('placeholder')

  if (!isFeaturedPlaceholder) {
    return featuredImage?.startsWith('uploads/') ? `/api/download?key=${encodeURIComponent(featuredImage)}` : featuredImage || null
  } else if (!isThumbnailPlaceholder) {
    return thumbnail?.startsWith('uploads/') ? `/api/download?key=${encodeURIComponent(thumbnail)}` : thumbnail || null
  } else {
    return null
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function processImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  return url.startsWith('uploads/') ? `/api/download?key=${encodeURIComponent(url)}` : url
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Parallel data fetching
  const [articleResponse, relatedArticlesResponse] = await Promise.all([
    supabase.from("articles").select("*").eq("id", id).eq("publish_status", "published").single(),
    supabase.from("articles").select("id, title, author, featured_image, created_at").eq("publish_status", "published").neq("id", id).limit(3)
  ])

  const article = articleResponse.data

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <div className="text-8xl font-bold text-primary/20 mb-4">404</div>
          <h1 className="text-3xl font-bold text-foreground mb-4 font-serif">المقال غير موجود</h1>
          <p className="text-muted-foreground mb-8">عذراً، المقال الذي تبحث عنه غير موجود أو تم حذفه.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <button className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg font-medium transition-colors">
                <Home className="h-4 w-4" />
                الرئيسية
              </button>
            </Link>
            <Link href="/articles">
              <button className="flex items-center gap-2 bg-muted hover:bg-accent text-foreground px-6 py-3 rounded-lg font-medium transition-colors border border-border">
                <Search className="h-4 w-4" />
                تصفح المقالات
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Increment views
  await supabase.from("articles").update({ views_count: (article.views_count || 0) + 1 }).eq("id", id)

  const relatedArticles = relatedArticlesResponse.data || []

  // Process Images
  const primaryImageUrl = getPrimaryImageUrl(article.thumbnail, article.featured_image)

  const articleSchema = generateArticleSchema({
    title: article.title,
    description: article.content ? stripHtml(article.content).slice(0, 160) : undefined,
    url: `/articles/${article.id}`,
    image: primaryImageUrl || undefined,
    datePublished: article.created_at,
    dateModified: article.created_at,
    authorName: article.author || undefined,
  })

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'الرئيسية', item: '/' },
    { name: 'المقالات', item: '/articles' },
    { name: article.title, item: `/articles/${article.id}` },
  ])

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-display antialiased transition-colors duration-300">
      <div className="container mx-auto px-4 lg:px-8 py-10 min-h-screen">
        <JsonLd schema={[articleSchema, breadcrumbSchema]} />
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #article-content, #article-content * { visibility: visible; }
            #article-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              color: #000000 !important;
            }
            #article-content * {
              color: #000000 !important;
              background: #ffffff !important;
            }
            #article-content h1, #article-content h2, #article-content h3,
            #article-content h4, #article-content h5, #article-content h6 {
              color: #000000 !important;
            }
            #article-content p, #article-content span, #article-content div {
              color: #000000 !important;
            }
            .no-print, header, footer, .lg\\:col-span-4 { display: none !important; }
          }
        `}</style>

        <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-8 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <Link href="/" className="hover:text-primary dark:hover:text-secondary">الرئيسية</Link>
          <ChevronLeft className="h-4 w-4 mx-2 text-gray-400" />
          <Link href="/articles" className="hover:text-primary dark:hover:text-secondary">المقالات</Link>
          <ChevronLeft className="h-4 w-4 mx-2 text-gray-400" />
          <span className="text-primary dark:text-secondary font-medium">{article.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {primaryImageUrl && (
              <div className="mb-8 rounded-2xl overflow-hidden shadow-lg">
                <img
                  src={primaryImageUrl}
                  alt={article.title}
                  className="w-full h-96 object-cover"
                  loading="lazy"
                />
              </div>
            )}

            <div className="bg-card-light dark:bg-card-dark rounded-2xl p-8 border border-border-light dark:border-border-dark shadow-sm relative overflow-hidden">
              <span className="material-icons-outlined absolute -left-10 -top-10 text-9xl text-gray-50 dark:text-gray-800/30 opacity-50 transform rotate-12">article</span>
              <div className="relative z-10">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-secondary/10 text-secondary text-xs rounded-full font-medium border border-secondary/20">مقالة</span>
                  <span className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-full flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {formatDate(article.created_at)}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold font-serif text-foreground mb-6 leading-tight">
                  {article.title}
                </h1>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-muted-foreground text-sm">بقلم: {article.author}</span>
                  <span className="text-muted-foreground text-sm">وقت القراءة: {article.read_time || 5} دقائق</span>
                </div>

                {/* Interactions Client Component */}
                <ArticleInteractions articleTitle={article.title} />

              </div>
            </div>

            <article
              id="article-content"
              className="prose prose-lg dark:prose-invert prose-headings:font-display prose-p:font-body prose-p:text-foreground max-w-none bg-card-light dark:bg-card-dark p-8 md:p-12 rounded-2xl border border-border-light dark:border-border-dark shadow-sm"
            >
              <h1 className="text-3xl md:text-4xl font-bold font-serif text-foreground mb-6 leading-tight">
                {article.title}
              </h1>
              <div className="flex items-center gap-4 mb-6 text-muted-foreground text-sm">
                <span>بقلم: {article.author}</span>
                <span>وقت القراءة: {article.read_time || 5} دقائق</span>
              </div>
              <SafeHtml html={article.content} />
            </article>

            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag: string, index: number) => (
                  <a key={index} className="px-4 py-2 bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground rounded-lg text-sm transition-colors border border-border" href="#">
                    #{tag}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-8">
            <SheikhProfileCard />

            {relatedArticles.length > 0 && (
              <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-border-light dark:border-border-dark shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg text-card-foreground flex items-center gap-2">
                    <span className="w-1 h-6 bg-primary rounded-full"></span>
                    مقالات ذات صلة
                  </h3>
                </div>
                <div className="space-y-4">
                  {relatedArticles.map((relatedArticle) => (
                    <Link key={relatedArticle.id} href={`/articles/${relatedArticle.id}`} className="group block">
                      <div className="flex gap-4 items-start">
                        <div className="w-20 h-20 rounded-lg bg-muted shrink-0 overflow-hidden relative">
                          <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/40 transition-colors flex items-center justify-center">
                            <Play className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <BookCoverImage
                            coverImagePath={processImageUrl(relatedArticle.featured_image)}
                            title={relatedArticle.title}
                            variant="card"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-card-foreground group-hover:text-primary transition-colors text-sm leading-snug mb-1">
                            {relatedArticle.title}
                          </h4>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="material-icons-outlined text-sm">person</span>
                            {relatedArticle.author}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/articles" className="block text-center text-primary dark:text-secondary text-sm font-bold mt-6 hover:underline">
                  عرض المزيد من المقالات
                </Link>
              </div>
            )}

            <NewsletterCard />
          </div>
        </div>
      </div>
    </div>
  )
}
