"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Plus, Pencil, Trash2, Tag } from "lucide-react"

interface TagItem {
  id: string
  name: string
  slug: string
  description?: string
  color: string
  usage_count: number
  created_at: string
}

const tagColors = [
  { value: "#3b82f6", label: "أزرق", class: "bg-blue-100 text-blue-700" },
  { value: "#10b981", label: "أخضر", class: "bg-green-100 text-green-700" },
  { value: "#f59e0b", label: "ذهبي", class: "bg-amber-100 text-amber-700" },
  { value: "#ef4444", label: "أحمر", class: "bg-red-100 text-red-700" },
  { value: "#8b5cf6", label: "بنفسجي", class: "bg-purple-100 text-purple-700" },
  { value: "#14b8a6", label: "فيروزي", class: "bg-teal-100 text-teal-700" },
  { value: "#ec4899", label: "وردي", class: "bg-pink-100 text-pink-700" },
]

export default function TagsManagementPage() {
  const [tags, setTags] = useState<TagItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<TagItem | null>(null)
  const [formData, setFormData] = useState({ name: "", slug: "", description: "", color: "#3b82f6" })
  const [message, setMessage] = useState({ type: "", text: "" })
  const supabase = createClient()

  useEffect(() => {
    fetchTags()
  }, [])

  async function fetchTags() {
    setLoading(true)
    const { data, error } = await supabase.from("tags").select("*").order("name")
    if (error) {
      console.error("[v0] Error fetching tags:", error)
    }
    if (data) {
      setTags(data)
    }
    setLoading(false)
  }

  function openCreateDialog() {
    setEditingTag(null)
    setFormData({ name: "", slug: "", description: "", color: "#3b82f6" })
    setDialogOpen(true)
  }

  function openEditDialog(tag: TagItem) {
    setEditingTag(tag)
    setFormData({
      name: tag.name,
      slug: tag.slug,
      description: tag.description || "",
      color: tag.color,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      setMessage({ type: "error", text: "يرجى إدخال اسم الوسم" })
      return
    }
    setSaving(true)
    setMessage({ type: "", text: "" })
    try {
      const payload = {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-"),
        description: formData.description || null,
        color: formData.color,
      }
      let error
      if (editingTag) {
        const result = await supabase.from("tags").update(payload).eq("id", editingTag.id)
        error = result.error
      } else {
        const result = await supabase.from("tags").insert(payload)
        error = result.error
      }
      if (error) throw error
      setMessage({ type: "success", text: editingTag ? "تم تحديث الوسم بنجاح" : "تم إضافة الوسم بنجاح" })
      setDialogOpen(false)
      fetchTags()
    } catch (error: any) {
      console.error("[v0] Error saving tag:", error)
      setMessage({ type: "error", text: "حدث خطأ: " + error.message })
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا الوسم؟")) return
    const { error } = await supabase.from("tags").delete().eq("id", id)
    if (error) {
      setMessage({ type: "error", text: "حدث خطأ أثناء الحذف: " + error.message })
    } else {
      setMessage({ type: "success", text: "تم حذف الوسم بنجاح" })
      fetchTags()
    }
  }

  const getColorStyle = (color: string) => {
    return { backgroundColor: color + "20" }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-serif flex items-center gap-3">
            <Tag className="h-8 w-8 text-primary" />
            إدارة الوسوم
          </h1>
          <p className="text-muted-foreground mt-2">إضافة وتعديل الوسوم المستخدمة في المحتوى</p>
        </div>

        <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary-hover text-white">
          <Plus className="h-4 w-4 ml-2" />
          إضافة وسم
        </Button>
      </div>

      {/* Message */}
      {message.text && (
        <div
          className={`p-4 rounded-xl text-center ${
            message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tags Grid */}
      {tags.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <Tag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">لا توجد وسوم</h3>
          <p className="text-muted-foreground mb-4">ابدأ بإضافة وسوم جديدة</p>
          <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary-hover text-white">
            <Plus className="h-4 w-4 ml-2" />
            إضافة وسم
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="bg-card rounded-xl p-4 border border-border hover:border-primary/50 transition-colors group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 rounded-full text-sm font-medium" style={getColorStyle(tag.color)}>
                  {tag.name}
                </span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(tag)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(tag.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {tag.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{tag.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">استخدام: {tag.usage_count || 0} مرة</p>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-card" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {editingTag ? "تعديل الوسم" : "إضافة وسم جديد"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>اسم الوسم *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="مثال: فقه، عقيدة، سيرة"
              />
            </div>
            <div className="space-y-2">
              <Label>الاسم المختصر (Slug)</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="يُستخرج تلقائياً من الاسم"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="وصف مختصر للوسم"
              />
            </div>
            <div className="space-y-2">
              <Label>لون الوسم</Label>
              <div className="flex flex-wrap gap-2">
                {tagColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, color: color.value }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${color.class} ${
                      formData.color === color.value ? "ring-2 ring-primary ring-offset-2" : ""
                    }`}
                  >
                    {color.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary-hover text-white">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : editingTag ? (
                  "تحديث"
                ) : (
                  "إضافة"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
