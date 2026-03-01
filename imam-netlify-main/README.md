# سجل التغييرات والتحديثات - Imam Website

هذا الملف يوثق جميع الأسئلة والتغييرات التي تمت في هذه المحادثة مع تفاصيل كاملة.

---

## 1. مؤثرات Transition للموقع الرئيسي

**السؤال:** عايز تعمل مؤثرات transition للموقع الرئيسي كله (الموقع بدون الادمن بانل)

**التفاصيل:**
- تمت إضافة CSS transitions لجميع العناصر التفاعلية
- إضافة `transition-all duration-300` للكروت والأزرار
- تحسين hover effects مع scale و shadow effects

**الصفحات المعدلة:**
- `app/(public)/page.tsx` - الصفحة الرئيسية
- `components/home/hero-section.tsx`
- `components/home/latest-articles.tsx`
- جميع الكروت في الموقع

---

## 2. توحيد تصميم شريط التنقل (Breadcrumb)

**السؤال:** توحيد تصميم الـ breadcrumb في جميع صفحات التفاصيل

**التفاصيل:**
الكود الموحد المستخدم في جميع الصفحات:
```tsx
<nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-8 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
  <Link href="/" className="hover:text-primary dark:hover:text-secondary">الرئيسية</Link>
  <ChevronLeft className="h-4 w-4 mx-2 text-gray-400" />
  <Link href="/[section]" className="hover:text-primary dark:hover:text-secondary">[اسم القسم]</Link>
  <ChevronLeft className="h-4 w-4 mx-2 text-gray-400" />
  <span className="text-primary dark:text-secondary font-medium">{item.title}</span>
</nav>
```

**الصفحات المعدلة:**
| الصفحة | التغيير |
|--------|---------|
| `app/(public)/dars/[id]/page.tsx` | استبدال `/` بـ ChevronLeft + إضافة CSS إخفاء scrollbar |
| `app/(public)/khutba/[id]/page.tsx` | استبدال material-icons بـ ChevronLeft + إضافة CSS |
| `app/(public)/articles/[id]/page.tsx` | استبدال material-icons بـ ChevronLeft + إضافة CSS |
| `app/(public)/videos/[id]/page.tsx` | تحويل من ol/li structure إلى flex layout |
| `app/(public)/books/[id]/page.tsx` | تحويل من ol/li structure إلى flex layout |

**الإضافات في كل صفحة:**
- Import: `import { ChevronLeft } from "lucide-react"`
- CSS classes: `[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`

---

## 3. إزالة الأيقونة غير المرغوبة من شريط التنقل

**السؤال:** إزالة أيقونة السهم للأعلى/للأسفل (شبه اسكرول) من جميع الصفحات

**التفاصيل:**
المشكلة كانت scrollbar أفقي يظهر في عنصر الـ breadcrumb بسبب `overflow-x-auto`

**الحل:**
```css
[&::-webkit-scrollbar]:hidden  /* Chrome, Safari, Edge */
[-ms-overflow-style:none]      /* IE, Legacy Edge */
[scrollbar-width:none]         /* Firefox */
```

**الصفحات المعدلة:**
- `app/(public)/dars/[id]/page.tsx`
- `app/(public)/khutba/[id]/page.tsx`
- `app/(public)/articles/[id]/page.tsx`
- `app/(public)/videos/[id]/page.tsx`
- `app/(public)/books/[id]/page.tsx`

---

## 4. تحديث مشغل الصوت (AudioPlayer)

**السؤال:** إصلاح رابط الصوت غير الصالح في صفحة الدرس + تحسين الأداء

**التفاصيل:**

**المشكلة:** الصوت لا يعمل بسبب تغليف مزدوج لـ API URL

**الحل في `components/audio-player.tsx`:**
```tsx
// إزالة رسالة التحذير عن المدة
// سطر 348-352 محذوف

// تبسيط togglePlayPause للتشغيل الفوري
// سطر 88-132: إزالة blocking على duration metadata

// تحسين تهيئة الـ audio element
<audio key={finalUrl} preload="auto" ... />
```

**الحل في `hooks/use-signed-url.ts`:**
```tsx
// معاملة المسارات المحلية التي تبدأ بـ / كـ URLs مباشرة
if (path.startsWith('/')) {
  setSignedUrl(path)
  return
}
```

**الحل في `app/(public)/dars/[id]/page.tsx`:**
```tsx
// تعديل getAudioUrl لإرجاع المسار الخام
const getAudioUrl = (lesson: any) => {
  if (lesson.media_url?.startsWith("uploads/")) {
    return lesson.media_url  // بدون تغليف بـ /api/download
  }
  return lesson.media_url || lesson.audio_url
}
```

**الملفات المعدلة:**
- `components/audio-player.tsx`
- `hooks/use-signed-url.ts`
- `app/(public)/dars/[id]/page.tsx`

---

## 5. توحيد زر المشاركة

**السؤال:** توحيد تصميم زر المشاركة في جميع صفحات التفاصيل

**التفاصيل:**

