import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [
        failedLoginsResult,
        lockedAccountsResult,
        recentLoginsResult,
        loginStatsResult,
    ] = await Promise.all([
        // Recent failed login attempts
        query(`
      SELECT al.id, al.description, al.ip_address, al.created_at,
             u.name AS user_name, u.email AS user_email
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.action = 'login_failed'
      ORDER BY al.created_at DESC
      LIMIT 50
    `),
        // Locked accounts
        query(`
      SELECT id, name, email, role, locked_at, failed_login_count, last_failed_login_at
      FROM users
      WHERE is_locked = true
      ORDER BY locked_at DESC
    `),
        // Recent successful logins
        query(`
      SELECT al.id, al.ip_address, al.created_at, al.details,
             u.name AS user_name, u.email AS user_email, u.role AS user_role
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.action = 'login_success'
      ORDER BY al.created_at DESC
      LIMIT 30
    `),
        // Login stats
        query(`
      SELECT
        COUNT(*) FILTER (WHERE action = 'login_success' AND created_at >= NOW() - INTERVAL '24 hours') AS logins_today,
        COUNT(*) FILTER (WHERE action = 'login_failed' AND created_at >= NOW() - INTERVAL '24 hours') AS failed_today,
        COUNT(*) FILTER (WHERE action = 'login_failed' AND created_at >= NOW() - INTERVAL '7 days') AS failed_week,
        (SELECT COUNT(*) FROM users WHERE is_locked = true) AS locked_accounts,
        (SELECT COUNT(*) FROM users WHERE is_active = true) AS active_accounts
      FROM activity_logs
    `),
    ])

    return NextResponse.json({
        failedLogins: failedLoginsResult,
        lockedAccounts: lockedAccountsResult,
        recentLogins: recentLoginsResult,
        stats: loginStatsResult[0],
    })
}

export async function PATCH(req: NextRequest) {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, action } = await req.json()
    if (!userId || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    if (action === 'unlock') {
        await query(
            `UPDATE users SET is_locked = false, failed_login_count = 0, locked_at = NULL
       WHERE id = $1`,
            [userId]
        )
        await query(
            `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description)
       VALUES ($1, 'account_unlocked', 'user', $2, 'Admin manually unlocked account')`,
            [session.sub, userId]
        )
    } else if (action === 'lock') {
        await query(
            `UPDATE users SET is_locked = true, locked_at = NOW() WHERE id = $1`,
            [userId]
        )
    }

    return NextResponse.json({ ok: true })
}
