import { type NextRequest, NextResponse } from "next/server"
import { createPublicClient } from "@/lib/supabase/public"

export async function POST(request: NextRequest) {
  try {
    const supabase = createPublicClient()
    const { query, contentTypes } = await request.json()

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: "يجب أن يكون البحث على الأقل حرفين" }, { status: 400 })
    }

    const searchQuery = query.trim()
    const types = contentTypes || ["sermons", "lessons", "articles", "books"]
    const results: Record<string, unknown[]> = {}

    const searchPromises = types.map(async (type: string) => {
      try {
        let data = []
        let error = null

        switch (type) {
          case "sermons":
            ({ data, error } = await supabase
              .from("sermons")
              .select("id, title, content, thumbnail_path, created_at")
              .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
              .eq("publish_status", "published")
              .eq("is_active", true)
              .limit(10))
            break

          case "lessons":
            ({ data, error } = await supabase
              .from("lessons")
              .select("id, title, content, thumbnail_path, type, media_source, created_at")
              .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
              .eq("publish_status", "published")
              .eq("is_active", true)
              .limit(10))
            break

          case "articles":
            ({ data, error } = await supabase
              .from("articles")
              .select("id, title, content, thumbnail_path, created_at")
              .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
              .eq("publish_status", "published")
              .eq("is_active", true)
              .limit(10))
            break

          case "books":
            ({ data, error } = await supabase
              .from("books")
              .select("id, title, description, cover_image_path, author, created_at")
              .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
              .eq("publish_status", "published")
              .eq("is_active", true)
              .limit(10))
            break

          default:
            return { type, documents: [] }
        }

        if (error) throw error

        return { type, documents: data || [] }
      } catch (error) {
        console.error(`Error searching ${type}:`, error)
        return { type, documents: [] }
      }
    })

    const searchResults = await Promise.all(searchPromises)
    searchResults.forEach(({ type, documents }) => {
      results[type] = documents
    })

    return NextResponse.json({ results })
  } catch (error) {
    console.error("[v0] Error searching:", error)
    return NextResponse.json({ error: "حدث خطأ في البحث" }, { status: 500 })
  }
}

