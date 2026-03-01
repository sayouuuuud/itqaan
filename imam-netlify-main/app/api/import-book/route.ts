import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudinary } from '@/lib/storage/cloudinary'
import { createClient } from '@/lib/supabase/server'
import { PDFDocument } from 'pdf-lib'
import { UTApi } from 'uploadthing/server'

const utapi = new UTApi()

// قائمة النطاقات المسموح بها
const ALLOWED_DOMAINS = [
    'saaid.org',
    'saaid.net',
    'archive.org',
    'waqfeya.com',
    'waqfeya.net',
    'shamela.ws',
    'islamhouse.com',
    'kafrelsheikh-azhar.com',
    'noor-book.com',
    'www.noor-book.com'
]

function formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * تحميل PDF ورفعه إلى Cloudinary
 */
/**
 * تحميل PDF ورفعه إلى UploadThing
 */
async function downloadAndUploadPDF(url: string, folder: string): Promise<{ url: string, size?: string, pages?: number } | null> {
    try {
        if (!url || !url.startsWith('http')) return null

        console.log(`📥 Downloading PDF from:`, url)

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        })

        if (!response.ok) {
            console.error(`❌ Failed to fetch ${url}:`, response.status)
            return null
        }

        const buffer = Buffer.from(await response.arrayBuffer())
        const sizeStr = formatSize(buffer.length)
        let numPages = undefined

        console.log(`📦 Downloaded ${sizeStr}, checking PDF header...`)

        const headerString = buffer.slice(0, 10).toString()
        if (!headerString.includes('%PDF')) {
            console.warn('⚠️ Header does not contain %PDF, might be another format or encrypted:', headerString)
        }

        // Parse PDF pages
        if (buffer.length < 20 * 1024 * 1024) {
            try {
                const pdfDoc = await PDFDocument.load(buffer)
                numPages = pdfDoc.getPageCount()
                console.log(`📖 PDF has ${numPages} pages`)
            } catch (e) {
                console.error('❌ Failed to parse PDF pages:', e)
            }
        }

        // Upload to UploadThing
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`
        console.log(`📤 Uploading PDF to UploadThing: ${filename}`)

        const blob = new Blob([buffer], { type: 'application/pdf' })
        const file = new File([blob], filename, { type: 'application/pdf' })

        const uploadResult = await utapi.uploadFiles([file])

        if (!uploadResult || uploadResult.length === 0 || uploadResult[0].error) {
            console.error('❌ UploadThing upload failed:', uploadResult[0]?.error)
            throw new Error(uploadResult[0]?.error?.message || 'Upload failed')
        }

        const uploadedUrl = uploadResult[0].data?.url
        console.log('✅ PDF uploaded to UploadThing:', uploadedUrl)

        return { url: uploadedUrl, size: sizeStr, pages: numPages }

    } catch (error) {
        console.error(`❌ Error processing PDF:`, error)
        return null
    }
}

/**
 * تحميل صورة ورفعها إلى UploadThing
 */
async function downloadAndUploadImage(url: string): Promise<string | null> {
    try {
        if (!url || !url.startsWith('http')) return null

        console.log(`📥 Downloading image from:`, url)

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/*,*/*',
            },
        })

        if (!response.ok) {
            console.error(`❌ Failed to fetch image:`, response.status)
            return null
        }

        const buffer = Buffer.from(await response.arrayBuffer())
        const contentType = response.headers.get('content-type') || 'image/jpeg'

        // تحديد الامتداد
        let extension = 'jpg'
        if (contentType.includes('png')) extension = 'png'
        else if (contentType.includes('webp')) extension = 'webp'
        else if (url.includes('.webp')) extension = 'webp'
        else if (url.includes('.png')) extension = 'png'

        const filename = `imported_${Date.now()}.${extension}`
        console.log(`📤 Uploading image to UploadThing: ${filename}`)

        const blob = new Blob([buffer], { type: contentType })
        const file = new File([blob], filename, { type: contentType })
        const uploadResult = await utapi.uploadFiles([file])

        if (!uploadResult || uploadResult.length === 0 || uploadResult[0].error) {
            console.error('❌ UploadThing upload failed:', uploadResult[0]?.error)
            return null
        }

        const uploadedUrl = uploadResult[0].data?.ufsUrl || uploadResult[0].data?.url
        console.log('✅ Image uploaded to UploadThing:', uploadedUrl)
        return uploadedUrl || null
    } catch (error) {
        console.error(`❌ Error processing image:`, error)
        return null
    }
}

export async function POST(request: NextRequest) {
    try {
        const bookData = await request.json()
        const supabase = await createClient()

        console.log('📚 Processing book:', bookData.title)

        let pdfUrl = bookData.pdf_file_path
        let coverUrl = bookData.cover_image_path
        let pdfSize = bookData.file_size
        let pdfPages = bookData.pages

        // 1. Handle PDF Import - إذا هناك رابط PDF خارجي، حمّله لـ Cloudinary
        if (bookData.pdf_external_url && bookData.pdf_external_url.startsWith('http')) {
            console.log('📄 Importing PDF from external URL...')
            const result = await downloadAndUploadPDF(bookData.pdf_external_url, 'books/pdfs')
            if (result) {
                pdfUrl = result.url
                pdfSize = result.size
                if (result.pages) {
                    pdfPages = result.pages
                }
                console.log('✅ PDF imported successfully')
            } else {
                console.warn('⚠️ PDF import failed, keeping external URL')
                // Keep as external if import fails
                pdfUrl = null
            }
        }

        // 2. Handle Cover Image Import - إذا هناك رابط صورة، حمّله لـ UploadThing
        if (coverUrl && coverUrl.startsWith('http') && !coverUrl.includes('utfs.io') && !coverUrl.includes('uploadthing')) {
            console.log('🖼️ Importing cover image to UploadThing...')
            const importedCover = await downloadAndUploadImage(coverUrl)
            if (importedCover) {
                coverUrl = importedCover
                console.log('✅ Cover image imported successfully')
            } else {
                console.warn('⚠️ Cover import failed, using original URL')
                // Keep original URL as fallback
            }
        }

        // 3. Prepare Data for Insert
        const insertData: any = {
            title: bookData.title,
            author: bookData.author,
            description: bookData.description,
            cover_image_path: coverUrl,
            publish_status: bookData.publish_status || 'published',
            is_active: bookData.is_active ?? true,
            publish_year: bookData.publish_year,
            language: bookData.language || 'ar',
            pages: pdfPages,
            file_size: pdfSize,
            category_id: bookData.category_id,
        }

        // Handle PDF based on whether import succeeded
        if (pdfUrl) {
            insertData.pdf_file_path = pdfUrl
            insertData.pdf_type = 'local'
            insertData.pdf_external_url = null
        } else if (bookData.pdf_external_url) {
            // Keep as external if import failed
            insertData.pdf_file_path = null
            insertData.pdf_type = 'external'
            insertData.pdf_external_url = bookData.pdf_external_url
        }

        const { error } = await supabase.from("books").insert(insertData)

        if (error) {
            console.error('❌ DB Insert Error:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        console.log('✅ Book imported successfully:', bookData.title)
        return NextResponse.json({ success: true, title: bookData.title })

    } catch (error) {
        console.error('❌ Import error:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
