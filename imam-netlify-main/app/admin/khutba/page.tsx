"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UiverseToggle } from "@/components/ui/uiverse-toggle"
import { createClient } from "@/lib/supabase/client"
import { RichTextEditor } from "@/components/admin/rich-text-editor"
import { FileUpload } from "@/components/admin/file-upload"
import { Pagination } from "@/components/admin/pagination"
import { CategorySelector } from "@/components/admin/category-selector"
import { BookCoverImage } from "@/components/book-cover-image"
import { AudioPlayer } from "@/app/admin/audio-player"
import { Mic, Plus, Eye, Search, Edit, Trash2, Loader2, CheckCircle, FileEdit, Download } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

interface Sermon {
    id: string
    title: string
    description: string
    content?: string
    date: string
    video_url?: string
    audio_url?: string
    thumbnail_path?: string
    publish_status: string
    is_active: boolean
    views_count: number
    download_count: number
    created_at: string
    category_id?: string
    author_name?: string
}

interface Category {
    id: string
    name: string
    type: string
}

interface SermonFormData {
    title: string
    author_name: string
    description: string
    content: string
    date: string
    video_url: string
    audio_url: string
    thumbnail_path: string
    publish_status: string
    is_active: boolean
    category_id: string
}

interface SermonFormProps {
    formData: SermonFormData
    setFormData: React.Dispatch<React.SetStateAction<SermonFormData>>
    categories: Category[]
    submitting: boolean
    onSubmit: (e: React.FormEvent) => void
    onCancel: () => void
    isEdit?: boolean
}

function SermonForm({
    formData,
    setFormData,
    categories,
    submitting,
    onSubmit,
    onCancel,
    isEdit,
}: SermonFormProps) {
    return (
        <form onSubmit={onSubmit} className="space-y-6 mt-4">
            <div className="space-y-2">
                <Label>عنوان الخطبة *</Label>
                <Input
                    value={formData.title}
                    onChange={(e) =>
                        setFormData((prev) => ({
                            ...prev,
                            title: e.target.value,
                        }))}
                    placeholder="عنوان الخطبة"
                    className="bg-muted"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label>اسم الكاتب</Label>
                <Input
                    value={formData.author_name}
                    onChange={(e) =>
                        setFormData((prev) => ({
                            ...prev,
                            author_name: e.target.value,
                        }))}
                    placeholder="اسم كاتب الخطبة"
                    className="bg-muted"
                />
            </div>

            <div className="space-y-2">
                <Label>وصف مختصر</Label>
                <Input
                    value={formData.description}
                    onChange={(e) =>
                        setFormData((prev) => ({
                            ...prev,
                            description: e.target.value,
                        }))}
                    placeholder="وصف مختصر للخطبة"
                    className="bg-muted"
                />
            </div>

            <div className="space-y-2">
                <Label>نص الخطبة</Label>
                <RichTextEditor
                    content={formData.content}
                    onChange={(html) =>
                        setFormData((prev) => ({
                            ...prev,
                            content: html,
                        }))}
                    placeholder="نص الخطبة كاملاً..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>تاريخ الخطبة</Label>
                    <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                date: e.target.value,
                            }))}
                        className="bg-muted"
                    />
                </div>

                <CategorySelector
                    type="sermon"
                    value={formData.category_id}
                    onChange={(value) =>
                        setFormData((prev) => ({
                            ...prev,
                            category_id: value,
                        }))}
                />
            </div>

            <div className="space-y-2">
                <Label>رابط فيديو (اختياري)</Label>
                <Input
                    value={formData.video_url}
                    onChange={(e) =>
                        setFormData((prev) => ({
                            ...prev,
                            video_url: e.target.value,
                        }))}
                    placeholder="https://youtube.com/watch?v=..."
                    className="bg-muted"
                    dir="ltr"
                />
            </div>

            <FileUpload
                accept="audio/*"
                folder="sermons/audio"
                label="الملف الصوتي"
                onUploadComplete={(path) =>
                    setFormData((prev) => ({
                        ...prev,
                        audio_url: path,
                    }))}
                currentFile={formData.audio_url}
            />

            {/* Audio Preview */}
            {formData.audio_url && (
                <div className="space-y-2">
                    <Label className="text-sm font-medium">معاينة الملف الصوتي</Label>
                    <AudioPlayer
                        src={formData.audio_url}
                        title={formData.title || "معاينة الصوت"}
                        className="mt-2"
                    />
                </div>
            )}

            <FileUpload
                accept="image/*"
                folder="sermons/thumbnails"
                label="صورة الغلاف"
                onUploadComplete={(path) =>
                    setFormData((prev) => ({
                        ...prev,
                        thumbnail_path: path,
                    }))}
                currentFile={formData.thumbnail_path}
                allowExternalUrl={true}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>حالة النشر</Label>
                    <Select
                        value={formData.publish_status}
                        onValueChange={(value) =>
                            setFormData((prev) => ({
                                ...prev,
                                publish_status: value,
                            }))}
                    >
                        <SelectTrigger className="bg-muted">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="draft">مسودة</SelectItem>
                            <SelectItem value="published">منشور</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                    <UiverseToggle
                        checked={formData.is_active}
                        onCheckedChange={(checked) =>
                            setFormData((prev) => ({
                                ...prev,
                                is_active: checked,
                            }))}
                    />
                    <Label>نشط</Label>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" type="button" onClick={onCancel}>
                    إلغاء
                </Button>
                <Button
                    type="submit"
                    className="bg-primary hover:bg-primary-hover text-white"
                    disabled={submitting}
                >
                    {submitting ? (
                        <>
                            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                            جاري الحفظ...
                        </>
                    ) : isEdit ? (
                        "حفظ التغييرات"
                    ) : (
                        "إضافة الخطبة"
                    )}
                </Button>
            </div>
        </form>
    )
}

