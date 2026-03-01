"use client"

import { useState, useEffect } from 'react'

/**
 * Hook لجلب URL الموقع
 * 
 * بعد الترحيل من B2 إلى UploadThing/Cloudinary:
 * - UploadThing و Cloudinary يوفران URLs مباشرة لا تحتاج توقيع
 * - هذا الـ hook يُرجع الـ URL مباشرة بدون أي تعديل
 * - تم الاحتفاظ به للتوافق مع الكود القديم
 */
export function useSignedUrl(path: string | null) {
    const [signedUrl, setSignedUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!path) {
            setSignedUrl(null)
            setLoading(false)
            return
        }

        // إذا كان URL كامل (من UploadThing أو Cloudinary أو أي مصدر خارجي)
        // أرجعه مباشرة بدون تعديل
        if (path.startsWith('http://') || path.startsWith('https://')) {
            setSignedUrl(path)
            setLoading(false)
            return
        }

        // للمسارات القديمة التي لا تزال تبدأ بـ uploads/
        // (للتوافق مع البيانات القديمة إن وجدت)
        if (path.startsWith('uploads/')) {
            // يمكن للمستخدم تحديث هذه المسارات يدوياً
            console.warn('⚠️ مسار قديم من B2 تم الكشف عنه:', path)
            setSignedUrl(null)
            setError('مسار قديم - يرجى تحديث الملف')
            setLoading(false)
            return
        }

        // أي مسار آخر
        setSignedUrl(path)
        setLoading(false)
    }, [path])

    return { signedUrl, loading, error }
}
