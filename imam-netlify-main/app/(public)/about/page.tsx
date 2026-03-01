import Link from "next/link"
import { createPublicClient } from "@/lib/supabase/public"
import {
  GraduationCap,
  MapPin,
  BookOpen,
  Youtube,
  Send,
  Facebook,
  MessageCircle,
  Award,
  ArrowLeft,
} from "lucide-react"
import { StatisticsSection } from "@/about/statistics"
import { MissionVisionSection } from "@/components/about/mission-vision-section"
import { JourneyTimeline } from "@/components/about/journey-timeline"
import { SheikhQuotesSection } from "@/components/about/sheikh-quotes-section"

export const revalidate = 0

// Islamic Pattern Component
const IslamicPattern = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={`absolute ${className}`} style={{ width: 200, height: 200 }}>
    <defs>
      <pattern id="islamicGeo" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <g fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3">
          <circle cx="10" cy="10" r="9" />
          <circle cx="10" cy="10" r="6" />
          <path d="M10 1L10 19M1 10L19 10" />
        </g>
      </pattern>
    </defs>
    <rect fill="url(#islamicGeo)" width="100" height="100" />
  </svg>
)

// Map database icon names to component icon types
function mapIconName(icon: string): 'graduation' | 'book' | 'award' | 'work' | 'heart' {
  const iconMap: Record<string, 'graduation' | 'book' | 'award' | 'work' | 'heart'> = {
    'baby': 'heart',
    'book': 'book',
    'graduation': 'graduation',
    'mosque': 'work',
    'globe': 'award',
    'award': 'award',
  }
  return iconMap[icon] || 'graduation'
}


