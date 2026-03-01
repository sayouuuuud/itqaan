import type { Metadata } from "next"
import Link from "next/link"
import { createPublicClient } from "@/lib/supabase/public"
import {
  Filter,
  Clock,
  History,
  TrendingUp,
  Mic,
  Eye,
  Music,
  ChevronRight,
  ChevronLeft,
  Tag,
} from "lucide-react"
import { BookCoverImage } from "@/components/book-cover-image"
import { SafeHtml } from "@/components/ui/safe-html"

export const metadata: Metadata = {
  title: "الخطب المنبرية",
  description:
    "مجموعة متكاملة من خطب الجمعة والأعياد والمناسبات الدينية مرتبة ومؤرشفة",
  keywords: ["خطب جمعة", "خطب دينية", "محاضرات إسلامية", "خطب المناسبات"],
  openGraph: {
    title: "الخطب المنبرية",
    description: "استمع إلى خطب الشيخ السيد مراد",
    type: "website",
  },
}

export default async function KhutbaPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    category?: string
    sort?: string
  }>
}) {
  const params = await searchParams
  const supabase = createPublicClient()
  const currentPage = Number(params.page) || 1
  const itemsPerPage = 9
  const offset = (currentPage - 1) * itemsPerPage

  // Fetch categories for sermons
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("type", "sermon")
    .order("name", { ascending: true })

  // Build query
  let query = supabase
    .from("sermons")
    .select("*", { count: "exact" })
    .eq("publish_status", "published")
    .range(offset, offset + itemsPerPage - 1)

  if (params.sort === "oldest") {
    query = query.order("created_at", { ascending: true })
  } else if (params.sort === "views") {
    query = query.order("views_count", { ascending: false })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  if (params.category && params.category !== "الكل") {
    query = query.eq("category_id", params.category)
  }

  const { data: sermons, count } = await query
  const totalPages = Math.ceil((count || 0) / itemsPerPage)

  return (
    <>
      {/* Hero Section */}
      <section className="bg-accent-light py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block bg-surface text-secondary px-3 py-1 rounded-full text-sm mb-4 border border-secondary/20 shadow-sm">
            مكتبة المنبر
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4 font-serif">
            الخطب المنبرية
          </h1>
          <p className="text-text-muted max-w-2xl mx-auto text-lg leading-relaxed">
            مجموعة متكاملة من خطب الجمعة والأعياد والمناسبات الدينية، مرتبة
            ومؤرشفة للرجوع إليها في أي وقت.
          </p>
        </div>
      </section>

      {/* Filters */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-surface p-4 rounded-xl shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-4 border border-border">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="h-5 w-5 text-primary" />
            <span className="font-bold text-foreground">تصفية الخطب:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Link
              href={`/khutba${params.category ? `?category=${params.category}` : ""}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1 ${!params.sort || params.sort === "newest"
                ? "bg-primary text-white"
                : "bg-background border border-border text-foreground hover:border-primary"
                }`}
            >
              <Clock className="h-4 w-4" />
              أحدث الخطب
            </Link>
            <Link
              href={`/khutba?sort=oldest${params.category ? `&category=${params.category}` : ""}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1 ${params.sort === "oldest"
                ? "bg-primary text-white"
                : "bg-background border border-border text-foreground hover:border-primary"
                }`}
            >
              <History className="h-4 w-4" />
              الأقدم
            </Link>
            <Link
              href={`/khutba?sort=views${params.category ? `&category=${params.category}` : ""}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1 ${params.sort === "views"
                ? "bg-primary text-white"
                : "bg-background border border-border text-foreground hover:border-primary"
                }`}
            >
              <TrendingUp className="h-4 w-4" />
              الأكثر مشاهدة
            </Link>
          </div>
        </div>

        {/* Category Pills */}
        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Link
              href={`/khutba${params.sort ? `?sort=${params.sort}` : ""}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${!params.category || params.category === "الكل"
                ? "bg-secondary text-white"
                : "bg-secondary/10 text-secondary hover:bg-secondary/20"
                }`}
            >
              جميع الموضوعات
            </Link>

            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/khutba?category=${cat.id}${params.sort ? `&sort=${params.sort}` : ""}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${params.category === cat.id
                  ? "bg-secondary text-white"
                  : "bg-secondary/10 text-secondary hover:bg-secondary/20"
                  }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* Sermons Grid */}
        {!sermons || sermons.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            <Mic className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">لا توجد خطب منشورة حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sermons.map((sermon) => (
              <article
                key={sermon.id}
                className="bg-surface rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-border flex flex-col h-full group"
              >
                <div className="relative h-48 bg-primary/5 rounded-t-xl overflow-hidden flex items-center justify-center">
                  <BookCoverImage
                    coverImagePath={sermon.thumbnail_path}
                    title={sermon.title}
                    variant="card"
                    hoverEffect={true}
                  />
                  <div className="absolute top-4 left-4 bg-surface text-xs font-bold px-2 py-1 rounded shadow-sm text-text-muted">
                    {new Date(sermon.created_at).toLocaleDateString("ar-EG")}
                  </div>

                  {sermon.audio_url && (
                    <div className="absolute bottom-4 right-4">
                      <span className="bg-primary/90 text-white text-xs font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                        <Music className="h-3 w-3" />
                        صوتي
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  {sermon.category && (
                    <div className="flex items-center gap-2 text-xs text-secondary font-medium mb-3">
                      <Tag className="h-4 w-4" />
                      <span>{sermon.category}</span>
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-primary mb-3 line-clamp-2 hover:text-secondary transition-colors cursor-pointer">
                    {sermon.title}
                  </h3>

                  {sermon.description && (
                    <div className="text-sm text-text-muted mb-4 line-clamp-3">
                      <SafeHtml
                        html={
                          sermon.description.replace(/<[^>]*>/g, "").substring(0, 120) +
                          (sermon.description.replace(/<[^>]*>/g, "").length > 120
                            ? "..."
                            : "")
                        }
                      />
                    </div>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-3 pt-4 border-t border-border">
                    <Link
                      href={`/khutba/${sermon.id}`}
                      className="flex-1 text-center bg-primary hover:bg-primary-hover text-white py-2 px-3 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      اقرأ الخطبة
                    </Link>
                    <div className="flex items-center gap-1 text-xs text-text-muted">
                      <Eye className="h-4 w-4" />
                      {sermon.views_count || 0}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center mt-12">
            <nav className="flex items-center gap-2">
              {currentPage > 1 && (
                <Link
                  href={`/khutba?page=${currentPage - 1}${params.sort ? `&sort=${params.sort}` : ""}${params.category ? `&category=${params.category}` : ""}`}
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
                    href={`/khutba?page=${pageNum}${params.sort ? `&sort=${params.sort}` : ""}${params.category ? `&category=${params.category}` : ""}`}
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
                  href={`/khutba?page=${currentPage + 1}${params.sort ? `&sort=${params.sort}` : ""}${params.category ? `&category=${params.category}` : ""}`}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-border text-text-muted hover:bg-background"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Link>
              )}
            </nav>
          </div>
        )}
      </main>
    </>
  )
}