
import type { Metadata } from "next"
import { createPublicClient } from "@/lib/supabase/public"
import { HeroSection } from "@/components/home/hero-section"
import { LatestContent } from "@/components/home/latest-lessons"
import { WeeklySchedule } from "@/components/home/weekly-schedule"
import { ExploreSections } from "@/components/home/explore-sections"
import { FeaturedBooks } from "@/components/home/featured-books"
import { RamadanDecorations } from "@/components/home/ramadan-decorations"
import { LatestSermons } from "@/components/home/latest-sermons"
import { LatestVideos } from "@/components/home/latest-videos"
import { NewsletterSection } from "@/components/home/newsletter-section"
import { ScrollAnimation } from "@/components/ui/scroll-animation"
import { unstable_cache } from "next/cache"

export const revalidate = 60

// Cache all home page data for 60 seconds
const getHomePageData = unstable_cache(
  async () => {
    const supabase = createPublicClient()

    const queryResults = await Promise.all([
      supabase.from("hero_section").select("*").order("updated_at", { ascending: false }).limit(1),
      supabase
        .from("lessons")
        .select("id, title, description, created_at, type, media_source, duration, author_name")
        .eq("publish_status", "published")
        .order("created_at", { ascending: false })
        .limit(2),
      supabase
        .from("sermons")
        .select("id, title, description, created_at")
        .eq("publish_status", "published")
        .order("created_at", { ascending: false })
        .limit(4),
      supabase
        .from("articles")
        .select("id, title, excerpt, author, created_at, read_time, thumbnail, featured_image, views_count")
        .eq("publish_status", "published")
        .order("created_at", { ascending: false })
        .limit(2),
      supabase
        .from("events")
        .select("id, title, description, event_date, event_time, is_active, event_type")
        .eq("is_active", true)
        .gte("event_date", new Date().toISOString().split("T")[0])
        .order("event_date", { ascending: true })
        .order("event_time", { ascending: true })
        .limit(3),
      supabase
        .from("books")
        .select("*")
        .eq("publish_status", "published")
        .order("created_at", { ascending: false })
        .limit(4),
      supabase
        .from("media")
        .select("id, title, description, created_at, duration, thumbnail, url")
        .eq("publish_status", "published")
        .order("created_at", { ascending: false })
        .limit(4),
    ])

    return {
      heroDataArray: queryResults[0].data,
      lessons: queryResults[1].data,
      sermons: queryResults[2].data,
      articles: queryResults[3].data,
      weeklyEvents: queryResults[4].data,
      books: queryResults[5].data,
      videos: queryResults[6].data,
    }
  },
  ["home_page_data"],
  { revalidate: 60 }
)

export const metadata: Metadata = {
  title: "الرئيسية",
  description:
    "منصة إسلامية شاملة تقدم خطب ودروس علمية ومقالات وكتب من الشيخ السيد مراد. تعلم العلم الشرعي بسهولة ويسر.",
  openGraph: {
    title: "الشيخ السيد مراد - الرئيسية",
    description: "منصة إسلامية شاملة تقدم خطب ودروس وكتب إسلامية",
    type: "website",
  },
}

