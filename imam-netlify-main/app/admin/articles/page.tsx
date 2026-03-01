"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { RichTextEditor } from "@/components/admin/rich-text-editor"
import { FileUpload } from "@/components/admin/file-upload"
import { Pagination } from "@/components/admin/pagination"
import { CategorySelector } from "@/components/admin/category-selector"
import { FileText, Plus, Eye, Search, Pencil, Trash2, Loader2, CheckCircle, FileEdit, Maximize2, Minimize2 } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

interface Article {
  id: string
  title: string
  content: string
  author: string
  featured_image?: string
  publish_status: string
  category_id?: string
  views_count: number
  created_at: string
}

interface Category {
  id: string
  name: string
  type: string
}

const ITEMS_PER_PAGE = 10

// Helper function to resolve image preview URLs
const resolvePreviewSrc = (value: string) => {
  if (!value) return ""
  // External URLs (e.g. YouTube)
  if (/^https?:\/\//i.test(value)) return value
  // Local images (start with / and don't contain uploads/)
  if (value.startsWith('/') && !value.includes('uploads/')) return value
  // Uploaded files (contain uploads/)
  return `/api/download?key=${encodeURIComponent(value)}`
}

const ArticleForm = ({
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
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6 mt-4">
      <div className="space-y-2">
        <Label>عنوان المقال</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData((prev: any) => ({
            ...prev,
            title: e.target.value,
          }))}
          placeholder="عنوان المقال"
          className="bg-muted dark:bg-background-alt"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label>الكاتب</Label>
          <Input
            value={formData.author}
            onChange={(e) => setFormData((prev: any) => ({
              ...prev,
              author: e.target.value,
            }))}
            className="bg-muted dark:bg-background-alt"
            required
          />
        </div>

        <CategorySelector
          type="article"
          value={formData.category_id || "none"}
          onChange={(value) => setFormData((prev: any) => ({
            ...prev,
            category_id: value,
          }))}
        />

        <div className="space-y-2">
          <Label>حالة النشر</Label>
          <Select
            value={formData.publish_status}
            onValueChange={(value) => setFormData((prev: any) => ({
              ...prev,
              publish_status: value,
            }))}
          >
            <SelectTrigger className="bg-muted dark:bg-background-alt">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="published">منشور</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <FileUpload
        accept="image/*"
        folder="articles"
        label="الصورة المميزة"
        onUploadComplete={(path) => setFormData((prev: any) => ({
          ...prev,
          featured_image: path,
        }))}
        currentFile={formData.featured_image}
        allowExternalUrl={true}
      />

      <div className="space-y-2">
        <Label>محتوى المقال</Label>
        <RichTextEditor
          content={formData.content}
          onChange={(html) => setFormData((prev: any) => ({
            ...prev,
            content: html,
          }))}
          placeholder="اكتب محتوى المقال هنا..."
        />
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
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={false}
        >
          {isEdit ? "حفظ التغييرات" : "نشر المقال"}
        </Button>
      </div>
    </form>
  )
}

