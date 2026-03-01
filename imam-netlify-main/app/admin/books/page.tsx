"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
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
import { BookOpen, Plus, Pencil, Trash2, Eye, Loader2, Search, Download, FileText, Link2, Upload } from "lucide-react"
import { useSignedUrl } from "@/hooks/use-signed-url"
import { useDebounce } from "@/hooks/use-debounce"

interface Book {
  id: string
  title: string
  author: string
  description: string
  cover_image_path?: string
  pdf_file_path?: string
  pdf_type?: 'local' | 'external'
  pdf_external_url?: string
  publish_status: string
  is_active: boolean
  download_count: number
  created_at: string
  pages?: number
  category_id?: string
  publish_year?: string
  language?: string
  file_size?: string
}

const ITEMS_PER_PAGE = 10

// Component to display book cover with signed URL
function BookImage({
  coverImagePath,
  alt,
  className
}: {
  coverImagePath?: string
  alt: string
  className?: string
}) {
  const { signedUrl, loading } = useSignedUrl(coverImagePath || null)

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted animate-pulse rounded-lg`}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    )
  }

  return (
    <img
      src={signedUrl || "/placeholder.svg"}
      alt={alt}
      className={className}
    />
  )
}

const BookForm = ({
  onSubmit,
  isEdit = false,
  formData,
  setFormData,
  onCancel,
  categories = []
}: {
  onSubmit: (e: React.FormEvent) => void
  isEdit?: boolean
  formData: any
  setFormData: any
  onCancel: () => void
  categories?: any[]
}) => (
  <form onSubmit={onSubmit} className="space-y-6 mt-4">
    <div className="space-y-2">
      <Label>عنوان الكتاب *</Label>
      <Input
        value={formData.title}
        onChange={(e) =>
          setFormData((prev: any) => ({
            ...prev,
            title: e.target.value,
          }))}
        placeholder="عنوان الكتاب"
        className="bg-muted"
        required
      />
    </div>

    <div className="space-y-2">
      <Label>التصنيف</Label>
      <Select
        value={formData.category_id || "uncategorized"}
        onValueChange={(value) =>
          setFormData((prev: any) => ({
            ...prev,
            category_id: value === "uncategorized" ? null : value,
          }))}
      >
        <SelectTrigger className="bg-muted">
          <SelectValue placeholder="اختر التصنيف" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="uncategorized">بدون تصنيف</SelectItem>
          {categories?.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <Label>المؤلف</Label>
      <Input
        value={formData.author}
        onChange={(e) =>
          setFormData((prev: any) => ({
            ...prev,
            author: e.target.value,
          }))}
        placeholder="اسم المؤلف"
        className="bg-muted"
      />
    </div>

    <div className="space-y-2">
      <Label>الوصف</Label>
      <RichTextEditor
        content={formData.description}
        onChange={(html) =>
          setFormData((prev: any) => ({
            ...prev,
            description: html,
          }))}
        placeholder="وصف الكتاب..."
      />
    </div>

    <FileUpload
      accept="image/*"
      folder="books/covers"
      label="صورة الغلاف"
      variant="cover"
      allowExternalUrl={true}
      onUploadComplete={(path) =>
        setFormData((prev: any) => ({
          ...prev,
          cover_image_path: path,
        }))}
      currentFile={formData.cover_image_path}
    />

    {/* PDF Upload - supports both file upload and external URL */}
    <FileUpload
      accept=".pdf"
      folder="books/pdfs"
      label="ملف PDF"
      onUploadComplete={(path, fileSize) => {
        setFormData((prev: any) => ({
          ...prev,
          pdf_file_path: path,
          pdf_type: "local",
          file_size: fileSize || prev.file_size,
        }))
      }}
      currentFile={formData.pdf_file_path}
      allowExternalUrl={true}
      onExternalUrlSubmit={async (url) => {
        // Import from external URL
        const response = await fetch('/api/import-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, folder: 'books/pdfs' }),
        })
        const data = await response.json()
        if (data.success) {
          if (data.keepExternal) {
            // ملف كبير - نبقي الرابط الخارجي
            setFormData((prev: any) => ({
              ...prev,
              pdf_file_path: null,
              pdf_external_url: data.externalUrl,
              pdf_type: "external",
              pages: data.pages || prev.pages,
              file_size: data.size || prev.file_size,
            }))
            return { success: true, message: data.message }
          } else {
            // ملف عادي - تم رفعه لـ Cloudinary
            setFormData((prev: any) => ({
              ...prev,
              pdf_file_path: data.path,
              pdf_external_url: null,
              pdf_type: "local",
              pages: data.pages || prev.pages,
              file_size: data.size || prev.file_size,
            }))
            return { success: true }
          }
        } else {
          return { success: false, error: data.error }
        }
      }}
    />

    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>عدد الصفحات</Label>
        <Input
          type="number"
          value={formData.pages || ""}
          onChange={(e) =>
            setFormData((prev: any) => ({
              ...prev,
              pages: e.target.value ? parseInt(e.target.value, 10) : null,
            }))}
          placeholder="عدد الصفحات"
          min="1"
        />
      </div>
      <div className="space-y-2">
        <Label>حجم الملف</Label>
        <Input
          type="text"
          value={formData.file_size || ""}
          onChange={(e) =>
            setFormData((prev: any) => ({
              ...prev,
              file_size: e.target.value,
            }))}
          placeholder="مثال: 5.2 MB"
        />
      </div>
      <div className="col-span-2">
        <p className="text-xs text-muted-foreground">
          يتم تعبئة هذه الحقول تلقائيًا عند استيراد ملف PDF من رابط خارجي.
        </p>
      </div>
    </div>


    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label>حالة النشر</Label>
        <Select
          value={formData.publish_status}
          onValueChange={(value) =>
            setFormData((prev: any) => ({
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

      <div className="space-y-2">
        <Label>سنة النشر</Label>
        <Input
          type="number"
          value={formData.publish_year || ""}
          onChange={(e) =>
            setFormData((prev: any) => ({
              ...prev,
              publish_year: e.target.value,
            }))}
          placeholder="مثال: 2024"
          min="1900"
          max="2100"
        />
      </div>

      <div className="space-y-2">
        <Label>اللغة</Label>
        <Select
          value={formData.language || "ar"}
          onValueChange={(value) =>
            setFormData((prev: any) => ({
              ...prev,
              language: value,
            }))}
        >
          <SelectTrigger className="bg-muted">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ar">العربية</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="fr">Français</SelectItem>
            <SelectItem value="ur">اردو</SelectItem>
          </SelectContent>
        </Select>
      </div>

    </div>

    <div className="flex items-center gap-6 pt-6">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center">
          <UiverseToggle
            checked={formData.is_active}
            onCheckedChange={(checked) =>
              setFormData((prev: any) => ({
                ...prev,
                is_active: checked,
              }))}
          />
        </div>
        <Label>نشط</Label>
      </div>
    </div>

    <div className="flex justify-end gap-3 pt-4 border-t border-border">
      <Button
        variant="outline"
        type="button"
        onClick={onCancel}
      >
        إلغاء
      </Button>
      <Button
        type="submit"
        className="bg-primary hover:bg-primary-hover text-white"
        disabled={false}
      >
        {isEdit ? "حفظ التغييرات" : "إضافة"}
      </Button>
    </div>
  </form>
)

export default function ManageBooksPage() {
  const { user } = useAuth()
  const isVisitor = user?.email === 'visitor@gmail.com'
  const searchParams = useSearchParams()
  const router = useRouter()
  const [items, setItems] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Book | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 500)
  const [formData, setFormData] = useState<{
    title: string
    author: string
    description: string
    cover_image_path: string
    pdf_file_path: string
    pdf_type: 'local' | 'external'
    pdf_external_url: string
    publish_status: string
    is_active: boolean
    publish_year: string
    language: string
    file_size: string | null
    pages: number | null
    category_id: string | null
  }>({
    title: "",
    author: "السيد مراد سلامة",
    description: "",
    cover_image_path: "",
    pdf_file_path: "",
    pdf_type: "local",
    pdf_external_url: "",
    publish_status: "draft",
    is_active: true,
    publish_year: "",
    language: "ar",
    file_size: null,
    pages: null,
    category_id: null,
  })
  const [submitting, setSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalDownloads, setTotalDownloads] = useState(0)
  const [categories, setCategories] = useState<any[]>([])

  const supabase = createClient()

  const fetchItems = async () => {
    setLoading(true)
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE - 1

    let query = supabase
      .from("books")
      .select("*, download_count", { count: "exact" })
      .order("created_at", { ascending: false })

    if (debouncedSearchQuery) {
      query = query.or(`title.ilike.%${debouncedSearchQuery}%,author.ilike.%${debouncedSearchQuery}%`)
    }

    const { data, count, error } = await query.range(start, end)

    if (!error) {
      setItems(data || [])
      setTotalCount(count || 0)
    }

    // Fetch categories
    const { data: cats } = await supabase
      .from("categories")
      .select("*")
      .eq("type", "book")
      .order("name", { ascending: true })

    setCategories(cats || [])

    setLoading(false)

    // Fetch total downloads separately
    const { data: allBooks } = await supabase.from('books').select('download_count')
    if (allBooks) {
      const total = allBooks.reduce((acc, curr) => acc + (curr.download_count || 0), 0)
      setTotalDownloads(total)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchQuery])

  useEffect(() => {
    fetchItems()
  }, [currentPage, debouncedSearchQuery])

  useEffect(() => {
    const editId = searchParams.get("edit")
    if (editId) {
      if (isVisitor) return // Prevent visitor from accessing edit mode via URL
      const fetchAndEdit = async () => {
        const { data, error } = await supabase.from("books").select("*").eq("id", editId).single()
        if (data && !error) {
          // Open edit modal
          setEditingItem(data)
          setFormData({
            title: data.title,
            author: data.author || "",
            description: data.description || "",
            cover_image_path: data.cover_image_path || "",
            pdf_file_path: data.pdf_file_path || "",
            pdf_type: data.pdf_type || "local",
            pdf_external_url: data.pdf_external_url || "",
            publish_status: data.publish_status,
            is_active: data.is_active,
            publish_year: data.publish_year || "",
            language: data.language || "ar",
            file_size: data.file_size || null,
            pages: data.pages || null,
            category_id: data.category_id || "uncategorized",
          })
          setIsEditModalOpen(true)
          router.replace("/admin/books")
        }
      }
      fetchAndEdit()
    }
  }, [searchParams])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await supabase.from("books").insert({
      title: formData.title,
      author: formData.author || null,
      description: formData.description || null,
      cover_image_path: formData.cover_image_path || null,
      pdf_file_path: formData.pdf_type === "local" ? (formData.pdf_file_path || null) : null,
      pdf_type: formData.pdf_type,
      pdf_external_url: formData.pdf_type === "external" ? (formData.pdf_external_url || null) : null,
      publish_status: formData.publish_status,
      is_active: formData.is_active,
      publish_year: formData.publish_year || null,
      language: formData.language || null,
      file_size: formData.file_size || null,
      pages: formData.pages || null,
      category_id: formData.category_id || null,
    })

    if (!error) {
      setIsAddModalOpen(false)
      resetForm()
      fetchItems()
    } else {
      alert("حدث خطأ أثناء الإضافة: " + error.message)
    }
    setSubmitting(false)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    setSubmitting(true)
    const { error } = await supabase
      .from("books")
      .update({
        title: formData.title,
        author: formData.author || null,
        description: formData.description || null,
        cover_image_path: formData.cover_image_path || null,
        pdf_file_path: formData.pdf_type === "local" ? (formData.pdf_file_path || null) : null,
        pdf_type: formData.pdf_type,
        pdf_external_url: formData.pdf_type === "external" ? (formData.pdf_external_url || null) : null,
        publish_status: formData.publish_status,
        is_active: formData.is_active,
        publish_year: formData.publish_year || null,
        language: formData.language || null,
        file_size: formData.file_size || null,
        pages: formData.pages || null,
        category_id: formData.category_id || null,
      })
      .eq("id", editingItem.id)

    if (!error) {
      setIsEditModalOpen(false)
      setEditingItem(null)
      fetchItems()
    } else {
      alert("حدث خطأ أثناء التحديث: " + error.message)
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الكتاب؟")) return

    // 1. جلب مسارات الملفات أولاً
    const { data: item } = await supabase
      .from("books")
      .select("cover_image_path, pdf_file_path")
      .eq("id", id)
      .single()

    // 2. حذف الملفات من Cloudinary إن وجدت
    if (item) {
      // حذف صورة الغلاف (Cloudinary)
      if (item.cover_image_path?.includes('cloudinary')) {
        // استخراج publicId من URL
        const match = item.cover_image_path.match(/\/imam\/(.+)\.[^.]+$/)
        if (match) {
          await fetch(`/api/storage/delete?publicId=imam/${match[1]}`, {
            method: "DELETE",
          })
        }
      }
      // حذف ملف PDF (Cloudinary)
      if (item.pdf_file_path?.includes('cloudinary.com')) {
        await fetch(`/api/storage/delete?url=${encodeURIComponent(item.pdf_file_path)}`, {
          method: "DELETE",
        })
      }
      if (item.cover_image_path?.includes('cloudinary.com')) {
        await fetch(`/api/storage/delete?url=${encodeURIComponent(item.cover_image_path)}`, {
          method: "DELETE",
        })
      }
    }

    // 3. حذف السجل من قاعدة البيانات
    const { error } = await supabase.from("books").delete().eq("id", id)
    if (!error) fetchItems()
  }


  const toggleActive = async (id: string, currentStatus: boolean) => {
    await supabase
      .from("books")
      .update({ is_active: !currentStatus })
      .eq("id", id)
    fetchItems()
  }

  const openEditModal = (item: Book) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      author: item.author || "السيد مراد سلامة",
      description: item.description || "",
      cover_image_path: item.cover_image_path || "",
      pdf_file_path: item.pdf_file_path || "",
      pdf_type: item.pdf_type || "local",
      pdf_external_url: item.pdf_external_url || "",
      publish_status: item.publish_status,
      is_active: item.is_active ?? true,
      publish_year: item.publish_year || "",
      language: item.language || "ar",
      file_size: item.file_size || null,
      pages: item.pages || null,
      category_id: item.category_id || null,
    })
    setIsEditModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: "",
      author: "السيد مراد سلامة",
      description: "",
      cover_image_path: "",
      pdf_file_path: "",
      pdf_type: "local",
      pdf_external_url: "",
      publish_status: "draft",
      is_active: true,
      publish_year: "",
      language: "ar",
      file_size: null,
      pages: null,
      category_id: null,
    })
  }

  // Reset form when opening add modal
  useEffect(() => {
    if (isAddModalOpen) {
      resetForm()
    }
  }, [isAddModalOpen])

  // Client-side filtering removed in favor of server-side
  const filteredItems = items

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  const getDownloadCount = (item: Book) =>
    item.download_count || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#035d44] font-serif flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-[#035d44]" />
            إدارة الكتب
          </h1>
          <p className="text-muted-foreground mt-2">
            إضافة وتعديل الكتب والمؤلفات
          </p>
        </div>

        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          {!isVisitor && (
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold">
                <Plus className="h-5 w-5 ml-2" />
                إضافة كتاب جديد
              </Button>
            </DialogTrigger>
          )}

          <DialogContent
            className="sm:max-w-lg bg-card max-h-[90vh] overflow-y-auto"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-primary">
                إضافة كتاب جديد
              </DialogTitle>
            </DialogHeader>

            <BookForm
              onSubmit={handleAdd}
              formData={formData}
              setFormData={setFormData}
              onCancel={() => {
                setIsAddModalOpen(false)
                resetForm()
              }}
              categories={categories}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-2xl border border-border flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <BookOpen className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">إجمالي الكتب</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {totalCount}
            </p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center">
            <Eye className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">المنشورة</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {items.filter((i) => i.publish_status === "published").length}
            </p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-yellow-500/10 text-yellow-600 flex items-center justify-center">
            <FileText className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">المسودات</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">
              {items.filter((i) => i.publish_status === "draft").length}
            </p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Download className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">إجمالي التحميلات</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {totalDownloads}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-[#035d44]">قائمة الكتب</h3>
          <div className="relative">
            <Search className="absolute top-1/2 right-3 transform -translate-y-1/2 text-[#035d44] h-5 w-5" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-muted w-full md:w-64"
              placeholder="بحث..."
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            جاري التحميل...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? "لا توجد نتائج" : "لا توجد كتب بعد"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-muted/50 text-muted-foreground text-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">الكتاب</th>
                  <th className="px-6 py-4 font-medium">التصنيف</th>
                  <th className="px-6 py-4 font-medium">الحالة</th>
                  <th className="px-6 py-4 font-medium">التحميلات</th>
                  <th className="px-6 py-4 font-medium">نشط</th>
                  <th className="px-6 py-4 font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        {item.cover_image_path ? (
                          <BookImage
                            coverImagePath={item.cover_image_path}
                            alt=""
                            className="w-12 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(item.created_at).toLocaleDateString("ar-EG")}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span className="text-text-muted">
                        {item.author || "غير محدد"}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${item.publish_status === "published"
                          ? "bg-green-100 text-green-600"
                          : "bg-yellow-100 text-yellow-600"
                          }`}
                      >
                        {item.publish_status === "published" ? "منشور" : "مسودة"}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span className="font-bold text-primary">{getDownloadCount(item)}</span>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center">
                        <UiverseToggle
                          checked={item.is_active ?? true}
                          onCheckedChange={(checked) =>
                            !isVisitor && toggleActive(item.id, checked)
                          }
                          disabled={isVisitor}
                        />
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.open(`/books/${item.id}`, "_blank")}
                          className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                          title="عرض"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        {!isVisitor && (
                          <>
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="تعديل"
                            >
                              <Pencil className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
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

        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              السابق
            </Button>
            <span className="text-sm text-muted-foreground px-4">
              صفحة {currentPage} من {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              التالي
            </Button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent
          className="sm:max-w-lg bg-card max-h-[90vh] overflow-y-auto"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary">
              تعديل الكتاب
            </DialogTitle>
          </DialogHeader>

          <BookForm
            onSubmit={handleEdit}
            isEdit
            formData={formData}
            setFormData={setFormData}
            onCancel={() => {
              setIsEditModalOpen(false)
              setEditingItem(null)
              resetForm()
            }}
            categories={categories}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}