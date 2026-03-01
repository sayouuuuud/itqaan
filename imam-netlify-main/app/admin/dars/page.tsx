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
import { BookOpen, Plus, Eye, Search, Edit, Trash2, Loader2, CheckCircle, FileEdit } from "lucide-react"

// Helper function to get thumbnail URL
const getThumbnailUrl = (lesson: any) => {
  console.log('📚 [ADMIN DARS] getThumbnailUrl Input:', {
    lessonId: lesson.id,
    thumbnail_path: lesson.thumbnail_path,
    startsWithUploads: lesson.thumbnail_path?.startsWith("uploads/"),
    startsWithHttp: lesson.thumbnail_path?.startsWith("http"),
    startsWithApi: lesson.thumbnail_path?.startsWith("/api/")
  })

  // If it's a malformed URL containing API path, extract real key
  if (lesson.thumbnail_path?.includes('/api/download?key=')) {
    console.log('🔧 Found malformed API URL, extracting key...')
    try {
      const url = new URL(lesson.thumbnail_path, 'http://localhost:3000')
      const encodedKey = url.searchParams.get('key')
      if (encodedKey) {
        const realKey = decodeURIComponent(encodedKey)
        console.log('✅ Extracted real key:', realKey)
        return `/api/download?key=${encodeURIComponent(realKey)}`
      }
    } catch (e: any) {
      console.error('❌ Failed to extract key from malformed URL:', e?.message || 'Unknown error')
    }
  }

  // If it's already a full URL from B2 (signed URL), extract the path
  if (lesson.thumbnail_path?.startsWith("http") && lesson.thumbnail_path?.includes('backblazeb2.com')) {
    console.log('🔄 Found B2 signed URL, extracting path...')
    try {
      const url = new URL(lesson.thumbnail_path)
      const pathParts = url.pathname.split('/')
      const uploadsIndex = pathParts.findIndex(part => part === 'uploads')
      if (uploadsIndex !== -1) {
        const realPath = pathParts.slice(uploadsIndex).join('/')
        console.log('✅ Extracted path from B2 URL:', realPath)
        return `/api/download?key=${encodeURIComponent(realPath)}`
      }
    } catch (e: any) {
      console.error('❌ Failed to extract path from B2 URL:', e?.message || 'Unknown error')
    }
  }

  // If it's already a full URL (not B2), use it directly
  if (lesson.thumbnail_path?.startsWith("http")) {
    console.log('🌐 Using direct HTTP URL:', lesson.thumbnail_path)
    return lesson.thumbnail_path
  }

  // If it's already an API URL, use it directly
  if (lesson.thumbnail_path?.startsWith("/api/")) {
    console.log('🔗 Using existing API URL:', lesson.thumbnail_path)
    return lesson.thumbnail_path
  }

  // If it's an uploads path, convert to API URL
  if (lesson.thumbnail_path?.startsWith("uploads/")) {
    console.log('📁 Converting uploads path to API URL:', lesson.thumbnail_path)
    return `/api/download?key=${encodeURIComponent(lesson.thumbnail_path)}`
  }

  console.log('❓ No thumbnail path found, using placeholder')
  return "/placeholder.svg"
}

interface Lesson {
  id: string
  title: string
  description: string
  content: string
  lesson_type: string
  type: string
  media_source: string
  media_url?: string
  thumbnail_path?: string
  duration?: string
  publish_status: string
  is_active: boolean
  views_count: number
  download_count?: number
  created_at: string
  category_id?: string
  author_name?: string
}

interface Category {
  id: string
  name: string
  type: string
}

interface LessonFormData {
  title: string
  author_name: string
  description: string
  lesson_type: string
  type: string
  media_source: string
  media_url: string
  thumbnail_path: string
  duration: string
  publish_status: string
  is_active: boolean
  category_id: string
}

interface LessonFormProps {
  formData: LessonFormData
  setFormData: React.Dispatch<React.SetStateAction<LessonFormData>>
  categories: Category[]
  submitting: boolean
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isEdit?: boolean
}

