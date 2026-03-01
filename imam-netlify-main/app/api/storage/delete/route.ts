import { type NextRequest, NextResponse } from "next/server"
import { deleteFromCloudinary, deleteFromCloudinaryByUrl } from "@/lib/storage/cloudinary"

export const runtime = "nodejs"

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileUrl = searchParams.get("url")
    const publicId = searchParams.get("publicId")

    console.log('🗑️ Storage Delete API called:', { fileUrl, publicId })

    // حذف من Cloudinary باستخدام publicId
    if (publicId) {
      // تحديد نوع المورد من الـ publicId
      let resourceType: 'image' | 'video' | 'raw' = 'raw'
      if (publicId.includes('/books/covers/') || publicId.includes('/articles/') || publicId.includes('/images/')) {
        resourceType = 'image'
      } else if (publicId.includes('/audios/') || publicId.includes('/lessons/audios/') || publicId.includes('/sermons/')) {
        resourceType = 'raw' // Audio files uploaded as raw
      }

      const result = await deleteFromCloudinary(publicId, resourceType)

      if (result.success) {
        console.log('✅ File deleted from Cloudinary:', publicId)
        return NextResponse.json({ success: true })
      } else {
        console.error('❌ Failed to delete from Cloudinary:', publicId, result.error)
        return NextResponse.json({ error: result.error }, { status: 500 })
      }
    }

    // حذف من Cloudinary باستخدام URL كامل
    if (fileUrl && fileUrl.includes('cloudinary.com')) {
      const result = await deleteFromCloudinaryByUrl(fileUrl)

      if (result.success) {
        console.log('✅ File deleted from Cloudinary by URL:', fileUrl)
        return NextResponse.json({ success: true })
      } else {
        console.error('❌ Failed to delete from Cloudinary by URL:', fileUrl, result.error)
        // Don't return error - file might already be deleted
        return NextResponse.json({ success: true, warning: result.error })
      }
    }

    // للملفات من UploadThing - لا يمكن حذفها عبر API بدون مفتاح خاص
    if (fileUrl && (fileUrl.includes('utfs.io') || fileUrl.includes('uploadthing'))) {
      console.log('⚠️ UploadThing files cannot be deleted via API')
      return NextResponse.json({
        success: true,
        warning: 'ملفات UploadThing لا يمكن حذفها تلقائياً'
      })
    }

    // للمسارات القديمة من B2 (للتوافق)
    if (fileUrl?.startsWith('uploads/')) {
      console.warn('⚠️ Old B2 path detected, skipping delete:', fileUrl)
      return NextResponse.json({
        success: true,
        warning: 'مسار قديم من B2'
      })
    }

    return NextResponse.json({ error: "مطلوب publicId أو url" }, { status: 400 })
  } catch (error: any) {
    console.error("Error in storage delete API:", error)
    return NextResponse.json({ error: "فشل حذف الملف" }, { status: 500 })
  }
}
