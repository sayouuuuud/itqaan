import { createPublicClient } from "@/lib/supabase/public"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search, Mic, BookOpen, FileText, BookMarked } from "lucide-react"
import { JsonLd } from "@/components/json-ld"
import { generateBreadcrumbSchema, generateSearchResultsSchema } from "@/lib/schema-generator"

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export const metadata = {
  title: "البحث في الموقع",
  description: "ابحث في الخطب والدروس والمقالات والكتب",
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q: query } = await searchParams
  const supabase = createPublicClient()

  let results: {
    sermons: any[]
    lessons: any[]
    articles: any[]
    books: any[]
  } = { sermons: [], lessons: [], articles: [], books: [] }

  if (query && query.trim()) {
    const searchTerm = `%${query}%`

    const [sermonsResult, lessonsResult, articlesResult, booksResult] = await Promise.all([
      supabase
        .from("sermons")
        .select("id, title, content, created_at")
        .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
        .eq("publish_status", "published")
        .limit(10),
      supabase
        .from("lessons")
        .select("id, title, description, type, created_at")
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .eq("publish_status", "published")
        .limit(10),
      supabase
        .from("articles")
        .select("id, title, content, author, created_at")
        .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
        .eq("publish_status", "published")
        .limit(10),
      supabase
        .from("books")
        .select("id, title, author, description, cover_image_path, created_at")
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm},author.ilike.${searchTerm}`)
        .eq("publish_status", "published")
        .limit(10),
    ])

    results = {
      sermons: sermonsResult.data || [],
      lessons: lessonsResult.data || [],
      articles: articlesResult.data || [],
      books: booksResult.data || [],
    }
  }

  const totalResults = results.sermons.length + results.lessons.length + results.articles.length + results.books.length

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'الرئيسية', item: '/' },
    { name: 'البحث', item: '/search' },
  ])

  const searchSchema = query ? generateSearchResultsSchema(query, totalResults) : null

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <JsonLd schema={[breadcrumbSchema, ...(searchSchema ? [searchSchema] : [])]} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Search Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-serif">
            البحث في الموقع
          </h1>
          <p className="text-text-muted">
            ابحث في الخطب والدروس والمقالات والكتب
          </p>
        </div>

        {/* Search Form */}
        <form action="/search" method="GET" className="mb-12">
          <div className="flex gap-3">
            <input
              type="text"
              name="q"
              defaultValue={query || ""}
              placeholder="اكتب كلمة البحث..."
              className="flex-1 px-6 py-4 bg-card border border-border rounded-xl text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button type="submit" className="bg-primary hover:bg-primary-hover text-white px-8 rounded-xl">
              <Search className="h-5 w-5 ml-2" />
              بحث
            </Button>
          </div>
        </form>

        {/* Results */}
        {query && (
          <div className="space-y-8">
            <p className="text-text-muted">
              تم العثور على <span className="font-bold text-primary">{totalResults}</span> نتيجة لـ &quot;{query}&quot;
            </p>

            {totalResults === 0 ? (
              <div className="text-center py-16 bg-card rounded-2xl border border-border">
                <Search className="h-16 w-16 mx-auto mb-4 text-text-muted opacity-30" />
                <h3 className="text-xl font-bold text-foreground mb-2">
                  لم يتم العثور على نتائج
                </h3>
                <p className="text-text-muted">
                  جرب استخدام كلمات مختلفة أو أكثر عمومية
                </p>
              </div>
            ) : (
              <>
                {/* Sermons Results */}
                {results.sermons.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <Mic className="h-5 w-5 text-primary" />
                      الخطب ({results.sermons.length})
                    </h2>
                    <div className="space-y-3">
                      {results.sermons.map((sermon) => (
                        <Link
                          key={sermon.id}
                          href={`/khutba/${sermon.id}`}
                          className="block bg-card p-4 rounded-xl border border-border hover:border-primary transition-colors"
                        >
                          <h3 className="font-bold text-foreground mb-1">
                            {sermon.title}
                          </h3>
                          <p className="text-sm text-text-muted line-clamp-2">
                            {sermon.content?.replace(/<[^>]*>/g, "").substring(0, 150)}...
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lessons Results */}
                {results.lessons.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-secondary" />
                      الدروس ({results.lessons.length})
                    </h2>
                    <div className="space-y-3">
                      {results.lessons.map((lesson) => (
                        <Link
                          key={lesson.id}
                          href={`/dars/${lesson.id}`}
                          className="block bg-card p-4 rounded-xl border border-border hover:border-primary transition-colors"
                        >
                          <h3 className="font-bold text-foreground mb-1">
                            {lesson.title}
                          </h3>
                          <p className="text-sm text-text-muted line-clamp-2">
                            {lesson.description}
                          </p>
                          <span className="inline-block mt-2 text-xs bg-secondary/10 text-secondary px-2 py-1 rounded">
                            {lesson.type === "video" ? "فيديو" : "صوت"}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Articles Results */}
                {results.articles.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      المقالات ({results.articles.length})
                    </h2>
                    <div className="space-y-3">
                      {results.articles.map((article) => (
                        <Link
                          key={article.id}
                          href={`/articles/${article.id}`}
                          className="block bg-card p-4 rounded-xl border border-border hover:border-primary transition-colors"
                        >
                          <h3 className="font-bold text-foreground mb-1">
                            {article.title}
                          </h3>
                          <p className="text-sm text-text-muted line-clamp-2">
                            {article.content?.replace(/<[^>]*>/g, "").substring(0, 150)}...
                          </p>
                          <span className="text-xs text-text-muted mt-2 block">
                            {article.author}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Books Results */}
                {results.books.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <BookMarked className="h-5 w-5 text-amber-500" />
                      الكتب ({results.books.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {results.books.map((book) => (
                        <Link
                          key={book.id}
                          href={`/books/${book.id}`}
                          className="flex gap-4 bg-card p-4 rounded-xl border border-border hover:border-primary transition-colors"
                        >
                          <img
                            src={book.cover_image_path || "/placeholder.svg?height=120&width=80&query=islamic book"}
                            alt={book.title}
                            className="w-16 h-24 object-cover rounded-lg"
                          />
                          <div>
                            <h3 className="font-bold text-foreground mb-1">
                              {book.title}
                            </h3>
                            <p className="text-sm text-text-muted">
                              {book.author}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* No query yet */}
        {!query && (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <Search className="h-16 w-16 mx-auto mb-4 text-primary/30" />
            <h3 className="text-xl font-bold text-foreground mb-2">
              ابدأ البحث
            </h3>
            <p className="text-text-muted">
              أدخل كلمة أو عبارة للبحث في محتوى الموقع
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
