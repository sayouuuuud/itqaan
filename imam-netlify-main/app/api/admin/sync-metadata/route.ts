import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { PDFDocument } from 'pdf-lib'

export const runtime = "nodejs"

function formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getS3Client() {
    return new S3Client({
        region: process.env.B2_REGION || "us-east-1",
        endpoint: process.env.B2_S3_ENDPOINT!,
        credentials: {
            accessKeyId: process.env.B2_KEY_ID!,
            secretAccessKey: process.env.B2_APPLICATION_KEY!,
        },
        forcePathStyle: true,
    })
}

async function getB2FileBuffer(key: string): Promise<{ data: Buffer | null, error?: string }> {
    const s3 = getS3Client()
    const bucket = process.env.B2_BUCKET
    const decodedKey = decodeURIComponent(key)
    
    console.log("⬇️ Downloading from B2:", decodedKey)

    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: decodedKey,
    })

    try {
        // Attempt 1: Direct Download
        const response = await s3.send(command)
        if (response.Body) {
             const byteArray = await response.Body.transformToByteArray()
             return { data: Buffer.from(byteArray) }
        }
    } catch (directError: any) {
        const errorMsg = directError.message || JSON.stringify(directError)
        console.warn("⚠️ Direct download failed:", errorMsg)

        // Check for Quota/Limit errors
        if (errorMsg.includes("bandwidth") || errorMsg.includes("transaction") || errorMsg.includes("Cap exceeded")) {
             return { data: null, error: "⚠️ وصل حساب B2 إلى الحد اليومي (Bandwidth/Transaction Cap). يرجى المحاولة غداً أو ترقية الحساب." }
        }
        
        // Attempt 2: Signed URL Fallback
        try {
            console.log("🔄 Fallback: Signed URL")
            const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 })
            
            const urlResponse = await fetch(signedUrl)
            if (!urlResponse.ok) {
                 const text = await urlResponse.text()
                 if (text.includes("bandwidth") || text.includes("transaction")) {
                     return { data: null, error: "⚠️ وصل حساب B2 إلى الحد اليومي." }
                 }
                 return { data: null, error: `Fallback failed: ${urlResponse.status}` }
            }
            return { data: Buffer.from(await urlResponse.arrayBuffer()) }

        } catch (signError: any) {
             const msg = directError.$metadata ? `AWS Error: ${directError.name} (${directError.$metadata.httpStatusCode})` : directError.message
            return { data: null, error: msg }
        }
    }
    
    return { data: null, error: "Unknown download error" }
}

async function getUrlBuffer(url: string): Promise<{ data: Buffer | null, error?: string }> {
    try {
        console.log("⬇️ Downloading from URL:", url)
        const response = await fetch(url)
        if (!response.ok) {
            return { data: null, error: `HTTP ${response.status}: ${response.statusText}` }
        }
        return { data: Buffer.from(await response.arrayBuffer()) }
    } catch (error: any) {
        console.error("❌ URL Download Error:", error)
        return { data: null, error: error.message }
    }
}

export async function POST(request: NextRequest) {
    console.log("🔄 Sync request received")

    try {
        const body = await request.json()
        const { bookId } = body
        console.log("📚 Syncing Book ID:", bookId)

        const supabase = await createClient()

        if (!bookId) {
            return NextResponse.json({ error: "Book ID required" }, { status: 400 })
        }

        // 1. Fetch Book
        const { data: book, error: fetchError } = await supabase
            .from("books")
            .select("*")
            .eq("id", bookId)
            .single()

        if (fetchError || !book) {
            return NextResponse.json({ error: "Book not found" }, { status: 404 })
        }

        console.log("📄 Found book:", book.title)

        // 2. Get File Buffer
        let result: { data: Buffer | null, error?: string } = { data: null, error: "No file path" }
        // const origin = request.nextUrl.origin // Removed as per instruction

        if (book.pdf_file_path?.startsWith('uploads/')) {
            result = await getB2FileBuffer(book.pdf_file_path)
        } else if (book.pdf_file_path?.startsWith('http')) {
            result = await getUrlBuffer(book.pdf_file_path)
        } else if (book.pdf_external_url) {
            result = await getUrlBuffer(book.pdf_external_url)
        }

        if (!result.data) {
            console.error(`❌ Download failed for ${book.title}:`, result.error)
            return NextResponse.json({ error: result.error || "Could not retrieve file content" }, { status: 400 })
        }

        const buffer = result.data
        console.log("✅ File retrieved. Size:", buffer.length)

        // 3. Extract Metadata
        const sizeStr = formatSize(buffer.length)
        let numPages = 0
        let parseError = null

        try {
            console.log("📊 Parsing PDF...")
            const pdfDoc = await PDFDocument.load(buffer)
            numPages = pdfDoc.getPageCount()
            console.log("✅ Parsed PDF. Pages:", numPages)
        } catch (e: any) { // Type as any for error
            console.error("❌ PDF Parse Error:", e)
            parseError = e?.message || "Unknown parse error"
        }

        // 4. Update Database
        const updates: any = {
            file_size: sizeStr
        }
        if (numPages > 0) {
            updates.pages = numPages
        }

        const { error: updateError } = await supabase
            .from("books")
            .update(updates)
            .eq("id", bookId)

        if (updateError) {
            console.error("❌ DB Update Error:", updateError)
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        console.log("✅ Sync complete for:", book.title)

        return NextResponse.json({
            success: true,
            pages: numPages,
            size: sizeStr,
            parseError: parseError
        })

    } catch (error: any) { // Type as any for error
        console.error("❌ Critical Sync error:", error)
        return NextResponse.json({
            success: false,
            error: error?.message || "Unknown error"
        }, { status: 500 })
    }
}
