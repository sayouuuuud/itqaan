import { type NextRequest, NextResponse } from "next/server"
import { createPublicClient } from "@/lib/supabase/public"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, telegram, name } = body

    // Validate - at least one contact method required
    if (!phone && !telegram) {
      return NextResponse.json({ error: "يرجى إدخال رقم واتساب أو معرف تيليجرام" }, { status: 400 })
    }

    // Validate phone number format if provided
    if (phone) {
      const phoneRegex = /^[0-9+]{8,15}$/
      if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
        return NextResponse.json({ error: "رقم الواتساب غير صحيح" }, { status: 400 })
      }
    }

    // Validate telegram username if provided
    if (telegram) {
      const telegramRegex = /^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/
      if (!telegramRegex.test(telegram)) {
        return NextResponse.json({ error: "معرف التيليجرام غير صحيح" }, { status: 400 })
      }
    }

    const supabase = createPublicClient()
    const { data: subscriber, error } = await supabase
      .from("subscribers")
      .insert({
        phone: phone || null,
        telegram: telegram || null,
        email: null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "هذا الرقم/المعرف مسجل بالفعل" }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      message: "تم الاشتراك بنجاح! شكراً لانضمامك",
      subscriber,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "حدث خطأ في الاشتراك"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