export default function ManageArticlesPage() {
  const { user } = useAuth()
  const isVisitor = user?.email === 'visitor@gmail.com'
  const searchParams = useSearchParams()
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 500)
  // FIX: Initialize category_id with "none" instead of empty string
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    author: "السيد مراد سلامة",
    featured_image: "",
    publish_status: "draft",
    category_id: "none",
  })
  const [submitting, setSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)

  const supabase = createClient()

  const fetchArticles = async () => {
    setLoading(true)
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE - 1

    let query = supabase
      .from("articles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })

    if (debouncedSearchQuery) {
      query = query.ilike('title', `%${debouncedSearchQuery}%`)
    }

    const { data, count, error } = await query.range(start, end)

    if (!error) {
      setArticles(data || [])
      setTotalCount(count || 0)
    }
    setLoading(false)
  }

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("type", "article")
    if (data) setCategories(data)
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchQuery])

  useEffect(() => {
    fetchArticles()
    fetchCategories()
  }, [currentPage, debouncedSearchQuery])

  useEffect(() => {
    const editId = searchParams.get("edit")
    if (editId) {
      if (isVisitor) return // Prevent visitor from accessing edit mode via URL
      const fetchAndEdit = async () => {
        const { data, error } = await supabase.from("articles").select("*").eq("id", editId).single()
        if (data && !error) {
          // Open edit modal
          setEditingArticle(data)
          setFormData({
            title: data.title,
            content: data.content,
            author: data.author,
            featured_image: data.featured_image || "",
            publish_status: data.publish_status,
            category_id: data.category_id || "none",
          })
          setIsEditModalOpen(true)
          router.replace("/admin/articles")
        }
      }
      fetchAndEdit()
    }
  }, [searchParams])

  const handleAddArticle = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    // FIX: Convert "none" back to null before sending to Supabase
    const categoryIdToSend = formData.category_id === "none" ? null : formData.category_id

    const { error } = await supabase.from("articles").insert({
      ...formData,
      featured_image: formData.featured_image || null,
      category_id: categoryIdToSend,
    })

    if (!error) {
      setIsAddModalOpen(false)
      resetForm()
      fetchArticles()
    } else {
      alert("حدث خطأ أثناء الإضافة: " + error.message)
    }
    setSubmitting(false)
  }

  const handleEditArticle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingArticle) return
    setSubmitting(true)

    // FIX: Convert "none" back to null before sending to Supabase
    const categoryIdToSend = formData.category_id === "none" ? null : formData.category_id

    const { error } = await supabase
      .from("articles")
      .update({
        ...formData,
        featured_image: formData.featured_image || null,
        category_id: categoryIdToSend,
      })
      .eq("id", editingArticle.id)

    if (!error) {
      setIsEditModalOpen(false)
      setEditingArticle(null)
      fetchArticles()
    }
    setSubmitting(false)
  }

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المقال؟")) return

    // 1. جلب مسارات الملفات أولاً
    const { data: item } = await supabase
      .from("articles")
      .select("featured_image, thumbnail")
      .eq("id", id)
      .single()

    // 2. حذف الملفات من B2 إن وجدت
    if (item) {
      if (item.featured_image?.startsWith("uploads/")) {
        await fetch(`/api/storage/delete?key=${encodeURIComponent(item.featured_image)}`, {
          method: "DELETE",
        })
      }
      if (item.thumbnail?.startsWith("uploads/")) {
        await fetch(`/api/storage/delete?key=${encodeURIComponent(item.thumbnail)}`, {
          method: "DELETE",
        })
      }

      // Cloudinary delete
      if (item.featured_image?.includes("cloudinary.com")) {
        await fetch(`/api/storage/delete?url=${encodeURIComponent(item.featured_image)}`, { method: "DELETE" })
      }
      if (item.thumbnail?.includes("cloudinary.com")) {
        await fetch(`/api/storage/delete?url=${encodeURIComponent(item.thumbnail)}`, { method: "DELETE" })
      }
    }

    // 3. حذف السجل من قاعدة البيانات
    const { error } = await supabase.from("articles").delete().eq("id", id)
    if (!error) fetchArticles()
  }

  const openEditModal = (article: Article) => {
    setEditingArticle(article)
    setFormData({
      title: article.title,
      content: article.content,
      author: article.author || "السيد مراد سلامة",
      featured_image: article.featured_image || "",
      publish_status: article.publish_status,
      // FIX: Handle null category_id by defaulting to "none"
      category_id: article.category_id || "none",
    })
    setIsEditModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      author: "السيد مراد سلامة",
      featured_image: "",
      publish_status: "draft",
      category_id: "none", // FIX: Reset to "none"
    })
  }

  // Reset form when opening add modal
  useEffect(() => {
    if (isAddModalOpen) {
      resetForm()
    }
  }, [isAddModalOpen])

  const filteredArticles = articles
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
          <h1 className="text-lg md:text-2xl font-bold text-foreground flex items-center gap-3 font-serif">
            <FileText className="h-8 w-8 text-primary" />
            إدارة المقالات والبحوث
          </h1>
          <p className="text-muted-foreground mt-2">
            إضافة وتعديل المقالات العلمية
          </p>
        </div>

        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          {!isVisitor && (
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-bold">
                <Plus className="h-5 w-5 ml-2" />
                إضافة مقال جديد
              </Button>
            </DialogTrigger>
          )}

          <DialogContent
            className={`${isExpanded ? '!max-w-[95vw] !w-[95vw] !h-[95vh] !max-h-[95vh]' : ''} bg-card transition-all duration-300`}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <DialogHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
              <DialogTitle className="text-lg font-bold text-foreground">
                إضافة مقال جديد
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "تصغير" : "توسيع"}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </DialogHeader>

            <ArticleForm
              onSubmit={handleAddArticle}
              formData={formData}
              setFormData={setFormData}
              categories={categories}
              onCancel={() => {
                setIsAddModalOpen(false)
                resetForm()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-2xl border border-border flex items-center justify-between">
          <div>
            <span className="block text-muted-foreground text-sm mb-1">
              إجمالي المقالات
            </span>
            <span className="text-3xl font-bold text-foreground">
              {totalCount}
            </span>
          </div>

          <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <FileText className="h-7 w-7" />
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border flex items-center justify-between">
          <div>
            <span className="block text-muted-foreground text-sm mb-1">المنشورة</span>
            <span className="text-3xl font-bold text-green-600">
              {articles.filter((a) => a.publish_status === "published").length}
            </span>
          </div>

          <div className="w-14 h-14 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center">
            <CheckCircle className="h-7 w-7" />
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border flex items-center justify-between">
          <div>
            <span className="block text-muted-foreground text-sm mb-1">مسودات</span>
            <span className="text-3xl font-bold text-yellow-600">
              {articles.filter((a) => a.publish_status === "draft").length}
            </span>
          </div>

          <div className="w-14 h-14 rounded-xl bg-yellow-500/10 text-yellow-600 flex items-center justify-center">
            <FileEdit className="h-7 w-7" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-3xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/50">
          <h2 className="font-bold text-xl text-foreground">
            قائمة المقالات ({totalCount})
          </h2>
          <div className="relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4 pr-10 py-2 rounded-lg w-64 bg-background"
              placeholder="بحث عن مقال..."
            />
            <Search className="absolute right-3 top-2.5 text-muted-foreground h-5 w-5" />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            جاري التحميل...
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            {searchQuery ? "لا توجد نتائج" : "لا توجد مقالات بعد"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-muted/50 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">المقال</th>
                  <th className="px-6 py-4">الكاتب</th>
                  <th className="px-6 py-4">التصنيف</th>
                  <th className="px-6 py-4">المشاهدات</th>
                  <th className="px-6 py-4">الحالة</th>
                  <th className="px-6 py-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredArticles.map((article, index) => (
                  <tr
                    key={article.id}
                    className="group hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-muted-foreground text-sm">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {article.featured_image ? (
                          <img
                            src={resolvePreviewSrc(article.featured_image)}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-foreground text-sm mb-1">
                            {article.title}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {new Date(article.created_at).toLocaleDateString(
                              "ar-EG"
                            )}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {article.author}
                    </td>

                    <td className="px-6 py-4">
                      {getCategoryName(article.category_id) ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {getCategoryName(article.category_id)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {article.views_count || 0}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${article.publish_status === "published"
                          ? "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                      >
                        {article.publish_status === "published"
                          ? "منشور"
                          : "مسودة"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            window.open(`/articles/${article.id}`, "_blank")
                          }
                          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="عرض"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        {!isVisitor && (
                          <>
                            <button
                              onClick={() => openEditModal(article)}
                              className="p-2 rounded-lg hover:bg-muted text-blue-600 transition-colors"
                              title="تعديل"
                            >
                              <Pencil className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteArticle(article.id)}
                              className="p-2 rounded-lg hover:bg-muted text-red-600 transition-colors"
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
          className={`${isExpanded ? '!max-w-[95vw] !w-[95vw] !h-[95vh] !max-h-[95vh]' : ''} bg-card transition-all duration-300`}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
            <DialogTitle className="text-lg font-bold text-foreground">
              تعديل المقال
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "تصغير" : "توسيع"}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </DialogHeader>

          <ArticleForm
            onSubmit={handleEditArticle}
            isEdit
            formData={formData}
            setFormData={setFormData}
            categories={categories}
            onCancel={() => {
              setIsEditModalOpen(false)
              setEditingArticle(null)
              resetForm()
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}