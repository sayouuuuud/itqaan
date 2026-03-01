import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Home, Search, ChevronLeft } from "lucide-react"
import { BookCoverImage } from "@/components/book-cover-image"
import { BookInteractions } from "@/components/books/book-interactions"
import { stripHtml } from "@/lib/utils/strip-html"
import { getBookOgImage } from "@/lib/utils/og-images"
import { Metadata } from "next"
import { JsonLd } from "@/components/json-ld"
import { generateBookSchema, generateBreadcrumbSchema } from "@/lib/schema-generator"

interface PageProps {
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params
    const supabase = await createClient()
    const { data: book } = await supabase.from("books").select("title, description, cover_image_path, cover_image").eq("id", id).single()

    if (!book) return { title: "الكتاب غير موجود" }

    const ogImage = getBookOgImage(book)

    return {
        title: `${book.title} | الشيخ السيد مراد سلامة`,
        description: book.description ? stripHtml(book.description).slice(0, 160) : undefined,
        openGraph: {
            title: book.title,
            description: book.description ? stripHtml(book.description).slice(0, 160) : undefined,
            images: [ogImage],
            type: "book",
        },
        twitter: {
            card: "summary_large_image",
            title: book.title,
            description: book.description ? stripHtml(book.description).slice(0, 160) : undefined,
            images: [ogImage.url],
        },
    }
}

// Helper functions (Server Side)
const getCoverImageUrl = (book: any) => {
    if (!book) return ""

    if (book.cover_image_path?.includes('/api/download?key=')) {
        try {
            const url = new URL(book.cover_image_path, 'http://localhost:3000')
            const encodedKey = url.searchParams.get('key')
            if (encodedKey) return `/api/download?key=${encodeURIComponent(decodeURIComponent(encodedKey))}`
        } catch (e) { }
    }

    if (book.cover_image_path?.startsWith("uploads/")) {
        return `/api/download?key=${encodeURIComponent(book.cover_image_path)}`
    }

    return book.cover_image_path || book.cover_image || ""
}

const getPdfUrl = (book: any) => {
    if (!book) return ""
    const safeFilename = book.title ? `${book.title}.pdf` : "download.pdf"

    if (book.pdf_type === 'external' && book.pdf_external_url) {
        return `/api/download-pdf?url=${encodeURIComponent(book.pdf_external_url)}&id=${book.id}`
    }

    if (book.pdf_file_path?.startsWith("uploads/")) {
        return `/api/download?key=${encodeURIComponent(book.pdf_file_path)}&download=true&filename=${encodeURIComponent(safeFilename)}&id=${book.id}`
    }

    const originalUrl = book.file_url || book.pdf_file_path
    if (originalUrl?.startsWith("http")) {
        return `/api/download-pdf?url=${encodeURIComponent(originalUrl)}&id=${book.id}`
    }

    return originalUrl || ""
}

const getPdfViewUrl = (book: any) => {
    if (!book) return ""

    if (book.pdf_type === 'external' && book.pdf_external_url) {
        return `/api/download-pdf?url=${encodeURIComponent(book.pdf_external_url)}&inline=true`
    }

    if (book.pdf_file_path?.startsWith('split:')) {
        return `/api/download-pdf?url=${encodeURIComponent(book.pdf_file_path)}&inline=true`
    }

    if (book.pdf_file_path?.startsWith("uploads/")) {
        return `/api/download?key=${encodeURIComponent(book.pdf_file_path)}`
    }

    const originalUrl = book.file_url || book.pdf_file_path
    if (originalUrl?.startsWith('http')) {
        return `/api/download-pdf?url=${encodeURIComponent(originalUrl)}&inline=true`
    }

    return originalUrl || ""
}

