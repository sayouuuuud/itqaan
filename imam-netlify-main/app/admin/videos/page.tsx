"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UiverseToggle } from "@/components/ui/uiverse-toggle"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Eye, Loader2, Video, Play, Search, Download, CheckCircle, FileEdit, Maximize2, Minimize2, Mic, Film } from "lucide-react"
import { FileUpload } from "@/components/admin/file-upload"
import { RichTextEditor } from "@/components/admin/rich-text-editor"
import { Pagination } from "@/components/admin/pagination"
import { CategorySelector } from "@/components/admin/category-selector"
import { useDebounce } from "@/hooks/use-debounce"

interface VideoFormData {
  title: string
  description: string
  type: string
  source: string
  url: string
  thumbnail: string
  duration: string
  publish_status: string
  is_active: boolean
  category_id: string
}

interface MediaFormProps {
  formData: VideoFormData
  setFormData: React.Dispatch<React.SetStateAction<VideoFormData>>
  submitting: boolean
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isEdit?: boolean
}

interface YouTubeVideoInfo {
  videoId: string
  title: string
  thumbnail: string
  embedUrl: string
  duration?: string
  description?: string
  channelTitle?: string
  publishedAt?: string
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

function MediaForm({ formData, setFormData, submitting, onSubmit, onCancel, isEdit }: MediaFormProps) {
  const [fetchingYouTube, setFetchingYouTube] = useState(false)
  const [lastFetchedUrl, setLastFetchedUrl] = useState("")

  const fetchYouTubeData = useCallback(async (url: string, silent = false) => {
    if (!url || formData.source !== 'youtube') {
      return
    }

    if (lastFetchedUrl === url) {
      return
    }

    setFetchingYouTube(true)
    try {
      const response = await fetch('/api/youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (data.success && data.videoInfo) {
        const videoInfo: YouTubeVideoInfo = data.videoInfo

        setFormData(prev => ({
          ...prev,
          title: prev.title || videoInfo.title || '',
          description: prev.description || videoInfo.description || '',
          thumbnail: prev.thumbnail || videoInfo.thumbnail || '',
          duration: prev.duration || videoInfo.duration || '',
        }))

        setLastFetchedUrl(url)
      } else if (!silent) {
        alert('فشل في جلب بيانات الفيديو: ' + (data.error || 'خطأ غير معروف'))
      }
    } catch (error) {
      console.error('Error fetching YouTube data:', error)
      if (!silent) {
        alert('حدث خطأ أثناء جلب بيانات الفيديو')
      }
    } finally {
      setFetchingYouTube(false)
    }
  }, [formData.source, lastFetchedUrl, setFormData])

  useEffect(() => {
    if (formData.source !== 'youtube') {
      setLastFetchedUrl("")
    }
  }, [formData.source])

  useEffect(() => {
    if (formData.source === 'youtube' && formData.url && formData.url !== lastFetchedUrl) {
      const timeoutId = setTimeout(() => {
        fetchYouTubeData(formData.url, true)
      }, 1000)

      return () => clearTimeout(timeoutId)
    }
  }, [formData.url, formData.source, lastFetchedUrl, fetchYouTubeData])

  return (
    <form onSubmit={onSubmit} className="space-y-6 mt-4">
      <div className="space-y-2">
        <Label>العنوان</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          className="bg-muted dark:bg-background-alt"
          placeholder="عنوان الفيديو/المقطع"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>الوصف</Label>
        <RichTextEditor
          content={formData.description}
          onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
          placeholder="وصف مختصر للمحتوى..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>النوع</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
          >
            <SelectTrigger className="bg-muted dark:bg-background-alt">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="video">فيديو</SelectItem>
              <SelectItem value="audio">صوتي</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>المصدر</Label>
          <Select
            value={formData.source}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, source: value }))}
          >
            <SelectTrigger className="bg-muted dark:bg-background-alt">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="youtube">يوتيوب</SelectItem>
              <SelectItem value="direct">رابط مباشر</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>الرابط</Label>
        <div className="flex gap-2">
          <Input
            value={formData.url}
            onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
            className="flex-1 bg-muted dark:bg-background-alt"
            placeholder="أدخل رابط اليوتيوب أو ملف الفيديو"
            dir="ltr"
          />
          {formData.source === 'youtube' && (
            <>
              {fetchingYouTube && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الجلب...
                </div>
              )}
              {formData.url && !fetchingYouTube && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fetchYouTubeData(formData.url)}
                  className="shrink-0"
                  title="جلب البيانات من يوتيوب"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
        {formData.source === 'youtube' && (
          <p className="text-xs text-muted-foreground">
            ✨ سيتم جلب العنوان، الوصف، والصورة المصغرة تلقائياً من يوتيوب
          </p>
        )}
      </div>

      <div className="space-y-2">
        <FileUpload
          label="صورة مصغرة"
          accept="image/*"
          folder="videos/thumbnails"
          currentFile={formData.thumbnail}
          onUploadComplete={(key) => setFormData((prev) => ({ ...prev, thumbnail: key }))}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>المدة (اختياري)</Label>
          <Input
            value={formData.duration}
            onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
            placeholder="مثال: 12:34"
            className="bg-muted dark:bg-background-alt"
            dir="ltr"
          />
        </div>

        <CategorySelector
          type="media"
          value={formData.category_id}
          onChange={(value) => setFormData((prev) => ({ ...prev, category_id: value }))}
        />

        <div className="space-y-2">
          <Label>حالة النشر</Label>
          <Select
            value={formData.publish_status}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, publish_status: value }))}
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

      <div className="flex items-center justify-between rounded-xl border border-border p-4 bg-muted/20">
        <div>
          <p className="text-sm font-medium">تفعيل العرض</p>
          <p className="text-xs text-muted-foreground">إظهار هذا العنصر في الموقع للزوار</p>
        </div>
        <UiverseToggle
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          إلغاء
        </Button>
        <Button
          type="submit"
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={submitting}
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري الحفظ...
            </span>
          ) : isEdit ? "حفظ التغييرات" : "نشر الفيديو"}
        </Button>
      </div>
    </form>
  )
}

