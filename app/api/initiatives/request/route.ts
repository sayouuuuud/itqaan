import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { createNotificationForAdmins } from "@/lib/notifications"

const VALID_TYPES = ["university", "ministry", "restaurant", "cafe", "other"]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name,
      type,
      description,
      contactName,
      contactEmail,
      contactPhone,
      targetStudentsCount,
    } = body

    if (!name || !contactName || !contactEmail) {
      return NextResponse.json(
        { error: "اسم الجهة واسم وبريد مسؤول التواصل مطلوبة" },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(contactEmail)) {
      return NextResponse.json({ error: "البريد الإلكتروني غير صحيح" }, { status: 400 })
    }

    const safeType = type && VALID_TYPES.includes(type) ? type : "other"
    const target =
      targetStudentsCount && Number.isFinite(Number(targetStudentsCount))
        ? Math.max(0, Math.floor(Number(targetStudentsCount)))
        : null

    const rows = await query<{ id: string; name: string }>(
      `INSERT INTO initiatives
        (name, type, description, contact_name, contact_email, contact_phone, target_students_count, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING id, name`,
      [
        name,
        safeType,
        description || null,
        contactName,
        contactEmail.toLowerCase(),
        contactPhone || null,
        target,
      ]
    )

    const created = rows[0]

    await createNotificationForAdmins({
      type: "general",
      title: "طلب مبادرة جديد",
      message: `وصل طلب انضمام مبادرة جديدة: "${name}" بانتظار المراجعة.`,
      category: "general",
      link: created ? `/admin/initiatives/${created.id}` : "/admin/initiatives",
    })

    return NextResponse.json(
      {
        success: true,
        message: "تم استلام طلبك بنجاح، سيتم التواصل معك بعد مراجعة الإدارة.",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Initiative request error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
