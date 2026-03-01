import { revalidatePath } from "next/cache"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const paths = body.paths || (body.path ? [body.path] : null)

    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      // If no specific paths provided, revalidate common paths
      revalidatePath("/")
      revalidatePath("/articles")
      revalidatePath("/books")
      revalidatePath("/schedule")
      return NextResponse.json({
        success: true,
        message: "Revalidated common paths"
      })
    }

    // Revalidate each path
    for (const path of paths) {
      revalidatePath(path)
    }

    return NextResponse.json({
      success: true,
      message: `Revalidated ${paths.length} paths`,
      paths
    })
  } catch (error) {
    console.error("[v0] Revalidate error:", error)
    return NextResponse.json({ error: "Failed to revalidate" }, { status: 500 })
  }
}

