"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UiverseToggle } from "@/components/ui/uiverse-toggle"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Plus, Pencil, Trash2, Calendar, GripVertical, ArrowUp, ArrowDown } from "lucide-react"

interface WeeklyItem {
  id: string
  day_name: string
  time_text: string
  title: string
  description: string | null
  is_active: boolean
  sort_order: number
}

const daysOfWeek = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"]

export default function WeeklyScheduleAdminPage() {
  const [items, setItems] = useState<WeeklyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WeeklyItem | null>(null)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [formData, setFormData] = useState({
    day_name: "السبت",
    time_text: "",
    title: "",
    description: "",
    is_active: true,
  })
  const supabase = createClient()

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    setLoading(true)
    const { data, error } = await supabase.from("weekly_schedule").select("*").order("sort_order", { ascending: true })
    if (error) {
      console.error("[v0] Error fetching weekly schedule:", error)
    }
    if (data) {
      setItems(data)
    }
    setLoading(false)
  }

  function openCreateDialog() {
    setEditingItem(null)
    setFormData({
      day_name: "السبت",
      time_text: "",
      title: "",
      description: "",
      is_active: true,
    })
    setDialogOpen(true)
  }

  function openEditDialog(item: WeeklyItem) {
    setEditingItem(item)
    setFormData({
      day_name: item.day_name,
      time_text: item.time_text,
      title: item.title,
      description: item.description || "",
      is_active: item.is_active,
    })
    setDialogOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.title || !formData.time_text) {
      setMessage({ type: "error", text: "يرجى ملء جميع الحقول المطلوبة" })
      return
    }
    setSaving(true)
    setMessage({ type: "", text: "" })
    try {
      const payload = {
        day_name: formData.day_name,
        time_text: formData.time_text,
        title: formData.title,
        description: formData.description || null,
        is_active: formData.is_active,
        sort_order: editingItem ? editingItem.sort_order : items.length,
      }
      let error
      if (editingItem) {
        const result = await supabase.from("weekly_schedule").update(payload).eq("id", editingItem.id)
        error = result.error
      } else {
        const result = await supabase.from("weekly_schedule").insert(payload)
        error = result.error
      }
      if (error) throw error
      setMessage({ type: "success", text: editingItem ? "تم التحديث بنجاح" : "تم الإضافة بنجاح" })
      setDialogOpen(false)
      fetchItems()
    } catch (error: any) {
      console.error("[v0] Error saving:", error)
      setMessage({ type: "error", text: "حدث خطأ: " + error.message })
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من الحذف؟")) return
    const { error } = await supabase.from("weekly_schedule").delete().eq("id", id)
    if (error) {
      setMessage({ type: "error", text: "حدث خطأ أثناء الحذف" })
    } else {
      setMessage({ type: "success", text: "تم الحذف بنجاح" })
      fetchItems()
    }
  }

  async function toggleActive(id: string, currentStatus: boolean) {
    await supabase.from("weekly_schedule").update({ is_active: !currentStatus }).eq("id", id)
    fetchItems()
  }

  async function moveItem(id: string, direction: "up" | "down") {
    const currentIndex = items.findIndex((item) => item.id === id)
    if (currentIndex === -1) return
    if (direction === "up" && currentIndex === 0) return
    if (direction === "down" && currentIndex === items.length - 1) return

    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    const currentItem = items[currentIndex]
    const swapItem = items[swapIndex]

    await supabase.from("weekly_schedule").update({ sort_order: swapItem.sort_order }).eq("id", currentItem.id)
    await supabase.from("weekly_schedule").update({ sort_order: currentItem.sort_order }).eq("id", swapItem.id)
    fetchItems()
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
            <Calendar className="h-8 w-8 text-primary" />
            الجدول الأسبوعي
          </h1>
          <p className="text-text-muted mt-2">إدارة جدول الدروس الأسبوعية الذي يظهر في الصفحة الرئيسية</p>
        </div>

        <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary-hover text-white">
          <Plus className="h-4 w-4 ml-2" />
          إضافة درس
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

      {/* Items List */}
      {items.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <Calendar className="h-16 w-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">لا توجد دروس في الجدول</h3>
          <p className="text-text-muted mb-4">ابدأ بإضافة دروس للجدول الأسبوعي</p>
          <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary-hover text-white">
            <Plus className="h-4 w-4 ml-2" />
            إضافة درس
          </Button>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b bg-muted/50">
            <h2 className="font-bold text-lg text-foreground">عناصر الجدول ({items.length})</h2>
          </div>

          <div className="divide-y divide-border">
            {items.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${
                  !item.is_active ? "opacity-50" : ""
                }`}
              >
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveItem(item.id, "up")}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveItem(item.id, "down")}
                    disabled={index === items.length - 1}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <div className="w-20 text-center">
                  <span className="text-xs text-text-muted block">{item.day_name}</span>
                  <span className="text-lg font-bold text-primary">{item.time_text}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground">{item.title}</h3>

                  {item.description && (
                    <p className="text-sm text-text-muted line-clamp-1">{item.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center">
                    <UiverseToggle
                      checked={item.is_active}
                      onCheckedChange={() => toggleActive(item.id, item.is_active)}
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-card max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "تعديل الدرس" : "إضافة درس جديد"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اليوم *</Label>
                <select
                  value={formData.day_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, day_name: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  {daysOfWeek.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>الوقت *</Label>
                <Input
                  value={formData.time_text}
                  onChange={(e) => setFormData((prev) => ({ ...prev, time_text: e.target.value }))}
                  placeholder="مثال: 7:30 م"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>عنوان الدرس *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="مثال: شرح منهاج الطالبين"
              />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="وصف مختصر للدرس"
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center">
                <UiverseToggle
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
                />
              </div>
              <Label>نشط في الجدول</Label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary-hover text-white">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : editingItem ? (
                  "تحديث"
                ) : (
                  "إضافة"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