export default async function BookDetailPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    // Parallel data fetching
    const [bookResponse, relatedBooksResponse] = await Promise.all([
        supabase.from("books").select("*").eq("id", id).eq("publish_status", "published").single(),
        supabase.from("books").select("id, title, author, cover_image_path, created_at, views_count").eq("publish_status", "published").neq("id", id).limit(4).order("created_at", { ascending: false })
    ])

    const book = bookResponse.data

    // Handle Not Found
    if (!book) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <div className="text-center max-w-md">
                    <div className="text-8xl font-bold text-primary/20 mb-4">404</div>
                    <h1 className="text-3xl font-bold text-foreground mb-4 font-serif">الكتاب غير موجود</h1>
                    <p className="text-muted-foreground mb-8">عذراً، الكتاب الذي تبحث عنه غير موجود أو تم حذفه.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/">
                            <button className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg font-medium transition-colors">
                                <Home className="h-4 w-4" />
                                الرئيسية
                            </button>
                        </Link>
                        <Link href="/books">
                            <button className="flex items-center gap-2 bg-muted hover:bg-accent text-foreground px-6 py-3 rounded-lg font-medium transition-colors border border-border">
                                <Search className="h-4 w-4" />
                                تصفح الكتب
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // Increment views
    await supabase.from("books").update({ views_count: (book.views_count || 0) + 1 }).eq("id", id)

    const relatedBooksData = relatedBooksResponse.data || []

    // Data processing
    const coverImageUrl = getCoverImageUrl(book)
    const pdfUrl = getPdfUrl(book)
    const pdfViewUrl = getPdfViewUrl(book)
    const hasPdf = !!pdfUrl

    // Determine Page Count
    let pageCount = book.pages

    const bookSchema = generateBookSchema({
        title: book.title,
        description: book.description ? stripHtml(book.description) : undefined,
        url: `/books/${book.id}`,
        image: coverImageUrl || undefined,
        authorName: book.author || undefined,
        datePublished: book.publish_year || undefined,
        // isbn: book.isbn // if available
    })

    const breadcrumbSchema = generateBreadcrumbSchema([
        { name: 'الرئيسية', item: '/' },
        { name: 'الكتب', item: '/books' },
        { name: book.title, item: `/books/${book.id}` },
    ])

    return (
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <JsonLd schema={[bookSchema, breadcrumbSchema]} />
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-8 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <Link className="inline-flex items-center hover:text-primary dark:hover:text-secondary" href="/">
                    الرئيسية
                </Link>
                <ChevronLeft className="h-4 w-4 mx-2 text-gray-400" />
                <Link className="hover:text-primary dark:hover:text-secondary" href="/books">
                    الكتب
                </Link>
                <ChevronLeft className="h-4 w-4 mx-2 text-gray-400" />
                <span className="text-primary dark:text-secondary font-medium">{book.title}</span>
            </nav>

            {/* Book Detail Section */}
            <div className="bg-surface rounded-2xl shadow-soft border border-border overflow-hidden mb-16 relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 z-0 pointer-events-none"></div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 p-6 md:p-10 relative z-10">
                    {/* Book Cover */}
                    <div className="lg:col-span-4 flex justify-center lg:justify-start">
                        <div className="relative group w-full aspect-[2/3]">
                            <BookCoverImage
                                coverImagePath={getCoverImageUrl(book)}
                                title={book.title}
                                variant="detail"
                                className="w-full h-full rounded-xl shadow-2xl transform group-hover:-translate-y-2 transition duration-500 object-cover"
                            />
                            {book.publish_year === new Date().getFullYear().toString() && (
                                <div className="absolute top-4 right-4 bg-secondary text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                    جديد
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Book Info */}
                    <div className="lg:col-span-8 flex flex-col justify-center">
                        <div className="mb-2 flex items-center gap-2">
                            <span className="bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5 rounded border border-primary/20">
                                كتب ومراجع
                            </span>
                        </div>

                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-5 leading-tight">
                            {book.title}
                        </h1>

                        <div className="flex items-center mt-5 gap-3 mb-8">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                <span className="material-icons-outlined text-muted-foreground">
                                    person
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-text-muted">المؤلف</span>
                                <span className="text-sm font-semibold text-primary">
                                    بقلم: {book.author || "الشيخ السيد مراد سلامة"}
                                </span>
                            </div>
                        </div>

                        {/* Client Component for Interactions */}
                        <BookInteractions
                            bookId={book.id}
                            bookTitle={book.title}
                            pdfUrl={pdfUrl}
                            pdfViewUrl={pdfViewUrl}
                            hasPdf={hasPdf}
                        />

                        {/* Book Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="material-icons-outlined text-primary text-base">menu_book</span>
                                <span className="text-text-muted">الصفحات:</span>
                                <span className="font-semibold text-foreground">
                                    {pageCount || book.pages || "—"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="material-icons-outlined text-primary text-base">language</span>
                                <span className="text-text-muted">اللغة:</span>
                                <span className="font-semibold text-foreground">
                                    {book.language === "ar" ? "العربية" :
                                        book.language === "en" ? "English" :
                                            book.language === "fr" ? "Français" :
                                                book.language === "ur" ? "اردو" : "العربية"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="material-icons-outlined text-primary text-base">calendar_today</span>
                                <span className="text-text-muted">سنة النشر:</span>
                                <span className="font-semibold text-foreground">
                                    {book.publish_year || "غير محدد"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="material-icons-outlined text-primary text-base">storage</span>
                                <span className="text-text-muted">الحجم:</span>
                                <span className="font-semibold text-foreground">
                                    {book.file_size || (book.pdf_file_path ? "غير محدد" : "غير متاح")}
                                </span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Book Description Section */}
            {book.description && (
                <div className="bg-surface rounded-2xl shadow-soft border border-border overflow-hidden mb-16 relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 z-0 pointer-events-none"></div>
                    <div className="p-6 md:p-10 relative z-10">
                        <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                            <span className="material-icons-outlined text-primary text-3xl">description</span>
                            نبذة عن الكتاب
                        </h3>
                        <div className="prose dark:prose-invert max-w-none">
                            <div
                                className="leading-relaxed text-lg text-foreground"
                                dangerouslySetInnerHTML={{ __html: book.description }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Related Books Section */}
            {relatedBooksData.length > 0 && (
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground relative pr-4">
                            <span className="absolute top-1 right-0 w-1 h-8 bg-secondary rounded-full"></span>
                            كتب ذات صلة
                        </h2>
                        <Link
                            className="text-primary hover:text-secondary font-medium text-sm flex items-center gap-1 transition"
                            href="/books"
                        >
                            عرض المزيد
                            <span className="material-icons-outlined text-sm">arrow_back</span>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {relatedBooksData.map((relatedBook) => (
                            <Link
                                key={relatedBook.id}
                                href={`/books/${relatedBook.id}`}
                                className="group bg-surface rounded-xl border border-border p-4 hover:shadow-xl hover:shadow-primary/5 transition duration-300 flex flex-col items-center text-center"
                            >
                                <BookCoverImage
                                    coverImagePath={getCoverImageUrl(relatedBook)}
                                    title={relatedBook.title}
                                    variant="card"
                                    className="w-full h-64 rounded-lg mb-4 overflow-hidden relative shadow-md group-hover:shadow-lg transition"
                                />
                                <h3 className="font-bold text-lg text-foreground mb-1 group-hover:text-primary transition">
                                    {relatedBook.title}
                                </h3>
                                <p className="text-sm text-text-muted">
                                    {relatedBook.author || "الشيخ السيد مراد سلامة"}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-text-muted mt-2">
                                    <span className="flex items-center gap-1">
                                        <span className="material-icons-outlined text-[12px]">
                                            visibility
                                        </span>
                                        {relatedBook.views_count || 0}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </main>
    )
}
