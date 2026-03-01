import { createPublicClient } from "@/lib/supabase/public"
import { HeroSection } from "@/about/hero-section"
import { QuoteSection } from "@/about/quote-section"
import { BiographySection } from "@/about/biography-section"
import { StatisticsSection } from "@/about/statistics"
import { Timeline } from "@/about/timeline"
import { AchievementsSection } from "@/about/achievements-section"
import { ExpertiseBadges } from "@/about/expertise-badges"
import { parseTimelineData } from "@/lib/timeline-utils"

export const revalidate = 60

export default async function ModernAboutPage() {
  const supabase = createPublicClient()
  const { data: aboutData } = await supabase.from("about_page").select("*").limit(1).maybeSingle()

  // Default data structure
  const about = {
    sheikh_name: aboutData?.sheikh_name || "",
    sheikh_photo: aboutData?.image_path || "",
    title: aboutData?.title || "",
    position: aboutData?.position || "",
    location: aboutData?.location || "",
    biography: aboutData?.biography || "",
    achievements: aboutData?.achievements || "",
    education: aboutData?.education || "",
    current_positions: aboutData?.positions || "",
    quote_text: aboutData?.quote || aboutData?.quote_text || "",
    quote_author: aboutData?.quote_author || "",
    social_links: aboutData?.social_links || [],
  }

  // Transform social links for HeroSection
  const socialLinks = about.social_links
    .filter((link: any) => link?.platform && link?.url)
    .map((link: any) => ({
      platform: link.platform.toLowerCase(),
      url: link.url,
    }))

  // Parse timeline data from education and positions
  const timelineItems = parseTimelineData(
    about.education,
    about.current_positions,
    about.achievements // Limited to 3 items
  )

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroSection
        sheikhName={about.sheikh_name}
        imagePath={about.sheikh_photo}
        title={about.title}
        position={about.position}
        location={about.location}
        socialLinks={socialLinks}
      />

      {/* Quote Section */}
      <QuoteSection
        quote={about.quote_text}
        quoteText={about.quote_text}
        quoteAuthor={about.quote_author}
      />

      {/* Biography Section */}
      <BiographySection biography={about.biography} />

      {/* Statistics Section */}
      <StatisticsSection />

      {/* Timeline Section */}
      <Timeline items={timelineItems} />

      {/* Achievements Section */}
      <AchievementsSection achievements={about.achievements} />

      {/* Expertise Badges Section */}
      <ExpertiseBadges />
    </main>
  )
}