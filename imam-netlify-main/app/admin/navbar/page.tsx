"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UiverseToggle } from "@/components/ui/uiverse-toggle"
import { createClient } from "@/lib/supabase/client"
import { revalidateNavbar } from "@/app/actions/revalidate"
import { FileUpload } from "@/components/admin/file-upload"

// Helper function to resolve preview src (copied from FileUpload)
const resolvePreviewSrc = (value: string) => {
  if (!value) return ""
  // External URLs (e.g. YouTube)
  if (/^https?:\/\//i.test(value)) return value
  // Local images (start with / and don't contain uploads/)
  if (value.startsWith('/') && !value.includes('uploads/')) return value
  // Uploaded files (contain uploads/)
  return `/api/download?key=${encodeURIComponent(value)}`
}
import { Plus, Pencil, Trash2, Save, X, GripVertical, Menu, Eye, EyeOff, Loader2, ArrowUp, ArrowDown, ImageIcon, Link2, Youtube, Send, Facebook, Twitter, Instagram, MessageCircle, Globe, Music, Video, LinkIcon } from "lucide-react"

interface NavItem {
  id: string
  label: string
  href: string
  order_index: number
  is_active: boolean
  created_at: string
}

export default function NavbarAdminPage() {
  const [items, setItems] = useState<NavItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()
  const isVisitor = user?.email === 'visitor@gmail.com'
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [activeTab, setActiveTab] = useState<"items" | "logo" | "footer" | "social">("items")
  const [logoUrl, setLogoUrl] = useState("")
  const [savingLogo, setSavingLogo] = useState(false)
  const [formData, setFormData] = useState({
    label: "",
    href: "",
    is_active: true,
  })

  // Social Links State
  const [socialLinks, setSocialLinks] = useState<{ platform: string, url: string, icon: string }[]>([])
  const [savingSocial, setSavingSocial] = useState(false)

  // Footer Description State
  const [footerDescription, setFooterDescription] = useState("")
  const [savingFooter, setSavingFooter] = useState(false)

  const platformOptions = [
    { value: "youtube", label: "يوتيوب", icon: "youtube" },
    { value: "telegram", label: "تليجرام", icon: "telegram" },
    { value: "facebook", label: "فيسبوك", icon: "facebook" },
    { value: "twitter", label: "تويتر/إكس", icon: "twitter" },
    { value: "instagram", label: "إنستجرام", icon: "instagram" },
    { value: "whatsapp", label: "واتساب", icon: "whatsapp" },
    { value: "tiktok", label: "تيك توك", icon: "tiktok" },
    { value: "soundcloud", label: "ساوند كلاود", icon: "soundcloud" },
    { value: "website", label: "موقع إلكتروني", icon: "website" },
  ]

  function getPlatformIcon(platform: string) {
    switch (platform) {
      case "youtube": return <Youtube className="h-5 w-5" />
      case "telegram": return <Send className="h-5 w-5" />
      case "facebook": return <Facebook className="h-5 w-5" />
      case "twitter": return <Twitter className="h-5 w-5" />
      case "instagram": return <Instagram className="h-5 w-5" />
      case "whatsapp": return <MessageCircle className="h-5 w-5" />
      case "tiktok": return <Video className="h-5 w-5" />
      case "soundcloud": return <Music className="h-5 w-5" />
      case "website": return <Globe className="h-5 w-5" />
      default: return <LinkIcon className="h-5 w-5" />
    }
  }

  const supabase = createClient()

  useEffect(() => {
    loadItems()
    loadLogo()
    loadSocialLinks()
    loadFooterDescription()
  }, [])

  async function loadLogo() {
    try {
      // Try appearance_settings first
      const { data, error } = await supabase
        .from("appearance_settings")
        .select("site_logo_path")
        .single()

      if (data && !error) {
        console.log('🎨 Admin Navbar: Loaded logo from appearance_settings:', data.site_logo_path)
        setLogoUrl(data.site_logo_path || "/placeholder-logo.png")
        return
      }

      // Fallback to site_settings if appearance_settings fails
      console.log('🎨 Admin Navbar: appearance_settings failed, trying site_settings')
      const { data: siteData, error: siteError } = await supabase
        .from("site_settings")
        .select("*")
        .eq("key", "site_logo")
        .single()

      if (siteData && !siteError) {
        console.log('🎨 Admin Navbar: Loaded logo from site_settings:', siteData.value)
        setLogoUrl(siteData.value || "/placeholder-logo.png")
      } else {
        console.log('🎨 Admin Navbar: No logo data found, using placeholder')
        setLogoUrl('/placeholder-logo.png')
      }
    } catch (error) {
      console.log('🎨 Admin Navbar: Database error, using placeholder:', error)
      setLogoUrl('/placeholder-logo.png')
    }
  }

  async function saveLogo() {
    setSavingLogo(true)
    setMessage({ type: "", text: "" })

    try {
      console.log('🎨 Admin Save: Attempting to save logo:', logoUrl)

      // Save to appearance_settings
      const appearanceResult = await supabase.from("appearance_settings").upsert(
        {
          id: "a0000000-0000-0000-0000-000000000001",
          site_logo_path: logoUrl,
          site_logo_path_dark: logoUrl, // Use same logo for both themes for now
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )

      console.log('🎨 Admin Save: appearance_settings result:', appearanceResult)

      if (appearanceResult.error) {
        console.error('🎨 Admin Save: appearance_settings error:', appearanceResult.error)
      }

      // Also save to site_settings for backward compatibility
      const siteResult = await supabase.from("site_settings").upsert(
        {
          key: "site_logo",
          value: logoUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      )

      console.log('🎨 Admin Save: site_settings result:', siteResult)

      console.log('🎨 Admin Save: site_settings result:', siteResult)

      // Store logo in localStorage for immediate UI update
      localStorage.setItem('site_logo_path', logoUrl)

      // Verify the save worked
      const { data: verifyData } = await supabase
        .from("appearance_settings")
        .select("site_logo_path")
        .single()

      console.log('🎨 Admin Save: Verification - current DB value:', verifyData?.site_logo_path)
      console.log('🎨 Admin Save: Verification - expected value:', logoUrl)

      await revalidateNavbar()
      setMessage({
        type: "success",
        text: "تم حفظ الشعار بنجاح",
      })
    } catch (error: any) {
      console.error("Error saving logo:", error)
      setMessage({
        type: "error",
        text: "حدث خطأ أثناء حفظ الشعار",
      })
    }

    setSavingLogo(false)
  }

  async function loadItems() {
    setLoading(true)
    const { data, error } = await supabase
      .from("navbar_items")
      .select("*")
      .order("order_index", { ascending: true })

    if (error) {
      setItems([])
    } else {
      setItems(data || [])
    }
    setLoading(false)
  }

  async function loadSocialLinks() {
    const { data } = await supabase.from("site_settings").select("*")
    if (data) {
      const links: { platform: string, url: string, icon: string }[] = []
      const settingsMap: Record<string, string> = {}
      data.forEach((item: Record<string, unknown>) => {
        const key = (item.key || "") as string
        const value = (item.value || "") as string
        if (key) settingsMap[key] = value
      })
      platformOptions.forEach((platform) => {
        const key = `${platform.value}_channel`
        const url = settingsMap[key] || ""
        if (url) {
          links.push({ platform: platform.value, url, icon: platform.icon })
        }
      })
      setSocialLinks(links)
    }
  }

  async function loadFooterDescription() {
    const { data } = await supabase.from("site_settings").select("*").eq("key", "footer_description").single()
    if (data) {
      setFooterDescription(data.value || "")
    }
  }

  function addSocialLink() {
    setSocialLinks([...socialLinks, { platform: "youtube", url: "", icon: "youtube" }])
  }

  function updateSocialLink(index: number, field: string, value: string) {
    const newLinks = [...socialLinks]
    if (field === "platform") {
      const platform = platformOptions.find((p) => p.value === value)
      newLinks[index] = { ...newLinks[index], platform: value, icon: platform?.icon || "link" }
    } else {
      newLinks[index] = { ...newLinks[index], [field]: value }
    }
    setSocialLinks(newLinks)
  }

  function removeSocialLink(index: number) {
    setSocialLinks(socialLinks.filter((_, i) => i !== index))
  }

  async function saveSocialLinks() {
    setSavingSocial(true)
    setMessage({ type: "", text: "" })
    try {
      for (const link of socialLinks) {
        if (link.url) {
          const key = `${link.platform}_channel`
          await supabase.from("site_settings").upsert(
            { key, value: link.url, updated_at: new Date().toISOString() },
            { onConflict: "key" }
          )
        }
      }
      setMessage({ type: "success", text: "تم حفظ روابط التواصل بنجاح!" })
    } catch (error: any) {
      setMessage({ type: "error", text: "حدث خطأ أثناء الحفظ" })
    }
    setSavingSocial(false)
  }

  async function saveFooterDescription() {
    setSavingFooter(true)
    setMessage({ type: "", text: "" })
    try {
      await supabase.from("site_settings").upsert(
        { key: "footer_description", value: footerDescription, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      )
      setMessage({ type: "success", text: "تم حفظ وصف الفوتر بنجاح!" })
    } catch (error: any) {
      setMessage({ type: "error", text: "حدث خطأ أثناء الحفظ" })
    }
    setSavingFooter(false)
  }

  async function handleSave() {
    if (!formData.label || !formData.href) {
      setMessage({
        type: "error",
        text: "يرجى ملء جميع الحقول المطلوبة",
      })
      return
    }

    setSaving(true)
    setMessage({ type: "", text: "" })

    try {
      if (editingId) {
        const { error } = await supabase
          .from("navbar_items")
          .update({
            label: formData.label,
            href: formData.href,
            is_active: formData.is_active,
          })
          .eq("id", editingId)

        if (error) throw error

        setMessage({
          type: "success",
          text: "تم تحديث العنصر بنجاح",
        })
      } else {
        const maxOrder =
          items.length > 0 ? Math.max(...items.map((item) => item.order_index)) : 0

        const { error } = await supabase.from("navbar_items").insert({
          label: formData.label,
          href: formData.href,
          is_active: formData.is_active,
          order_index: maxOrder + 1,
        })

        if (error) throw error

        setMessage({
          type: "success",
          text: "تم إضافة العنصر بنجاح",
        })
      }

      await revalidateNavbar()
      await loadItems()
      resetForm()
    } catch (error: any) {
      setMessage({
        type: "error",
        text: "حدث خطأ أثناء حفظ العنصر",
      })
    }

    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا العنصر؟")) return

    try {
      const { error } = await supabase.from("navbar_items").delete().eq("id", id)

      if (error) throw error

      await revalidateNavbar()
      await loadItems()

      setMessage({
        type: "success",
        text: "تم حذف العنصر بنجاح",
      })
    } catch (error: any) {
      setMessage({
        type: "error",
        text: "حدث خطأ أثناء حذف العنصر",
      })
    }
  }

  async function toggleActive(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from("navbar_items")
        .update({ is_active: !currentStatus })
        .eq("id", id)

      if (error) throw error

      await revalidateNavbar()
      await loadItems()
    } catch (error: any) {
      setMessage({
        type: "error",
        text: "حدث خطأ أثناء تحديث حالة العنصر",
      })
    }
  }

  async function moveItem(id: string, direction: "up" | "down") {
    const currentIndex = items.findIndex((item) => item.id === id)
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= items.length) return

    const newItems = [...items]
    const temp = newItems[currentIndex].order_index
    newItems[currentIndex].order_index = newItems[newIndex].order_index
    newItems[newIndex].order_index = temp

    setItems(newItems)

    try {
      await supabase
        .from("navbar_items")
        .update({ order_index: newItems[currentIndex].order_index })
        .eq("id", newItems[currentIndex].id)

      await supabase
        .from("navbar_items")
        .update({ order_index: newItems[newIndex].order_index })
        .eq("id", newItems[newIndex].id)

      await revalidateNavbar()
    } catch (error: any) {
      // Revert on error
      await loadItems()
      setMessage({
        type: "error",
        text: "حدث خطأ أثناء إعادة الترتيب",
      })
    }
  }

  function startEdit(item: NavItem) {
    setEditingId(item.id)
    setFormData({
      label: item.label,
      href: item.href,
      is_active: item.is_active,
    })
    setIsAdding(true)
  }

  function resetForm() {
    setEditingId(null)
    setIsAdding(false)
    setFormData({
      label: "",
      href: "",
      is_active: true,
    })
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Menu className="h-6 w-6 text-primary" />
            <h1 className="text-lg md:text-2xl font-bold text-primary">إدارة القائمة والفوتر</h1>
          </div>

          <p className="text-muted-foreground">
            تحكم في عناصر شريط التنقل الرئيسي وشعار الموقع
          </p>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div
          className={`p-4 rounded-xl text-center ${message.type === "error"
            ? "bg-red-100 text-red-700"
            : "bg-green-100 text-green-700"
            }`}
        >
          {message.text}
        </div>
      )}

      {/* Tab Buttons */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2 mb-6">
        <Button
          variant={activeTab === "items" ? "default" : "ghost"}
          onClick={() => setActiveTab("items")}
          className={activeTab === "items" ? "bg-primary text-white" : ""}
        >
          <Menu className="h-4 w-4 ml-2" />
          عناصر القائمة
        </Button>

        <Button
          variant={activeTab === "logo" ? "default" : "ghost"}
          onClick={() => setActiveTab("logo")}
          className={activeTab === "logo" ? "bg-primary text-white" : ""}
        >
          <ImageIcon className="h-4 w-4 ml-2" />
          الشعار
        </Button>

        <Button
          variant={activeTab === "social" ? "default" : "ghost"}
          onClick={() => setActiveTab("social")}
          className={activeTab === "social" ? "bg-primary text-white" : ""}
        >
          <Link2 className="h-4 w-4 ml-2" />
          روابط التواصل
        </Button>

        <Button
          variant={activeTab === "footer" ? "default" : "ghost"}
          onClick={() => setActiveTab("footer")}
          className={activeTab === "footer" ? "bg-primary text-white" : ""}
        >
          <LinkIcon className="h-4 w-4 ml-2" />
          وصف الفوتر
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === "items" && (
        <>
          {/* Add Button */}
          <div className="flex justify-end mb-6">
            <Button
              onClick={() => setIsAdding(true)}
              disabled={isAdding || isVisitor}
              className="bg-primary hover:bg-primary-hover"
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة عنصر جديد
            </Button>
          </div>

          {/* Add/Edit Form */}
          {isAdding && (
            <div className="bg-card rounded-2xl p-6 border shadow-sm mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  {editingId ? "تعديل العنصر" : "إضافة عنصر جديد"}
                </h2>
                <Button variant="ghost" size="icon" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>اسم العنصر *</Label>
                  <Input
                    value={formData.label}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        label: e.target.value,
                      }))}
                    placeholder="مثال: الرئيسية، خطب، دروس"
                    className="bg-muted"
                    disabled={isVisitor}
                  />
                </div>

                <div className="space-y-2">
                  <Label>الرابط *</Label>
                  <Input
                    value={formData.href}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        href: e.target.value,
                      }))}
                    placeholder="مثال: /khutba أو /articles"
                    className="bg-muted"
                    dir="ltr"
                    disabled={isVisitor}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 p-4 bg-muted/50 rounded-xl">
                <div>
                  <Label className="text-base">نشط في الموقع</Label>
                  <p className="text-sm text-muted-foreground">
                    إظهار العنصر في القائمة العلوية
                  </p>
                </div>

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
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={resetForm}>
                  إلغاء
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || isVisitor}
                  className="bg-primary hover:bg-primary-hover"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 ml-2" />
                      {editingId ? "تحديث" : "إضافة"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="bg-card rounded-2xl border overflow-hidden">
            <div className="p-4 border-b bg-muted/50">
              <h2 className="font-bold text-lg">عناصر القائمة ({items.length})</h2>
              <p className="text-sm text-muted-foreground">
                استخدم أزرار الأسهم لإعادة ترتيب العناصر
              </p>
            </div>

            {items.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Menu className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-bold text-foreground mb-2">
                  لا توجد عناصر في القائمة
                </h3>
                <p className="text-muted-foreground">
                  أضف عناصر جديدة لتظهر في شريط التنقل الرئيسي
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${!item.is_active ? "opacity-50" : ""
                      }`}
                  >
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveItem(item.id, "up")}
                        disabled={index === 0 || isVisitor}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveItem(item.id, "down")}
                        disabled={index === items.length - 1 || isVisitor}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>

                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />

                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Menu className="h-5 w-5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${item.is_active
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300"
                            }`}
                        >
                          {item.is_active ? "نشط" : "مخفي"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          #{index + 1}
                        </span>
                      </div>

                      <h3 className="font-bold">{item.label}</h3>
                      <p className="text-sm text-muted-foreground" dir="ltr">
                        {item.href}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleActive(item.id, item.is_active)}
                        title={item.is_active ? "إخفاء" : "إظهار"}
                        disabled={isVisitor}
                      >
                        {item.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(item)}
                        title="تعديل"
                        disabled={isVisitor}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                        title="حذف"
                        disabled={isVisitor}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Items Instructions */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <h3 className="font-bold text-blue-800 mb-2">ملاحظات هامة</h3>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>العناصر النشطة فقط ستظهر في شريط التنقل الرئيسي</li>
              <li>يمكنك إعادة ترتيب العناصر باستخدام أزرار الأسهم</li>
              <li>تأكد من أن الروابط صحيحة وتبدأ بـ /</li>
              <li>التغييرات تظهر في الموقع فوراً بعد الحفظ</li>
            </ul>
          </div>
        </>
      )}

      {activeTab === "logo" && (
        <>
          {/* Logo Content */}
          <div className="bg-card rounded-2xl p-6 border shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                شعار الموقع
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                الشعار الذي سيظهر في شريط التنقل العلوي
              </p>
            </div>

            {logoUrl && (
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-2">
                  معاينة الشعار الحالي:
                </p>
                <img
                  src={resolvePreviewSrc(logoUrl) || "/placeholder.svg"}
                  alt="شعار الموقع"
                  className="h-16 w-auto object-contain"
                />
              </div>
            )}

            <FileUpload
              accept="image/*"
              folder="logo"
              label="رفع شعار جديد"
              onUploadComplete={(path) => setLogoUrl(path)}
              currentFile={logoUrl}
              disabled={isVisitor}
            />

            <div className="space-y-2">
              <Label>أو أدخل رابط الشعار مباشرة</Label>
              <Input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                dir="ltr"
                className="bg-muted"
                disabled={isVisitor}
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={saveLogo}
                disabled={savingLogo}
                className="bg-primary hover:bg-primary-hover text-white"
              >
                {savingLogo ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 ml-2" />
                    حفظ الشعار
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Logo Instructions */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <h3 className="font-bold text-blue-800 mb-2">ملاحظات هامة</h3>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>الشعار سيظهر في شريط التنقل العلوي</li>
              <li>يفضل استخدام صورة شفافة (PNG) أو مع خلفية بيضاء</li>
              <li>الحجم المثالي: 200x60 بكسل</li>
              <li>التغييرات تظهر في الموقع فوراً بعد الحفظ</li>
            </ul>
          </div>
        </>
      )}

      {/* Social Links Tab */}
      {activeTab === "social" && (
        <>
          <div className="bg-card rounded-2xl p-6 border shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-primary" />
                  روابط التواصل الاجتماعي
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  الروابط التي ستظهر في الفوتر
                </p>
              </div>
              <Button onClick={addSocialLink} variant="outline" size="sm" disabled={isVisitor}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة رابط
              </Button>
            </div>

            {socialLinks.length === 0 ? (
              <div className="text-center py-12 bg-muted/50 rounded-xl">
                <Link2 className="h-12 w-12 mx-auto text-text-muted mb-4" />
                <p className="text-text-muted">لا توجد روابط تواصل</p>
                <Button onClick={addSocialLink} variant="outline" className="mt-4 bg-transparent" disabled={isVisitor}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة رابط جديد
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {socialLinks.map((link, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {getPlatformIcon(link.platform)}
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">المنصة</Label>
                        <select
                          value={link.platform}
                          onChange={(e) => updateSocialLink(index, "platform", e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
                          disabled={isVisitor}
                        >
                          {platformOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">الرابط</Label>
                        <Input
                          value={link.url}
                          onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                          placeholder="https://..."
                          dir="ltr"
                          className="bg-background"
                          disabled={isVisitor}
                        />
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeSocialLink(index)} className="text-red-500" disabled={isVisitor}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-border">
              <Button onClick={saveSocialLinks} disabled={savingSocial || isVisitor} className="bg-primary hover:bg-primary-hover text-white">
                {savingSocial ? (
                  <><Loader2 className="h-4 w-4 ml-2 animate-spin" />جاري الحفظ...</>
                ) : (
                  <><Save className="h-4 w-4 ml-2" />حفظ روابط التواصل</>
                )}
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-800 text-sm">
              <strong>ملاحظة:</strong> ستظهر روابط التواصل المضافة في أسفل الموقع (Footer) بجانب شعار الموقع.
            </p>
          </div>
        </>
      )}

      {/* Footer Description Tab */}
      {activeTab === "footer" && (
        <>
          <div className="bg-card rounded-2xl p-6 border shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-primary" />
                وصف الفوتر
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                النص الذي يظهر أسفل الشعار في الفوتر
              </p>
            </div>

            <div className="space-y-2">
              <Label>وصف الموقع</Label>
              <textarea
                value={footerDescription}
                onChange={(e) => setFooterDescription(e.target.value)}
                placeholder="علم نافع للقلب السليم..."
                rows={4}
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground resize-none"
                disabled={isVisitor}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={saveFooterDescription} disabled={savingFooter || isVisitor} className="bg-primary hover:bg-primary-hover text-white">
                {savingFooter ? (
                  <><Loader2 className="h-4 w-4 ml-2 animate-spin" />جاري الحفظ...</>
                ) : (
                  <><Save className="h-4 w-4 ml-2" />حفظ الوصف</>
                )}
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-800 text-sm">
              <strong>ملاحظة:</strong> هذا النص سيظهر في الفوتر تحت شعار الموقع.
            </p>
          </div>
        </>
      )}
    </div>
  )
}