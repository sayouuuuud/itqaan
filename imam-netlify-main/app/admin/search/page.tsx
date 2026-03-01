"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Search, Mic, GraduationCap, FileText, BookOpen, Video, Pencil, Trash2, Eye } from "lucide-react"
import { Input } from "@/components/ui/input"

interface SearchResult {
    id: string
    title: string
    type: "sermon" | "lesson" | "article" | "book" | "video"
    created_at: string
}

const typeConfig = {
    sermon: { label: "خطبة", icon: Mic, color: "text-blue-500", bgColor: "bg-blue-500/10", href: "/admin/khutba", viewHref: "/khutba", table: "sermons" },
    lesson: { label: "درس", icon: GraduationCap, color: "text-green-500", bgColor: "bg-green-500/10", href: "/admin/dars", viewHref: "/dars", table: "lessons" },
    article: { label: "مقال", icon: FileText, color: "text-amber-500", bgColor: "bg-amber-500/10", href: "/admin/articles", viewHref: "/articles", table: "articles" },
    book: { label: "كتاب", icon: BookOpen, color: "text-purple-500", bgColor: "bg-purple-500/10", href: "/admin/books", viewHref: "/books", table: "books" },
    video: { label: "فيديو", icon: Video, color: "text-red-500", bgColor: "bg-red-500/10", href: "/admin/videos", viewHref: "/videos", table: "media" },
}

export default function AdminSearchPage() {
    const searchParams = useSearchParams()
    const initialQuery = searchParams.get("q") || ""

    const [query, setQuery] = useState(initialQuery)
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)

    const supabase = createClient()

    const performSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([])
            return
        }

        setLoading(true)
        const searchTerm = `%${searchQuery}%`

        try {
            const [sermons, lessons, articles, books, videos] = await Promise.all([
                supabase.from("sermons").select("id, title, created_at").ilike("title", searchTerm).limit(10),
                supabase.from("lessons").select("id, title, created_at").ilike("title", searchTerm).limit(10),
                supabase.from("articles").select("id, title, created_at").ilike("title", searchTerm).limit(10),
                supabase.from("books").select("id, title, created_at").ilike("title", searchTerm).limit(10),
                supabase.from("media").select("id, title, created_at").ilike("title", searchTerm).limit(10),
            ])

            const allResults: SearchResult[] = [
                ...(sermons.data || []).map(item => ({ ...item, type: "sermon" as const })),
                ...(lessons.data || []).map(item => ({ ...item, type: "lesson" as const })),
                ...(articles.data || []).map(item => ({ ...item, type: "article" as const })),
                ...(books.data || []).map(item => ({ ...item, type: "book" as const })),
                ...(videos.data || []).map(item => ({ ...item, type: "video" as const })),
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

            setResults(allResults)
        } catch (error) {
            console.error("Search error:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (initialQuery) {
            performSearch(initialQuery)
        }
    }, [initialQuery])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        performSearch(query)
        window.history.replaceState({}, "", `/admin/search?q=${encodeURIComponent(query)}`)
    }

    const handleDelete = async (result: SearchResult) => {
        const config = typeConfig[result.type]
        if (!confirm(`هل أنت متأكد من حذف "${result.title}"؟`)) return

        setDeleting(result.id)
        try {
            const { error } = await supabase.from(config.table).delete().eq("id", result.id)
            if (!error) {
                setResults(prev => prev.filter(r => !(r.id === result.id && r.type === result.type)))
            } else {
                alert("حدث خطأ أثناء الحذف: " + error.message)
            }
        } catch (error) {
            console.error("Delete error:", error)
        } finally {
            setDeleting(null)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                    <Search className="h-7 w-7 text-primary" />
                    البحث في المحتوى
                </h1>
                <p className="text-muted-foreground mt-1">ابحث في الخطب والدروس والمقالات والكتب والفيديوهات</p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSubmit} className="flex gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="اكتب كلمة البحث..."
                        className="pr-10 text-lg py-6"
                        autoFocus
                    />
                </div>
                <button
                    type="submit"
                    className="px-6 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors"
                >
                    بحث
                </button>
            </form>

            {/* Results */}
            <div className="bg-card rounded-xl border border-border">
                {loading ? (
                    <div className="p-12 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        <p className="text-muted-foreground mt-2">جاري البحث...</p>
                    </div>
                ) : results.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        {query ? "لا توجد نتائج" : "اكتب كلمة للبحث"}
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        <div className="p-4 bg-muted/50 font-medium text-foreground">
                            {results.length} نتيجة
                        </div>
                        {results.map((result) => {
                            const config = typeConfig[result.type]
                            const Icon = config.icon
                            const isDeleting = deleting === result.id
                            return (
                                <div
                                    key={`${result.type}-${result.id}`}
                                    className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                                >
                                    <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center ${config.color}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-foreground truncate">{result.title}</p>
                                        <p className="text-sm text-muted-foreground">{config.label}</p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2">
                                        {/* View */}
                                        <Link
                                            href={`${config.viewHref}/${result.id}`}
                                            target="_blank"
                                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                            title="عرض"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Link>

                                        {/* Edit */}
                                        <Link
                                            href={`${config.href}?edit=${result.id}`}
                                            className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 rounded-lg transition-colors"
                                            title="تعديل"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Link>

                                        {/* Delete */}
                                        <button
                                            onClick={() => handleDelete(result)}
                                            disabled={isDeleting}
                                            className="p-2 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                            title="حذف"
                                        >
                                            {isDeleting ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
