import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import * as db from '@/lib/db'

export async function GET(req: Request) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const query = searchParams.get('q') || ''

        if (!query) {
            return NextResponse.json({ users: [] })
        }

        // Search users + quick metrics
        const users = await db.query<any>(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role,
        u.avatar_url,
        (SELECT COUNT(*) FROM recitations WHERE student_id = u.id) as total_recitations,
        (SELECT COUNT(*) FROM bookings WHERE (student_id = u.id OR reader_id = u.id) AND status = 'completed') as total_sessions
      FROM users u
      WHERE (u.name ILIKE $1 OR u.email ILIKE $1)
      ORDER BY u.created_at DESC
      LIMIT 10
    `, [`%${query}%`])

        return NextResponse.json({ users })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