export default async function AboutPage() {
  const supabase = createPublicClient()

  // Fetch all data in parallel
  const [aboutResult, timelineResult, quotesResult, sermonsCount, lessonsCount, booksCount, articlesCount, videosCount] = await Promise.all([
    supabase.from("about_page").select("*").order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from("about_timeline").select("*").eq("is_active", true).order("order_index", { ascending: true }),
    supabase.from("about_quotes").select("*").eq("is_active", true).order("order_index", { ascending: true }),
    supabase.from("sermons").select("id", { count: "exact", head: true }).eq("publish_status", "published"),
    supabase.from("lessons").select("id", { count: "exact", head: true }).eq("publish_status", "published"),
    supabase.from("books").select("id", { count: "exact", head: true }).eq("publish_status", "published"),
    supabase.from("articles").select("id", { count: "exact", head: true }).eq("publish_status", "published"),
    supabase.from("media").select("id", { count: "exact", head: true }).eq("publish_status", "published"),
  ])

  const aboutData = aboutResult.data
  const timelineData = timelineResult.data || []
  const quotesData = quotesResult.data || []

  const counts = {
    sermons: sermonsCount.count || 0,
    lessons: lessonsCount.count || 0,
    books: booksCount.count || 0,
    articles: articlesCount.count || 0,
    videos: videosCount.count || 0,
  }

  // Total content items for Card 2
  const totalContent = counts.sermons + counts.lessons + counts.books + counts.articles + counts.videos

  let socialLinks: Record<string, string> = {}
  if (aboutData?.social_links && Array.isArray(aboutData.social_links)) {
    aboutData.social_links.forEach((link: { platform: string; url: string }) => {
      if (link.platform && link.url) {
        socialLinks[link.platform.toLowerCase()] = link.url
      }
    })
  }

  const about = {
    sheikh_name: aboutData?.sheikh_name || "الشيخ السيد مراد",
    sheikh_photo: aboutData?.image_path || "/islamic-scholar-portrait.jpg",
    title: aboutData?.title || "",
    position: aboutData?.position || "إمام وخطيب ومدرس بالأوقاف المصرية  ",
    location: aboutData?.location || "",
    biography: aboutData?.biography || "",
    mission_text: aboutData?.mission_text || "",
    vision_text: aboutData?.vision_text || "",
    youtube_channel: socialLinks.youtube || "",
    telegram_channel: socialLinks.telegram || "",
    facebook_page: socialLinks.facebook || "",
    whatsapp_channel: socialLinks.whatsapp || "",
  }

  // Transform timeline data for component
  const timelineEvents = timelineData.map((item: any) => ({
    id: item.id,
    year: item.year,
    title: item.title,
    description: item.description || "",
    icon: mapIconName(item.icon),
  }))

  // Transform quotes data for component  
  const quotesList = quotesData.map((item: any) => ({
    id: item.id,
    text: item.quote_text,
    context: item.category,
  }))

  // Transform stats from database to StatisticsSection format
  // Card 1: Years (Admin)
  // Card 2: Students (Re-purposed as Total Content)
  // Card 3: Lectures (Lessons)
  // Card 4: Books (Books)
  // Card 5: Awards (Re-purposed as Sermons)
  // Card 6: Courses (Re-purposed as Videos)
  const statsArray = [
    { id: 'years', label: 'سنوات الخدمة', value: parseInt(aboutData?.stats?.years?.replace(/\D/g, '') || '25'), suffix: '+', icon: 'calendar' as const },
    { id: 'students', label: 'إجمالي المحتوى', value: totalContent, suffix: '+', icon: 'users' as const },
    { id: 'lectures', label: 'محاضرات ودروس', value: counts.lessons, suffix: '+', icon: 'book' as const },
    { id: 'books', label: 'مؤلفات ومراجعات', value: counts.books, icon: 'file' as const },
    { id: 'awards', label: 'خطب منبرية', value: counts.sermons, icon: 'award' as const },
    { id: 'courses', label: 'مرئيات', value: counts.videos, suffix: '+', icon: 'graduation' as const },
  ]

  const socialLinksArray = [
    { icon: Youtube, href: about.youtube_channel, label: "يوتيوب", color: "from-red-500 to-red-600" },
    { icon: Send, href: about.telegram_channel, label: "تليجرام", color: "from-sky-400 to-sky-500" },
    { icon: Facebook, href: about.facebook_page, label: "فيسبوك", color: "from-blue-500 to-blue-600" },
    { icon: MessageCircle, href: about.whatsapp_channel, label: "واتساب", color: "from-green-500 to-green-600" },
  ].filter((link) => link.href)

  return (
    <main className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section - Clean & Modern */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a2018] via-[#0d2818] to-[#1a4d3e]">
          <IslamicPattern className="top-0 right-0 opacity-20 text-white" />
          <IslamicPattern className="bottom-0 left-0 opacity-15 text-white" />

          {/* Floating Particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 bg-[#d4af37] rounded-full opacity-20"
                style={{
                  left: `${10 + i * 12}%`,
                  top: `${20 + (i % 3) * 25}%`,
                  animation: `float ${8 + i * 2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.5}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Bottom Wave - overlaps to prevent visible line */}
        <div className="absolute -bottom-1 left-0 right-0 z-20">
          <svg viewBox="0 0 1440 100" className="w-full h-auto block" preserveAspectRatio="none" style={{ marginBottom: '-2px' }}>
            <path
              className="fill-background"
              d="M0,50 C300,100 600,0 900,50 C1200,100 1350,30 1440,50 L1440,100 L0,100 Z"
            />
          </svg>
        </div>


        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20">
          <div className="flex flex-col-reverse lg:flex-row items-center gap-8 lg:gap-16">
            {/* Text Content */}
            <div className="lg:w-1/2 text-white animate-fade-in text-center lg:text-right">
              {/* Back Link */}


              {/* Badge */}
              <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-[#d4af37]/10 backdrop-blur-sm rounded-full border border-[#d4af37]/30 mb-8">
                <Award className="w-5 h-5 text-[#d4af37]" />
                <span className="text-[#d4af37] font-medium text-sm">عن فضيلة الشيخ</span>
              </div>

              {/* Name */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold font-['Cairo'] leading-tight mb-4 relative">
                <span className="relative z-10">{about.sheikh_name}</span>
              </h1>

              {/* Position */}
              {about.position && (
                <p className="text-xl md:text-2xl lg:text-3xl text-[#d4af37] mb-4 font-['Amiri']">
                  {about.position}
                </p>
              )}

              {/* Location */}
              {about.location && (
                <div className="flex items-center justify-center lg:justify-start gap-2 text-emerald-200/80 mb-8">
                  <MapPin className="h-5 w-5 text-[#d4af37]" />
                  <span>{about.location}</span>
                </div>
              )}

              {/* Divider */}
              <div className="w-24 h-0.5 bg-gradient-to-r from-[#d4af37] to-transparent rounded-full mb-8 mx-auto lg:mx-0" />

              {/* Social Links */}
              {socialLinksArray.length > 0 && (
                <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                  {socialLinksArray.map((link, index) => (
                    <a
                      key={index}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${link.color} flex items-center justify-center`}>
                        <link.icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium">{link.label}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Image */}
            <div className="lg:w-1/2 flex justify-center animate-fade-in-delayed mb-8 lg:mb-0">
              <div className="relative">
                {/* Decorative Frame */}
                <div className="absolute -inset-4 border border-[#d4af37]/20 rounded-[2rem]" />
                <div className="absolute -inset-8 border border-[#d4af37]/10 rounded-[2.5rem]" />

                {/* Main Image */}
                <div className="relative w-72 h-80 sm:w-80 sm:h-96 md:w-96 md:h-[450px] lg:w-[420px] lg:h-[520px] rounded-[2rem] overflow-hidden shadow-2xl shadow-emerald-900/30">
                  <img
                    src={about.sheikh_photo?.startsWith('http') ? about.sheikh_photo : "/placeholder.svg"}
                    alt={about.sheikh_name}
                    className="w-full h-full object-cover"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a2018]/70 via-transparent to-transparent" />

                  {/* Bottom Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-[#0a2018] to-transparent">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#d4af37] flex items-center justify-center">
                        <Award className="w-4 h-4 sm:w-5 sm:h-5 text-[#0a2018]" />
                      </div>
                      <div>
                        <p className="text-white font-['Cairo'] font-semibold text-xs sm:text-sm">{about.position}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Badge */}
                <div className="absolute -top-4 -right-4 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#d4af37] to-[#b8941f] rounded-full flex items-center justify-center shadow-lg animate-bounce-slow">
                  <Award className="w-6 h-6 sm:w-7 sm:h-7 text-[#0a2018]" />
                </div>
              </div>
            </div>
          </div>
        </div>


      </section>

      {/* Statistics Section */}
      {statsArray.length > 0 ? (
        <StatisticsSection statistics={statsArray} />
      ) : (
        <StatisticsSection />
      )}

      {/* Mission & Vision Section */}
      <MissionVisionSection
        mission={about.mission_text || undefined}
        vision={about.vision_text || undefined}
      />

      {/* Journey Timeline */}
      {timelineEvents.length > 0 && (
        <JourneyTimeline events={timelineEvents} />
      )}
      {timelineEvents.length === 0 && (
        <JourneyTimeline />
      )}

      {/* Biography Section - Simplified */}
      {about.biography && (
        <section className="py-20 bg-gradient-to-b from-background via-background-alt/20 to-background">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="w-12 h-[2px] bg-gradient-to-r from-transparent to-secondary" />
                <BookOpen className="w-5 h-5 text-secondary" />
                <div className="w-12 h-[2px] bg-gradient-to-l from-transparent to-secondary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-primary dark:text-secondary font-['Cairo']">
                السيرة الذاتية
              </h2>
            </div>

            <div className="relative bg-card rounded-3xl shadow-lg border border-border/50 p-8 md:p-12">
              {/* Decorative Elements */}
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary/20 rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary/20 rounded-bl-lg" />

              <div
                className="text-lg text-text-muted leading-8 font-['Cairo']"
                dangerouslySetInnerHTML={{ __html: about.biography }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Sheikh Quotes Section */}
      {quotesList.length > 0 ? (
        <SheikhQuotesSection quotes={quotesList} sheikhName={about.sheikh_name} />
      ) : (
        <SheikhQuotesSection sheikhName={about.sheikh_name} />
      )}
    </main>
  )
}

