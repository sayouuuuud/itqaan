import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id } = await params

    const allowed = ['subject_ar', 'subject_en', 'body_ar', 'body_en', 'is_active']
    const setters: string[] = []
    const values: any[] = []
    let idx = 1

    for (const [k, v] of Object.entries(body)) {
        if (allowed.includes(k)) {
            setters.push(`${k} = $${idx++}`)
            values.push(v)
        }
    }

    if (!setters.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    setters.push(`updated_at = NOW()`)
    values.push(id)

    await query(
        `UPDATE email_templates SET ${setters.join(', ')} WHERE id = $${idx}`,
        values
    )

    return NextResponse.json({ ok: true })
}