**الكود الجديد:**
```tsx
import { Share2 } from "lucide-react"

const handleShare = () => {
  if (navigator.share) {
    navigator.share({
      title: item.title,
      text: item.description,
      url: window.location.href,
    }).catch(() => { })
  } else {
    navigator.clipboard.writeText(window.location.href)
  }
}

// في JSX:
<button onClick={handleShare} className="p-2 rounded-full bg-primary/10 ...">
  <Share2 className="h-5 w-5 text-primary" />
</button>
```

**الصفحات المعدلة:**
| الصفحة | التغيير |
|--------|---------|
| `app/(public)/dars/[id]/page.tsx` | استبدال ShareButtons بزر واحد + handleShare |
| `app/(public)/videos/[id]/page.tsx` | إضافة handleShare + زر مشاركة |

**الإضافات:**
- Import: `import { Share2 } from "lucide-react"`
- Function: `handleShare()`
- إزالة: `ShareButtons` component

---

## 6. إنشاء كروت موحدة للـ Sidebar

**السؤال:** إنشاء كروت موحدة لبروفايل الشيخ والنشرة البريدية بدلاً من تكرار الكود

**التفاصيل:**

### ملف جديد: `components/sheikh-profile-card.tsx`
```tsx
"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

export function SheikhProfileCard() {
  // جلب البيانات من about_page table
  // دعم صور من: uploads/, http, محلية
  // fallback لاسم ووصف وصورة
  // رابط لصفحة /about
}
```

### ملف جديد: `components/newsletter-card.tsx`
```tsx
export function NewsletterCard() {
  // نموذج اشتراك بسيط
  // input للإيميل + زر اشتراك
  // تصميم متجاوب
}
```

**الصفحات المعدلة لاستخدام الكروت الجديدة:**
| الصفحة | التغيير |
|--------|---------|
| `app/(public)/khutba/[id]/page.tsx` | استبدال hardcoded cards بـ SheikhProfileCard و NewsletterCard |
| `app/(public)/articles/[id]/page.tsx` | استبدال hardcoded cards بـ SheikhProfileCard و NewsletterCard |
| `app/(public)/videos/[id]/page.tsx` | إضافة SheikhProfileCard و NewsletterCard للـ sidebar |
| `app/(public)/dars/[id]/page.tsx` | إضافة SheikhProfileCard و NewsletterCard للـ sidebar |

**الإضافات في كل صفحة:**
```tsx
import { SheikhProfileCard } from "@/components/sheikh-profile-card"
import { NewsletterCard } from "@/components/newsletter-card"
```

---

## 7. تحديث تخطيط صفحة الدرس

**السؤال:** تحديث صفحة dars لتتطابق مع صفحة khutba (تخطيط عمودين + sidebar)

**التفاصيل:**

**قبل:**
- تخطيط عمود واحد
- Related Lessons في أسفل الصفحة

**بعد:**
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  {/* Main Content - 2 columns */}
  <div className="lg:col-span-2">
    {/* محتوى الدرس */}
  </div>
  
  {/* Sidebar - 1 column */}
  <aside className="space-y-6 print:hidden">
    <SheikhProfileCard />
    {/* آخر الدروس */}
    <NewsletterCard />
  </aside>
</div>
```

**الملف المعدل:**
- `app/(public)/dars/[id]/page.tsx` (سطور 167-421)

**التغييرات:**
- تحويل من single column إلى grid 3 columns
- Main content يأخذ 2 columns
- Sidebar يأخذ 1 column
- إضافة `print:hidden` للـ sidebar

---

## 8. تغيير الدروس ذات الصلة إلى آخر الدروس

**السؤال:** تغيير "دروس ذات صلة" في صفحة الدرس إلى "آخر الدروس" (عالمياً)

**التفاصيل:**

**قبل:**
```tsx
// Query يفلتر حسب lesson_type
const { data: relatedLessonsData } = await supabase
  .from("lessons")
  .select("*")
  .eq("lesson_type", lesson.lesson_type)
  .neq("id", lesson.id)
  .limit(4)
```

**بعد:**
```tsx
// Query يجلب آخر الدروس بدون فلتر
const { data: relatedLessonsData } = await supabase
  .from("lessons")
  .select("*")
  .neq("id", lesson.id)
  .order("created_at", { ascending: false })
  .limit(4)
```

**الملف المعدل:**
- `app/(public)/dars/[id]/page.tsx`
  - سطور 49-58: تعديل الـ query
  - سطر 370: تغيير العنوان من "دروس ذات صلة" إلى "آخر الدروس"

---

## 9. حذف الملفات من B2 عند حذف العناصر

**السؤال:** عند حذف أي عنصر من الموقع، الملفات تبقى على السحابة (B2) مما يسبب تراكم

**التفاصيل:**

### ملف جديد: `app/api/storage/delete/route.ts`
```tsx
import { deleteFromB2 } from "@/lib/storage/b2"