const ITEMS_PER_PAGE = 10

export default function ManageKhutbaPage() {
    const { user } = useAuth()
    const isVisitor = user?.email === 'visitor@gmail.com'
    const searchParams = useSearchParams()
    const router = useRouter()
    const [sermons, setSermons] = useState<Sermon[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingSermon, setEditingSermon] = useState<Sermon | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const debouncedSearchQuery = useDebounce(searchQuery, 500)
    const [formData, setFormData] = useState<SermonFormData>({
        title: "",
        author_name: "السيد مراد سلامة",
        description: "",
        content: "",
        date: new Date().toISOString().split("T")[0],
        video_url: "",
        audio_url: "",
        thumbnail_path: "",
        publish_status: "draft",
        is_active: true,
        category_id: "none", // Added category_id
    })
    const [submitting, setSubmitting] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [totalDownloads, setTotalDownloads] = useState(0)

    const supabase = createClient()

    const fetchSermons = async () => {
        setLoading(true)
        const start = (currentPage - 1) * ITEMS_PER_PAGE
        const end = start + ITEMS_PER_PAGE - 1

        let query = supabase
            .from("sermons")
            .select("*, download_count", { count: "exact" })
            .order("created_at", { ascending: false })

        if (debouncedSearchQuery) {
            query = query.ilike('title', `%${debouncedSearchQuery}%`)
        }

        const { data, count, error } = await query.range(start, end)

        if (!error) {
            setSermons(data || [])
            setTotalCount(count || 0)
        }

        // Fetch total downloads separately
        const { data: allSermons } = await supabase.from('sermons').select('download_count')
        if (allSermons) {
            const total = allSermons.reduce((acc, curr) => acc + (curr.download_count || 0), 0)
            setTotalDownloads(total)
        }

        setLoading(false)
    }

    const fetchCategories = async () => {
        const { data } = await supabase
            .from("categories")
            .select("*")
            .eq("type", "sermon")
        if (data) setCategories(data)
    }

    useEffect(() => {
        setCurrentPage(1)
    }, [debouncedSearchQuery])

    useEffect(() => {
        fetchSermons()
        fetchCategories() // Fetch categories on mount
    }, [currentPage, debouncedSearchQuery])

    useEffect(() => {
        const editId = searchParams.get("edit")
        if (editId) {
            if (isVisitor) return // Prevent visitor from accessing edit mode via URL
            const fetchAndEdit = async () => {
                const { data, error } = await supabase.from("sermons").select("*").eq("id", editId).single()
                if (data && !error) {
                    openEditModal(data)
                    // Clean URL
                    router.replace("/admin/khutba")
                }
            }
            fetchAndEdit()
        }
    }, [searchParams])

    const handleAddSermon = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        const categoryIdToSend =
            formData.category_id === "none" ? null : formData.category_id
        // console.log("Form data being sent:", formData)
        const { error } = await supabase.from("sermons").insert({
            ...formData,
            video_url: formData.video_url || null,
            audio_url: formData.audio_url || null,
            thumbnail_path: formData.thumbnail_path || null,
            category_id: categoryIdToSend,
        })

        if (!error) {
            setIsAddModalOpen(false)
            resetForm()
            fetchSermons()
        } else {
            alert("حدث خطأ أثناء الإضافة: " + error.message)
        }
        setSubmitting(false)
    }

    const handleEditSermon = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingSermon) return
        setSubmitting(true)
        const categoryIdToSend =
            formData.category_id === "none" ? null : formData.category_id
        // console.log("Edit form data being sent:", formData)
        const { error } = await supabase
            .from("sermons")
            .update({
                ...formData,
                video_url: formData.video_url || null,
                audio_url: formData.audio_url || null,
                thumbnail_path: formData.thumbnail_path || null,
                category_id: categoryIdToSend,
            })
            .eq("id", editingSermon.id)

        if (!error) {
            setIsEditModalOpen(false)
            setEditingSermon(null)
            fetchSermons()
        }
        setSubmitting(false)
    }

    const handleDeleteSermon = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذه الخطبة؟")) return

        // 1. جلب مسارات الملفات أولاً
        const { data: item } = await supabase
            .from("sermons")
            .select("audio_url, thumbnail_path")
            .eq("id", id)
            .single()

        // 2. حذف الملفات من B2 إن وجدت
        if (item) {
            if (item.audio_url?.startsWith("uploads/")) {
                await fetch(`/api/storage/delete?key=${encodeURIComponent(item.audio_url)}`, {
                    method: "DELETE",
                })
            }
            if (item.thumbnail_path?.startsWith("uploads/")) {
                await fetch(`/api/storage/delete?key=${encodeURIComponent(item.thumbnail_path)}`, {
                    method: "DELETE",
                })
            }

            // Cloudinary delete
            if (item.audio_url?.includes("cloudinary.com")) {
                await fetch(`/api/storage/delete?url=${encodeURIComponent(item.audio_url)}`, { method: "DELETE" })
            }
            if (item.thumbnail_path?.includes("cloudinary.com")) {
                await fetch(`/api/storage/delete?url=${encodeURIComponent(item.thumbnail_path)}`, { method: "DELETE" })
            }
        }

        // 3. حذف السجل من قاعدة البيانات
        const { error } = await supabase.from("sermons").delete().eq("id", id)
        if (!error) fetchSermons()
    }

    const toggleActive = async (id: string, currentStatus: boolean) => {
        await supabase
            .from("sermons")
            .update({ is_active: !currentStatus })
            .eq("id", id)
        fetchSermons()
    }

    const openEditModal = (sermon: Sermon) => {
        setEditingSermon(sermon)
        setFormData({
            title: sermon.title,
            author_name: sermon.author_name || "السيد مراد سلامة",
            description: sermon.description || "",
            content: sermon.content || "",
            date: sermon.date,
            video_url: sermon.video_url || "",
            audio_url: sermon.audio_url || "",
            thumbnail_path: sermon.thumbnail_path || "",
            publish_status: sermon.publish_status,
            is_active: sermon.is_active ?? true,
            category_id: sermon.category_id || "none", // Handle category_id
        })
        setIsEditModalOpen(true)
    }

    const resetForm = () => {
        setFormData({
            title: "",
            author_name: "السيد مراد سلامة",
            description: "",
            content: "",
            date: new Date().toISOString().split("T")[0],
            video_url: "",
            audio_url: "",
            thumbnail_path: "",
            publish_status: "draft",
            is_active: true,
            category_id: "none", // Reset category_id
        })
    }

    const filteredSermons = sermons
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

    const getCategoryName = (categoryId: string | undefined) => {
        if (!categoryId) return null
        const category = categories.find((c) => c.id === categoryId)
        return category?.name
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-3 font-serif">
                        <Mic className="h-8 w-8 text-primary" />
                        إدارة الخطب
                    </h1>
                    <p className="text-text-muted mt-2">
                        إضافة وتعديل خطب الجمعة والمناسبات
                    </p>
                </div>

                {/* Add Sermon Modal */}
                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                    {!isVisitor && (
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary-hover text-white">
                                <Plus className="h-4 w-4 ml-2" />
                                إضافة خطبة جديدة
                            </Button>
                        </DialogTrigger>
                    )}

                    <DialogContent
                        className="sm:max-w-lg bg-card max-h-[90vh] overflow-y-auto"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold text-primary">
                                إضافة خطبة جديدة
                            </DialogTitle>
                        </DialogHeader>

                        <SermonForm
                            formData={formData}
                            setFormData={setFormData}
                            categories={categories}
                            submitting={submitting}
                            onSubmit={handleAddSermon}
                            onCancel={() => {
                                setIsAddModalOpen(false)
                                resetForm()
                            }}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-card p-6 rounded-2xl border border-border flex items-center justify-between">
                    <div>
                        <span className="block text-text-muted text-sm mb-1">
                            إجمالي الخطب
                        </span>
                        <span className="text-3xl font-bold text-primary">{totalCount}</span>
                    </div>

                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                        <Mic className="h-6 w-6" />
                    </div>
                </div>

                <div className="bg-card p-6 rounded-2xl border border-border flex items-center justify-between">
                    <div>
                        <span className="block text-text-muted text-sm mb-1">
                            إجمالي التحميلات
                        </span>
                        <span className="text-3xl font-bold text-blue-600">{totalDownloads}</span>
                    </div>

                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <Download className="h-6 w-6" />
                    </div>
                </div>

                <div className="bg-card p-6 rounded-2xl border border-border flex items-center justify-between">
                    <div>
                        <span className="block text-text-muted text-sm mb-1">المنشورة</span>
                        <span className="text-3xl font-bold text-green-600">
                            {sermons.filter((s) => s.publish_status === "published").length}
                        </span>
                    </div>

                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                        <CheckCircle className="h-6 w-6" />
                    </div>
                </div>

                <div className="bg-card p-6 rounded-2xl border border-border flex items-center justify-between">
                    <div>
                        <span className="block text-text-muted text-sm mb-1">مسودات</span>
                        <span className="text-3xl font-bold text-yellow-600">
                            {sermons.filter((s) => s.publish_status === "draft").length}
                        </span>
                    </div>

                    <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
                        <FileEdit className="h-6 w-6" />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-card rounded-3xl border border-border overflow-hidden">
                <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/50">
                    <h2 className="font-bold text-xl text-primary">
                        قائمة الخطب ({totalCount})
                    </h2>
                    <div className="relative">
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-4 pr-10 py-2 rounded-lg w-64 bg-card"
                            placeholder="بحث عن خطبة..."
                        />
                        <Search className="absolute right-3 top-2.5 text-text-muted h-5 w-5" />
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-text-muted flex items-center justify-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        جاري التحميل...
                    </div>
                ) : filteredSermons.length === 0 ? (
                    <div className="p-12 text-center text-text-muted">
                        {searchQuery ? "لا توجد نتائج" : "لا توجد خطب بعد"}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-muted/50 text-xs font-bold text-text-muted uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">#</th>
                                    <th className="px-6 py-4">الخطبة</th>
                                    <th className="px-6 py-4">التاريخ</th>
                                    <th className="px-6 py-4 min-w-[150px]">التصنيف</th>
                                    <th className="px-6 py-4">المشاهدات</th>
                                    <th className="px-6 py-4">التحميلات</th>
                                    <th className="px-6 py-4">الحالة</th>
                                    <th className="px-6 py-4">نشط</th>
                                    <th className="px-6 py-4 text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredSermons.map((sermon, index) => (
                                    <tr
                                        key={sermon.id}
                                        className="group hover:bg-muted/50 transition-colors"
                                    >
                                        <td className="px-6 py-4 text-text-muted text-sm">
                                            {String(index + 1).padStart(2, "0")}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <BookCoverImage
                                                    coverImagePath={sermon.thumbnail_path}
                                                    title={sermon.title}
                                                    variant="admin"
                                                    className="w-12 h-16"
                                                />
                                                <div>
                                                    <h3 className="font-bold text-foreground text-sm">
                                                        {sermon.title}
                                                    </h3>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-sm text-text-muted">
                                            {new Date(sermon.date).toLocaleDateString("ar-EG")}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getCategoryName(sermon.category_id) ? (
                                                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                                                    {getCategoryName(sermon.category_id)}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-text-muted">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-text-muted">
                                            {sermon.views_count || 0}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-primary">
                                            {sermon.download_count || 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`text-xs px-3 py-1 rounded-full font-medium ${sermon.publish_status === "published"
                                                    ? "bg-green-50 text-green-600"
                                                    : "bg-yellow-50 text-yellow-600"
                                                    }`}
                                            >
                                                {sermon.publish_status === "published"
                                                    ? "منشور"
                                                    : "مسودة"}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <UiverseToggle
                                                checked={sermon.is_active ?? true}
                                                onCheckedChange={() =>
                                                    !isVisitor && toggleActive(sermon.id, sermon.is_active ?? true)
                                                }
                                                disabled={isVisitor}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() =>
                                                        window.open(`/khutba/${sermon.id}`, "_blank")
                                                    }
                                                    className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                                                    title="عرض"
                                                >
                                                    <Eye className="h-5 w-5" />
                                                </button>
                                                {!isVisitor && (
                                                    <>
                                                        <button
                                                            onClick={() => openEditModal(sermon)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="تعديل"
                                                        >
                                                            <Edit className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSermon(sermon.id)}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="حذف"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="p-4 border-t border-border">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={totalCount}
                        itemsPerPage={ITEMS_PER_PAGE}
                    />
                </div>
            </div>

            {/* Edit Sermon Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent
                    className="sm:max-w-lg bg-card max-h-[90vh] overflow-y-auto"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-primary">
                            تعديل الخطبة
                        </DialogTitle>
                    </DialogHeader>

                    <SermonForm
                        formData={formData}
                        setFormData={setFormData}
                        categories={categories}
                        submitting={submitting}
                        onSubmit={handleEditSermon}
                        onCancel={() => {
                            setIsEditModalOpen(false)
                            resetForm()
                        }}
                        isEdit={true}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
