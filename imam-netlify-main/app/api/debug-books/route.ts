import { NextResponse } from "next/server"
import { createPublicClient } from "@/lib/supabase/public"

export async function GET() {
  try {
    const supabase = createPublicClient()

    // Get all books with cover image paths
    const { data: books, error } = await supabase
      .from("books")
      .select("id, title, cover_image_path, cover_image")
      .not("cover_image_path", "is", null)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Analyze the data
    const analysis = books.map(book => ({
      id: book.id,
      title: book.title,
      cover_image_path: book.cover_image_path,
      cover_image: book.cover_image,
      issues: {
        startsWithHttp: book.cover_image_path?.startsWith("http"),
        containsApiDownload: book.cover_image_path?.includes("/api/download"),
        startsWithUploads: book.cover_image_path?.startsWith("uploads/"),
        looksLikeSignedUrl: book.cover_image_path?.includes("X-Amz-Algorithm"),
        containsB2Url: book.cover_image_path?.includes("backblazeb2.com"),
      },
      recommendedFix: getRecommendedFix(book.cover_image_path)
    }))

    function getRecommendedFix(path?: string): string {
      if (!path) return "No path"

      // Case 1: Malformed URL containing API path
      if (path.includes("/api/download?key=")) {
        try {
          const url = new URL(path, "http://localhost:3000")
          const encodedKey = url.searchParams.get("key")
          if (encodedKey) {
            return decodeURIComponent(encodedKey)
          }
        } catch (e) {
          return "Failed to extract key from API URL"
        }
      }

      // Case 2: B2 signed URL - extract the uploads path
      if (path.startsWith("http") && path.includes("backblazeb2.com")) {
        try {
          const url = new URL(path)
          const pathParts = url.pathname.split("/")
          const uploadsIndex = pathParts.findIndex(part => part === "uploads")
          if (uploadsIndex !== -1) {
            return pathParts.slice(uploadsIndex).join("/")
          }
        } catch (e) {
          return "Failed to parse B2 signed URL"
        }
      }

      // Case 3: Already correct uploads path
      if (path.startsWith("uploads/")) {
        return "Path looks correct"
      }

      // Case 4: Other HTTP URLs (external images)
      if (path.startsWith("http")) {
        return "External URL - will be used as-is"
      }

      return "Unknown path format"
    }

    return NextResponse.json({
      totalBooks: books.length,
      analysis,
      summary: {
        totalIssues: analysis.filter(a => a.issues.containsApiDownload || a.issues.looksLikeSignedUrl).length,
        booksWithApiUrls: analysis.filter(a => a.issues.containsApiDownload).length,
        booksWithSignedUrls: analysis.filter(a => a.issues.looksLikeSignedUrl).length,
      }
    })

  } catch (error) {
    console.error("Debug books error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST() {
  try {
    const supabase = createPublicClient()

    // Get all books with problematic paths
    const { data: books, error: fetchError } = await supabase
      .from("books")
      .select("id, title, cover_image_path")
      .not("cover_image_path", "is", null)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    let fixedCount = 0
    const fixes = []

    for (const book of books) {
      let newPath = book.cover_image_path
      let needsUpdate = false

      // Fix malformed API URLs
      if (book.cover_image_path.includes("/api/download?key=")) {
        try {
          const url = new URL(book.cover_image_path, "http://localhost:3000")
          const encodedKey = url.searchParams.get("key")
          if (encodedKey) {
            newPath = decodeURIComponent(encodedKey)
            needsUpdate = true
          }
        } catch (e) {
          console.error(`Failed to fix ${book.id}: ${e.message}`)
        }
      }
      // Fix B2 signed URLs (both with and without X-Amz-Algorithm)
      else if (book.cover_image_path.startsWith("http") &&
               book.cover_image_path.includes("backblazeb2.com")) {
        try {
          const url = new URL(book.cover_image_path)
          const pathParts = url.pathname.split("/")
          const uploadsIndex = pathParts.findIndex(part => part === "uploads")
          if (uploadsIndex !== -1) {
            newPath = pathParts.slice(uploadsIndex).join("/")
            needsUpdate = true
          }
        } catch (e) {
          console.error(`Failed to fix B2 URL for ${book.id}: ${e.message}`)
        }
      }

      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from("books")
          .update({ cover_image_path: newPath })
          .eq("id", book.id)

        if (!updateError) {
          fixedCount++
          fixes.push({
            id: book.id,
            title: book.title,
            oldPath: book.cover_image_path,
            newPath
          })
        } else {
          console.error(`Failed to update ${book.id}:`, updateError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      fixedCount,
      fixes
    })

  } catch (error) {
    console.error("Fix books error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Test if a file exists in B2
export async function PUT(request: NextRequest) {
  try {
    const { fileKey } = await request.json()

    if (!fileKey) {
      return NextResponse.json({ error: "fileKey is required" }, { status: 400 })
    }

    console.log('Testing file existence:', fileKey)

    // Try to get a signed URL - if it works, file exists
    const response = await fetch(`${request.nextUrl.origin}/api/download?key=${encodeURIComponent(fileKey)}&format=json`)

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        exists: true,
        fileKey,
        signedUrl: data.url,
        urlLength: data.url?.length || 0
      })
    } else {
      return NextResponse.json({
        exists: false,
        fileKey,
        error: `HTTP ${response.status}: ${response.statusText}`
      })
    }

  } catch (error) {
    console.error("Test file error:", error)
    return NextResponse.json({
      exists: false,
      fileKey,
      error: error.message
    }, { status: 500 })
  }
}