export async function DELETE(request: NextRequest) {
  const fileKey = searchParams.get("key")
  
  // فقط ملفات uploads/ للأمان
  if (!decodedKey.startsWith("uploads/")) {
    return NextResponse.json({ error: "مسار غير صالح" }, { status: 400 })
  }
  
  const result = await deleteFromB2(decodedKey)
  return NextResponse.json({ success: result.success })
}
```

### تعديل: `lib/storage/b2.ts`
```tsx
import { DeleteObjectCommand } from "@aws-sdk/client-s3"

export async function deleteFromB2(key: string): Promise<{ success: boolean; error?: string }> {
  const client = getClient()
  await client.send(new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  }))
  return { success: true }
}
```

### تعديل دوال الحذف في Admin Pages:

**نموذج الكود الجديد:**
```tsx
const handleDelete = async (id: string) => {
  if (!confirm("هل أنت متأكد؟")) return
  
  // 1. جلب العنصر لمعرفة مسارات الملفات
  const { data: item } = await supabase
    .from("table_name")
    .select("file_path_1, file_path_2")
    .eq("id", id)
    .single()
  
  // 2. حذف الملفات من B2
  if (item) {
    if (item.file_path_1?.startsWith("uploads/")) {
      await fetch(`/api/storage/delete?key=${encodeURIComponent(item.file_path_1)}`, { method: 'DELETE' })
    }
    if (item.file_path_2?.startsWith("uploads/")) {
      await fetch(`/api/storage/delete?key=${encodeURIComponent(item.file_path_2)}`, { method: 'DELETE' })
    }
  }
  
  // 3. حذف السجل من قاعدة البيانات
  await supabase.from("table_name").delete().eq("id", id)
}
```

**الصفحات المعدلة:**
| الصفحة | الملفات المحذوفة من B2 |
|--------|------------------------|
| `app/admin/books/page.tsx` | `cover_image_path`, `pdf_file_path` |
| `app/admin/khutba/page.tsx` | `audio_url`, `thumbnail_path` |
| `app/admin/dars/page.tsx` | `media_url`, `thumbnail_path` |
| `app/admin/articles/page.tsx` | `featured_image`, `thumbnail` |
| `app/admin/videos/page.tsx` | `thumbnail`, `url` |
| `app/admin/media/page.tsx` | `url_or_path` |

---

## 10. تحميل الملفات باسم العنوان

**السؤال:** عند تحميل كتاب أو صوت، الملف يحمل باسم عشوائي بدلاً من عنوان الكتاب

**التفاصيل:**

### تعديل: `app/api/download/route.ts`
```tsx
// سطر 117-118
const customFilename = searchParams.get("filename")
const fileName = customFilename || decodedFileKey.split('/').pop() || 'download.pdf'

// Content-Disposition header
'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`
```

### تعديل: `app/(public)/books/[id]/page.tsx`
```tsx
const getPdfUrl = (book: any) => {
  if (!book) return ""
  
  // إنشاء اسم ملف آمن من عنوان الكتاب
  const safeFilename = book.title ? `${book.title}.pdf` : 'download.pdf'
  
  if (book.pdf_file_path?.startsWith("uploads/")) {
    return `/api/download?key=${encodeURIComponent(book.pdf_file_path)}&download=true&filename=${encodeURIComponent(safeFilename)}`
  }
  // ... باقي الحالات
}
```

**الملفات المعدلة:**
- `app/api/download/route.ts` - إضافة دعم filename parameter
- `app/(public)/books/[id]/page.tsx` - إرسال عنوان الكتاب كـ filename

---

## ملخص كامل للملفات

### ملفات جديدة (Created)
| الملف | الوصف |
|-------|-------|
| `components/sheikh-profile-card.tsx` | كارت بروفايل الشيخ |
| `components/newsletter-card.tsx` | كارت النشرة البريدية |
| `app/api/storage/delete/route.ts` | API لحذف ملفات B2 |

### ملفات معدلة (Modified)
| الملف | التغييرات |
|-------|----------|
| `lib/storage/b2.ts` | إضافة `deleteFromB2` function |
| `hooks/use-signed-url.ts` | إصلاح معالجة المسارات المحلية |
| `components/audio-player.tsx` | تحسين أداء التشغيل |
| `app/api/download/route.ts` | دعم filename parameter |
| `app/(public)/dars/[id]/page.tsx` | breadcrumb + layout + audio fix |
| `app/(public)/khutba/[id]/page.tsx` | breadcrumb + reusable cards |
| `app/(public)/articles/[id]/page.tsx` | breadcrumb + reusable cards |
| `app/(public)/videos/[id]/page.tsx` | breadcrumb + share button |
| `app/(public)/books/[id]/page.tsx` | breadcrumb + filename download |
| `app/admin/books/page.tsx` | B2 file deletion |
| `app/admin/khutba/page.tsx` | B2 file deletion |
| `app/admin/dars/page.tsx` | B2 file deletion |
| `app/admin/articles/page.tsx` | B2 file deletion |
| `app/admin/videos/page.tsx` | B2 file deletion |
| `app/admin/media/page.tsx` | B2 file deletion |
#   i m a m - n e t l i f y  
 