import { type NextRequest, NextResponse } from "next/server"


// IMPORTANT: This route handles legacy B2 downloads and proxying
// It also handles DOWNLOAD COUNTING logic

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const key = searchParams.get("key")
        const format = searchParams.get("format")
        const isDownload = searchParams.get("download") === "true"
        const id = searchParams.get("id") // Book ID from valid download links
        const filename = searchParams.get("filename")
        const table = searchParams.get("table") || "books"

        console.log('📥 Download API called:', { key, format, isDownload, id })

        if (!key) {
            if (format === "json") {
                return NextResponse.json({ success: false, error: "Missing key" }, { status: 400 })
            }
            return new NextResponse("Missing key", { status: 400 })
        }

        // --- Logic: Increment Download Count ---
        if (isDownload && id) {
            // Fire and forget (or await if critical)
            const supabase = await createClient()
            try {
                // RPC call with dynamic table name
                const { error } = await supabase.rpc('increment_downloads', { row_id: id, table_name: table })

                if (error) {
                    console.warn(`RPC increment_downloads failed for ${table}:${id}, trying manual update. Error:`, error)
                    // Fallback: manual update if RPC missing
                    // We only support manual update for known tables where we know the column name is 'downloads_count'
                    if (['books', 'lessons', 'sermons'].includes(table)) {
                        const { data: item } = await supabase.from(table).select('download_count').eq('id', id).single()
                        if (item) {
                            await supabase.from(table).update({ download_count: (item.download_count || 0) + 1 }).eq('id', id)
                        }
                    }
                }


            } catch (err) {
                console.error("Failed to increment download count:", err)
            }
        }

        // --- Logic: Serve File ---

        // 1. Direct URL (UploadThing/Cloudinary)
        if (key.startsWith('http://') || key.startsWith('https://')) {
            return NextResponse.redirect(key)
        }

        // 2. B2 / Local Uploads (Legacy)
        if (key.startsWith('uploads/')) {
            // Fallback logic from previous state (assumed)
            // Before bandwidth feature, we simply redirected to B2 public URL
        }

        return NextResponse.redirect(`https://f005.backblazeb2.com/file/sheikh-sayed-public/${key}`)

    } catch (error: any) {
        console.error("Error in download API:", error)
        return NextResponse.json({ error: "Server Error" }, { status: 500 })
    }
}
