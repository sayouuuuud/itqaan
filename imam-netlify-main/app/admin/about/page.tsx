"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileUpload } from "@/components/admin/file-upload"
import { Loader2, User, Save, Plus, X, Trash2, GripVertical, Target, Eye, Calendar, Quote, ArrowUp, ArrowDown } from "lucide-react"

interface TimelineEvent {
  id?: string
  year: string
  title: string
  description: string
  icon: string
  order_index: number
  is_active: boolean
}

interface SheikhQuote {
  id?: string
  quote_text: string
  category: string
  order_index: number
  is_active: boolean
}

export default function AdminAboutPage() {
  const { user } = useAuth()
  const isVisitor = user?.email === 'visitor@gmail.com'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"basic" | "mission" | "timeline" | "quotes">("basic")
  const [message, setMessage] = useState({ type: "", text: "" })

  // Basic info state
  const [aboutData, setAboutData] = useState({
    id: "",
    sheikh_name: "",
    sheikh_photo: "",
    biography: "",
    mission_text: "",
    vision_text: "",
    stats: {
      students: "",
      books: "",
      lectures: "",
      years: "",
      awards: "",
      courses: "",
    },
    social_links: [] as Array<{ platform: string; url: string; icon: string }>,
  })

  // Timeline state
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [editingTimeline, setEditingTimeline] = useState<TimelineEvent | null>(null)

  // Quotes state
  const [quotes, setQuotes] = useState<SheikhQuote[]>([])
  const [editingQuote, setEditingQuote] = useState<SheikhQuote | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    await Promise.all([fetchAboutData(), fetchTimeline(), fetchQuotes()])
    setLoading(false)
  }

  const fetchAboutData = async () => {
    try {
      const { data, error } = await supabase
        .from("about_page")
        .select("*")
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error("[About Page] Fetch error:", error)
        return
      }

      if (data) {
        console.log('📥 [FETCH] Received data from database:', data)

        // Convert social_media object to social_links array format
        let socialLinksArray: Array<{ platform: string; url: string; icon: string }> = []

        if (data.social_links && Array.isArray(data.social_links) && data.social_links.length > 0) {
          // Use social_links if available
          socialLinksArray = data.social_links
        } else if (data.social_media && typeof data.social_media === 'object') {
          // Convert social_media object to social_links array
          socialLinksArray = Object.entries(data.social_media).map(([platform, url]) => ({
            platform,
            url: url as string,
            icon: platform,
          }))
        }

        console.log('🔄 [FETCH] Converted social links:', socialLinksArray)

        setAboutData({
          id: data.id || '',
          sheikh_name: data.sheikh_name || "",
          sheikh_photo: data.sheikh_photo || data.image_path || "",
          biography: data.biography || "",
          mission_text: data.mission_text || "",
          vision_text: data.vision_text || "",
          stats: {
            students: data.stats?.students || "",
            books: data.stats?.books || "",
            lectures: data.stats?.lectures || "",
            years: data.stats?.years || "",
            awards: data.stats?.awards || "",
            courses: data.stats?.courses || "",
          },
          social_links: socialLinksArray,
        })

        console.log('✅ [FETCH] State updated successfully')
      }
    } catch (err) {
      console.error("[About Page] Unexpected fetch error:", err)
    }
  }

  const fetchTimeline = async () => {
    try {
      const { data, error } = await supabase
        .from("about_timeline")
        .select("*")
        .order("order_index", { ascending: true })

      if (error) {
        console.error("[Timeline] Fetch error:", error)
        return
      }

      setTimeline(data || [])
    } catch (err) {
      console.error("[Timeline] Unexpected fetch error:", err)
    }
  }

  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from("about_quotes")
        .select("*")
        .order("order_index", { ascending: true })

      if (error) {
        console.error("[Quotes] Fetch error:", error)
        return
      }

      setQuotes(data || [])
    } catch (err) {
      console.error("[Quotes] Unexpected fetch error:", err)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage({ type: "", text: "" })
    try {
      // Use the ID from the database if it exists, otherwise create new record
      const recordId = aboutData.id || null;

      console.log('🔍 [SAVE] Starting save with ID:', recordId)
      console.log('🔍 [SAVE] Current aboutData:', aboutData)

      const payload: any = {
        updated_at: new Date().toISOString(),
      }

      // Add id only if we have one (for updating existing record)
      if (recordId) {
        payload.id = recordId
      }

      // Required fields (NOT NULL in database)
      payload.sheikh_name = aboutData.sheikh_name?.trim() || "الشيخ"
      payload.biography = aboutData.biography?.trim() || ""

      // Optional fields - using correct database column names
      payload.sheikh_photo = aboutData.sheikh_photo?.trim() || null
      payload.image_path = aboutData.sheikh_photo?.trim() || null
      payload.stats = aboutData.stats || {}
      payload.social_links = aboutData.social_links || []

      // Convert social_links array to social_media object
      const socialMediaObj: Record<string, string> = {}
      if (aboutData.social_links && aboutData.social_links.length > 0) {
        aboutData.social_links.forEach(link => {
          if (link.platform && link.url) {
            socialMediaObj[link.platform] = link.url
          }
        })
      }
      payload.social_media = socialMediaObj

      // New columns (added by about_page_updates.sql)
      payload.mission_text = aboutData.mission_text?.trim() || null
      payload.vision_text = aboutData.vision_text?.trim() || null

      console.log('📦 [SAVE] Payload to be saved:', payload)

      let error;
      if (recordId) {
        // Update existing record
        console.log('✏️ [SAVE] Updating existing record with ID:', recordId)
        const result = await supabase
          .from("about_page")
          .update(payload)
          .eq("id", recordId)
        error = result.error
        console.log('✅ [SAVE] Update result:', result)
      } else {
        // Insert new record
        console.log('➕ [SAVE] Inserting new record')
        const result = await supabase
          .from("about_page")
          .insert(payload)
        error = result.error
        console.log('✅ [SAVE] Insert result:', result)
      }

      if (error) {
        console.error('❌ [SAVE] Database error:', error)
        throw new Error(error.message)
      }

      console.log('✅ [SAVE] Save successful!')
      setMessage({ type: "success", text: "تم الحفظ بنجاح" })
      fetchAboutData()
    } catch (error: any) {
      console.error("[About Page] Save error:", error)
      setMessage({
        type: "error",
        text: "حدث خطأ أثناء الحفظ: " + (error.message || "خطأ غير معروف")
      })
    }
    setSaving(false)
  }


  // Timeline functions
  const saveTimelineEvent = async (event: TimelineEvent) => {
    setSaving(true)
    try {
      if (event.id) {
        const { error } = await supabase
          .from("about_timeline")
          .update({
            year: event.year,
            title: event.title,
            description: event.description,
            icon: event.icon,
            is_active: event.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", event.id)

        if (error) throw error
      } else {
        const maxOrder = timeline.length > 0 ? Math.max(...timeline.map(t => t.order_index)) : 0
        const { error } = await supabase
          .from("about_timeline")
          .insert({
            year: event.year,
            title: event.title,
            description: event.description,
            icon: event.icon,
            is_active: event.is_active,
            order_index: maxOrder + 1,
          })

        if (error) throw error
      }

      setMessage({ type: "success", text: "تم حفظ المحطة بنجاح" })
      setEditingTimeline(null)
      fetchTimeline()
    } catch (error: any) {
      console.error("[Timeline] Save error:", error)
      setMessage({ type: "error", text: "حدث خطأ أثناء الحفظ" })
    }
    setSaving(false)
  }

  const deleteTimelineEvent = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه المحطة؟")) return

    try {
      const { error } = await supabase.from("about_timeline").delete().eq("id", id)
      if (error) throw error

      setMessage({ type: "success", text: "تم حذف المحطة" })
      fetchTimeline()
    } catch (error: any) {
      console.error("[Timeline] Delete error:", error)
      setMessage({ type: "error", text: "حدث خطأ أثناء الحذف" })
    }
  }

  const moveTimelineEvent = async (id: string, direction: "up" | "down") => {
    const currentIndex = timeline.findIndex(t => t.id === id)
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= timeline.length) return

    const newTimeline = [...timeline]
    const temp = newTimeline[currentIndex].order_index
    newTimeline[currentIndex].order_index = newTimeline[newIndex].order_index
    newTimeline[newIndex].order_index = temp

    try {
      await supabase
        .from("about_timeline")
        .update({ order_index: newTimeline[currentIndex].order_index })
        .eq("id", newTimeline[currentIndex].id)

      await supabase
        .from("about_timeline")
        .update({ order_index: newTimeline[newIndex].order_index })
        .eq("id", newTimeline[newIndex].id)

      fetchTimeline()
    } catch (error) {
      console.error("[Timeline] Move error:", error)
    }
  }

  // Quotes functions
  const saveQuote = async (quote: SheikhQuote) => {
    setSaving(true)
    try {
      if (quote.id) {
        const { error } = await supabase
          .from("about_quotes")
          .update({
            quote_text: quote.quote_text,
            category: quote.category,
            is_active: quote.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", quote.id)

        if (error) throw error
      } else {
        const maxOrder = quotes.length > 0 ? Math.max(...quotes.map(q => q.order_index)) : 0
        const { error } = await supabase
          .from("about_quotes")
          .insert({
            quote_text: quote.quote_text,
            category: quote.category,
            is_active: quote.is_active,
            order_index: maxOrder + 1,
          })

        if (error) throw error
      }

      setMessage({ type: "success", text: "تم حفظ القول بنجاح" })
      setEditingQuote(null)
      fetchQuotes()
    } catch (error: any) {
      console.error("[Quotes] Save error:", error)
      setMessage({ type: "error", text: "حدث خطأ أثناء الحفظ" })
    }
    setSaving(false)
  }

  const deleteQuote = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا القول؟")) return

    try {
      const { error } = await supabase.from("about_quotes").delete().eq("id", id)
      if (error) throw error

      setMessage({ type: "success", text: "تم حذف القول" })
      fetchQuotes()
    } catch (error: any) {
      console.error("[Quotes] Delete error:", error)
      setMessage({ type: "error", text: "حدث خطأ أثناء الحذف" })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#1a4d3e] mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <User className="h-6 w-6 md:h-7 md:w-7 text-primary" />
            إدارة صفحة عن الشيخ
          </h1>
          <p className="text-muted-foreground mt-1">معلومات فضيلة الشيخ والسيرة الذاتية</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || isVisitor}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 ml-2" />
              حفظ
            </>
          )}
        </Button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg text-center ${message.type === "error"
          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <Button
          variant={activeTab === "basic" ? "default" : "ghost"}
          onClick={() => setActiveTab("basic")}
          className={activeTab === "basic" ? "" : ""}
        >
          <User className="h-4 w-4 ml-2" />
          المعلومات الأساسية
        </Button>
        <Button
          variant={activeTab === "mission" ? "default" : "ghost"}
          onClick={() => setActiveTab("mission")}
          className={activeTab === "mission" ? "" : ""}
        >
          <Target className="h-4 w-4 ml-2" />
          الرسالة والرؤية
        </Button>
        <Button
          variant={activeTab === "timeline" ? "default" : "ghost"}
          onClick={() => setActiveTab("timeline")}
          className={activeTab === "timeline" ? "" : ""}
        >
          <Calendar className="h-4 w-4 ml-2" />
          المسيرة
        </Button>
        <Button
          variant={activeTab === "quotes" ? "default" : "ghost"}
          onClick={() => setActiveTab("quotes")}
          className={activeTab === "quotes" ? "" : ""}
        >
          <Quote className="h-4 w-4 ml-2" />
          أقوال الشيخ
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === "basic" && (
        <>
          {/* Basic Info */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">المعلومات الأساسية</h2>

            <div className="grid gap-4">
              {/* Photo */}
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="flex-1">
                  <Label>صورة الشيخ</Label>
                  <FileUpload
                    accept="image/*"
                    folder="about"
                    label="رفع الصورة"
                    onUploadComplete={(path) => setAboutData({ ...aboutData, sheikh_photo: path })}
                    currentFile={aboutData.sheikh_photo}
                    disabled={isVisitor}
                  />
                </div>
                {aboutData.sheikh_photo && (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border flex-shrink-0">
                    <img
                      src={aboutData.sheikh_photo.startsWith("uploads/") || aboutData.sheikh_photo.startsWith("/uploads/")
                        ? (aboutData.sheikh_photo.startsWith("/") ? aboutData.sheikh_photo : `/${aboutData.sheikh_photo}`)
                        : `/api/download?key=${encodeURIComponent(aboutData.sheikh_photo)}`}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>اسم الشيخ</Label>
                <Input
                  value={aboutData.sheikh_name}
                  onChange={(e) => setAboutData({ ...aboutData, sheikh_name: e.target.value })}
                  className="mt-1"
                  placeholder="الشيخ الفلاني"
                  disabled={isVisitor}
                />
              </div>
            </div>
          </div>

          {/* Biography */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">السيرة الذاتية</h2>
            <div>
              <Label>النبذة التعريفية</Label>
              <Textarea
                value={aboutData.biography}
                onChange={(e) => setAboutData({ ...aboutData, biography: e.target.value })}
                className="mt-1 min-h-[150px]"
                placeholder="اكتب السيرة الذاتية هنا..."
                disabled={isVisitor}
              />
            </div>
          </div>



          {/* Stats */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">إحصائيات</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">الطلاب</Label>
                <Input
                  value={aboutData.stats.students}
                  onChange={(e) =>
                    setAboutData({ ...aboutData, stats: { ...aboutData.stats, students: e.target.value } })
                  }
                  className="mt-1"
                  placeholder="5000"
                  disabled={isVisitor}
                />
              </div>
              <div>
                <Label className="text-xs">الكتب</Label>
                <Input
                  value={aboutData.stats.books}
                  onChange={(e) =>
                    setAboutData({ ...aboutData, stats: { ...aboutData.stats, books: e.target.value } })
                  }
                  className="mt-1"
                  placeholder="20"
                  disabled={isVisitor}
                />
              </div>
              <div>
                <Label className="text-xs">المحاضرات</Label>
                <Input
                  value={aboutData.stats.lectures}
                  onChange={(e) =>
                    setAboutData({ ...aboutData, stats: { ...aboutData.stats, lectures: e.target.value } })
                  }
                  className="mt-1"
                  placeholder="1000"
                  disabled={isVisitor}
                />
              </div>
              <div>
                <Label className="text-xs">السنوات</Label>
                <Input
                  value={aboutData.stats.years}
                  onChange={(e) =>
                    setAboutData({ ...aboutData, stats: { ...aboutData.stats, years: e.target.value } })
                  }
                  className="mt-1"
                  placeholder="25"
                  disabled={isVisitor}
                />
              </div>
              <div>
                <Label className="text-xs">جوائز وتكريمات</Label>
                <Input
                  value={aboutData.stats.awards}
                  onChange={(e) =>
                    setAboutData({ ...aboutData, stats: { ...aboutData.stats, awards: e.target.value } })
                  }
                  className="mt-1"
                  placeholder="8"
                  disabled={isVisitor}
                />
              </div>
              <div>
                <Label className="text-xs">دورات علمية</Label>
                <Input
                  value={aboutData.stats.courses}
                  onChange={(e) =>
                    setAboutData({ ...aboutData, stats: { ...aboutData.stats, courses: e.target.value } })
                  }
                  className="mt-1"
                  placeholder="50"
                  disabled={isVisitor}
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">روابط التواصل</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setAboutData({
                    ...aboutData,
                    social_links: [...aboutData.social_links, { platform: "youtube", url: "", icon: "youtube" }],
                  })
                }
                disabled={isVisitor}
              >
                <Plus className="h-4 w-4 ml-1" />
                إضافة
              </Button>
            </div>

            {aboutData.social_links.length > 0 ? (
              <div className="space-y-3">
                {aboutData.social_links.map((link, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <select
                      value={link.platform}
                      onChange={(e) =>
                        setAboutData({
                          ...aboutData,
                          social_links: aboutData.social_links.map((l, i) =>
                            i === index ? { ...l, platform: e.target.value, icon: e.target.value } : l,
                          ),
                        })
                      }
                      className="px-2 py-1 bg-background border border-input rounded text-sm text-foreground"
                      disabled={isVisitor}
                    >
                      <option value="youtube">يوتيوب</option>
                      <option value="telegram">تليجرام</option>
                      <option value="facebook">فيس</option>
                      <option value="whatsapp">واتساب</option>
                    </select>
                    <Input
                      value={link.url}
                      onChange={(e) =>
                        setAboutData({
                          ...aboutData,
                          social_links: aboutData.social_links.map((l, i) =>
                            i === index ? { ...l, url: e.target.value } : l,
                          ),
                        })
                      }
                      placeholder="الرابط"
                      dir="ltr"
                      className="flex-1"
                      disabled={isVisitor}
                    />
                    {!isVisitor && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setAboutData({
                            ...aboutData,
                            social_links: aboutData.social_links.filter((_, i) => i !== index),
                          })
                        }
                        className="text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">لا توجد روابط</p>
            )}
          </div>
        </>
      )}

      {activeTab === "mission" && (
        <div className="space-y-6">
          {/* Mission */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">الرسالة</h2>
            </div>
            <Textarea
              value={aboutData.mission_text}
              onChange={(e) => setAboutData({ ...aboutData, mission_text: e.target.value })}
              className="min-h-[120px]"
              placeholder="نسعى من خلال هذا الموقع إلى نشر العلم الشرعي الصحيح..."
              disabled={isVisitor}
            />
            <p className="text-xs text-muted-foreground mt-2">النص الذي سيظهر في قسم الرسالة بصفحة عن الشيخ</p>
          </div>

          {/* Vision */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-bold text-foreground">الرؤية</h2>
            </div>
            <Textarea
              value={aboutData.vision_text}
              onChange={(e) => setAboutData({ ...aboutData, vision_text: e.target.value })}
              className="min-h-[120px]"
              placeholder="إنشاء جيل واعٍ بدينه..."
              disabled={isVisitor}
            />
            <p className="text-xs text-muted-foreground mt-2">النص الذي سيظهر في قسم الرؤية بصفحة عن الشيخ</p>
          </div>
        </div>
      )}

      {activeTab === "timeline" && (
        <div className="space-y-6">
          {/* Add Timeline Button */}
          {!isVisitor && (
            <div className="flex justify-end">
              <Button
                onClick={() => setEditingTimeline({
                  year: "",
                  title: "",
                  description: "",
                  icon: "graduation",
                  order_index: 0,
                  is_active: true,
                })}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة محطة جديدة
              </Button>
            </div>
          )}

          {/* Timeline Form */}
          {editingTimeline && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-bold mb-4">
                {editingTimeline.id ? "تعديل المحطة" : "إضافة محطة جديدة"}
              </h3>
              <div className="grid gap-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>السنة</Label>
                    <Input
                      value={editingTimeline.year}
                      onChange={(e) => setEditingTimeline({ ...editingTimeline, year: e.target.value })}
                      placeholder="١٩٨٥"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>الأيقونة</Label>
                    <select
                      value={editingTimeline.icon}
                      onChange={(e) => setEditingTimeline({ ...editingTimeline, icon: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-lg text-foreground"
                    >
                      <option value="baby">مولد 👶</option>
                      <option value="book">قرآن 📖</option>
                      <option value="graduation">تخرج 🎓</option>
                      <option value="mosque">مسجد 🕌</option>
                      <option value="globe">عالمي 🌍</option>
                      <option value="award">جائزة 🏆</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label>العنوان</Label>
                  <Input
                    value={editingTimeline.title}
                    onChange={(e) => setEditingTimeline({ ...editingTimeline, title: e.target.value })}
                    placeholder="حفظ القرآن الكريم"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>الوصف</Label>
                  <Textarea
                    value={editingTimeline.description}
                    onChange={(e) => setEditingTimeline({ ...editingTimeline, description: e.target.value })}
                    placeholder="وصف المحطة..."
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setEditingTimeline(null)}>
                    إلغاء
                  </Button>
                  <Button
                    onClick={() => saveTimelineEvent(editingTimeline)}
                    disabled={saving || !editingTimeline.year || !editingTimeline.title || isVisitor}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Timeline List */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/50">
              <h3 className="font-bold">محطات المسيرة ({timeline.length})</h3>
            </div>
            {timeline.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد محطات بعد</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {timeline.map((event, index) => (
                  <div key={event.id} className="p-4 flex items-center gap-4 hover:bg-muted/50">
                    <div className="flex flex-col gap-1">
                      {!isVisitor && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveTimelineEvent(event.id!, "up")}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveTimelineEvent(event.id!, "down")}
                            disabled={index === timeline.length - 1}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-2xl">
                      {event.icon === "baby" && "👶"}
                      {event.icon === "book" && "📖"}
                      {event.icon === "graduation" && "🎓"}
                      {event.icon === "mosque" && "🕌"}
                      {event.icon === "globe" && "🌍"}
                      {event.icon === "award" && "🏆"}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-yellow-500 font-bold">{event.year}</div>
                      <div className="font-bold text-foreground">{event.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">{event.description}</div>
                    </div>
                    <div className="flex gap-2">
                      {!isVisitor && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingTimeline(event)}
                          >
                            <GripVertical className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteTimelineEvent(event.id!)}
                            className="text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "quotes" && (
        <div className="space-y-6">
          {/* Add Quote Button */}
          {!isVisitor && (
            <div className="flex justify-end">
              <Button
                onClick={() => setEditingQuote({
                  quote_text: "",
                  category: "علم",
                  order_index: 0,
                  is_active: true,
                })}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة قول جديد
              </Button>
            </div>
          )}

          {/* Quote Form */}
          {editingQuote && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-bold mb-4">
                {editingQuote.id ? "تعديل القول" : "إضافة قول جديد"}
              </h3>
              <div className="grid gap-4">
                <div>
                  <Label>نص القول</Label>
                  <Textarea
                    value={editingQuote.quote_text}
                    onChange={(e) => setEditingQuote({ ...editingQuote, quote_text: e.target.value })}
                    placeholder="العلم نور يبدد ظلمات الجهل..."
                    className="mt-1 min-h-[100px]"
                  />
                </div>
                <div>
                  <Label>التصنيف</Label>
                  <select
                    value={editingQuote.category}
                    onChange={(e) => setEditingQuote({ ...editingQuote, category: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-lg text-foreground"
                  >
                    <option value="علم">علم</option>
                    <option value="دعوة">دعوة</option>
                    <option value="أخلاق">أخلاق</option>
                    <option value="عبادة">عبادة</option>
                    <option value="حكمة">حكمة</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setEditingQuote(null)}>
                    إلغاء
                  </Button>
                  <Button
                    onClick={() => saveQuote(editingQuote)}
                    disabled={saving || !editingQuote.quote_text || isVisitor}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Quotes List */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/50">
              <h3 className="font-bold">أقوال الشيخ ({quotes.length})</h3>
            </div>
            {quotes.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Quote className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد أقوال بعد</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {quotes.map((quote) => (
                  <div key={quote.id} className="p-4 flex items-start gap-4 hover:bg-muted/50">
                    <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Quote className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground leading-relaxed">{quote.quote_text}</p>
                      <span className="inline-block mt-2 text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                        {quote.category}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {!isVisitor && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingQuote(quote)}
                          >
                            <GripVertical className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteQuote(quote.id!)}
                            className="text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}