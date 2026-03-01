import { NextRequest, NextResponse } from 'next/server'
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

function isAllowedDomain(url: string): boolean {
    try {
        const parsedUrl = new URL(url)
        const hostname = parsedUrl.hostname.toLowerCase()
        return ALLOWED_DOMAINS.some(domain =>
            hostname === domain || hostname.endsWith('.' + domain)
        )
    } catch {
        return false
    }
}

export async function POST(request: NextRequest) {
    try {
        const { url, folder = 'books/pdfs' } = await request.json()

        if (!url) {
            return NextResponse.json({ error: 'URL مطلوب' }, { status: 400 })
        }

        // التحقق من النطاق
        if (!isAllowedDomain(url)) {
            return NextResponse.json({ error: 'النطاق غير مسموح به' }, { status: 403 })
        }

        console.log('📥 Importing PDF from:', url)

        // تحميل الملف
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/pdf,*/*',
            },
        })

        if (!response.ok) {
            console.error('❌ Failed to fetch:', response.status)
            return NextResponse.json({ error: 'فشل تحميل الملف من الرابط' }, { status: 500 })
        }

        const buffer = Buffer.from(await response.arrayBuffer())
        console.log('📦 Downloaded size:', buffer.length)

        // التحقق من أنه PDF - check first 20 bytes for %PDF
        const headerBytes = buffer.slice(0, 20)
        const headerString = headerBytes.toString()
        console.log('📄 First 20 bytes hex:', headerBytes.toString('hex'))
        console.log('📄 Header string:', headerString)

        if (!headerString.includes('%PDF')) {
            console.error('❌ Not a valid PDF. Header:', headerString)
            return NextResponse.json({ error: 'الملف ليس PDF صالح', details: headerString.slice(0, 20) }, { status: 400 })
        }

        console.log('✅ PDF validated, size:', buffer.length)

        // استخراج البيانات الوصفية
        let numPages = 0
        try {
            const pdfDoc = await PDFDocument.load(buffer)
            numPages = pdfDoc.getPageCount()
            console.log('📖 PDF has', numPages, 'pages')
        } catch (e) {
            console.error('❌ Failed to parse PDF pages:', e)
            // Continue anyway
        }

        const sizeStr = formatSize(buffer.length)
        const TEN_MB = 10 * 1024 * 1024

        let finalPath = ''
        let publicId = ''

        // Upload to UploadThing
        console.log('📥 Uploading to UploadThing (PDF)...')
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`

        const blob = new Blob([buffer], { type: 'application/pdf' })
        const file = new File([blob], filename, { type: 'application/pdf' })

        const uploadResult = await utapi.uploadFiles([file])

        if (!uploadResult || uploadResult.length === 0 || uploadResult[0].error) {
            throw new Error(uploadResult[0]?.error?.message || 'Upload failed')
        }

        finalPath = uploadResult[0].data?.url
        publicId = uploadResult[0].data?.key // Use Key as PublicId (for tracking generally)

        console.log('✅ Uploaded to UploadThing:', finalPath)

        return NextResponse.json({
            success: true,
            path: finalPath,
            publicId: publicId,
            size: sizeStr,
            pages: numPages
        })

    } catch (error) {
        console.error('❌ Import error:', error)
        return NextResponse.json({
            error: 'فشل استيراد الملف',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
