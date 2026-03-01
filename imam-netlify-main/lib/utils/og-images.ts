/**
 * مساعدات لإدارة صور المعاينة (Open Graph images)
 */


const DEFAULT_OG_IMAGE = "/og-default.jpg"
const SITE_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://elsayed-mourad.online"

/**
 * الحصول على صورة المعاينة المناسبة للكتاب
 */
export function getBookOgImage(book: any): { url: string; width?: number; height?: number; alt: string } {
  let imageUrl = ""

  // محاولة الحصول على صورة الغلاف
  if (book.cover_image_path?.includes('/api/download?key=')) {
    try {
      const url = new URL(book.cover_image_path, 'http://localhost:3000')
      const encodedKey = url.searchParams.get('key')
      if (encodedKey) {
        imageUrl = `${SITE_BASE_URL}/api/download?key=${encodeURIComponent(decodeURIComponent(encodedKey))}`
      }
    } catch (e) {
      // تجاهل الخطأ
    }
  }

  if (!imageUrl && book.cover_image_path?.startsWith("uploads/")) {
    imageUrl = `${SITE_BASE_URL}/api/download?key=${encodeURIComponent(book.cover_image_path)}`
  }

  if (!imageUrl && book.cover_image_path?.startsWith("http")) {
    imageUrl = book.cover_image_path
  }

  if (!imageUrl && book.cover_image) {
    imageUrl = book.cover_image.startsWith("http") ? book.cover_image : `${SITE_BASE_URL}/${book.cover_image}`
  }

  // استخدام الصورة الافتراضية إذا لم تكن هناك صورة
  if (!imageUrl) {
    imageUrl = `${SITE_BASE_URL}${DEFAULT_OG_IMAGE}`
  }

  return {
    url: imageUrl,
    width: 1200,
    height: 630,
    alt: `${book.title} - غلاف الكتاب`
  }
}

/**
 * الحصول على صورة المعاينة المناسبة للخطبة
 */
export function getSermonOgImage(sermon: any): { url: string; width?: number; height?: number; alt: string } {
  let imageUrl = ""

  // محاولة الحصول على الصورة المصغرة
  if (sermon.thumbnail_path?.startsWith("uploads/")) {
    imageUrl = `${SITE_BASE_URL}/api/download?key=${encodeURIComponent(sermon.thumbnail_path)}`
  }

  if (!imageUrl && sermon.thumbnail?.startsWith("uploads/")) {
    imageUrl = `${SITE_BASE_URL}/api/download?key=${encodeURIComponent(sermon.thumbnail)}`
  }

  if (!imageUrl && sermon.thumbnail_path?.startsWith("http")) {
    imageUrl = sermon.thumbnail_path
  }

  if (!imageUrl && sermon.thumbnail?.startsWith("http")) {
    imageUrl = sermon.thumbnail
  }

  // استخدام الصورة الافتراضية إذا لم تكن هناك صورة
  if (!imageUrl) {
    imageUrl = `${SITE_BASE_URL}${DEFAULT_OG_IMAGE}`
  }

  return {
    url: imageUrl,
    width: 1200,
    height: 630,
    alt: `${sermon.title} - صورة الخطبة`
  }
}

/**
 * الحصول على صورة المعاينة المناسبة للفيديو
 */
export function getVideoOgImage(video: any): { url: string; width?: number; height?: number; alt: string } {
  let imageUrl = ""

  // محاولة الحصول على الصورة المصغرة
  if (video.thumbnail?.startsWith("uploads/")) {
    imageUrl = `${SITE_BASE_URL}/api/download?key=${encodeURIComponent(video.thumbnail)}`
  }

  // للفيديوهات من يوتيوب
  if (!imageUrl && video.source === "youtube" && video.url) {
    const videoId = video.url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^"&?/\s]{11})/)?.[1]
    if (videoId) {
      imageUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    }
  }

  if (!imageUrl && video.thumbnail?.startsWith("http")) {
    imageUrl = video.thumbnail
  }

  // استخدام الصورة الافتراضية إذا لم تكن هناك صورة
  if (!imageUrl) {
    imageUrl = `${SITE_BASE_URL}${DEFAULT_OG_IMAGE}`
  }

  return {
    url: imageUrl,
    width: 1200,
    height: 630,
    alt: `${video.title} - صورة الفيديو`
  }
}

/**
 * الحصول على صورة المعاينة المناسبة للدرس
 */
export function getLessonOgImage(lesson: any): { url: string; width?: number; height?: number; alt: string } {
  let imageUrl = ""

  // محاولة الحصول على الصورة المصغرة
  if (lesson.thumbnail_path?.startsWith("uploads/")) {
    imageUrl = `${SITE_BASE_URL}/api/download?key=${encodeURIComponent(lesson.thumbnail_path)}`
  }

  if (!imageUrl && lesson.thumbnail?.startsWith("uploads/")) {
    imageUrl = `${SITE_BASE_URL}/api/download?key=${encodeURIComponent(lesson.thumbnail)}`
  }

  if (!imageUrl && lesson.thumbnail_path?.startsWith("http")) {
    imageUrl = lesson.thumbnail_path
  }

  if (!imageUrl && lesson.thumbnail?.startsWith("http")) {
    imageUrl = lesson.thumbnail
  }

  // استخدام الصورة الافتراضية إذا لم تكن هناك صورة
  if (!imageUrl) {
    imageUrl = `${SITE_BASE_URL}${DEFAULT_OG_IMAGE}`
  }

  return {
    url: imageUrl,
    width: 1200,
    height: 630,
    alt: `${lesson.title} - صورة الدرس`
  }
}

/**
 * الحصول على صورة المعاينة المناسبة للمقالة
 */
export function getArticleOgImage(article: any): { url: string; width?: number; height?: number; alt: string } {
  let imageUrl = ""

  // محاولة الحصول على الصورة المميزة للمقالة
  if (article.featured_image?.startsWith("uploads/")) {
    imageUrl = `${SITE_BASE_URL}/api/download?key=${encodeURIComponent(article.featured_image)}`
  }

  if (!imageUrl && article.image?.startsWith("uploads/")) {
    imageUrl = `${SITE_BASE_URL}/api/download?key=${encodeURIComponent(article.image)}`
  }

  if (!imageUrl && article.featured_image?.startsWith("http")) {
    imageUrl = article.featured_image
  }

  if (!imageUrl && article.image?.startsWith("http")) {
    imageUrl = article.image
  }

  // استخدام الصورة الافتراضية إذا لم تكن هناك صورة
  if (!imageUrl) {
    imageUrl = `${SITE_BASE_URL}${DEFAULT_OG_IMAGE}`
  }

  return {
    url: imageUrl,
    width: 1200,
    height: 630,
    alt: `${article.title} - صورة المقالة`
  }
}

/**
 * الحصول على الصورة الافتراضية للموقع
 */
export function getDefaultOgImage(): { url: string; width?: number; height?: number; alt: string } {
  return {
    url: `${SITE_BASE_URL}${DEFAULT_OG_IMAGE}`,
    width: 1200,
    height: 630,
    alt: "الشيخ السيد مراد سلامة - عالم أزهري"
  }
}





