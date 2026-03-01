import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const audience = searchParams.get('audience') || ''
    const published = searchParams.get('published') || ''

    let conditions: string[] = []
    let params: any[] = []
    let idx = 1

    if (audience) { conditions.push(`target_audience = $${idx++}`); params.push(audience) }
    if (published === 'true') { conditions.push(`is_published = true`) }
    else if (published === 'false') { conditions.push(`is_published = false`) }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''

    const result = await query(
        `SELECT a.*, u.name AS created_by_name
     FROM announcements a
     LEFT JOIN users u ON a.created_by = u.id
     ${where}
     ORDER BY a.created_at DESC`,
        params
    )

    return NextResponse.json({ announcements: result })
}

export async function POST(req: NextRequest) {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title_ar, title_en, content_ar, content_en, target_audience, priority, expires_at, is_published } = body

    if (!title_ar || !content_ar || !target_audience) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await query(
        `INSERT INTO announcements
       (title_ar, title_en, content_ar, content_en, target_audience, priority, expires_at, is_published, published_at, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
        [
            title_ar, title_en || title_ar, content_ar, content_en || content_ar,
            target_audience, priority || 'normal', expires_at || null,
            !!is_published, is_published ? new Date() : null, session.sub
        ]
    )

    return NextResponse.json({ announcement: result[0] }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, ...fields } = body

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const setters: string[] = []
    const params: any[] = []
    let idx = 1

    const allowed = ['title_ar', 'title_en', 'content_ar', 'content_en', 'target_audience', 'priority', 'expires_at', 'is_published']
    for (const [k, v] of Object.entries(fields)) {
        if (allowed.includes(k)) { setters.push(`${k} = $${idx++}`); params.push(v) }
    }

    if (fields.is_published === true) { setters.push(`published_at = NOW()`) }
    setters.push(`updated_at = NOW()`)
    params.push(id)

    await query(`UPDATE announcements SET ${setters.join(', ')} WHERE id = $${idx}`, params)

    return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    await query(`DELETE FROM announcements WHERE id = $1`, [id])
    return NextResponse.json({ ok: true })
}