function LessonForm({
  formData,
  setFormData,
  categories,
  submitting,
  onSubmit,
  onCancel,
  isEdit,
}: LessonFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>عنوان الدرس</Label>
          <Input
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                title: e.target.value,
              }))}
            className="w-full"
            placeholder="عنوان الدرس"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>اسم المحاضر</Label>
          <Input
            value={formData.author_name}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                author_name: e.target.value,
              }))}
            className="w-full"
            placeholder="اسم المحاضر"
          />
        </div>
      </div>

      <CategorySelector
        type="lesson"
        label="الفئة"
        value={formData.category_id}
        onChange={(value) =>
          setFormData((prev) => ({
            ...prev,
            category_id: value,
          }))}
      />

      <div className="space-y-2">
        <Label>وصف مختصر</Label>
        <RichTextEditor
          content={formData.description}
          onChange={(html) =>
            setFormData((prev) => ({
              ...prev,
              description: html,
            }))}
          placeholder="وصف مختصر للدرس..."
        />
      </div>

      <div className="space-y-2">
        <Label>نوع الدرس</Label>
        <Select
          value={formData.lesson_type}
          onValueChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              lesson_type: value,
            }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="اختر نوع الدرس" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fiqh">فقه</SelectItem>
            <SelectItem value="aqeedah">عقيدة</SelectItem>
            <SelectItem value="hadith">حديث</SelectItem>
            <SelectItem value="tafseer">تفسير</SelectItem>
            <SelectItem value="seerah">سيرة</SelectItem>
            <SelectItem value="other">أخرى</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Hardcoded values for simplified audio upload */}
      <input type="hidden" value={formData.type} />
      <input type="hidden" value={formData.media_source} />

      <div className="space-y-4 border p-4 rounded-xl bg-card/50">
        <Label className="text-lg font-semibold text-primary block mb-2">
          الملف الصوتي
        </Label>

        <FileUpload
          accept="audio/*"
          folder="lessons/audios"
          onUploadComplete={(path) =>
            setFormData((prev) => ({
              ...prev,
              media_url: path,
              type: "audio", // Ensure type is audio
              media_source: "upload" // Ensure source is upload
            }))}
          currentFile={formData.media_url}
          label="رفع ملف الدرس (صوت)"
          onDurationChange={(duration) =>
            setFormData((prev) => ({
              ...prev,
              duration: duration,
            }))}
        />
      </div>

      <div className="space-y-2">
        <FileUpload
          accept="image/*"
          folder="lessons/thumbnails"
          onUploadComplete={(path) =>
            setFormData((prev) => ({
              ...prev,
              thumbnail_path: path,
            }))}
          currentFile={formData.thumbnail_path}
          label="صورة مصغرة"
          allowExternalUrl={true}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>المدة</Label>
          <Input
            value={formData.duration}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                duration: e.target.value,
              }))}
            className="w-full"
            placeholder="مثال: 45:30"
          />
        </div>

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
            <SelectTrigger>
              <SelectValue placeholder="اختر حالة النشر" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="published">منشور</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center">
          <UiverseToggle
            checked={formData.is_active}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({
                ...prev,
                is_active: checked,
              }))}
          />
        </div>
        <Label>نشط</Label>
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
            "إضافة الدرس"
          )}
        </Button>
      </div>
    </form>
  )
}

const ITEMS_PER_PAGE = 10

