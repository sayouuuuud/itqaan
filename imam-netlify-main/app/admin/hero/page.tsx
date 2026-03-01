"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UiverseToggle } from "@/components/ui/uiverse-toggle"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save } from "lucide-react"

interface Book {
  id: string
  title: string
}

export default function AdminHeroPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()
  const isVisitor = user?.email === 'visitor@gmail.com'
  const [message, setMessage] = useState("")
  const [heroData, setHeroData] = useState<{
    id: string;
    hadith_text: string;
    hadith_translation: string;
    hadith_explanation: string;
    hadith_button_text: string;
    hadith_button_link: string;
    book_custom_text: string;
    book_button_text: string;
    book_button_link: string;
    featured_book_id: string | null;
    important_notice: string;
    important_notice_link: string;
    show_important_notice: boolean;
    underline_text: string | null;
  }>({
    id: "",
    hadith_text: "الحديث النصي هنا",
    hadith_translation: "",
    hadith_explanation: "",
    hadith_button_text: "اقرأ المزيد",
    hadith_button_link: "/articles",
    book_custom_text: "أحدث إصدارات الشيخ",
    book_button_text: "تصفح الكتب",
    book_button_link: "/books",
    featured_book_id: null,
    important_notice: "",
    important_notice_link: "",
    show_important_notice: false,
    underline_text: null,
  })
  const [books, setBooks] = useState<Book[]>([])

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch hero data - جلب أحدث سجل
      const { data: hero, error: heroError } = await supabase
        .from("hero_section")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      console.log("بيانات hero المستلمة:", hero)
      console.log("خطأ hero:", heroError)

      if (hero && !heroError) {
        console.log("تحديث البيانات في الواجهة من السجل:", hero.id)
        setHeroData({
          id: hero.id || "",
          hadith_text: hero.hadith_text || "الحديث النصي هنا",
          hadith_translation: hero.hadith_translation || "",
          hadith_explanation: hero.hadith_explanation || "",
          hadith_button_text: hero.hadith_button_text || "اقرأ المزيد",
          hadith_button_link: hero.hadith_button_link || "/articles",
          book_custom_text: hero.book_custom_text || "أحدث إصدارات الشيخ",
          book_button_text: hero.book_button_text || "تصفح الكتب",
          book_button_link: hero.book_button_link || "/books",
          featured_book_id: hero.featured_book_id || null,
          important_notice: hero.important_notice || "",
          important_notice_link: hero.important_notice_link || "",
          show_important_notice: hero.show_important_notice ?? false,
          underline_text: hero.underline_text || "",
        })
      } else {
        // إذا لم يوجد سجل، ابقِ القيم الافتراضية
        console.log("لم يتم العثور على بيانات hero_section، سيتم استخدام القيم الافتراضية")
        setHeroData({
          id: "",
          hadith_text: "الحديث النصي هنا",
          hadith_translation: "",
          hadith_explanation: "",
          hadith_button_text: "اقرأ المزيد",
          hadith_button_link: "/articles",
          book_custom_text: "أحدث إصدارات الشيخ",
          book_button_text: "تصفح الكتب",
          book_button_link: "/books",
          featured_book_id: "",
          important_notice: "",
          important_notice_link: "",
          show_important_notice: false,
          underline_text: "",
        })
      }
    } catch (error) {
      console.error("خطأ في جلب البيانات:", error)
      // في حالة الخطأ، ابقِ القيم الافتراضية
      setHeroData({
        id: "",
        hadith_text: "الحديث النصي هنا",
        hadith_translation: "",
        hadith_explanation: "",
        hadith_button_text: "اقرأ المزيد",
        hadith_button_link: "/articles",
        book_custom_text: "أحدث إصدارات الشيخ",
        book_button_text: "تصفح الكتب",
        book_button_link: "/books",
        featured_book_id: "",
        important_notice: "",
        important_notice_link: "",
        show_important_notice: false,
        underline_text: "",
      })
    }

    // Fetch books for selection
    const { data: booksData } = await supabase
      .from("books")
      .select("id, title")
      .eq("publish_status", "published")
      .order("title")

    if (booksData) {
      setBooks(booksData)
    }

    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage("")
    console.log("بيانات heroData قبل الحفظ:", heroData)
    console.log("قيم التنويه:", {
      important_notice: heroData.important_notice,
      important_notice_link: heroData.important_notice_link,
    })

    // Validate required fields
    if (!heroData.hadith_text.trim()) {
      setMessage("يرجى إدخال نص الحديث")
      setSaving(false)
      return
    }

    const updateData = {
      hadith_text: heroData.hadith_text.trim(),
      hadith_translation: heroData.hadith_translation.trim(),
      hadith_explanation: heroData.hadith_explanation.trim(),
      hadith_button_text: heroData.hadith_button_text.trim(),
      hadith_button_link: heroData.hadith_button_link.trim(),
      book_custom_text: heroData.book_custom_text.trim(),
      book_button_text: heroData.book_button_text.trim(),
      book_button_link: heroData.book_button_link.trim(),
      featured_book_id: heroData.featured_book_id || null,
      important_notice: heroData.important_notice.trim(),
      important_notice_link: heroData.important_notice_link.trim(),
      show_important_notice: heroData.show_important_notice,
      underline_text: heroData.underline_text?.trim() || null,
      updated_at: new Date().toISOString(),
    }

    console.log("البيانات المرسلة لقاعدة البيانات:", updateData)
    console.log("ID الحالي:", heroData.id)

    let error
    if (heroData.id) {
      console.log("تحديث السجل الموجود بالـ ID:", heroData.id)
      const result = await supabase
        .from("hero_section")
        .update(updateData)
        .eq("id", heroData.id)
      console.log("نتيجة التحديث:", result)
      error = result.error
    } else {
      console.log("إدراج سجل جديد")
      const result = await supabase.from("hero_section").insert(updateData)
      console.log("نتيجة الإدراج:", result)
      error = result.error
    }

    if (error) {
      console.error("خطأ في الحفظ:", error)
      setMessage("حدث خطأ أثناء الحفظ: " + error.message)
    } else {
      console.log("تم الحفظ بنجاح، جاري إعادة تحميل البيانات...")
      // تحديث البيانات محلياً بدلاً من إعادة جلبها
      const updatedData = { ...heroData, ...updateData }
      console.log("البيانات المحدثة محلياً:", updatedData)
      setHeroData(updatedData)
      setMessage("تم الحفظ بنجاح!")
      // أعد تحميل البيانات من قاعدة البيانات للتأكد من التحديث
      setTimeout(async () => {
        await fetchData()
      }, 1000)
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-[#035d44] font-serif flex items-center gap-3">
            <span className="material-icons-outlined text-4xl text-[#035d44]">
              view_carousel
            </span>
            إدارة القسم الرئيسي
          </h1>
          <p className="text-muted-foreground mt-2">
            تحديث محتوى القسم الرئيسي في الصفحة الرئيسية
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || isVisitor}
          className="bg-primary hover:bg-primary-hover text-white px-8"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 ml-2" />
              حفظ التغييرات
            </>
          )}
        </Button>
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

      {/* Important Notice Section */}
      <div className="bg-accent rounded-2xl p-6 border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-icons-outlined">campaign</span>
            </span>

            <div>
              <h2 className="text-xl font-bold text-foreground">
                التنويه الهام
              </h2>
              <p className="text-sm text-muted-foreground">
                إظهار رسالة تنويه في أعلى الصفحة الرئيسية
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <UiverseToggle
              checked={heroData.show_important_notice}
              disabled={isVisitor}
              onCheckedChange={(checked) =>
                setHeroData({
                  ...heroData,
                  show_important_notice: checked,
                })}
            />
          </div>
        </div>

        {heroData.show_important_notice && (
          <div className="pt-4 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نص التنويه</Label>
                <Input
                  value={heroData.important_notice}
                  onChange={(e) =>
                    setHeroData({
                      ...heroData,
                      important_notice: e.target.value,
                    })}
                  placeholder="مثال: درس جديد اليوم في مسجد الرحمن الساعة 7 مساءً"
                  className="bg-background"
                  disabled={isVisitor}
                />
              </div>
              <div className="space-y-2">
                <Label>رابط التنويه (اختياري)</Label>
                <Input
                  value={heroData.important_notice_link}
                  onChange={(e) =>
                    setHeroData({
                      ...heroData,
                      important_notice_link: e.target.value,
                    })}
                  placeholder="/articles/new-lesson"
                  className="bg-background"
                  dir="ltr"
                  disabled={isVisitor}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hadith Section */}
        <div className="bg-card rounded-2xl p-6 border border-border space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <span className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-icons-outlined">format_quote</span>
            </span>

            <h2 className="text-xl font-bold text-foreground">قسم الحديث</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>نص الحديث *</Label>
              <Textarea
                value={heroData.hadith_text}
                onChange={(e) =>
                  setHeroData({
                    ...heroData,
                    hadith_text: e.target.value,
                  })}
                rows={2}
                className="bg-muted resize-none"
                placeholder="أدخل نص الحديث الأساسي"
                disabled={isVisitor}
              />
            </div>

            <div className="space-y-2">
              <Label>الكلمة/الجملة المراد تسطيرها</Label>
              <Input
                value={heroData.underline_text || ""}
                onChange={(e) =>
                  setHeroData({
                    ...heroData,
                    underline_text: e.target.value,
                  })}
                className="bg-muted"
                placeholder="مثال: خيراً - اكتب الكلمة التي تريد وضع خط تحتها"
                disabled={isVisitor}
              />
              <p className="text-xs text-text-muted">
                اكتب الكلمة أو الجملة التي تريد وضع خط تحتها من نص الحديث
              </p>
            </div>

            <div className="space-y-2">
              <Label>راوي الحديث</Label>
              <Input
                value={heroData.hadith_translation}
                onChange={(e) =>
                  setHeroData({
                    ...heroData,
                    hadith_translation: e.target.value,
                  })}
                className="bg-muted"
                placeholder="مثال: رواه البخاري ومسلم"
                disabled={isVisitor}
              />
            </div>

            <div className="space-y-2">
              <Label>شرح الحديث</Label>
              <Textarea
                value={heroData.hadith_explanation}
                onChange={(e) =>
                  setHeroData({
                    ...heroData,
                    hadith_explanation: e.target.value,
                  })}
                rows={3}
                className="bg-muted resize-none"
                placeholder="شرح مختصر للحديث يظهر تحت النص الرئيسي"
                disabled={isVisitor}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نص الزر</Label>
                <Input
                  value={heroData.hadith_button_text}
                  onChange={(e) =>
                    setHeroData({
                      ...heroData,
                      hadith_button_text: e.target.value,
                    })}
                  className="bg-muted"
                  placeholder="اقرأ المزيد"
                  disabled={isVisitor}
                />
              </div>

              <div className="space-y-2">
                <Label>رابط الزر</Label>
                <Input
                  value={heroData.hadith_button_link}
                  onChange={(e) =>
                    setHeroData({
                      ...heroData,
                      hadith_button_link: e.target.value,
                    })}
                  className="bg-muted"
                  placeholder="/articles"
                  dir="ltr"
                  disabled={isVisitor}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Book Section */}
        <div className="bg-card rounded-2xl p-6 border border-border space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <span className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
              <span className="material-icons-outlined">auto_stories</span>
            </span>

            <h2 className="text-xl font-bold text-foreground">
              قسم الكتاب المميز
            </h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اختر الكتاب المميز</Label>
              <Select
                value={heroData.featured_book_id || ""}
                onValueChange={(value) =>
                  setHeroData({
                    ...heroData,
                    featured_book_id: value,
                  })}
                disabled={isVisitor}
              >
                <SelectTrigger className="bg-muted">
                  <SelectValue placeholder="اختر كتاباً..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون كتاب</SelectItem>
                  {books.map((book) => (
                    <SelectItem key={book.id} value={book.id}>
                      {book.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <p className="text-xs text-text-muted">
                صورة الكتاب المختار ستظهر في الصفحة الرئيسية
              </p>
            </div>



            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نص الزر</Label>
                <Input
                  value={heroData.book_button_text}
                  onChange={(e) =>
                    setHeroData({
                      ...heroData,
                      book_button_text: e.target.value,
                    })}
                  className="bg-muted"
                  placeholder="تصفح الكتب"
                  disabled={isVisitor}
                />
              </div>

              <div className="space-y-2">
                <Label>رابط الزر</Label>
                <Input
                  value={heroData.book_button_link}
                  onChange={(e) =>
                    setHeroData({
                      ...heroData,
                      book_button_link: e.target.value,
                    })}
                  className="bg-muted"
                  placeholder="/books"
                  dir="ltr"
                  disabled={isVisitor}
                />
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  )
}