import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { uploadToStorage, deleteFromStorage } from "@/lib/storage"

// POST /api/upload - upload audio or image file to UploadThing
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
    const isAudio = file.type.startsWith("audio/") || 
                    file.name.endsWith(".mp4") || 
                    file.name.endsWith(".m4a") ||
                    file.name.endsWith(".caf") ||
                    file.name.endsWith(".mov") ||
                    file.name.endsWith(".webm")

    const isImage = file.type.startsWith("image/")

    if (!isAudio && !isImage) {
      return NextResponse.json({ error: "نوع الملف غير مدعوم (صوت أو صورة فقط)" }, { status: 400 })
    }

    let finalBuffer: Buffer
    let finalFileName = file.name
    let finalContentType = file.type

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Convert WebM to MP4 if needed
    if (isAudio && (file.type === "audio/webm" || file.name.endsWith(".webm"))) {
      try {
        const { convertWebMToMP4 } = await import("@/lib/audio-converter")
        finalBuffer = await convertWebMToMP4(buffer)
        finalFileName = file.name.replace(/\.[^/.]+$/, "") + ".mp4"
        finalContentType = "audio/mp4"
        console.log(`[Upload] Converted ${file.name} to MP4`)
      } catch (convErr) {
        console.error("[Upload] Audio conversion failed, using original:", convErr)
        finalBuffer = buffer
      }
    } else {
      finalBuffer = buffer
    }

    // Validate file size (check after conversion just in case)
    const maxSizeAudio = 32 * 1024 * 1024 
    const maxSizeImage = 4 * 1024 * 1024  
    const maxSize = isAudio ? maxSizeAudio : maxSizeImage

    if (finalBuffer.length > maxSize) {
      const limit = isAudio ? "32MB" : "4MB"
      return NextResponse.json({ error: `حجم الملف يتجاوز ${limit}` }, { status: 400 })
    }

    // Upload to UploadThing
    const result = await uploadToStorage(finalBuffer, finalFileName, finalContentType)

    return NextResponse.json({
      url: result.url,
      audioUrl: isAudio ? result.url : undefined,
      imageUrl: isImage ? result.url : undefined,
      public_id: result.key, // Using 'key' as 'public_id' for backward compatibility
    }, { status: 201 })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "فشل رفع الملف" }, { status: 500 })
  }
}

// DELETE /api/upload - delete file from UploadThing
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const fileKey = searchParams.get("publicId") || searchParams.get("fileKey")

    if (!fileKey) {
      return NextResponse.json({ error: "معرف الملف مطلوب" }, { status: 400 })
    }

    // Attempt to delete from UploadThing
    await deleteFromStorage(fileKey)

    return NextResponse.json({ success: true, message: "تم الحذف بنجاح" })
  } catch (error) {
    console.error("Delete upload error:", error)
    return NextResponse.json({ error: "فشل حذف الملف" }, { status: 500 })
  }
}