export default function ManageDarsPage() {
  const { user } = useAuth()
  const isVisitor = user?.email === 'visitor@gmail.com'
  const searchParams = useSearchParams()
  const router = useRouter()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState<LessonFormData>({
    title: "",
    author_name: "السيد مراد سلامة",
    description: "",
    lesson_type: "fiqh",
    type: "audio",
    media_source: "upload",
    media_url: "",
    thumbnail_path: "",
    duration: "",
    publish_status: "draft",
    is_active: true,
    category_id: "none", // Added category_id
  })
  const [submitting, setSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalDownloads, setTotalDownloads] = useState(0)

  const supabase = createClient()

  const fetchLessons = async () => {
    setLoading(true)
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE - 1
    const { data, count, error } = await supabase
      .from("lessons")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(start, end)

    if (!error) {
      setLessons(data || [])
      setTotalCount(count || 0)
    }

    // Fetch total downloads
    const { data: allLessons } = await supabase.from('lessons').select('download_count');
    if (allLessons) {
      const downloads = allLessons.reduce((acc, curr) => acc + (curr.download_count || 0), 0);
      setTotalDownloads(downloads);
    }
    setLoading(false)
  }

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("type", "lesson")
    if (data) setCategories(data)
  }

  useEffect(() => {
    fetchLessons()
    fetchCategories() // Fetch categories on mount
  }, [currentPage])

  useEffect(() => {
    const editId = searchParams.get("edit")
    if (editId) {
      if (isVisitor) return // Prevent visitor from accessing edit mode via URL
      const fetchAndEdit = async () => {
        const { data, error } = await supabase.from("lessons").select("*").eq("id", editId).single()
        if (data && !error) {
          openEditModal(data)
          router.replace("/admin/dars")
        }
      }
      fetchAndEdit()
    }
  }, [searchParams])

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const categoryIdToSend =
      formData.category_id === "none" ? null : formData.category_id
    const { error } = await supabase.from("lessons").insert({
      ...formData,
      media_url: formData.media_url || null,
      thumbnail_path: formData.thumbnail_path || null,
      category_id: categoryIdToSend,
    })

    if (!error) {
      setIsAddModalOpen(false)
      resetForm()
      fetchLessons()
    } else {
      alert("حدث خطأ أثناء الإضافة: " + error.message)
    }
    setSubmitting(false)
  }

  const handleEditLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLesson) return
    setSubmitting(true)
    const categoryIdToSend =
      formData.category_id === "none" ? null : formData.category_id
    const { error } = await supabase
      .from("lessons")
      .update({
        ...formData,
        media_url: formData.media_url || null,
        thumbnail_path: formData.thumbnail_path || null,
        category_id: categoryIdToSend,
      })
      .eq("id", editingLesson.id)

    if (!error) {
      setIsEditModalOpen(false)
      setEditingLesson(null)
      fetchLessons()
    }
    setSubmitting(false)
  }

  const handleDeleteLesson = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الدرس؟")) return

    // 1. جلب مسارات الملفات أولاً
    const { data: item } = await supabase
      .from("lessons")
      .select("media_url, thumbnail_path")
      .eq("id", id)
      .single()

    // 2. حذف الملفات من B2 إن وجدت
    if (item) {
      // Legacy B2 delete
      if (item.media_url?.startsWith("uploads/")) {
        await fetch(`/api/storage/delete?key=${encodeURIComponent(item.media_url)}`, {
          method: "DELETE",
        })
      }
      if (item.thumbnail_path?.startsWith("uploads/")) {
        await fetch(`/api/storage/delete?key=${encodeURIComponent(item.thumbnail_path)}`, {
          method: "DELETE",
        })
      }

      // Cloudinary delete
      if (item.media_url?.includes("cloudinary.com")) {
        await fetch(`/api/storage/delete?url=${encodeURIComponent(item.media_url)}`, {
          method: "DELETE",
        })
      }
      if (item.thumbnail_path?.includes("cloudinary.com")) {
        await fetch(`/api/storage/delete?url=${encodeURIComponent(item.thumbnail_path)}`, {
          method: "DELETE",
        })
      }
    }

    // 3. حذف السجل من قاعدة البيانات
    const { error } = await supabase.from("lessons").delete().eq("id", id)
    if (!error) fetchLessons()
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    await supabase
      .from("lessons")
      .update({ is_active: !currentStatus })
      .eq("id", id)
    fetchLessons()
  }

  const openEditModal = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setFormData({
      title: lesson.title,
      author_name: lesson.author_name || "السيد مراد سلامة",
      description: lesson.description || "",
      lesson_type: lesson.lesson_type,
      type: lesson.type,
      media_source: lesson.media_source,
      media_url: lesson.media_url || "",
      thumbnail_path: lesson.thumbnail_path || "",
      duration: lesson.duration || "",
      publish_status: lesson.publish_status,
      is_active: lesson.is_active ?? true,
      category_id: lesson.category_id || "none", // Handle category_id
    })
    setIsEditModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: "",
      author_name: "السيد مراد سلامة",
      description: "",
      lesson_type: "fiqh",
      type: "audio",
      media_source: "youtube",
      media_url: "",
      thumbnail_path: "",
      duration: "",
      publish_status: "draft",
      is_active: true,
      category_id: "none", // Reset category_id
    })
  }

  const filteredLessons = lessons.filter((l) =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const getLessonTypeLabel = (type: string) => {
    switch (type) {
      case "fiqh":
        return "فقه"
      case "seerah":
        return "سيرة"
      default:
        return "عام"
    }
  }

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
            <BookOpen className="h-8 w-8 text-primary" />
            إدارة الدروس العلمية
          </h1>
          <p className="text-text-muted mt-2">
            إضافة وتعديل الدروس والشروحات العلمية
          </p>
        </div>

        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          {!isVisitor && (
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold">
                <Plus className="h-5 w-5 ml-2" />
                إضافة درس جديد
              </Button>
            </DialogTrigger>
          )}

          <DialogContent
            className="sm:max-w-lg bg-card max-h-[90vh] overflow-y-auto"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-primary">
                إضافة درس جديد
              </DialogTitle>
            </DialogHeader>

            <LessonForm
              formData={formData}
              setFormData={setFormData}
              categories={categories}
              submitting={submitting}
              onSubmit={handleAddLesson}
              onCancel={() => {
                setIsAddModalOpen(false)
                resetForm()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-2xl border border-border flex items-center justify-between">
          <div>
            <span className="block text-text-muted text-sm mb-1">
              إجمالي الدروس
            </span>
            <span className="text-3xl font-bold text-primary">{totalCount}</span>
          </div>

          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <BookOpen className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border flex items-center justify-between">
          <div>
            <span className="block text-text-muted text-sm mb-1">
              إجمالي التحميلات
            </span>
            <span className="text-3xl font-bold text-indigo-600">{totalDownloads}</span>
          </div>

          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download h-6 w-6"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border flex items-center justify-between">
          <div>
            <span className="block text-text-muted text-sm mb-1">المنشورة</span>
            <span className="text-3xl font-bold text-green-600">
              {lessons.filter((l) => l.publish_status === "published").length}
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
              {lessons.filter((l) => l.publish_status === "draft").length}
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
            قائمة الدروس ({totalCount})
          </h2>
          <div className="relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4 pr-10 py-2 rounded-lg w-64 bg-card"
              placeholder="بحث عن درس..."
            />
            <Search className="absolute right-3 top-2.5 text-text-muted h-5 w-5" />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-text-muted flex items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            جاري التحميل...
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="p-12 text-center text-text-muted">
            {searchQuery ? "لا توجد نتائج" : "لا توجد دروس بعد"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-muted/50 text-xs font-bold text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">الدرس</th>
                  <th className="px-6 py-4">النوع</th>
                  <th className="px-6 py-4 min-w-[160px]">التصنيف</th>
                  <th className="px-6 py-4">المشاهدات</th>
                  <th className="px-6 py-4">التحميلات</th>
                  <th className="px-6 py-4">الحالة</th>
                  <th className="px-6 py-4">نشط</th>
                  <th className="px-6 py-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLessons.map((lesson, index) => (
                  <tr
                    key={lesson.id}
                    className="group hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-text-muted text-sm">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {lesson.thumbnail_path ? (
                            <img
                              src={getThumbnailUrl(lesson)}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover cursor-grab active:cursor-grabbing"
                              draggable={true}
                              onDragStart={(e) => {
                                // Create custom drag preview with the image
                                const dragImage = new Image()
                                dragImage.src = getThumbnailUrl(lesson)
                                dragImage.style.width = '48px'
                                dragImage.style.height = '48px'
                                dragImage.style.borderRadius = '8px'
                                dragImage.style.objectFit = 'cover'

                                // Position the drag image at the cursor
                                e.dataTransfer.setDragImage(dragImage, 24, 24)

                                // Set drag data
                                e.dataTransfer.setData('text/plain', lesson.title)
                                e.dataTransfer.effectAllowed = 'copy'
                              }}
                            />
                          ) : (
                            <div
                              className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center cursor-not-allowed"
                              title="لا توجد صورة مصغرة"
                            >
                              <BookOpen className="h-5 w-5 text-blue-600" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground text-sm mb-1">
                            {lesson.title}
                          </h3>
                          <span className="text-xs text-text-muted">
                            {new Date(lesson.created_at).toLocaleDateString(
                              "ar-EG"
                            )}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                        {getLessonTypeLabel(lesson.lesson_type)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {getCategoryName(lesson.category_id) ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {getCategoryName(lesson.category_id)}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-text-muted">
                      {lesson.views_count || 0}
                    </td>

                    <td className="px-6 py-4 text-sm text-text-muted">
                      {lesson.download_count || 0}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${lesson.publish_status === "published"
                          ? "bg-green-50 text-green-600"
                          : "bg-yellow-50 text-yellow-600"
                          }`}
                      >
                        {lesson.publish_status === "published"
                          ? "منشور"
                          : "مسودة"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <UiverseToggle
                          checked={lesson.is_active ?? true}
                          onCheckedChange={() =>
                            !isVisitor && toggleActive(lesson.id, lesson.is_active ?? true)
                          }
                          disabled={isVisitor}
                        />
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            window.open(`/dars/${lesson.id}`, "_blank")
                          }
                          className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                          title="عرض"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        {!isVisitor && (
                          <>
                            <button
                              onClick={() => openEditModal(lesson)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="تعديل"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteLesson(lesson.id)}
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

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent
          className="sm:max-w-lg bg-card max-h-[90vh] overflow-y-auto"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary">
              تعديل الدرس
            </DialogTitle>
          </DialogHeader>

          <LessonForm
            formData={formData}
            setFormData={setFormData}
            categories={categories}
            submitting={submitting}
            onSubmit={handleEditLesson}
            isEdit={true}
            onCancel={() => {
              setIsEditModalOpen(false)
              resetForm()
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}