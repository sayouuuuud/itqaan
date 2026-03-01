"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2, Plus, Trash2, Edit, FolderTree, ChevronDown, ChevronLeft,
  Maximize2, Minimize2, BookOpen, Mic, FileText, Book, Video,
  Calendar, Star, Shield, Scroll, Heart, Sparkles, GraduationCap, Users,
  Tv, Film, Headphones, Radio, MapPin, Moon, Coins, Sunrise, Droplet, Scale, MessageCircle
} from "lucide-react"

interface Category {
  id: string
  name: string
  slug: string
  type: string
  description?: string
  parent_category_id?: string | null
  icon?: string
  color?: string
  sort_order?: number
  is_active?: boolean
  content_count?: number
  created_at: string
}

const CONTENT_TYPES = [
  { value: "sermon", label: "الخطب", icon: Mic, color: "#16A34A" },
  { value: "lesson", label: "الدروس", icon: BookOpen, color: "#0891B2" },
  { value: "article", label: "المقالات", icon: FileText, color: "#2563EB" },
  { value: "book", label: "الكتب", icon: Book, color: "#7C3AED" },
  { value: "media", label: "المرئيات", icon: Video, color: "#DC2626" },
]

const ICON_OPTIONS = [
  { value: "folder", label: "مجلد", Icon: FolderTree },
  { value: "book-open", label: "كتاب مفتوح", Icon: BookOpen },
  { value: "mic", label: "ميكروفون", Icon: Mic },
  { value: "file-text", label: "ملف نصي", Icon: FileText },
  { value: "book", label: "كتاب", Icon: Book },
  { value: "video", label: "فيديو", Icon: Video },
  { value: "calendar", label: "تقويم", Icon: Calendar },
  { value: "star", label: "نجمة", Icon: Star },
  { value: "shield", label: "درع", Icon: Shield },
  { value: "scroll", label: "مخطوطة", Icon: Scroll },
  { value: "heart", label: "قلب", Icon: Heart },
  { value: "sparkles", label: "لمعان", Icon: Sparkles },
  { value: "graduation-cap", label: "قبعة التخرج", Icon: GraduationCap },
  { value: "users", label: "مجموعة", Icon: Users },
  { value: "tv", label: "تلفزيون", Icon: Tv },
  { value: "film", label: "فيلم", Icon: Film },
  { value: "headphones", label: "سماعات", Icon: Headphones },
  { value: "radio", label: "راديو", Icon: Radio },
  { value: "map-pin", label: "موقع", Icon: MapPin },
  { value: "moon", label: "قمر", Icon: Moon },
  { value: "coins", label: "عملات", Icon: Coins },
  { value: "sunrise", label: "شروق", Icon: Sunrise },
  { value: "droplet", label: "قطرة", Icon: Droplet },
  { value: "scale", label: "ميزان", Icon: Scale },
  { value: "message-circle", label: "رسالة", Icon: MessageCircle },
]

const COLOR_OPTIONS = [
  { value: "#1e4338", label: "أخضر داكن" },
  { value: "#16A34A", label: "أخضر" },
  { value: "#0891B2", label: "سماوي" },
  { value: "#2563EB", label: "أزرق" },
  { value: "#7C3AED", label: "بنفسجي" },
  { value: "#DC2626", label: "أحمر" },
  { value: "#EA580C", label: "برتقالي" },
  { value: "#EAB308", label: "أصفر" },
  { value: "#F59E0B", label: "ذهبي" },
  { value: "#DB2777", label: "وردي" },
  { value: "#6366F1", label: "نيلي" },
  { value: "#0D9488", label: "فيروزي" },
]

