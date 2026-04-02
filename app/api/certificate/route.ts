import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { transliterate, containsArabic } from "@/lib/transliterate"

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
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || (host ? `${protocol}://${host}` : "");
    enhancedCertificate.certificate_url = `${baseUrl}/c/${session.sub}`;
  }

  const latestRecitation = await queryOne<{ status: string }>(
    `SELECT status FROM recitations WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [session.sub]
  )

  const [universities, entities] = await Promise.all([
    query<{ name: string }>(`SELECT name FROM universities ORDER BY name ASC`),
    query<{ id: string, name: string }>(`SELECT id, name FROM authorized_entities ORDER BY name ASC`)
  ])

  return NextResponse.json({
    certificate: enhancedCertificate || null,
    certificateEnabled,
    recitationStatus: latestRecitation?.status || 'no_recitation',
    universities: universities.map(u => u.name),
    entities: entities
  })
}

// POST /api/certificate - save certificate data (including photo)
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !requireRole(session, ["student"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  // Verify student is eligible (mastered or session_booked)
  const latestRecitation = await queryOne<{ status: string }>(
    `SELECT status FROM recitations WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [session.sub]
  )

  const eligibleStatuses = ['mastered', 'session_booked']
  if (!latestRecitation || !eligibleStatuses.includes(latestRecitation.status)) {
    return NextResponse.json(
      { error: "يجب أن تكون قد أتممت الجلسة أو قراءتك متقنة لإصدار الشهادة" },
      { status: 403 }
    )
  }

  const { university, college, city, entity_id, entity_other, phone, age, certificate_photo_url } = await req.json()

  // Compute English name for certificate
  const rawName: string = session.name || ''
  const nameEn = containsArabic(rawName) ? transliterate(rawName) : rawName

  // Generate serial code if not already assigned
  const existing = await queryOne<{ serial_code: string | null }>(
    `SELECT serial_code FROM certificate_data WHERE student_id = $1`,
    [session.sub]
  )

  let serialCode = existing?.serial_code
  if (!serialCode) {
    // Get next sequence value
    const seqRow = await queryOne<{ nextval: bigint }>(
      `SELECT nextval('certificate_serial_seq') as nextval`
    )
    const seqNum = Number(seqRow?.nextval || 1)
    serialCode = `ITQ-MAK-${String(seqNum).padStart(8, '0')}`
  }

  // Upsert certificate data
  const result = await query(
    `INSERT INTO certificate_data
       (student_id, university, college, city, entity_id, entity_other, phone, age, certificate_photo_url, serial_code, name_en)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (student_id) DO UPDATE SET
       university          = COALESCE($2, certificate_data.university),
       college             = COALESCE($3, certificate_data.college),
       city                = COALESCE($4, certificate_data.city),
       entity_id           = COALESCE($5, certificate_data.entity_id),
       entity_other        = COALESCE($6, certificate_data.entity_other),
       phone               = COALESCE($7, certificate_data.phone),
       age                 = COALESCE($8, certificate_data.age),
       certificate_photo_url = COALESCE($9, certificate_data.certificate_photo_url),
       serial_code         = COALESCE($10, certificate_data.serial_code),
       name_en             = COALESCE($11, certificate_data.name_en),
       updated_at          = NOW()
     RETURNING *`,
    [
      session.sub,
      university || null,
      college || null,
      city || null,
      entity_id || null,
      entity_other || null,
      phone || null,
      age ? parseInt(age.toString()) : null,
      certificate_photo_url || null,
      serialCode,
      nameEn || null,
    ]
  )

  const { createNotificationForAdmins } = await import('@/lib/notifications')
  await createNotificationForAdmins({
    type: 'general',
    title: 'طلب شهادة جديد 🎓',
    message: `قام الطالب ${session.name} بتقديم طلب لإصدار شهادة إتقان.`,
    category: 'general',
    link: '/admin/certificates'
  })

  return NextResponse.json({ certificate: result[0] }, { status: 201 })
}
