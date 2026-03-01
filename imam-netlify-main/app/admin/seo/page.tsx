"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { UiverseToggle } from "@/components/ui/uiverse-toggle"
import { Save, Search, Globe, RefreshCw, Plus, Pencil, Trash2, X, FileText, Trash, Share2, BarChart3, Code, LinkIcon, Shield, Eye } from "lucide-react"
import { FileUpload } from "@/components/admin/file-upload"

interface SEOSettings {
  meta_title: string
  meta_description: string
  meta_keywords: string
  og_title: string
  og_description: string
  og_image: string
  twitter_title: string
  twitter_description: string
  twitter_image: string
  twitter_handle: string
  robots_txt: string
  google_verification: string
  bing_verification: string
  google_analytics_id: string
  facebook_pixel_id: string
  canonical_url: string
  structured_data: string
  sitemap_enabled: boolean
  auto_generate_meta: boolean
}

interface PageSEO {
  id: string
  page_path: string
  page_title: string
  meta_description: string
  meta_keywords: string
  og_title: string
  og_description: string
  og_image: string
  robots: string
  canonical_url: string
  priority: number
}

const CONTENT_TYPES = [
  { value: "sermon", label: "خطبة" },
  { value: "lesson", label: "درس" },
  { value: "article", label: "مقال" },
  { value: "book", label: "كتاب" },
  { value: "media", label: "مرئيات" },
]

