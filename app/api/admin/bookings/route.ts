import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { logAdminAction } from '@/lib/activity-log'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const readerId = searchParams.get('readerId') || ''
  const dateFrom = searchParams.get('dateFrom') || ''
  const dateTo = searchParams.get('dateTo') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20
  const offset = (page - 1) * limit

  let conditions: string[] = []
  let params: any[] = []
  let idx = 1

  if (status) { conditions.push(`b.status = $${idx++}`); params.push(status) }
  if (readerId) { conditions.push(`b.reader_id = $${idx++}`); params.push(readerId) }
  if (dateFrom) { conditions.push(`b.scheduled_at >= $${idx++}`); params.push(dateFrom) }
  if (dateTo) { conditions.push(`b.scheduled_at <= $${idx++}`); params.push(dateTo + 'T23:59:59Z') }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''

  const bookingsQuery = `
    SELECT
      b.id, b.scheduled_at, b.duration_minutes, b.end_time,
      b.status, b.meeting_link, b.meeting_platform,
      b.cancellation_reason, b.student_notes, b.reader_notes,
      b.created_at, b.cancelled_at,
      s.name AS student_name, s.email AS student_email,
      r.name AS reader_name, r.email AS reader_email,
      rec.surah_name
    FROM bookings b
    JOIN users s ON b.student_id = s.id
    JOIN users r ON b.reader_id = r.id
    LEFT JOIN recitations rec ON b.recitation_id = rec.id
    ${where}
    ORDER BY b.scheduled_at DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `
  params.push(limit, offset)

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM bookings b
    JOIN users s ON b.student_id = s.id
    JOIN users r ON b.reader_id = r.id
    ${where}
  `

  const statsQuery = `
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending') AS pending,
      COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed,
      COUNT(*) FILTER (WHERE status = 'completed') AS completed,
      COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
      COUNT(*) FILTER (WHERE status = 'no_show') AS no_show,
      COUNT(*) FILTER (WHERE scheduled_at::date = CURRENT_DATE) AS today
    FROM bookings
  `

  const [bookings, countResult, statsResult] = await Promise.all([
    query(bookingsQuery, params),
    query(countQuery, params.slice(0, -2)),
    query(statsQuery),
  ])

  return NextResponse.json({
    bookings,
    total: parseInt((countResult[0] as any)?.total || '0'),
    page,
    limit,
    stats: statsResult[0],
  })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { id, status, meeting_link, cancellation_reason } = body

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const fields: string[] = []
  const params: any[] = []
  let idx = 1

  if (status) { fields.push(`status = $${idx++}`); params.push(status) }
  if (meeting_link !== undefined) { fields.push(`meeting_link = $${idx++}`); params.push(meeting_link) }
  if (cancellation_reason) { fields.push(`cancellation_reason = $${idx++}`); params.push(cancellation_reason) }
  if (status === 'cancelled') { fields.push(`cancelled_at = NOW()`, `cancelled_by = $${idx++}`); params.push(session.sub) }

  if (!fields.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  fields.push(`updated_at = NOW()`)
  params.push(id)

  await query(
    `UPDATE bookings SET ${fields.join(', ')} WHERE id = $${idx}`,
    params
  )

  await logAdminAction({
    userId: session.sub,
    action: status ? `booking_${status}` : 'booking_updated',
    entityType: 'booking',
    entityId: id,
    description: `Admin updated booking ${id}`,
  })

  return NextResponse.json({ ok: true })
}
