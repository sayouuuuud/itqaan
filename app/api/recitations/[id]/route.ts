import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"

// GET /api/recitations/:id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const { id } = await params

    const recitation = await queryOne(
      `SELECT r.*, 
              s.name as student_name, s.email as student_email,
              rd.name as reader_name
       FROM recitations r
       LEFT JOIN users s ON r.student_id = s.id
       LEFT JOIN users rd ON r.assigned_reader_id = rd.id
       WHERE r.id = $1`,
      [id]
    )

    if (!recitation) return NextResponse.json({ error: "التلاوة غير موجودة" }, { status: 404 })

    // Get reviews for this recitation
    const reviews = await query(
      `SELECT rv.*, u.name as reviewer_name
       FROM reviews rv
       JOIN users u ON rv.reader_id = u.id
       WHERE rv.recitation_id = $1
       ORDER BY rv.created_at DESC`,
      [id]
    )

    return NextResponse.json({ recitation, reviews })
  } catch (error) {
    console.error("Get recitation error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}

// PATCH /api/recitations/:id - update status or assign reader
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const { id } = await params
    const body = await req.json()

    const updates: string[] = []
    const values: unknown[] = []

    if (body.status) {
      values.push(body.status)
      updates.push(`status = $${values.length}`)
    }

    if (body.assignedReaderId) {
      values.push(body.assignedReaderId)
      updates.push(`assigned_reader_id = $${values.length}`)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "لا توجد بيانات للتحديث" }, { status: 400 })
    }

    values.push(id)
    const result = await query(
      `UPDATE recitations SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`,
      values
    )

    return NextResponse.json({ recitation: result[0] })
  } catch (error) {
    console.error("Update recitation error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}

// DELETE /api/recitations/:id - delete a recitation
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const { id } = await params

    // Fetch the recitation first to determine if the user owns it and get the audio_url
    const recitation = await queryOne<{ student_id: string, audio_url: string, status: string }>(
      `SELECT student_id, audio_url, status FROM recitations WHERE id = $1`,
      [id]
    )

    if (!recitation) return NextResponse.json({ error: "التلاوة غير موجودة" }, { status: 404 })

    // Ensure only the student who created it can delete it
    if (recitation.student_id !== session.sub) {
      return NextResponse.json({ error: "غير مصرح بحذف هذه التلاوة" }, { status: 403 })
    }

    // Determine the public_id from the Cloudinary URL if present
    if (recitation.audio_url && recitation.audio_url.includes("cloudinary.com")) {
      try {
        // Extract public_id from Cloudinary URL:
        // e.g. https://res.cloudinary.com/cloud_name/video/upload/v12345/itqaan/recitations/user_123.webm -> itqaan/recitations/user_123
        const parts = recitation.audio_url.split('/upload/')
        if (parts.length === 2) {
          const pathParts = parts[1].split('/')
          pathParts.shift() // Remove the version (v12345)
          const publicIdWithExt = pathParts.join('/')
          const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.')) || publicIdWithExt

          // Delete from Cloudinary using our helper function
          const { deleteFromCloudinary } = await import("@/lib/cloudinary")
          await deleteFromCloudinary(publicId, "video")
        }
      } catch (cloudinaryError) {
        console.error("Failed to delete from Cloudinary, proceeding with DB delete:", cloudinaryError)
      }
    }

    // Delete DB record
    await query(`DELETE FROM recitations WHERE id = $1`, [id])

    return NextResponse.json({ success: true, message: "تم حذف التلاوة بنجاح" })
  } catch (error) {
    console.error("Delete recitation error:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء الحذف" }, { status: 500 })
  }
}
