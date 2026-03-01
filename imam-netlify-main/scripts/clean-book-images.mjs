// Script لتنظيف مسارات الصور في قاعدة البيانات
// يقوم بإصلاح URLs الخاطئة في cover_image_path

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ متغيرات البيئة مفقودة')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanBookImages() {
  console.log('🧹 بدء تنظيف مسارات الصور في الكتب...')

  try {
    // احصل على جميع الكتب
    const { data: books, error } = await supabase
      .from('books')
      .select('id, title, cover_image_path, cover_image')
      .not('cover_image_path', 'is', null)

    if (error) {
      console.error('❌ خطأ في استرجاع البيانات:', error)
      return
    }

    console.log(`📚 تم العثور على ${books.length} كتاب`)

    let fixedCount = 0

    for (const book of books) {
      let newPath = book.cover_image_path
      let needsUpdate = false

      console.log(`\n📖 كتاب: ${book.title}`)
      console.log(`   مسار حالي: ${book.cover_image_path}`)

      // إذا كان URL يحتوي على /api/download، استخرج الـ key الحقيقي
      if (book.cover_image_path.includes('/api/download?key=')) {
        try {
          const url = new URL(book.cover_image_path, 'http://localhost:3000')
          const encodedKey = url.searchParams.get('key')
          if (encodedKey) {
            newPath = decodeURIComponent(encodedKey)
            needsUpdate = true
            console.log(`   ✅ تم إصلاح: ${newPath}`)
          }
        } catch (e) {
          console.log(`   ❌ فشل في تحليل URL: ${e.message}`)
        }
      }
      // إذا كان URL كاملاً من B2، حوله إلى path فقط
      else if (book.cover_image_path.includes('backblazeb2.com')) {
        try {
          const url = new URL(book.cover_image_path)
          // استخراج المسار من URL
          const pathParts = url.pathname.split('/')
          // تخطي اسم البطاقة والأجزاء الأولى
          const uploadsIndex = pathParts.findIndex(part => part === 'uploads')
          if (uploadsIndex !== -1) {
            newPath = pathParts.slice(uploadsIndex).join('/')
            needsUpdate = true
            console.log(`   ✅ تم تحويل B2 URL إلى path: ${newPath}`)
          }
        } catch (e) {
          console.log(`   ❌ فشل في تحليل B2 URL: ${e.message}`)
        }
      }
      // تحقق من URLs أخرى مشبوهة
      else if (book.cover_image_path.startsWith('http') &&
               !book.cover_image_path.includes('backblazeb2.com') &&
               !book.cover_image_path.includes('localhost') &&
               !book.cover_image_path.includes('supabase')) {
        console.log(`   ⚠️ URL غير معروف: ${book.cover_image_path}`)
      }

      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('books')
          .update({ cover_image_path: newPath })
          .eq('id', book.id)

        if (updateError) {
          console.error(`   ❌ فشل في تحديث الكتاب ${book.id}:`, updateError)
        } else {
          console.log(`   ✅ تم تحديث الكتاب ${book.id}`)
          fixedCount++
        }
      } else {
        console.log(`   ℹ️ لا حاجة للتحديث`)
      }
    }

    console.log(`\n🎉 انتهى التنظيف! تم إصلاح ${fixedCount} كتاب`)

  } catch (error) {
    console.error('❌ خطأ عام:', error)
  }
}

// تشغيل التنظيف
cleanBookImages().catch(console.error)







