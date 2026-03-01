import { NextRequest, NextResponse } from "next/server"
import { createPublicClient } from "@/lib/supabase/public"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 API page-count called for book:', id)
    const supabase = createPublicClient()

    // Fetch book to get PDF file path
    const { data: book, error } = await supabase
      .from("books")
      .select("pdf_file_path, cover_image_path")
      .eq("id", id)
      .single()

    console.log('🔍 API fetched book:', { error, hasBook: !!book, pdfPath: book?.pdf_file_path })

    if (error || !book?.pdf_file_path) {
      console.log('🔍 API returning 404 - no PDF found')
      return NextResponse.json({ pageCount: null, error: "Book or PDF not found" }, { status: 404 })
    }

    let pdfUrl = book.pdf_file_path

    // Handle different PDF path formats
    if (book.pdf_file_path.startsWith("http") && book.pdf_file_path.includes("backblazeb2.com")) {
      // Already a B2 signed URL, use it directly
      pdfUrl = book.pdf_file_path
      console.log('🔗 Using B2 signed URL directly:', pdfUrl)
    } else if (book.pdf_file_path.startsWith("uploads/")) {
      // Get signed URL from our API
      try {
        const downloadResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/download?key=${encodeURIComponent(book.pdf_file_path)}`)
        if (downloadResponse.ok) {
          const downloadData = await downloadResponse.json()
          if (downloadData.url) {
            pdfUrl = downloadData.url
            console.log('🔗 Got signed URL from API:', pdfUrl)
          } else {
            throw new Error("No URL in download response")
          }
        } else {
          throw new Error(`Download API returned ${downloadResponse.status}`)
        }
      } catch (e) {
        console.error("Failed to get signed URL:", e)
        return NextResponse.json({ pageCount: null, error: "Could not access PDF file" }, { status: 500 })
      }
    } else if (book.pdf_file_path.startsWith("/api/")) {
      pdfUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${book.pdf_file_path}`
    } else {
      // Assume it's a direct URL
      pdfUrl = book.pdf_file_path
    }

    console.log('📄 Final PDF URL for page count:', pdfUrl)

    let arrayBuffer: ArrayBuffer

    // Handle split files
    if (pdfUrl.startsWith('split:')) {
      console.log('🔗 Split file detected in page count, merging parts...')
      const parts = pdfUrl.replace('split:', '').split('||')

      const responses = await Promise.all(parts.map((url: string) => fetch(url)))
      if (responses.some(r => !r.ok)) {
        throw new Error("Failed to fetch split parts")
      }

      const buffers = await Promise.all(responses.map(r => r.arrayBuffer()))
      const totalSize = buffers.reduce((acc, b) => acc + b.byteLength, 0)

      const finalBuffer = new Uint8Array(totalSize)
      let offset = 0
      for (const buffer of buffers) {
        finalBuffer.set(new Uint8Array(buffer), offset)
        offset += buffer.byteLength
      }
      arrayBuffer = finalBuffer.buffer
    } else {
      // Fetch the PDF to get page count
      const response = await fetch(pdfUrl)
      if (!response.ok) {
        throw new Error("Failed to fetch PDF")
      }
      arrayBuffer = await response.arrayBuffer()
    }
    const pdfBytes = new Uint8Array(arrayBuffer)

    // Parse PDF to get page count (basic parsing without external libraries)
    // Look for the /Count keyword in the PDF trailer
    const pdfString = new TextDecoder("latin1").decode(pdfBytes)
    const countMatch = pdfString.match(/\/Count\s+(\d+)/)

    if (countMatch) {
      const pageCount = parseInt(countMatch[1], 10)
      return NextResponse.json({ pageCount })
    }

    // Alternative: Look for "page" object references
    const pageMatch = pdfString.match(/<<[^>]*\/Type\s*\/Pages[^>]*\/Count\s+(\d+)/)
    if (pageMatch) {
      const pageCount = parseInt(pageMatch[1], 10)
      return NextResponse.json({ pageCount })
    }

    return NextResponse.json({ pageCount: null, error: "Could not determine page count" }, { status: 404 })
  } catch (error) {
    console.error("Error getting page count:", error)
    return NextResponse.json({ pageCount: null, error: "Server error" }, { status: 500 })
  }
}
