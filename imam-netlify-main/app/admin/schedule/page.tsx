"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UiverseToggle } from "@/components/ui/uiverse-toggle"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { Calendar, Plus, CalendarCheck, Radio, Edit, Trash2, Clock, MapPin, CalendarDays, Loader2 } from "lucide-react"

interface ScheduleEvent {
  id: string
  title: string
  description: string | null
  event_type: string
  event_date: string | null
  event_time: string | null
  location: string | null
  is_live: boolean
  is_active: boolean
  created_at: string
}

const eventTypes = [
  { value: "fiqh", label: "فقه", color: "bg-blue-500" },
  { value: "seerah", label: "سيرة", color: "bg-yellow-500" },
  { value: "friday", label: "خطبة الجمعة", color: "bg-green-500" },
  { value: "aqeedah", label: "عقيدة", color: "bg-purple-500" },
  { value: "general", label: "عام", color: "bg-muted" },
]

export default function AdminSchedulePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user } = useAuth()
  const isVisitor = user?.email === 'visitor@gmail.com'
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [filterType, setFilterType] = useState<"all" | "active" | "inactive">("all")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "fiqh",
    event_date: "",
    event_time: "",
    location: "",
    is_live: false,
    is_active: true,
  })

  const supabase = createClient()

  const fetchEvents = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true })

    if (!error && data) {
      setEvents(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isVisitor) return // Prevent submission if visitor
    setSubmitting(true)

    try {
      const eventData = {
        title: formData.title,
        description: formData.description || null,
        event_type: formData.event_type,
        event_date: formData.event_date || null,
        event_time: formData.event_time || null,
        location: formData.location || null,
        is_live: formData.is_live,
        is_active: formData.is_active,
        type: "one_time",
      }

      if (editingEvent) {
        const { error } = await supabase
          .from("events")
          .update({
            ...eventData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingEvent.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from("events")
          .insert(eventData)

        if (error) throw error
      }

      setIsModalOpen(false)
      resetForm()
      fetchEvents()
    } catch (error) {
      console.error("Error saving event:", error)
      alert("حدث خطأ أثناء الحفظ")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (isVisitor) return // Prevent deletion if visitor
    if (!confirm("هل أنت متأكد من حذف هذا الحدث؟")) return

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id)

    if (!error) {
      fetchEvents()
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    if (isVisitor) return // Prevent toggle if visitor
    await supabase
      .from("events")
      .update({ is_active: !currentStatus })
      .eq("id", id)
    fetchEvents()
  }

  const openEditModal = (event: ScheduleEvent) => {
    if (isVisitor) return // Prevent opening edit modal if visitor
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description || "",
      event_type: event.event_type,
      event_date: event.event_date || "",
      event_time: event.event_time || "",
      location: event.location || "",
      is_live: event.is_live,
      is_active: event.is_active,
    })
    setIsModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      event_type: "fiqh",
      event_date: "",
      event_time: "",
      location: "",
      is_live: false,
      is_active: true,
    })
    setEditingEvent(null)
  }

  const getEventTypeInfo = (type: string) => {
    return eventTypes.find((t) => t.value === type) || eventTypes[4]
  }

  const formatTime12h = (time: string | null) => {
    if (!time) return ""
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours, 10)
    const ampm = hour >= 12 ? "م" : "ص"
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    return date.toLocaleDateString("ar-EG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getDayName = (dateStr: string | null) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
    return days[date.getDay()]
  }

  const filteredEvents = events.filter((event) => {
    if (filterType === "all") return true
    if (filterType === "active") return event.is_active
    if (filterType === "inactive") return !event.is_active
    return true
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground font-serif flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            إدارة الجدول الزمني
          </h1>
          <p className="text-text-muted mt-2">
            إدارة مواعيد الدروس والمحاضرات والخطب
          </p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-primary hover:bg-primary-hover text-white"
              onClick={() => {
                resetForm()
                setIsModalOpen(true)
              }}
              disabled={isVisitor}
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة حدث جديد
            </Button>
          </DialogTrigger>

          <DialogContent
            className="sm:max-w-lg bg-card max-h-[90vh] overflow-y-auto"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-primary">
                {editingEvent ? "تعديل الحدث" : "إضافة حدث جديد"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>عنوان الحدث *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))}
                    placeholder="مثال: شرح كتاب منهاج الطالبين"
                    className="bg-muted"
                    required
                    disabled={isVisitor}
                  />
                </div>

                <div className="space-y-2">
                  <Label>نوع الحدث *</Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        event_type: value,
                      }))}
                    disabled={isVisitor}
                  >
                    <SelectTrigger className="bg-muted">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${type.color}`}></div>
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>التاريخ *</Label>
                  <Input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        event_date: e.target.value,
                      }))}
                    className="bg-muted"
                    required
                    disabled={isVisitor}
                  />
                </div>

                <div className="space-y-2">
                  <Label>الوقت</Label>
                  <Input
                    type="time"
                    value={formData.event_time}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        event_time: e.target.value,
                      }))}
                    className="bg-muted"
                    disabled={isVisitor}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>المكان</Label>
                <Input
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))}
                  placeholder="مثال: مسجد الرحمن - مدينة النور"
                  className="bg-muted"
                  disabled={isVisitor}
                />
              </div>

              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))}
                  placeholder="وصف مختصر للحدث..."
                  className="bg-muted resize-none"
                  rows={3}
                  disabled={isVisitor}
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center">
                    <UiverseToggle
                      checked={formData.is_live}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          is_live: checked,
                        }))}
                      disabled={isVisitor}
                    />
                  </div>
                  <Label>بث مباشر</Label>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center">
                    <UiverseToggle
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          is_active: checked,
                        }))}
                      disabled={isVisitor}
                    />
                  </div>
                  <Label>مفعّل</Label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    resetForm()
                  }}
                  disabled={isVisitor}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white"
                  disabled={submitting || isVisitor}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : editingEvent ? (
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-text-muted">إجمالي الأحداث</p>
            <p className="text-2xl font-bold text-foreground">{events.length}</p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-text-muted">الأحداث النشطة</p>
            <p className="text-2xl font-bold text-green-600">
              {events.filter((e) => e.is_active).length}
            </p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600">
            <Radio className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-text-muted">بث مباشر</p>
            <p className="text-2xl font-bold text-red-600">
              {events.filter((e) => e.is_live).length}
            </p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-text-muted">هذا الشهر</p>
            <p className="text-2xl font-bold text-foreground">
              {events.filter((e) => {
                if (!e.event_date) return false
                const eventDate = new Date(e.event_date)
                const now = new Date()
                return eventDate.getMonth() === now.getMonth() &&
                  eventDate.getFullYear() === now.getFullYear()
              }).length}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filterType === "all" ? "default" : "outline"}
          onClick={() => setFilterType("all")}
          className={filterType === "all" ? "bg-primary text-white" : ""}
        >
          الكل
        </Button>
        <Button
          variant={filterType === "active" ? "default" : "outline"}
          onClick={() => setFilterType("active")}
          className={filterType === "active" ? "bg-primary text-white" : ""}
        >
          نشطة
        </Button>
        <Button
          variant={filterType === "inactive" ? "default" : "outline"}
          onClick={() => setFilterType("inactive")}
          className={filterType === "inactive" ? "bg-primary text-white" : ""}
        >
          معطّلة
        </Button>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="text-center py-12 text-text-muted flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          جاري التحميل...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <Calendar className="h-16 w-16 mx-auto text-text-muted mb-4" />
          <p className="text-text-muted">لا توجد أحداث في الجدول</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredEvents.map((event) => {
            const typeInfo = getEventTypeInfo(event.event_type)
            return (
              <div
                key={event.id}
                className={`bg-card rounded-xl p-4 border border-border flex flex-col md:flex-row md:items-center gap-4 ${!event.is_active ? "opacity-50" : ""
                  }`}
              >
                <div className={`w-12 h-12 rounded-lg ${typeInfo.color} flex items-center justify-center text-white`}>
                  <CalendarDays className="h-6 w-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs bg-muted px-2 py-0.5 rounded text-text-muted">
                      {typeInfo.label}
                    </span>

                    {event.is_live && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                        مباشر
                      </span>
                    )}

                    {!event.is_active && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                        معطّل
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-foreground truncate">
                    {event.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted mt-1">
                    {event.event_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(event.event_date)}
                      </span>
                    )}

                    {event.event_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatTime12h(event.event_time)}
                      </span>
                    )}

                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center">
                    <UiverseToggle
                      checked={event.is_active}
                      onCheckedChange={() =>
                        toggleActive(event.id, event.is_active)
                      }
                      disabled={isVisitor}
                    />
                  </div>
                  <button
                    onClick={() => openEditModal(event)}
                    className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-white transition"
                    disabled={isVisitor}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-500 hover:text-white transition"
                    disabled={isVisitor}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
