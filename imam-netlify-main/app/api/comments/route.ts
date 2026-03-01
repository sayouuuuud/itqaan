import { type NextRequest, NextResponse } from "next/server"
import { createPublicClient } from "@/lib/supabase/public"
import { createClient as createAuthClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

// GET - Fetch approved comments for content
export async function GET(request: NextRequest) {
  try {
    const supabase = createPublicClient()
    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get("contentId")
    const contentType = searchParams.get("contentType")

    if (!contentId || !contentType) {
      return NextResponse.json({ error: "contentId و contentType مطلوبان" }, { status: 400 })
    }

    const { data: comments, error } = await supabase
      .from("comments")
      .select("id, content_id, content_type, author_name, comment_text, created_at")
      .eq("content_id", contentId)
      .eq("content_type", contentType)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ comments: comments || [] })
  } catch (error) {
    console.error("[v0] Error fetching comments:", error)
    return NextResponse.json({ error: "حدث خطأ في جلب التعليقات" }, { status: 500 })
  }
}

// POST - Submit new comment (public)
export async function POST(request: NextRequest) {
  try {
    const supabase = createPublicClient()
    const body = await request.json()
    const { content_id, content_type, author_name, author_email, comment_text } = body

    // Validate required fields
    if (!content_id || !content_type || !author_name || !author_email || !comment_text) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(author_email)) {
      return NextResponse.json({ error: "البريد الإلكتروني غير صحيح" }, { status: 400 })
    }

    // Validate comment length
    if (comment_text.length < 10 || comment_text.length > 5000) {
      return NextResponse.json({ error: "يجب أن يكون التعليق بين 10 و 5000 حرف" }, { status: 400 })
    }

    const { data: comment, error } = await supabase
      .from("comments")
      .insert([
        {
          content_id,
          content_type,
          author_name,
          author_email,
          comment_text,
          is_approved: false,
          created_at: new Date().toISOString(),
        },
      ])
      .select("id, content_id, content_type, author_name, comment_text, created_at, is_approved")

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: "تم إرسال تعليقك بنجاح وسيتم مراجعته قبل النشر",
      comment,
    })
  } catch (error) {
    console.error("[v0] Error creating comment:", error)
    return NextResponse.json({ error: "حدث خطأ في إرسال التعليق" }, { status: 500 })
  }
}

// PATCH - Approve/Reject comment (admin only)
export async function PATCH(request: NextRequest) {
  try {
    // Require authenticated user (admin area).
    const supabaseAuth = await createAuthClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    // Use service role for moderation actions (bypasses RLS), but ONLY after auth.
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY غير مضبوط" }, { status: 500 })
    }

    const supabaseService = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      serviceKey
    )

    const body = await request.json()
    const { id, action } = body

    if (!id || !action) {
      return NextResponse.json({ error: "id و action مطلوبان" }, { status: 400 })
    }

    if (action === "approve") {
      const { data: comment, error } = await supabaseService
        .from("comments")
        .update({
          is_approved: true,
          approved_at: new Date().toISOString()
        })
        .eq("id", id)
        .select("id, content_id, content_type, author_name, comment_text, created_at, is_approved, approved_at")

      if (error) throw error

      return NextResponse.json({ success: true, comment })
    } else if (action === "reject") {
      const { error } = await supabaseService.from("comments").delete().eq("id", id)
      if (error) throw error

      return NextResponse.json({
        success: true,
        message: "تم حذف التعليق"
      })
    }

    return NextResponse.json({ error: "إجراء غير صحيح" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Error modifying comment:", error)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 })
  }
}

