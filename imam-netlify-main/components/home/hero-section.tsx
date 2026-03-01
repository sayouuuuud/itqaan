import Link from "next/link"
import Image from "next/image"
import { createPublicClient } from "@/lib/supabase/public"

interface HeroData {
  hadith_text: string | null
  hadith_translation: string | null
  hadith_explanation: string | null
  hadith_button_text: string | null
  hadith_button_link: string | null
  book_custom_text: string | null
  book_button_text: string | null
  button_link: string | null
  notice_text: string | null
  notice_link: string | null
  notice_active: boolean | null
  important_notice: string | null
  important_notice_link: string | null
  show_important_notice: boolean | null
  featured_book_id: string | null
  underline_text: string | null
}

interface FeaturedBook {
  id: string
  title: string
  cover_image_path: string | null
  author: string | null
}

interface HeroSectionProps {
  data: HeroData | null
}

function parseUnderlinedText(text: string, underlineText: string | null): string {
  if (!underlineText || !underlineText.trim()) return text
  // Escape special regex characters in underlineText
  const escaped = underlineText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return text.replace(
    new RegExp(`(${escaped})`, "g"),
    '<span class="underline decoration-secondary decoration-2 underline-offset-4">$1</span>',
  )
}

export async function HeroSection({ data }: HeroSectionProps) {
  const supabase = createPublicClient()

  let featuredBook: FeaturedBook | null = null
  let bookImageUrl: string | null = null

  if (data?.featured_book_id && data.featured_book_id !== "none") {
    try {
      const { data: bookData, error } = await supabase
        .from("books")
        .select("id, title, cover_image_path, author")
        .eq("id", data.featured_book_id)
        .single()

      if (!error && bookData) {
        featuredBook = bookData
        if (bookData.cover_image_path) {
          if (bookData.cover_image_path.startsWith("uploads/")) {
            bookImageUrl = `/api/download?key=${encodeURIComponent(bookData.cover_image_path)}`
          } else {
            bookImageUrl = bookData.cover_image_path
          }
        }
      }
    } catch (err) {
      console.error("خطأ في جلب الكتاب:", err)
    }
  }

  const heroData = {
    hadith_text: data?.hadith_text || "من سلك طريقاً يلتمس فيه علماً سهل الله له به طريقاً إلى الجنة",
    hadith_translation: data?.hadith_translation || "رواه مسلم",
    hadith_explanation:
      data?.hadith_explanation ||
      "حديث عظيم يبين فضل طلب العلم والسعي في تحصيله، وأن الله يسهل لطالب العلم طريقه إلى الجنة",
    hadith_button_text: data?.hadith_button_text || "اقرأ المزيد",
    hadith_button_link: data?.hadith_button_link || "/articles",
    book_custom_text: data?.book_custom_text || "أحدث إصدارات الشيخ",
    book_button_text: data?.book_button_text || "تصفح الكتب",
    button_link: data?.button_link || "/books",
    notice_text: data?.important_notice || data?.notice_text || null,
    notice_link: data?.important_notice_link || data?.notice_link || null,
    notice_active: data?.show_important_notice ?? data?.notice_active ?? false,
    underline_text: data?.underline_text || null,
  }

  const hadithText = heroData.hadith_text?.trim() || ""

  return (
    <header className="relative overflow-hidden py-16 lg:py-24 bg-background">
      {/* Smooth gradient blend overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-48 from-surface via-background/30 to-transparent pointer-events-none" />

      {heroData.notice_active && heroData.notice_text && (
        <div className="bg-secondary/10 dark:bg-secondary/20 border-b border-secondary/20 absolute top-0 left-0 right-0 z-20 overflow-hidden h-10 md:h-12 flex items-center" dir="ltr">
          {/* dir="ltr" is essential here for the negative translate animation to work correctly in RTL document */}
          <div className="animate-scroll flex">
            {/* First Set of Content */}
            <div className="flex items-center gap-12 px-6 shrink-0">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={`set1-${i}`} className="flex items-center gap-2 text-center">
                  {/* Emoji Removed */}
                  {heroData.notice_link ? (
                    <Link
                      href={heroData.notice_link}
                      className="text-sm md:text-base font-medium text-foreground hover:underline whitespace-nowrap"
                    >
                      {heroData.notice_text}
                    </Link>
                  ) : (
                    <span className="text-sm md:text-base font-medium text-foreground whitespace-nowrap">{heroData.notice_text}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Second Set of Content (Duplicate for Seamless Loop) */}
            <div className="flex items-center gap-12 px-6 shrink-0">
              {Array.from({ length: 100 }).map((_, i) => (
                <div key={`set2-${i}`} className="flex items-center gap-2 text-center">
                  {/* Emoji Removed */}
                  {heroData.notice_link ? (
                    <Link
                      href={heroData.notice_link}
                      className="text-sm md:text-base font-medium text-foreground hover:underline whitespace-nowrap"
                    >
                      {heroData.notice_text}
                    </Link>
                  ) : (
                    <span className="text-sm md:text-base font-medium text-foreground whitespace-nowrap">{heroData.notice_text}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={heroData.notice_active && heroData.notice_text ? "pt-12" : ""}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
            {/* Content */}
            <div className="flex-1 text-center lg:text-right space-y-8 lg:space-y-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-card px-4 py-2 rounded-full border border-border shadow-sm transition-all duration-300 group-hover:shadow-md">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                <span className="text-sm text-secondary font-medium">حديث اليوم</span>
              </div>

              <h1
                className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl leading-relaxed font-medium text-foreground font-serif w-full"
                dangerouslySetInnerHTML={{
                  __html: parseUnderlinedText(hadithText, heroData.underline_text),
                }}
              />

              {/* Description - from database */}
              <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto lg:mx-0">
                {heroData.hadith_explanation}
              </p>

              {/* Source - from database */}
              <p className="text-sm text-secondary font-medium flex items-center justify-center lg:justify-start gap-2">
                <span className="material-icons-outlined text-sm">format_quote</span>
                {heroData.hadith_translation}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <Link
                  href={heroData.hadith_button_link}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg font-medium group"
                >
                  <span className="material-icons-outlined text-xl group-hover:scale-110 transition-transform">
                    menu_book
                  </span>
                  {heroData.hadith_button_text}
                </Link>
                <Link
                  href="/dars"
                  className="flex items-center gap-2 bg-card border border-border text-card-foreground px-8 py-3.5 rounded-xl hover:bg-accent transition-all duration-300 shadow-sm hover:shadow-md text-lg font-medium group"
                >
                  <span className="material-icons-outlined text-xl group-hover:scale-110 transition-transform">
                    play_circle
                  </span>
                  استمع للدرس
                </Link>
              </div>
            </div>

            {/* Featured Book - Now properly shows book image from database */}
            <div className="flex-shrink-0 relative group">
              <div className="absolute inset-0 bg-primary opacity-20 blur-3xl rounded-full transform scale-90 group-hover:scale-100 transition duration-700"></div>
              <div className="relative bg-card p-4 rounded-2xl shadow-xl border border-border">
                {bookImageUrl ? (
                  <div className="relative w-[280px] sm:w-[320px] h-[400px] sm:h-[460px] rounded-xl overflow-hidden">
                    <Image
                      src={bookImageUrl}
                      alt={featuredBook?.title || ""}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 280px, 320px"
                      priority
                    />
                  </div>
                ) : (
                  <div className="relative bg-gradient-to-br from-primary to-primary-hover w-[280px] sm:w-[320px] h-[400px] sm:h-[460px] rounded-xl shadow-inner flex flex-col items-center justify-center text-center p-8 border-[8px] border-primary-hover/50">
                    <div className="absolute inset-4 border border-secondary/30 rounded-lg pointer-events-none"></div>
                    <div className="absolute inset-6 border border-secondary/20 rounded pointer-events-none"></div>

                    <span className="text-secondary text-xs font-medium tracking-widest mb-4 uppercase">
                      {heroData.book_custom_text}
                    </span>
                    <h2 className="text-primary-foreground text-4xl sm:text-5xl font-serif font-bold mb-1">فقه</h2>
                    <h2 className="text-primary-foreground text-4xl sm:text-5xl font-serif font-bold mb-6">السنة</h2>
                    <div className="w-16 h-0.5 bg-secondary mb-6"></div>
                    <p className="text-muted text-sm">دراسة منهجية</p>

                    <div className="absolute left-0 top-4 bottom-4 w-4 bg-gradient-to-r from-black/20 to-transparent rounded-l-lg"></div>
                  </div>
                )}

                {/* View Book Link */}
                <Link
                  href={featuredBook ? `/books/${featuredBook.id}` : heroData.button_link}
                  className="mt-4 flex items-center justify-center gap-2 text-primary dark:text-secondary font-medium cursor-pointer hover:underline py-2 group/link"
                >
                  <span className="material-icons-outlined text-sm group-hover/link:scale-110 transition-transform">
                    visibility
                  </span>
                  <span className="text-sm">{heroData.book_button_text}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