export default function SEOManagementPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()
  const isVisitor = user?.email === 'visitor@gmail.com'
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState<"general" | "social" | "verification" | "pages" | "analytics" | "advanced" | "cache">("general")

  // Page-specific SEO
  const [pageSEOList, setPageSEOList] = useState<PageSEO[]>([])
  const [editingPageId, setEditingPageId] = useState<string | null>(null)
  const [isAddingPage, setIsAddingPage] = useState(false)
  const [pageFormData, setPageFormData] = useState({
    page_path: "",
    page_title: "",
    meta_description: "",
    meta_keywords: "",
    og_title: "",
    og_description: "",
    og_image: "",
    robots: "index, follow",
    canonical_url: "",
    priority: 0.5,
  })
  const [settings, setSettings] = useState<SEOSettings>({
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    og_title: "",
    og_description: "",
    og_image: "",
    twitter_title: "",
    twitter_description: "",
    twitter_image: "",
    twitter_handle: "",
    robots_txt: "",
    google_verification: "",
    bing_verification: "",
    google_analytics_id: "",
    facebook_pixel_id: "",
    canonical_url: "",
    structured_data: "",
    sitemap_enabled: true,
    auto_generate_meta: true,
  })

  const supabase = createClient()

  useEffect(() => {
    loadSettings()
    loadPageSEO()
  }, [])

  async function loadSettings() {
    setLoading(true)
    const { data } = await supabase.from("site_settings").select("*")
    if (data) {
      const settingsObj: Record<string, any> = {}
      data.forEach((item: Record<string, unknown>) => {
        const key = (item.key || item.setting_key || "") as string
        const value = (item.value || item.setting_value || "") as string
        if (key && Object.keys(settings).includes(key)) {
          // Handle boolean values
          if (value === "true" || value === "false") {
            settingsObj[key] = value === "true"
          } else {
            settingsObj[key] = value
          }
        }
      })
      setSettings((prev) => ({ ...prev, ...settingsObj }))
    }
    setLoading(false)
  }

  async function loadPageSEO() {
    const { data } = await supabase
      .from("seo_settings")
      .select("*")
      .order("page_path", { ascending: true })
    if (data) setPageSEOList(data)
  }

  async function saveSettings() {
    setSaving(true)
    setMessage("")
    try {
      for (const [key, value] of Object.entries(settings)) {
        await supabase.from("site_settings").upsert(
          {
            key: key,
            value: String(value),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        )
      }
      setMessage("تم حفظ إعدادات SEO بنجاح")
    } catch (error) {
      setMessage("حدث خطأ أثناء حفظ الإعدادات")
    }
    setSaving(false)
  }

  async function savePageSEO() {
    if (!pageFormData.page_path || !pageFormData.page_title) {
      setMessage("يرجى ملء مسار الصفحة والعنوان")
      return
    }
    try {
      if (editingPageId) {
        await supabase.from("seo_settings").update(
          {
            ...pageFormData,
            updated_at: new Date().toISOString(),
          },
          { eq: { id: editingPageId } }
        )
        setMessage("تم تحديث إعدادات SEO للصفحة بنجاح")
      } else {
        await supabase.from("seo_settings").insert(pageFormData)
        setMessage("تم إضافة إعدادات SEO للصفحة بنجاح")
      }
      resetPageForm()
      loadPageSEO()
    } catch (error) {
      setMessage("حدث خطأ أثناء الحفظ")
    }
  }

  async function deletePageSEO(id: string) {
    if (!confirm("هل أنت متأكد من حذف إعدادات SEO لهذه الصفحة؟")) return
    await supabase.from("seo_settings").delete().eq("id", id)
    setMessage("تم حذف إعدادات SEO بنجاح")
    loadPageSEO()
  }

  function startEditPage(page: PageSEO) {
    setPageFormData({
      page_path: page.page_path,
      page_title: page.page_title,
      meta_description: page.meta_description || "",
      meta_keywords: page.meta_keywords || "",
      og_title: page.og_title || "",
      og_description: page.og_description || "",
      og_image: page.og_image || "",
      robots: page.robots || "index, follow",
      canonical_url: page.canonical_url || "",
      priority: page.priority || 0.5,
    })
    setEditingPageId(page.id)
    setIsAddingPage(true)
  }

  function resetPageForm() {
    setPageFormData({
      page_path: "",
      page_title: "",
      meta_description: "",
      meta_keywords: "",
      og_title: "",
      og_description: "",
      og_image: "",
      robots: "index, follow",
      canonical_url: "",
      priority: 0.5,
    })
    setEditingPageId(null)
    setIsAddingPage(false)
  }

  async function clearCache() {
    try {
      await fetch("/api/revalidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paths: ["/", "/khutba", "/dars", "/articles", "/books", "/videos", "/about"],
        }),
      })
      setMessage("تم مسح الكاش بنجاح! قد يستغرق التحديث بضع ثوانٍ.")
    } catch (error) {
      setMessage("حدث خطأ أثناء مسح الكاش")
    }
  }

  async function generateSitemap() {
    try {
      setMessage("جاري إنشاء خريطة الموقع...")
      await fetch("/api/sitemap/generate", { method: "POST" })
      setMessage("تم إنشاء خريطة الموقع بنجاح!")
    } catch (error) {
      setMessage("حدث خطأ أثناء إنشاء خريطة الموقع")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل الإعدادات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold mb-3">
          تحسين محركات البحث المتقدم
        </span>
        <h1 className="text-4xl font-bold mb-4">
          إعدادات <span className="text-primary">SEO</span>
          الاحترافية
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          تحسين شامل لظهور موقعك في محركات البحث وشبكات التواصل الاجتماعي مع أدوات تحليل متقدمة
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-xl text-center ${message.includes("خطأ") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            }`}
        >
          {message}
        </div>
      )}

      <div className="flex gap-2 justify-center flex-wrap">
        <Button
          variant={activeTab === "general" ? "default" : "outline"}
          onClick={() => setActiveTab("general")}
          className="gap-2"
        >
          <Search className="h-4 w-4" />
          البيانات الوصفية
        </Button>
        <Button
          variant={activeTab === "social" ? "default" : "outline"}
          onClick={() => setActiveTab("social")}
          className="gap-2"
        >
          <Share2 className="h-4 w-4" />
          الشبكات الاجتماعية
        </Button>
        <Button
          variant={activeTab === "analytics" ? "default" : "outline"}
          onClick={() => setActiveTab("analytics")}
          className="gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          التحليلات
        </Button>
        <Button
          variant={activeTab === "verification" ? "default" : "outline"}
          onClick={() => setActiveTab("verification")}
          className="gap-2"
        >
          <Shield className="h-4 w-4" />
          التحقق من الملكية
        </Button>
        <Button
          variant={activeTab === "pages" ? "default" : "outline"}
          onClick={() => setActiveTab("pages")}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          SEO الصفحات
        </Button>
        <Button
          variant={activeTab === "advanced" ? "default" : "outline"}
          onClick={() => setActiveTab("advanced")}
          className="gap-2"
        >
          <Code className="h-4 w-4" />
          إعدادات متقدمة
        </Button>
        <Button
          variant={activeTab === "cache" ? "default" : "outline"}
          onClick={() => setActiveTab("cache")}
          className="gap-2"
        >
          <Trash className="h-4 w-4" />
          الكاش والخرائط
        </Button>
      </div>

      {/* Content */}
      <div className="bg-card rounded-2xl p-8 shadow-sm border">
        {activeTab === "general" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              البيانات الوصفية الأساسية
            </h2>
            <div className="space-y-2">
              <Label>عنوان الموقع (Meta Title)</Label>
              <Input
                value={settings.meta_title}
                onChange={(e) =>
                  setSettings({ ...settings, meta_title: e.target.value })}
                placeholder="الشيخ السيد مراد - العلم الشرعي"
                className="bg-muted"
                disabled={isVisitor}
              />
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  يظهر في نتائج البحث - يفضل 50-60 حرفاً
                </span>
                <span
                  className={
                    settings.meta_title.length > 60
                      ? "text-red-500"
                      : "text-green-500"
                  }
                >
                  {settings.meta_title.length}/60
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>وصف الموقع (Meta Description)</Label>
              <Textarea
                value={settings.meta_description}
                onChange={(e) =>
                  setSettings({ ...settings, meta_description: e.target.value })}
                placeholder="الموقع الرسمي للشيخ السيد مراد - دروس وخطب ومقالات في العلوم الشرعية"
                rows={3}
                className="bg-muted resize-none"
                disabled={isVisitor}
              />
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  يظهر في نتائج البحث - يفضل 150-160 حرفاً
                </span>
                <span
                  className={
                    settings.meta_description.length > 160
                      ? "text-red-500"
                      : "text-green-500"
                  }
                >
                  {settings.meta_description.length}/160
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>الكلمات المفتاحية (Meta Keywords)</Label>
              <Input
                value={settings.meta_keywords}
                onChange={(e) =>
                  setSettings({ ...settings, meta_keywords: e.target.value })}
                placeholder="إسلام، فقه، عقيدة، خطب، دروس، الشيخ السيد مراد"
                className="bg-muted"
                disabled={isVisitor}
              />
              <p className="text-xs text-muted-foreground">
                افصل بين الكلمات بفواصل
              </p>
            </div>

            <div className="space-y-2">
              <Label>الرابط الأساسي (Canonical URL)</Label>
              <Input
                value={settings.canonical_url}
                onChange={(e) =>
                  setSettings({ ...settings, canonical_url: e.target.value })}
                placeholder="https://example.com"
                dir="ltr"
                className="bg-muted"
                disabled={isVisitor}
              />
              <p className="text-xs text-muted-foreground">
                الرابط الرسمي للموقع لتجنب المحتوى المكرر
              </p>
            </div>

            {/* SEO Preview */}
            <div className="bg-muted/50 rounded-xl p-6 mt-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                معاينة نتائج البحث
              </h3>
              <div className="bg-card rounded-lg p-4 border border-border">
                <p className="text-blue-600 text-lg hover:underline cursor-pointer">
                  {settings.meta_title || "عنوان الموقع"}
                </p>
                <p className="text-green-700 text-sm" dir="ltr">
                  {settings.canonical_url || "https://example.com"}
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  {settings.meta_description || "وصف الموقع يظهر هنا..."}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "social" && (
          <div className="space-y-8">
            {/* Open Graph */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Open Graph (Facebook, WhatsApp, Telegram)
              </h2>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>عنوان OG</Label>
                  <Input
                    value={settings.og_title}
                    onChange={(e) =>
                      setSettings({ ...settings, og_title: e.target.value })}
                    placeholder="اتركه فارغاً لاستخدام عنوان الصفحة"
                    className="bg-muted"
                    disabled={isVisitor}
                  />
                </div>
                <div className="space-y-2">
                  <Label>وصف OG</Label>
                  <Textarea
                    value={settings.og_description}
                    onChange={(e) =>
                      setSettings({ ...settings, og_description: e.target.value })}
                    rows={2}
                    className="bg-muted resize-none"
                    disabled={isVisitor}
                  />
                </div>
                <div className="space-y-2">
                  <Label>صورة OG</Label>
                  <FileUpload
                    accept="image/*"
                    folder="seo"
                    label="رفع صورة OG"
                    onUploadComplete={(path) =>
                      setSettings({ ...settings, og_image: path })}
                    currentFile={settings.og_image}
                    disabled={isVisitor}
                  />
                  <p className="text-xs text-muted-foreground">
                    الأبعاد المثالية: 1200x630 بكسل
                  </p>
                </div>
              </div>
            </div>

            {/* Twitter */}
            <div className="space-y-6 pt-6 border-t">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Globe className="h-5 w-5 text-sky-500" />
                Twitter Cards
              </h2>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>حساب Twitter</Label>
                  <Input
                    value={settings.twitter_handle}
                    onChange={(e) =>
                      setSettings({ ...settings, twitter_handle: e.target.value })}
                    placeholder="@username"
                    dir="ltr"
                    className="bg-muted"
                    disabled={isVisitor}
                  />
                </div>
                <div className="space-y-2">
                  <Label>عنوان Twitter</Label>
                  <Input
                    value={settings.twitter_title}
                    onChange={(e) =>
                      setSettings({ ...settings, twitter_title: e.target.value })}
                    className="bg-muted"
                    disabled={isVisitor}
                  />
                </div>
                <div className="space-y-2">
                  <Label>وصف Twitter</Label>
                  <Textarea
                    value={settings.twitter_description}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        twitter_description: e.target.value,
                      })}
                    rows={2}
                    className="bg-muted resize-none"
                    disabled={isVisitor}
                  />
                </div>
                <div className="space-y-2">
                  <Label>صورة Twitter</Label>
                  <FileUpload
                    accept="image/*"
                    folder="seo"
                    label="رفع صورة Twitter"
                    onUploadComplete={(path) =>
                      setSettings({ ...settings, twitter_image: path })}
                    currentFile={settings.twitter_image}
                    disabled={isVisitor}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              أدوات التحليلات والتتبع
            </h2>
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label>Google Analytics ID</Label>
                <Input
                  value={settings.google_analytics_id}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      google_analytics_id: e.target.value,
                    })}
                  placeholder="G-XXXXXXXXXX أو UA-XXXXXXXX-X"
                  dir="ltr"
                  className="bg-muted"
                  disabled={isVisitor}
                />
                <p className="text-xs text-muted-foreground">
                  معرف Google Analytics لتتبع زيارات الموقع
                </p>
              </div>

              <div className="space-y-2">
                <Label>Facebook Pixel ID</Label>
                <Input
                  value={settings.facebook_pixel_id}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      facebook_pixel_id: e.target.value,
                    })}
                  placeholder="XXXXXXXXXXXXXXXX"
                  dir="ltr"
                  className="bg-muted"
                  disabled={isVisitor}
                />
                <p className="text-xs text-muted-foreground">
                  معرف Facebook Pixel للتتبع والإعلانات
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h3 className="font-bold text-blue-800 mb-2">نصائح التحليلات</h3>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>
                    استخدم Google Analytics 4 (GA4) للحصول على تحليلات أفضل
                  </li>
                  <li>راجع تقارير الزيارات أسبوعياً لفهم سلوك الزوار</li>
                  <li>تتبع الصفحات الأكثر زيارة وحسّن محتواها</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === "verification" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              التحقق من ملكية الموقع
            </h2>
            <div className="space-y-2">
              <Label>Google Search Console</Label>
              <Input
                value={settings.google_verification}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    google_verification: e.target.value,
                  })}
                placeholder="رمز التحقق من Google"
                dir="ltr"
                className="bg-muted"
                disabled={isVisitor}
              />
              <p className="text-xs text-muted-foreground">
                احصل على الرمز من{" "}
                <a
                  href="https://search.google.com/search-console"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-primary hover:underline"
                >
                  Google Search Console
                </a>
              </p>
            </div>
            <div className="space-y-2">
              <Label>Bing Webmaster</Label>
              <Input
                value={settings.bing_verification}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bing_verification: e.target.value,
                  })}
                placeholder="رمز التحقق من Bing"
                dir="ltr"
                className="bg-muted"
                disabled={isVisitor}
              />
            </div>
          </div>
        )}

        {activeTab === "pages" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                إعدادات SEO لكل صفحة
              </h2>
              <Button
                onClick={() => setIsAddingPage(true)}
                disabled={isAddingPage || isVisitor}
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة صفحة
              </Button>
            </div>

            {/* Add/Edit Page SEO Form */}
            {isAddingPage && (
              <div className="bg-muted/50 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">
                    {editingPageId ? "تعديل SEO الصفحة" : "إضافة SEO لصفحة جديدة"}
                  </h3>
                  <Button variant="ghost" size="icon" onClick={resetPageForm}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>مسار الصفحة *</Label>
                    <Input
                      value={pageFormData.page_path}
                      onChange={(e) =>
                        setPageFormData({
                          ...pageFormData,
                          page_path: e.target.value,
                        })}
                      placeholder="/khutba"
                      dir="ltr"
                      className="bg-background"
                      disabled={isVisitor}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>عنوان الصفحة *</Label>
                    <Input
                      value={pageFormData.page_title}
                      onChange={(e) =>
                        setPageFormData({
                          ...pageFormData,
                          page_title: e.target.value,
                        })}
                      placeholder="الخطب - الشيخ السيد مراد"
                      className="bg-background"
                      disabled={isVisitor}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>الوصف</Label>
                    <Textarea
                      value={pageFormData.meta_description}
                      onChange={(e) =>
                        setPageFormData({
                          ...pageFormData,
                          meta_description: e.target.value,
                        })}
                      rows={2}
                      className="bg-background resize-none"
                      disabled={isVisitor}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الكلمات المفتاحية</Label>
                    <Input
                      value={pageFormData.meta_keywords}
                      onChange={(e) =>
                        setPageFormData({
                          ...pageFormData,
                          meta_keywords: e.target.value,
                        })}
                      className="bg-background"
                      disabled={isVisitor}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Robots</Label>
                    <Input
                      value={pageFormData.robots}
                      onChange={(e) =>
                        setPageFormData({
                          ...pageFormData,
                          robots: e.target.value,
                        })}
                      placeholder="index, follow"
                      dir="ltr"
                      className="bg-background"
                      disabled={isVisitor}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Canonical URL</Label>
                    <Input
                      value={pageFormData.canonical_url}
                      onChange={(e) =>
                        setPageFormData({
                          ...pageFormData,
                          canonical_url: e.target.value,
                        })}
                      placeholder="https://..."
                      dir="ltr"
                      className="bg-background"
                      disabled={isVisitor}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الأولوية في خريطة الموقع (0-1)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={pageFormData.priority}
                      onChange={(e) =>
                        setPageFormData({
                          ...pageFormData,
                          priority: parseFloat(e.target.value) || 0.5,
                        })}
                      dir="ltr"
                      className="bg-background"
                      disabled={isVisitor}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetPageForm}>
                    إلغاء
                  </Button>
                  <Button onClick={savePageSEO} disabled={isVisitor}>
                    <Save className="h-4 w-4 ml-2" />
                    {editingPageId ? "تحديث" : "إضافة"}
                  </Button>
                </div>
              </div>
            )}

            {/* Pages List */}
            <div className="space-y-3">
              {pageSEOList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد إعدادات SEO مخصصة للصفحات
                </div>
              ) : (
                pageSEOList.map((page) => (
                  <div
                    key={page.id}
                    className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded" dir="ltr">
                          {page.page_path}
                        </code>
                        <span className="text-xs text-muted-foreground">
                          الأولوية: {page.priority || 0.5}
                        </span>
                      </div>

                      <h4 className="font-medium mt-1 truncate">
                        {page.page_title}
                      </h4>

                      {page.meta_description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {page.meta_description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEditPage(page)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deletePageSEO(page.id)}
                        disabled={isVisitor}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "advanced" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              إعدادات SEO المتقدمة
            </h2>
            <div className="space-y-2">
              <Label>Robots.txt (إضافات مخصصة)</Label>
              <Textarea
                value={settings.robots_txt}
                onChange={(e) =>
                  setSettings({ ...settings, robots_txt: e.target.value })}
                rows={8}
                dir="ltr"
                className="bg-muted font-mono text-sm resize-none"
                placeholder={`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Sitemap: https://example.com/sitemap.xml`}
                disabled={isVisitor}
              />
              <p className="text-xs text-muted-foreground">
                تحكم في كيفية فهرسة محركات البحث لموقعك
              </p>
            </div>

            <div className="space-y-2">
              <Label>البيانات المنظمة (Structured Data / JSON-LD)</Label>
              <Textarea
                value={settings.structured_data}
                onChange={(e) =>
                  setSettings({ ...settings, structured_data: e.target.value })}
                rows={10}
                dir="ltr"
                className="bg-muted font-mono text-sm resize-none"
                placeholder={`{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "الشيخ السيد مراد",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png"
}`}
                disabled={isVisitor}
              />
              <p className="text-xs text-muted-foreground">
                أضف بيانات منظمة لتحسين ظهورك في نتائج البحث
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div>
                  <h3 className="font-bold">خريطة الموقع التلقائية</h3>
                  <p className="text-sm text-muted-foreground">
                    إنشاء sitemap.xml تلقائياً
                  </p>
                </div>

                <div className="flex items-center justify-center">
                  <UiverseToggle
                    checked={settings.sitemap_enabled}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, sitemap_enabled: checked })}
                    disabled={isVisitor}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div>
                  <h3 className="font-bold">توليد Meta تلقائي</h3>
                  <p className="text-sm text-muted-foreground">
                    إنشاء وصف تلقائي للصفحات
                  </p>
                </div>

                <div className="flex items-center justify-center">
                  <UiverseToggle
                    checked={settings.auto_generate_meta}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, auto_generate_meta: checked })}
                    disabled={isVisitor}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "cache" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Trash className="h-5 w-5 text-primary" />
              مسح الكاش وخريطة الموقع
            </h2>
            <div className="grid gap-6">
              <div className="bg-muted/50 rounded-xl p-6">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  مسح كاش جميع الصفحات
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  سيتم إعادة تحميل جميع الصفحات الرئيسية. استخدم هذا إذا لم تظهر التغييرات.
                </p>
                <Button
                  onClick={clearCache}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
                  disabled={isVisitor}
                >
                  <Trash className="h-4 w-4 ml-2" />
                  مسح الكاش الآن
                </Button>
              </div>

              <div className="bg-muted/50 rounded-xl p-6">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  إنشاء خريطة الموقع
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  إنشاء ملف sitemap.xml جديد يحتوي على جميع صفحات الموقع.
                </p>
                <Button onClick={generateSitemap} disabled={isVisitor}>
                  <Plus className="h-4 w-4 ml-2" />
                  إنشاء خريطة الموقع
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {activeTab !== "pages" && (
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={loadSettings}>
            <RefreshCw className="h-4 w-4 ml-2" />
            إعادة تحميل
          </Button>
          <Button
            onClick={saveSettings}
            disabled={saving || isVisitor}
            className="bg-primary hover:bg-primary-hover text-white"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 ml-2" />
                حفظ الإعدادات
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}