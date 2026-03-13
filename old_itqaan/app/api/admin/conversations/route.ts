import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 20
    const offset = (page - 1) * limit

    const searchCondition = search
        ? `WHERE s.name ILIKE $1 OR r.name ILIKE $1`
        : ''
    const params: any[] = search ? [`%${search}%`, limit, offset] : [limit, offset]
    const limitIdx = search ? 2 : 1

    const q = `
    SELECT
      c.id, c.last_message_at, c.last_message_preview,
      c.unread_count_student, c.unread_count_reader, c.is_active,
      c.created_at,
      s.id AS student_id, s.name AS student_name, s.email AS student_email,
      r.id AS reader_id, r.name AS reader_name, r.email AS reader_email,
      (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS message_count
    FROM conversations c
    JOIN users s ON c.student_id = s.id
    JOIN users r ON c.reader_id = r.id
    ${searchCondition}
    ORDER BY c.last_message_at DESC NULLS LAST
    LIMIT $${limitIdx} OFFSET $${limitIdx + 1}
  `

    const countQuery = `
    SELECT COUNT(*) AS total FROM conversations c
    JOIN users s ON c.student_id = s.id
    JOIN users r ON c.reader_id = r.id
    ${searchCondition}
  `

    const [convos, countResult] = await Promise.all([
        query(q, params),
        query(countQuery, search ? [`%${search}%`] : []),
    ])

    return NextResponse.json({
        conversations: convos,
        total: parseInt((countResult[0] as any)?.total || '0'),
        page,
        limit,
    })
}

export async function PATCH(req: NextRequest) {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, is_active } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    await query(`UPDATE conversations SET is_active = $1, updated_at = NOW() WHERE id = $2`, [is_active, id])

    return NextResponse.json({ ok: true })
}
