import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary"

// POST /api/upload - upload audio or image file to Cloudinary
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const formData = await req.formData()

    // Support both 'audio' and 'image' field names
    const file = (formData.get("audio") || formData.get("image") || formData.get("file")) as File | null
    const folder = (formData.get("folder") as string) || "uploads"

    if (!file) {
      return NextResponse.json({ error: "لم يتم تحميل ملف" }, { status: 400 })
    }

    // Validate file type
    const isAudio = file.type.startsWith("audio/")
    const isImage = file.type.startsWith("image/")

    if (!isAudio && !isImage) {
      return NextResponse.json({ error: "نوع الملف غير مدعوم (صوت أو صورة فقط)" }, { status: 400 })
    }

    // Validate file size
    const maxSizeAudio = 30 * 1024 * 1024 // 30MB for audio
    const maxSizeImage = 5 * 1024 * 1024  // 5MB for image
    const maxSize = isAudio ? maxSizeAudio : maxSizeImage

    if (file.size > maxSize) {
      const limit = isAudio ? "30MB" : "5MB"
      return NextResponse.json({ error: `حجم الملف يتجاوز ${limit}` }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate a meaningful public_id: userId_timestamp
    const ext = file.name.split(".").pop() || (isAudio ? "webm" : "jpg")
    const timestamp = Date.now()
    const publicId = `${session.sub}_${timestamp}`

    // Upload to Cloudinary
    const result = await uploadToCloudinary(buffer, {
      folder: `itqaan/${folder}`,
      resource_type: isAudio ? "video" : "image", // Cloudinary uses 'video' for audio files
      public_id: publicId,
    })

    return NextResponse.json({
      url: result.url,
      audioUrl: isAudio ? result.url : undefined,
      imageUrl: isImage ? result.url : undefined,
      public_id: result.public_id,
    }, { status: 201 })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "فشل رفع الملف" }, { status: 500 })
  }
}

// DELETE /api/upload - delete audio or image file from Cloudinary
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const publicId = searchParams.get("publicId")
    const resourceType = searchParams.get("resourceType") as "image" | "video" | "raw" || "video"

    if (!publicId) {
      return NextResponse.json({ error: "معرف الملف مطلوب" }, { status: 400 })
    }

    // Attempt to delete from Cloudinary
    await deleteFromCloudinary(publicId, resourceType)

    return NextResponse.json({ success: true, message: "تم الحذف بنجاح" })
  } catch (error) {
    console.error("Delete upload error:", error)
    return NextResponse.json({ error: "فشل حذف الملف" }, { status: 500 })
  }
}
