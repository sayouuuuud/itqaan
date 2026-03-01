import type { Metadata } from "next"
import { createPublicClient } from "@/lib/supabase/public"
import Link from "next/link"
import { Calendar, Eye, Play, Search, Video, ChevronRight, ChevronLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "المرئيات والمحاضرات - الشيخ السيد مراد",
  description: "مجموعة من الخطب والدروس واللقاءات التلفزيونية المرئية للشيخ السيد مراد",
  keywords: ["مرئيات إسلامية", "محاضرات", "خطب", "فيديو"],
  openGraph: {
    title: "المرئيات والمحاضرات",
    description: "خطب ودروس ومحاضرات مصورة",
    type: "website",
  },
}

function formatViews(views: number): string {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`
  }
  return views.toString()
}

function getYouTubeThumbnail(url: string): string {
  const match = url?.match(
    /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^"&?/\s]{11})/
  )
  if (match && match[1]) {
    return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`
  }
  return "/video-thumbnail.png"
}

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    category?: string
    page?: string
  }>
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
    .eq("type", "media")
    .order("name", { ascending: true })

  // Build query
  let query = supabase
    .from("media")
    .select("*", { count: "exact" })
    .eq("publish_status", "published")
    .order("created_at", { ascending: false })
    .range(offset, offset + itemsPerPage - 1)

  if (params.search) {
    query = query.or(
      `title.ilike.%${params.search}%,description.ilike.%${params.search}%`
    )
  }

  if (params.category && params.category !== "الكل") {
    query = query.eq("category_id", params.category)
  }

  const { data: videos, count } = await query
  const totalPages = Math.ceil((count || 0) / itemsPerPage)

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block bg-primary/10 text-primary px-4 py-1 rounded-full text-sm font-bold mb-4">
              المرئيات والمحاضرات
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              مكتبة <span className="text-primary">مرئية</span> شاملة
            </h1>
            <p className="text-muted-foreground text-lg">
              مجموعة من الخطب والدروس المصورة
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
                placeholder="ابحث في المرئيات..."
                className="pr-10 bg-muted"
              />
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link href="/videos">
                <Button
                  variant={
                    !params.category || params.category === "الكل"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                >
                  الكل
                </Button>
              </Link>

              {categories?.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/videos?category=${cat.id}`}
                >
                  <Button
                    variant={params.category === cat.id ? "default" : "outline"}
                    size="sm"
                  >
                    {cat.name}
                  </Button>
                </Link>
              ))}
            </div>
          </form>
        </div>
      </section>

      {/* Videos Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {!videos || videos.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Video className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">لا توجد مرئيات</h3>
              <p className="text-muted-foreground">
                لم يتم العثور على مرئيات مطابقة لبحثك
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {videos.map((video) => (
                <Link key={video.id} href={`/videos/${video.id}`} className="group">
                  <article className="bg-card rounded-xl overflow-hidden border shadow-sm hover:shadow-lg transition-all duration-300">
                    <div className="aspect-video relative overflow-hidden bg-muted">
                      <img
                        src={video.thumbnail || getYouTubeThumbnail(video.url)}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                          <Play className="h-8 w-8 text-white fill-white mr-[-4px]" />
                        </div>
                      </div>

                      {video.duration && (
                        <span className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {video.duration}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {video.category || "عام"}
                      </span>
                      <h3 className="font-bold mt-2 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {video.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(video.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {formatViews(video.views || 0)}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-12">
              <nav className="flex items-center gap-2">
                {currentPage > 1 && (
                  <Link
                    href={`/videos?page=${currentPage - 1}${params.category ? `&category=${params.category}` : ""}${params.search ? `&search=${params.search}` : ""}`}
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
                      href={`/videos?page=${pageNum}${params.category ? `&category=${params.category}` : ""}${params.search ? `&search=${params.search}` : ""}`}
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
                    href={`/videos?page=${currentPage + 1}${params.category ? `&category=${params.category}` : ""}${params.search ? `&search=${params.search}` : ""}`}
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