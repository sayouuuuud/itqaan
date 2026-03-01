import type { Metadata } from "next"
import { createPublicClient } from "@/lib/supabase/public"
import Link from "next/link"
import { Search, ChevronRight, ChevronLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"

export const metadata: Metadata = {
  title: "المقالات والبحوث - الشيخ السيد مراد",
  description: "مجموعة من المقالات والبحوث العلمية في العلوم الشرعية والقضايا المعاصرة من الشيخ السيد مراد",
  keywords: ["مقالات إسلامية", "بحوث", "فقه", "قضايا معاصرة"],
  openGraph: {
    title: "المقالات والبحوث",
    description: "مقالات وبحوث شرعية معمقة",
    type: "website",
  },
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; page?: string }>
}) {
  const params = await searchParams
  const supabase = createPublicClient()
  const currentPage = Number(params.page) || 1
  const itemsPerPage = 8
  const offset = (currentPage - 1) * itemsPerPage

  // Fetch categories
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("type", "article")
    .order("name", { ascending: true })

  // Build query - Now fetching thumbnail and featured_image properly
  let query = supabase
    .from("articles")
    .select("id, title, author, thumbnail, featured_image, publish_status, created_at", { count: "exact" })
    .eq("publish_status", "published")
    .order("created_at", { ascending: false })
    .range(offset, offset + itemsPerPage - 1)

  if (params.search) {
    query = query.or(`title.ilike.%${params.search}%,content.ilike.%${params.search}%`)
  }

  if (params.category && params.category !== "الكل") {
    query = query.eq("category_id", params.category)
  }

  const { data: articles, count } = await query
  const totalPages = Math.ceil((count || 0) / itemsPerPage)

  // Convert image keys to download URLs
  const articlesWithImageUrls = articles?.map(article => ({
    ...article,
    thumbnailUrl: article.thumbnail?.startsWith('uploads/') ? `/api/download?key=${encodeURIComponent(article.thumbnail)}` : article.thumbnail,
    featuredImageUrl: article.featured_image?.startsWith('uploads/') ? `/api/download?key=${encodeURIComponent(article.featured_image)}` : article.featured_image,
    // Determine primary image for display
    primaryImageUrl: getPrimaryImageUrl(article.thumbnail, article.featured_image)
  })) || []

  // Helper function to determine which image to show
  function getPrimaryImageUrl(thumbnail: string | null, featuredImage: string | null): string | null {
    // Priority: featured_image if it's not a placeholder, then thumbnail if it's not a placeholder
    const isFeaturedPlaceholder = !featuredImage || featuredImage.includes('placeholder')
    const isThumbnailPlaceholder = !thumbnail || thumbnail.includes('placeholder')

    if (!isFeaturedPlaceholder) {
      return featuredImage?.startsWith('uploads/') ? `/api/download?key=${encodeURIComponent(featuredImage)}` : featuredImage
    } else if (!isThumbnailPlaceholder) {
      return thumbnail?.startsWith('uploads/') ? `/api/download?key=${encodeURIComponent(thumbnail)}` : thumbnail
    } else {
      return null // Will show placeholder
    }
  }

  console.log("[v0] Articles fetched:", articlesWithImageUrls?.length || 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block bg-primary/10 text-primary px-4 py-1 rounded-full text-sm font-bold mb-4">
              المقالات والبحوث
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              مقالات <span className="text-primary">علمية</span> متنوعة
            </h1>
            <p className="text-muted-foreground text-lg">
              مجموعة من المقالات والبحوث العلمية في العلوم الشرعية والقضايا المعاصرة
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <form className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                name="search"
                defaultValue={params.search}
                placeholder="ابحث في المقالات..."
                className="pr-10 bg-muted"
              />
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link href="/articles">
                <Button variant={!params.category || params.category === "الكل" ? "default" : "outline"} size="sm">
                  الكل
                </Button>
              </Link>
              {categories?.map((cat) => (
                <Link key={cat.id} href={`/articles?category=${cat.id}`}>
                  <Button variant={params.category === cat.id ? "default" : "outline"} size="sm">
                    {cat.name}
                  </Button>
                </Link>
              ))}
            </div>
          </form>
        </div>
      </section>

      {/* Articles Grid - Fixed to show actual images from database */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {!articles || articles.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">لا توجد مقالات</h3>
              <p className="text-muted-foreground">لم يتم العثور على مقالات مطابقة لبحثك</p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {articlesWithImageUrls.map((article) => {
                const imagePath = article.primaryImageUrl
                return (
                  <Link key={article.id} href={`/articles/${article.id}`} className="group">
                    <article className="bg-card rounded-2xl overflow-hidden border shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col ring-1 ring-black/5 dark:ring-white/5">
                      {/* Thumbnail - Now properly displays actual images */}
                      <div className="aspect-video overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
                        {imagePath ? (
                          <img
                            src={imagePath}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted/50">
                            <div className="text-center text-muted-foreground">
                              <svg className="h-8 w-8 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className="text-xs">لا توجد صورة</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-6 flex-1 flex flex-col">
                        {/* Title */}
                        <h2 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                          {article.title}
                        </h2>
                        {/* Author */}
                        <div className="flex items-center gap-2 text-sm text-secondary font-medium mt-auto">
                          <span className="material-icons-outlined text-sm">person</span>
                          <span>{article.author}</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-12">
              <nav className="flex items-center gap-2">
                {currentPage > 1 && (
                  <Link
                    href={`/articles?page=${currentPage - 1}${params.category ? `&category=${params.category}` : ""}${params.search ? `&search=${params.search}` : ""}`}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-border text-text-muted hover:bg-background"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                )}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  return (
                    <Link
                      key={pageNum}
                      href={`/articles?page=${pageNum}${params.category ? `&category=${params.category}` : ""}${params.search ? `&search=${params.search}` : ""}`}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium ${currentPage === pageNum
                        ? "bg-primary text-white"
                        : "border border-border text-text-muted hover:bg-background"
                        }`}
                    >
                      {pageNum}
                    </Link>
                  )
                })}
                {currentPage < totalPages && (
                  <Link
                    href={`/articles?page=${currentPage + 1}${params.category ? `&category=${params.category}` : ""}${params.search ? `&search=${params.search}` : ""}`}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-border text-text-muted hover:bg-background"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Link>
                )}
              </nav>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
