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
    const status = searchParams.get('status') || ''
    const gender = searchParams.get('gender') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 20
    const offset = (page - 1) * limit

    let conditions: string[] = [`u.role = 'reader'`]
    let params: any[] = []
    let idx = 1

    if (search) {
        conditions.push(`(u.name ILIKE $${idx} OR u.email ILIKE $${idx})`)
        params.push(`%${search}%`)
        idx++
    }
    if (status) { conditions.push(`u.approval_status = $${idx++}`); params.push(status) }
    if (gender) { conditions.push(`u.gender = $${idx++}`); params.push(gender) }

    const where = 'WHERE ' + conditions.join(' AND ')

    const q = `
    SELECT
      u.id, u.name, u.email, u.phone, u.is_active, u.created_at,
      u.approval_status, u.gender, u.city,
      u.full_name_triple, u.qualification, u.memorized_parts, u.years_of_experience,
      rp.rating, rp.total_reviews, rp.total_sessions_completed, rp.is_accepting_students,
      rsta.total_reviews_completed, rsta.total_sessions_completed AS sessions_done,
      rsta.average_session_rating, rsta.last_review_at
    FROM users u
    LEFT JOIN reader_profiles rp ON u.id = rp.user_id
    LEFT JOIN reader_stats rsta ON u.id = rsta.reader_id
    ${where}
    ORDER BY u.created_at DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `
    params.push(limit, offset)

    const countQuery = `SELECT COUNT(*) AS total FROM users u ${where}`

    const [readers, countResult] = await Promise.all([
        query(q, params),
        query(countQuery, params.slice(0, -2)),
    ])

    return NextResponse.json({
        readers,
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

    const body = await req.json()
    const { id, ...fields } = body
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const allowed = ['name', 'phone', 'city', 'gender', 'qualification', 'memorized_parts', 'years_of_experience', 'is_active']
    const setters: string[] = []
    const params: any[] = []
    let idx = 1

    for (const [k, v] of Object.entries(fields)) {
        if (allowed.includes(k)) { setters.push(`${k} = $${idx++}`); params.push(v) }
    }

    if (!setters.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

    setters.push(`updated_at = NOW()`)
    params.push(id)

    await query(`UPDATE users SET ${setters.join(', ')} WHERE id = $${idx} AND role = 'reader'`, params)

    return NextResponse.json({ ok: true })
}
