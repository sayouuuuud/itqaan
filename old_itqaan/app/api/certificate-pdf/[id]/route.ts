import { NextResponse } from "next/server"
import { getCertificateHtml } from "@/lib/pdf-html"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const html = await getCertificateHtml(id)

    if (!html) {
      return NextResponse.json({ error: "Certificate not found or not issued" }, { status: 404 })
    }

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error) {
    console.error("Generate certificate HTML error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
