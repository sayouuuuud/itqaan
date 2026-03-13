import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"

// GET /api/certificate - get student's certificate data
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !requireRole(session, ["student"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const certificateEnabled = true


  const certificate = await queryOne(
    `SELECT cd.*, u.name as student_name
     FROM certificate_data cd
     JOIN users u ON u.id = cd.student_id
     WHERE cd.student_id = $1
     ORDER BY cd.updated_at DESC
     LIMIT 1`,
    [session.sub]
  )

  let enhancedCertificate = certificate ? { ...certificate } : null;

  if (enhancedCertificate && enhancedCertificate.certificate_issued) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || (req.headers.get("host") ? `http://${req.headers.get("host")}` : "");
    enhancedCertificate.certificate_url = `${baseUrl}/c/${session.sub}`;
  }

  console.log('Certificate data for student', session.sub, ':', enhancedCertificate)

  // Check if student is mastered
  const latestRecitation = await queryOne<{ status: string }>(
    `SELECT status FROM recitations WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [session.sub]
  )

  return NextResponse.json({
    certificate: enhancedCertificate || null,
    certificateEnabled,
    isMastered: latestRecitation?.status === 'mastered'
  })
}

// POST /api/certificate - save certificate data
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !requireRole(session, ["student"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  // Verify student is mastered
  const latestRecitation = await queryOne<{ status: string }>(
    `SELECT status FROM recitations WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [session.sub]
  )

  if (latestRecitation?.status !== 'mastered') {
    return NextResponse.json(
      { error: "يجب أن تكون قراءتك متقنة لإصدار الشهادة" },
      { status: 403 }
    )
  }

  const { university, college, city, gender, pdfFileUrl } = await req.json()

  // Upsert certificate data
  const result = await query(
    `INSERT INTO certificate_data (student_id, university, college, city, gender, pdf_file_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (student_id) DO UPDATE SET
       university = COALESCE($2, certificate_data.university),
       college = COALESCE($3, certificate_data.college),
       city = COALESCE($4, certificate_data.city),
       gender = COALESCE($5, certificate_data.gender),
       pdf_file_url = COALESCE($6, certificate_data.pdf_file_url),
       updated_at = NOW()
     RETURNING *`,
    [session.sub, university || null, college || null, city || null, gender || null, pdfFileUrl || null]
  )

  return NextResponse.json({ certificate: result[0] }, { status: 201 })
}
