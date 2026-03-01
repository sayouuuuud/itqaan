"use client"

import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { stripHtml } from "@/lib/utils/strip-html"
import { BookCoverImage } from "@/components/book-cover-image"

interface Book {
  id: string
  title: string
  author: string
  description: string
  cover_image_path: string | null
  pdf_file_path: string | null
  download_count: number
}

interface FeaturedBooksProps {
  books: Book[]
}

// Book cover colors for visual variety - using CSS variables
const bookColors = [
  { bg: "bg-card", border: "border-l-border" },
  { bg: "bg-muted", border: "border-l-border" },
  { bg: "bg-accent", border: "border-l-accent" },
  { bg: "bg-surface", border: "border-l-border" },
]

export function FeaturedBooks({ books }: FeaturedBooksProps) {

  const handleDownload = async (bookId: string, currentCount: number) => {
    const supabase = createClient()
    await supabase
      .from("books")
      .update({ download_count: currentCount + 1 })
      .eq("id", bookId)
  }

  const getExcerpt = (description: string | null, maxLength = 100) => {
    if (!description) {
      return ""
    }

    const plainText = stripHtml(description)
    if (plainText.length <= maxLength) {
      return plainText
    }
    return plainText.substring(0, maxLength) + "..."
  }
  return (<section className="py-16 bg-surface relative">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      {/* Header */} <div className="flex justify-between items-end mb-12">
        <div>
          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full mb-3 inline-block">
            المكتبة العلمية </span>
          <h2 className="text-4xl font-bold font-serif text-foreground">
            أحدث المؤلفات</h2>
        </div>

        <Link href="/books" className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-primary bg-card px-4 py-2 rounded-lg text-sm border border-border transition-all duration-300 hover:shadow-md" >
          عرض كل المؤلفات <span className="material-icons-outlined text-sm rtl-flip">
            arrow_right_alt</span>
        </Link>

      </div>

      {/* Books Grid */} {books.length === 0 ? (<p className="text-gray-600 dark:text-gray-400 text-center py-12">
        لا توجد كتب حالياً</p>

      ) : (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {books.map((book, index) => {
          const colors = bookColors[index % bookColors.length]
          return (<div key={book.id}
            className="group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl h-full flex flex-col">
            {/* Book Cover - Clickable to detail page */} <Link href={`/books/${book.id}`}>
              <div className="relative bg-muted p-6 rounded-t-2xl flex justify-center items-center h-64 transition-all duration-300 group-hover:bg-accent cursor-pointer">
                {book.cover_image_path ? (<BookCoverImage coverImagePath={book.cover_image_path}
                  title={book.title}
                  variant="admin" className="w-32 h-48 shadow-2xl" />
                ) : (<div className={`w-32 h-48 ${colors.bg} shadow-2xl relative rounded-sm flex flex-col items-center justify-center text-center p-4 border-l-4 ${colors.border}`} >
                  <div className="border border-secondary absolute inset-2 opacity-50">
                  </div>
                  <span className="text-[8px] text-primary mb-4">
                    كتاب</span>
                  <h4 className="text-card-foreground font-serif text-xl mb-1">
                    {book.title}</h4>
                  <span className="text-[8px] text-gray-500 dark:text-gray-400">
                    {book.author}</span>
                </div>

                )} </div>
            </Link>

            {/* Book Info */} <div className="bg-muted p-6 rounded-b-2xl border-t border-border flex-1 flex flex-col">
              <Link href={`/books/${book.id}`}>
                <h3 className="font-bold text-lg mb-2 text-card-foreground group-hover:text-primary transition cursor-pointer">
                  {book.title} </h3>
              </Link>

              <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {book.author} </p>
              <div className="flex items-center justify-between mt-auto pt-4">
                {book.pdf_file_path ? (<a href={`/api/books/${book.id}/pdf?download=1`} download onClick={() =>
                  handleDownload(book.id, book.download_count)}
                  className="text-primary text-sm flex items-center gap-1 font-medium hover:underline transition-all duration-300" > <span className="material-icons-outlined text-sm">
                    download</span>

                  تحميل </a>

                ) : (<Link href={`/books/${book.id}`}
                  className="text-primary text-sm flex items-center gap-1 font-medium hover:underline transition-all duration-300" >
                  <span className="material-icons-outlined text-sm">
                    visibility</span>

                  عرض </Link>

                )} </div>
            </div>

          </div>

          )
        })} </div>

      )} </div>
  </section>

  )
}
