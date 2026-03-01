import { createPublicClient } from "@/lib/supabase/public"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createPublicClient()

    // Fetch all content for sitemap
    const [sermons, lessons, articles, books, seoSettings] = await Promise.all([
      supabase.from("sermons").select("id, slug, updated_at").eq("publish_status", "published"),
      supabase.from("lessons").select("id, slug, updated_at").eq("publish_status", "published"),
      supabase.from("articles").select("id, slug, updated_at").eq("publish_status", "published"),
      supabase.from("books").select("id, slug, updated_at").eq("is_active", true),
      supabase.from("seo_settings").select("page_path, priority"),
    ])

    // Generate sitemap content
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
 <url>
<loc>${baseUrl}</loc>
<priority>1.0</priority>
<changefreq>daily</changefreq>
</url>

 <url>
<loc>${baseUrl}/khutba</loc>
<priority>0.9</priority>
<changefreq>weekly</changefreq>
</url>

 <url>
<loc>${baseUrl}/dars</loc>
<priority>0.9</priority>
<changefreq>weekly</changefreq>
</url>

 <url>
<loc>${baseUrl}/articles</loc>
<priority>0.8</priority>
<changefreq>weekly</changefreq>
</url>

 <url>
<loc>${baseUrl}/books</loc>
<priority>0.8</priority>
<changefreq>monthly</changefreq>
</url>

 <url>
<loc>${baseUrl}/about</loc>
<priority>0.7</priority>
<changefreq>monthly</changefreq>
</url>
`

    // Add sermons
    sermons.data?.forEach((sermon) => {
      sitemap += ` <url>
<loc>${baseUrl}/khutba/${sermon.id}</loc>
<lastmod>${new Date(sermon.updated_at).toISOString()}</lastmod>
<priority>0.8</priority>
</url>
`
    })

    // Add lessons
    lessons.data?.forEach((lesson) => {
      sitemap += ` <url>
<loc>${baseUrl}/dars/${lesson.id}</loc>
<lastmod>${new Date(lesson.updated_at).toISOString()}</lastmod>
<priority>0.8</priority>
</url>
`
    })

    // Add articles
    articles.data?.forEach((article) => {
      sitemap += ` <url>
<loc>${baseUrl}/articles/${article.id}</loc>
<lastmod>${new Date(article.updated_at).toISOString()}</lastmod>
<priority>0.7</priority>
</url>
`
    })

    // Add books
    books.data?.forEach((book) => {
      sitemap += ` <url>
<loc>${baseUrl}/books/${book.id}</loc>
<lastmod>${new Date(book.updated_at).toISOString()}</lastmod>
<priority>0.7</priority>
</url>
`
    })

    sitemap += `</urlset>`

    return NextResponse.json({
      success: true,
      message: "Sitemap generated successfully"
    })
  } catch (error: any) {
    console.error("[v0] Sitemap generation error:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "حدث خطأ في إنشاء خريطة الموقع"
    }, { status: 500 })
  }
}