export default function VideosAdminPage() {
  const { user } = useAuth()
  const isVisitor = user?.email === 'visitor@gmail.com'
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, views: 0 })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [formData, setFormData] = useState<VideoFormData>({
    title: "",
    description: "",
    type: "video",
    source: "youtube",
    url: "",
    thumbnail: "",
    duration: "",
    publish_status: "draft",
    is_active: true,
    category_id: "none",
  })

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "video",
      source: "youtube",
      url: "",
      thumbnail: "",
      duration: "",
      publish_status: "draft",
      is_active: true,
      category_id: "none",
    })
  }

  // Reset expanded state when modals close
  useEffect(() => {
    if (!isAddModalOpen && !isEditModalOpen) {
      setTimeout(() => setIsExpanded(false), 300)
    }
  }, [isAddModalOpen, isEditModalOpen])

  // Also reset form when opening add modal
  useEffect(() => {
    if (isAddModalOpen) resetForm()
  }, [isAddModalOpen])

  const fetchItems = async () => {
    setLoading(true)
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE - 1

    try {
      // Fetch paginated data
      let query = supabase
        .from("media")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })

      if (debouncedSearchTerm) {
        query = query.ilike('title', `%${debouncedSearchTerm}%`)
      }

      const { data, count, error } = await query.range(start, end)

      if (!error && data) {
        setItems(data)
        setTotalCount(count || 0)
      }

      // Fetch Stats (Global) - separate query for stats to get totals correctly
      const { data: allData } = await supabase
        .from("media")
        .select("publish_status, views_count, views")

      if (allData) {
        setStats({
          total: allData.length,
          published: allData.filter((i) => i.publish_status === "published").length,
          draft: allData.filter((i) => i.publish_status === "draft").length,
          views: allData.reduce((sum, i) => sum + (i.views || i.views_count || 0), 0),
        })
      }

    } catch (error) {
      console.error("Error fetching items:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm])

  useEffect(() => {
    fetchItems()
  }, [currentPage, debouncedSearchTerm])

  useEffect(() => {
    const editId = searchParams.get("edit")
    if (editId) {
      if (isVisitor) return // Prevent visitor from accessing edit mode via URL
      const fetchAndEdit = async () => {
        const { data, error } = await supabase.from("media").select("*").eq("id", editId).single()
        if (data && !error) {
          openEditModal(data)
          router.replace("/admin/videos")
        }
      }
      fetchAndEdit()
    }
  }, [searchParams])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const categoryIdToSend = formData.category_id === "none" ? null : formData.category_id
      const insertPayload = {
        title: formData.title,
        description: formData.description || null,
        type: formData.type,
        source: formData.source,
        url: formData.url,
        thumbnail: formData.thumbnail || null,
        duration: formData.duration || null,
        publish_status: formData.publish_status,
        is_active: formData.is_active,
        category_id: categoryIdToSend,
      }

      const { error } = await supabase.from("media").insert(insertPayload)

      if (!error) {
        setIsAddModalOpen(false)
        resetForm()
        fetchItems()
      } else {
        alert("حدث خطأ أثناء الإضافة: " + error.message)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return
    setSubmitting(true)

    try {
      const categoryIdToSend = formData.category_id === "none" ? null : formData.category_id
      const updatePayload = {
        title: formData.title,
        description: formData.description || null,
        type: formData.type,
        source: formData.source,
        url: formData.url,
        thumbnail: formData.thumbnail || null,
        duration: formData.duration || null,
        publish_status: formData.publish_status,
        is_active: formData.is_active,
        category_id: categoryIdToSend,
      }

      const { error } = await supabase
        .from("media")
        .update(updatePayload)
        .eq("id", selectedItem.id)

      if (!error) {
        setIsEditModalOpen(false)
        setSelectedItem(null)
        resetForm()
        fetchItems()
      } else {
        alert("حدث خطأ أثناء التحديث: " + error.message)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الفيديو؟")) return

    const { data: item } = await supabase
      .from("media")
      .select("thumbnail, url")
      .eq("id", id)
      .single()

    if (item) {
      // Legacy B2 delete
      if (item.thumbnail?.startsWith("uploads/")) {
        await fetch(`/api/storage/delete?key=${encodeURIComponent(item.thumbnail)}`, { method: "DELETE" })
      }
      if (item.url?.startsWith("uploads/")) {
        await fetch(`/api/storage/delete?key=${encodeURIComponent(item.url)}`, { method: "DELETE" })
      }

      // Cloudinary delete
      if (item.thumbnail?.includes("cloudinary.com")) {
        await fetch(`/api/storage/delete?url=${encodeURIComponent(item.thumbnail)}`, { method: "DELETE" })
      }
      if (item.url?.includes("cloudinary.com")) {
        await fetch(`/api/storage/delete?url=${encodeURIComponent(item.url)}`, { method: "DELETE" })
      }
    }

    const { error } = await supabase.from("media").delete().eq("id", id)
    if (!error) {
      fetchItems()
    } else {
      alert("حدث خطأ أثناء الحذف: " + error.message)
    }
  }

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("media").update({ is_active: !current }).eq("id", id)
    if (!error) fetchItems()
  }

  const openEditModal = (item: any) => {
    setSelectedItem(item)
    setFormData({
      title: item.title || "",
      description: item.description || "",
      type: item.type || "video",
      source: item.source || "youtube",
      url: item.url || "",
      thumbnail: item.thumbnail || "",
      duration: item.duration || "",
      publish_status: item.publish_status || "draft",
      is_active: item.is_active ?? true,
      category_id: item.category_id || "none",
    })
    setIsEditModalOpen(true)
  }

  const filteredItems = items
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3 font-serif">
            <Video className="h-8 w-8 text-primary" />
            إدارة المرئيات والصوتيات
          </h1>
          <p className="text-muted-foreground mt-2">
            إضافة وتعديل الفيديوهات والدروس المسجلة
          </p>
        </div>

        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          {!isVisitor && (
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-bold">
                <Plus className="h-5 w-5 ml-2" />
                إضافة فيديو جديد
              </Button>
            </DialogTrigger>
          )}

          <DialogContent
            className={`${isExpanded ? '!max-w-[95vw] !w-[95vw] !h-[95vh] !max-h-[95vh]' : 'sm:max-w-lg'} bg-card transition-all duration-300 overflow-y-auto`}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <DialogHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
              <DialogTitle className="text-lg font-bold text-foreground">
                إضافة فيديو جديد
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

            <MediaForm
              formData={formData}
              setFormData={setFormData}
              submitting={submitting}
              onSubmit={handleAdd}
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
            <span className="block text-muted-foreground text-sm mb-1">إجمالي الفيديوهات</span>
            <span className="text-3xl font-bold text-foreground">{stats.total}</span>
          </div>
          <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Film className="h-7 w-7" />
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border flex items-center justify-between">
          <div>
            <span className="block text-muted-foreground text-sm mb-1">المنشورة</span>
            <span className="text-3xl font-bold text-green-600">{stats.published}</span>
          </div>
          <div className="w-14 h-14 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center">
            <CheckCircle className="h-7 w-7" />
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border flex items-center justify-between">
          <div>
            <span className="block text-muted-foreground text-sm mb-1">مسودات</span>
            <span className="text-3xl font-bold text-yellow-600">{stats.draft}</span>
          </div>
          <div className="w-14 h-14 rounded-xl bg-yellow-500/10 text-yellow-600 flex items-center justify-center">
            <FileEdit className="h-7 w-7" />
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border flex items-center justify-between">
          <div>
            <span className="block text-muted-foreground text-sm mb-1">إجمالي المشاهدات</span>
            <span className="text-3xl font-bold text-blue-600">{stats.views}</span>
          </div>
          <div className="w-14 h-14 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Eye className="h-7 w-7" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-3xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/50">
          <h2 className="font-bold text-xl text-foreground">
            قائمة المرئيات ({totalCount})
          </h2>
          <div className="relative">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-4 pr-10 py-2 rounded-lg w-64 bg-background"
              placeholder="بحث في الفيديوهات..."
            />
            <Search className="absolute right-3 top-2.5 text-muted-foreground h-5 w-5" />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            جاري التحميل...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            {searchTerm ? "لا توجد نتائج" : "لا توجد فيديوهات بعد"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right font-bold">الفيديو</TableHead>
                  <TableHead className="text-right font-bold">النوع</TableHead>
                  <TableHead className="text-right font-bold">المصدر</TableHead>
                  <TableHead className="text-right font-bold">الحالة</TableHead>
                  <TableHead className="text-right font-bold">المشاهدات</TableHead>
                  <TableHead className="text-right font-bold text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {item.thumbnail ? (
                          <div className="relative w-16 h-10 rounded-md overflow-hidden shrink-0 group">
                            <img
                              src={resolvePreviewSrc(item.thumbnail)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-4 h-4 text-white fill-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-16 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                            <Video className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-foreground text-sm line-clamp-1 max-w-[200px]" title={item.title}>
                            {item.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString("ar-EG")}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.type === "video" ? (
                          <Film className="h-4 w-4 text-purple-500" />
                        ) : (
                          <Mic className="h-4 w-4 text-orange-500" />
                        )}
                        <span className="text-sm">
                          {item.type === "video" ? "فيديو" : "صوتي"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {item.source === "youtube" ? "يوتيوب" : "ملف محلي"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.publish_status === "published"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}>
                        {item.publish_status === "published" ? "منشور" : "مسودة"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {item.views || item.views_count || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                          onClick={() => openEditModal(item)}
                          title="تعديل"
                          disabled={isVisitor}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${item.is_active ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-gray-400 hover:text-gray-600"}`}
                          onClick={() => !isVisitor && toggleActive(item.id, item.is_active)}
                          title={item.is_active ? "تعطيل" : "تفعيل"}
                          disabled={isVisitor}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(item.id)}
                          title="حذف"
                          disabled={isVisitor}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
          className={`${isExpanded ? '!max-w-[95vw] !w-[95vw] !h-[95vh] !max-h-[95vh]' : 'sm:max-w-lg'} bg-card transition-all duration-300 overflow-y-auto`}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
            <DialogTitle className="text-lg font-bold text-foreground">
              تعديل الفيديو
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

          <MediaForm
            formData={formData}
            setFormData={setFormData}
            submitting={submitting}
            onSubmit={handleEdit}
            isEdit
            onCancel={() => {
              setIsEditModalOpen(false)
              setSelectedItem(null)
              resetForm()
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