function formatTime12h(time: string | null): string {
  if (!time) return ""
  const [hours, minutes] = time.split(":")
  const hour = Number.parseInt(hours, 10)
  const ampm = hour >= 12 ? "م" : "ص"
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

function getDayName(day: string | null): string {
  const days: Record<string, string> = {
    sunday: "الأحد",
    monday: "الاثنين",
    tuesday: "الثلاثاء",
    wednesday: "الأربعاء",
    thursday: "الخميس",
    friday: "الجمعة",
    saturday: "السبت",
  }
  return day ? days[day.toLowerCase()] || day : ""
}

function getDayNameFromDate(dateStr: string | null): string {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
  return days[date.getDay()]
}

function getRelativeDayDescription(dateStr: string | null): string {
  if (!dateStr) return ""
  const eventDate = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  eventDate.setHours(0, 0, 0, 0)

  const diffTime = eventDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "اليوم"
  if (diffDays === 1) return "غداً"
  if (diffDays === 2) return "بعد غد"
  if (diffDays > 0 && diffDays <= 6) {
    return getDayNameFromDate(dateStr)
  }
  if (diffDays < 0) {
    const absDays = Math.abs(diffDays)
    if (absDays === 1) return "أمس"
    if (absDays <= 6) {
      return `الأسبوع الماضي`
    }
  }

  return getDayNameFromDate(dateStr)
}

function getPrimaryImageUrl(thumbnail: string | null, featuredImage: string | null): string | null {
  const isFeaturedPlaceholder = !featuredImage || featuredImage.includes("placeholder")
  const isThumbnailPlaceholder = !thumbnail || thumbnail.includes("placeholder")

  if (!isFeaturedPlaceholder) {
    return featuredImage?.startsWith("uploads/")
      ? `/api/download?key=${encodeURIComponent(featuredImage)}`
      : featuredImage
  } else if (!isThumbnailPlaceholder) {
    return thumbnail?.startsWith("uploads/") ? `/api/download?key=${encodeURIComponent(thumbnail)}` : thumbnail
  } else {
    return null
  }
}

export default async function HomePage() {
  // Use cached data
  const {
    heroDataArray,
    lessons,
    sermons,
    articles,
    weeklyEvents,
    books,
    videos,
  } = await getHomePageData()


  // Convert article image keys to download URLs
  const articlesWithImageUrls =
    articles?.map((article) => {
      const primaryImageUrl = getPrimaryImageUrl(article.thumbnail, article.featured_image)
      return {
        ...article,
        thumbnailUrl: article.thumbnail?.startsWith("uploads/")
          ? `/api/download?key=${encodeURIComponent(article.thumbnail)}`
          : article.thumbnail,
        featuredImageUrl: article.featured_image?.startsWith("uploads/")
          ? `/api/download?key=${encodeURIComponent(article.featured_image)}`
          : article.featured_image,
        // Determine primary image for display
        primaryImageUrl: primaryImageUrl || undefined,
      }
    }) || []


  // Get first item from array or null
  const heroData = heroDataArray?.[0] || null

  // تجميع المحتويات من مصادر مختلفة

  const latestContent = [
    ...(Array.isArray(lessons)
      ? lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        content_type: "lesson" as const,
        created_at: lesson.created_at,
        duration: lesson.duration,
        author: lesson.author_name,
      }))
      : []),
    ...(Array.isArray(sermons)
      ? sermons.map((sermon) => ({
        id: sermon.id,
        title: sermon.title,
        description: sermon.description,
        content_type: "sermon" as const,
        created_at: sermon.created_at,
      }))
      : []),
    ...(Array.isArray(articles)
      ? articles.map((article) => ({
        id: article.id,
        title: article.title,
        excerpt: article.excerpt,
        content_type: "article" as const,
        created_at: article.created_at,
        read_time: article.read_time,
        author: article.author,
      }))
      : []),
    ...(Array.isArray(books)
      ? books.map((book: any) => ({
        id: book.id,
        title: book.title,
        description: book.description,
        author: book.author,
        content_type: "book" as const,
        created_at: book.created_at,
      }))
      : []),
    ...(Array.isArray(videos)
      ? videos.map((video: any) => ({
        id: video.id,
        title: video.title,
        description: video.description,
        content_type: "video" as const,
        created_at: video.created_at,
        duration: video.duration,
      }))
      : []),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)


  const schedule = (Array.isArray(weeklyEvents) ? weeklyEvents : []).map((event) => ({
    id: event.id,
    day_name: getRelativeDayDescription(event.event_date),
    time_text: formatTime12h(event.event_time),
    title: event.title,
    description: event.description,
    is_active: event.is_active ?? true,
    sort_order: 0,
    event_date: event.event_date,
    event_type: event.event_type,
  }))


  return (
    <>
      <RamadanDecorations />
      <ScrollAnimation>
        <HeroSection data={heroData} />
      </ScrollAnimation>

      {/* Latest Content & Schedule Section */}
      <section className="py-12 lg:py-16 bg-surface relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <ScrollAnimation delay={0.1} className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <LatestContent content={latestContent} />
            <WeeklySchedule schedule={schedule} />
          </ScrollAnimation>
        </div>
      </section>

      <ScrollAnimation delay={0.2}>
        <ExploreSections />
      </ScrollAnimation>

      <ScrollAnimation delay={0.3}>
        <FeaturedBooks books={Array.isArray(books) ? books : []} />
      </ScrollAnimation>

      <ScrollAnimation delay={0.4}>
        <LatestSermons sermons={Array.isArray(sermons) ? sermons : []} />
      </ScrollAnimation>

      <ScrollAnimation delay={0.45}>
        <LatestVideos videos={Array.isArray(videos) ? videos : []} />
      </ScrollAnimation>

      <ScrollAnimation delay={0.5}>
        <NewsletterSection />
      </ScrollAnimation>
    </>
  )
}
