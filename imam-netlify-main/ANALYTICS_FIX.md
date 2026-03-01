# Analytics Setup Instructions

## مشكلة: Dashboard لا يعرض عدد الزيارات

### الحل:

تم إصلاح المشكلة عن طريق:

1. **إضافة نظام تتبع الزيارات (Analytics Tracking)**
   - تم إنشاء component جديد `components/analytics-tracker.tsx` لتتبع زيارات الصفحات
   - تم إنشاء API endpoint جديد `/api/analytics/page-view` لحفظ بيانات الزيارات

2. **تصحيح الفترة الزمنية**
   - تم تغيير الفترة الزمنية من 90 يوم إلى 30 يوم في `app/admin/page.tsx` لتتطابق مع النص المعروض

3. **إعداد قاعدة البيانات**
   - يجب تشغيل الـ SQL script التالي في Supabase SQL Editor:
   
   ```bash
   # افتح Supabase Dashboard
   # اذهب إلى SQL Editor
   # قم بتشغيل محتوى الملف التالي:
   scripts/analytics_complete_setup.sql
   ```

4. **التأكد من عمل النظام**
   - بعد نشر التحديثات، قم بزيارة أي صفحة في الموقع
   - انتظر دقيقة واحدة
   - افتح Admin Dashboard وتحقق من عداد الزيارات

## ملاحظات مهمة:

- النظام لا يتتبع صفحات الـ Admin Panel أو الـ API routes
- يتم حفظ معرف الزائر (visitor_id) في localStorage للتمييز بين الزوار
- يتم جمع معلومات الجهاز والمتصفح ونظام التشغيل تلقائياً
- البيانات تُحفظ في جدول `analytics_visits` في Supabase

## الملفات المعدلة:

1. ✅ `app/admin/page.tsx` - تصحيح الفترة الزمنية
2. ✅ `components/analytics-tracker.tsx` - نظام التتبع الجديد
3. ✅ `app/api/analytics/page-view/route.ts` - API endpoint جديد
4. ✅ `app/layout.tsx` - إضافة AnalyticsTracker
5. ✅ `netlify.toml` - حل مشكلة Netlify secrets scanning

---

## مشكلة Netlify: Secrets Scanning

### المشكلة:
```
Secrets scanning found secrets in build.
Secret env var "CLOUDINARY_CLOUD_NAME"'s value detected
Secret env var "NEXT_PUBLIC_SUPABASE_URL"'s value detected
Secret env var "NEXT_PUBLIC_SUPABASE_ANON_KEY"'s value detected
```

### الحل:
تم إنشاء ملف `netlify.toml` مع التكوين التالي:

```toml
[build.environment]
  SECRETS_SCAN_OMIT_KEYS = "NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,CLOUDINARY_CLOUD_NAME"
```

هذا يخبر Netlify أن هذه المتغيرات هي **public** ومن الآمن ظهورها في الكود.

### لماذا هذا آمن؟
- `NEXT_PUBLIC_*` متغيرات مصممة لتكون public (تُستخدم في client-side code)
- `CLOUDINARY_CLOUD_NAME` هو اسم عام وليس secret
- المتغيرات الحساسة مثل `SUPABASE_SERVICE_ROLE_KEY` لا تظهر في الكود

---

## الخطوات التالية:

1. **قم بتشغيل SQL script في Supabase**:
   - افتح [Supabase Dashboard](https://supabase.com/dashboard)
   - اذهب إلى SQL Editor
   - انسخ محتوى `scripts/analytics_complete_setup.sql`
   - قم بتشغيله

2. **قم بعمل commit و push للتغييرات**:
   ```bash
   git add .
   git commit -m "Fix: Analytics tracking and Netlify secrets scanning"
   git push
   ```

3. **انتظر اكتمال الـ build على Netlify**

4. **تحقق من عمل النظام**:
   - قم بزيارة الموقع
   - افتح Admin Dashboard
   - تحقق من عداد الزيارات

---

تم بحمد الله! 🎉