function getIconComponent(iconName: string) {
  const iconOption = ICON_OPTIONS.find(opt => opt.value === iconName)
  return iconOption?.Icon || FolderTree
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const isVisitor = user?.email === 'visitor@gmail.com'
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [activeTab, setActiveTab] = useState("sermon")
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    type: "sermon",
    description: "",
    parent_category_id: "none",
    icon: "folder",
    color: "#1e4338",
    sort_order: 0,
    is_active: true,
  })
  const supabase = createClient()

  useEffect(() => {
    fetchCategories()
  }, [])

  // Reset expanded when dialog closes
  useEffect(() => {
    if (!dialogOpen) {
      setTimeout(() => setIsExpanded(false), 300)
    }
  }, [dialogOpen])

  async function fetchCategories() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true })

      if (error) {
        console.error("Error fetching categories:", error)
        setMessage({ type: "error", text: "حدث خطأ أثناء جلب التصنيفات: " + error.message })
        setCategories([])
      } else {
        setCategories(data || [])
      }
    } catch (err: any) {
      console.error("Fetch error:", err)
      setMessage({ type: "error", text: "حدث خطأ غير متوقع" })
      setCategories([])
    }
    setLoading(false)
  }

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[أإآ]/g, 'a')
      .replace(/[ب]/g, 'b')
      .replace(/[ت]/g, 't')
      .replace(/[ث]/g, 'th')
      .replace(/[ج]/g, 'j')
      .replace(/[ح]/g, 'h')
      .replace(/[خ]/g, 'kh')
      .replace(/[د]/g, 'd')
      .replace(/[ذ]/g, 'dh')
      .replace(/[ر]/g, 'r')
      .replace(/[ز]/g, 'z')
      .replace(/[س]/g, 's')
      .replace(/[ش]/g, 'sh')
      .replace(/[ص]/g, 's')
      .replace(/[ض]/g, 'd')
      .replace(/[ط]/g, 't')
      .replace(/[ظ]/g, 'z')
      .replace(/[ع]/g, 'a')
      .replace(/[غ]/g, 'gh')
      .replace(/[ف]/g, 'f')
      .replace(/[ق]/g, 'q')
      .replace(/[ك]/g, 'k')
      .replace(/[ل]/g, 'l')
      .replace(/[م]/g, 'm')
      .replace(/[ن]/g, 'n')
      .replace(/[ه]/g, 'h')
      .replace(/[و]/g, 'w')
      .replace(/[ي]/g, 'y')
      .replace(/[ة]/g, 'a')
      .replace(/[ى]/g, 'a')
      .replace(/[ء]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .replace(/--+/g, '-')
      .trim()
  }

  function handleEdit(category: Category) {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug || "",
      type: category.type,
      description: category.description || "",
      parent_category_id: category.parent_category_id || "none",
      icon: category.icon || "folder",
      color: category.color || "#1e4338",
      sort_order: category.sort_order || 0,
      is_active: category.is_active ?? true,
    })
    setDialogOpen(true)
  }

  function handleNew(type?: string) {
    setEditingCategory(null)
    setFormData({
      name: "",
      slug: "",
      type: type || activeTab,
      description: "",
      parent_category_id: "none",
      icon: "folder",
      color: CONTENT_TYPES.find(t => t.value === (type || activeTab))?.color || "#1e4338",
      sort_order: 0,
      is_active: true,
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: "", text: "" })

    try {
      const slug = formData.slug || generateSlug(formData.name)
      const payload = {
        name: formData.name,
        slug,
        type: formData.type,
        description: formData.description || null,
        parent_category_id: formData.parent_category_id === "none" ? null : formData.parent_category_id,
        icon: formData.icon,
        color: formData.color,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
      }

      let error
      if (editingCategory) {
        const result = await supabase
          .from("categories")
          .update(payload)
          .eq("id", editingCategory.id)
        error = result.error
      } else {
        const result = await supabase.from("categories").insert([payload])
        error = result.error
      }

      if (error) throw error

      setMessage({
        type: "success",
        text: editingCategory ? "تم تحديث التصنيف بنجاح" : "تم إضافة التصنيف بنجاح",
      })
      setDialogOpen(false)
      fetchCategories()
    } catch (error: any) {
      console.error("Error saving category:", error)
      setMessage({ type: "error", text: "حدث خطأ أثناء الحفظ: " + error.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا التصنيف؟")) return
    const { error } = await supabase.from("categories").delete().eq("id", id)
    if (error) {
      setMessage({ type: "error", text: "حدث خطأ أثناء الحذف: " + error.message })
    } else {
      setMessage({ type: "success", text: "تم حذف التصنيف بنجاح" })
      fetchCategories()
    }
  }

  function getParentCategories(type: string) {
    return categories.filter((c) => c.type === type && !c.parent_category_id)
  }

  function getChildCategories(parentId: string) {
    return categories.filter((c) => c.parent_category_id === parentId)
  }

  function getCategoriesByType(type: string) {
    return categories.filter((c) => c.type === type)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3 font-serif">
            <FolderTree className="h-8 w-8 text-primary" />
            إدارة التصنيفات
          </h1>
          <p className="text-muted-foreground mt-2">
            تنظيم محتوى الموقع في تصنيفات هرمية
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleNew()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-bold"
            >
              <Plus className="h-5 w-5 ml-2" />
              إضافة تصنيف
            </Button>
          </DialogTrigger>

          <DialogContent
            className={`${isExpanded ? '!max-w-[95vw] !w-[95vw] !h-[95vh] !max-h-[95vh]' : 'sm:max-w-lg'} bg-card transition-all duration-300 overflow-y-auto`}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <DialogHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
              <DialogTitle className="text-lg font-bold text-foreground">
                {editingCategory ? "تعديل التصنيف" : "إضافة تصنيف جديد"}
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

            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>اسم التصنيف</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      name: e.target.value,
                      slug: prev.slug || generateSlug(e.target.value),
                    }))}
                    required
                    placeholder="مثال: فقه العبادات"
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label>الرابط (Slug)</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="fiqh-worship"
                    className="bg-muted"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  placeholder="وصف مختصر للتصنيف"
                  className="bg-muted"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>نوع المحتوى</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData((prev) => ({
                      ...prev,
                      type: value,
                      parent_category_id: "none",
                      color: CONTENT_TYPES.find(t => t.value === value)?.color || prev.color,
                    }))}
                  >
                    <SelectTrigger className="bg-muted">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPES.map((type) => {
                        const Icon = type.icon
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" style={{ color: type.color }} />
                              {type.label}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>التصنيف الأب (اختياري)</Label>
                  <Select
                    value={formData.parent_category_id}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, parent_category_id: value }))}
                  >
                    <SelectTrigger className="bg-muted">
                      <SelectValue placeholder="بدون تصنيف أب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون تصنيف أب (رئيسي)</SelectItem>
                      {getParentCategories(formData.type)
                        .filter((c) => c.id !== editingCategory?.id)
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>الأيقونة</Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, icon: value }))}
                  >
                    <SelectTrigger className="bg-muted">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((opt) => {
                        const Icon = opt.Icon
                        return (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {opt.label}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>اللون</Label>
                  <Select
                    value={formData.color}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, color: value }))}
                  >
                    <SelectTrigger className="bg-muted">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: opt.value }} />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>الترتيب</Label>
                  <Input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    className="bg-muted"
                    min={0}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={saving || isVisitor}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    "حفظ"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Message */}
      {message.text && (
        <div
          className={`p-4 rounded-xl text-center border ${message.type === "error"
            ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
            : "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
            }`}
        >
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {CONTENT_TYPES.map((type) => {
          const count = getCategoriesByType(type.value).length
          const Icon = type.icon
          return (
            <div
              key={type.value}
              className="bg-card p-4 rounded-xl border border-border flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setActiveTab(type.value)}
            >
              <div>
                <span className="block text-muted-foreground text-xs mb-1">{type.label}</span>
                <span className="text-2xl font-bold" style={{ color: type.color }}>{count}</span>
              </div>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${type.color}20` }}
              >
                <Icon className="h-5 w-5" style={{ color: type.color }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-2 bg-muted/50 p-2 rounded-xl">
          {CONTENT_TYPES.map((type) => {
            const Icon = type.icon
            return (
              <TabsTrigger
                key={type.value}
                value={type.value}
                className="flex-1 min-w-[120px] data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg py-3"
              >
                <Icon className="h-4 w-4 ml-2" style={{ color: type.color }} />
                {type.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {CONTENT_TYPES.map((type) => {
          const parentCats = getParentCategories(type.value)
          const typeCats = getCategoriesByType(type.value)

          return (
            <TabsContent key={type.value} value={type.value} className="mt-6">
              <div className="bg-card rounded-xl border border-border">
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <span
                      className="px-2 py-1 rounded-lg text-sm"
                      style={{ backgroundColor: `${type.color}20`, color: type.color }}
                    >
                      {type.label}
                    </span>
                    <span className="text-sm text-muted-foreground font-normal">
                      ({typeCats.length} تصنيف)
                    </span>
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleNew(type.value)}
                    disabled={isVisitor}
                  >
                    <Plus className="h-4 w-4 ml-1" />
                    إضافة
                  </Button>
                </div>

                {typeCats.length === 0 ? (
                  <div className="p-12 text-center">
                    <FolderTree className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">لا توجد تصنيفات لـ {type.label}</p>
                    <Button
                      className="mt-4"
                      variant="outline"
                      onClick={() => handleNew(type.value)}
                      disabled={isVisitor}
                    >
                      <Plus className="h-4 w-4 ml-1" />
                      إضافة أول تصنيف
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {parentCats.map((category) => {
                      const children = getChildCategories(category.id)
                      const IconComponent = getIconComponent(category.icon || "folder")

                      return (
                        <div key={category.id}>
                          {/* Parent Category */}
                          <div className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${category.color || type.color}20` }}
                            >
                              <IconComponent
                                className="h-5 w-5"
                                style={{ color: category.color || type.color }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-foreground">{category.name}</span>
                                {children.length > 0 && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                    {children.length} فرعي
                                  </span>
                                )}
                                {!category.is_active && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                    معطل
                                  </span>
                                )}
                              </div>
                              {category.description && (
                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                  {category.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(category)}
                                title="تعديل"
                                disabled={isVisitor}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(category.id)}
                                title="حذف"
                                disabled={isVisitor}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>

                          {/* Child Categories */}
                          {children.length > 0 && (
                            <div className="mr-6 border-r-2 border-border/50">
                              {children.map((child) => {
                                const ChildIcon = getIconComponent(child.icon || "folder")
                                return (
                                  <div
                                    key={child.id}
                                    className="flex items-center gap-3 p-3 pr-6 hover:bg-muted/30 transition-colors"
                                  >
                                    <ChevronLeft className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <div
                                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                      style={{ backgroundColor: `${child.color || category.color}20` }}
                                    >
                                      <ChildIcon
                                        className="h-4 w-4"
                                        style={{ color: child.color || category.color }}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className="font-medium text-foreground text-sm">{child.name}</span>
                                      {child.description && (
                                        <p className="text-xs text-muted-foreground truncate">
                                          {child.description}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEdit(child)}
                                        disabled={isVisitor}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDelete(child.id)}
                                      >
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                      </Button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {/* Orphan categories */}
                    {typeCats
                      .filter(
                        (c) =>
                          c.parent_category_id &&
                          !categories.find((p) => p.id === c.parent_category_id)
                      )
                      .map((category) => {
                        const IconComponent = getIconComponent(category.icon || "folder")
                        return (
                          <div
                            key={category.id}
                            className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors opacity-60"
                          >
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${category.color}20` }}
                            >
                              <IconComponent className="h-5 w-5" style={{ color: category.color }} />
                            </div>
                            <div className="flex-1">
                              <span className="font-medium text-foreground">{category.name}</span>
                              <p className="text-xs text-yellow-600">تصنيف أب مفقود</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost" onClick={() => handleEdit(category)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDelete(category.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}