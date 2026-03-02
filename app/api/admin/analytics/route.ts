import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import crypto from 'crypto'

function getDeviceType(ua: string): 'mobile' | 'tablet' | 'desktop' | 'bot' | 'unknown' {
    if (!ua) return 'unknown'
    const uaL = ua.toLowerCase()
    if (/bot|crawl|spider|slurp|facebookexternalhit/i.test(uaL)) return 'bot'
    if (/tablet|ipad|kindle|playbook/i.test(uaL)) return 'tablet'
    if (/mobile|iphone|android.*phone|windows phone/i.test(uaL)) return 'mobile'
    return 'desktop'
}

function hashIp(ip: string): string {
    return crypto.createHash('sha256').update(ip + 'itqaan_salt').digest('hex').substring(0, 16)
}

export async function POST(req: NextRequest) {
    try {
        const { path, referrer, userId } = await req.json()
        const ua = req.headers.get('user-agent') || ''
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || ''
        const country = req.headers.get('x-vercel-ip-country') ||
            req.headers.get('cf-ipcountry') ||
            (req as any).geo?.country || null

        await query(
            `INSERT INTO page_views (path, country, device_type, user_agent, ip_hash, user_id, referrer)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                path || '/',
                country,
                getDeviceType(ua),
                ua.substring(0, 500),
                ip ? hashIp(ip) : null,
                userId || null,
                referrer || null,
            ]
        )
        return NextResponse.json({ ok: true })
    } catch {
        return NextResponse.json({ ok: false })
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const days = Math.min(Math.max(parseInt(searchParams.get('days') || '30') || 30, 1), 365)

        const [
            overviewResult,
            overTimeResult,
            topPagesResult,
            topCountriesResult,
            deviceTypesResult,
        ] = await Promise.all([
            query(`
        SELECT
          COUNT(*) AS total_views,
          COUNT(DISTINCT ip_hash) AS unique_visitors,
          COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) AS today_views,
          COUNT(DISTINCT ip_hash) FILTER (WHERE created_at::date = CURRENT_DATE) AS today_visitors,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS week_views,
          COUNT(DISTINCT ip_hash) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS week_visitors
        FROM page_views
        WHERE device_type != 'bot' AND created_at >= NOW() - INTERVAL '1 day' * $1
      `, [days]),
            query(`
        SELECT
          TO_CHAR(created_at::date, 'MM/DD') AS day,
          created_at::date AS raw_date,
          COUNT(*) AS views,
          COUNT(DISTINCT ip_hash) AS visitors
        FROM page_views
        WHERE device_type != 'bot' AND created_at >= NOW() - INTERVAL '1 day' * $1
        GROUP BY raw_date, day
        ORDER BY raw_date ASC
      `, [days]),
            query(`
        SELECT path, COUNT(*) AS views, COUNT(DISTINCT ip_hash) AS visitors
        FROM page_views
        WHERE device_type != 'bot' AND created_at >= NOW() - INTERVAL '1 day' * $1
        GROUP BY path
        ORDER BY views DESC
        LIMIT 15
      `, [days]),
            query(`
        SELECT
          COALESCE(country, 'Unknown') AS country,
          COUNT(*) AS views
        FROM page_views
        WHERE device_type != 'bot' AND created_at >= NOW() - INTERVAL '1 day' * $1
        GROUP BY country
        ORDER BY views DESC
        LIMIT 10
      `, [days]),
            query(`
        SELECT device_type, COUNT(*) AS count
        FROM page_views
        WHERE device_type != 'bot' AND created_at >= NOW() - INTERVAL '1 day' * $1
        GROUP BY device_type
        ORDER BY count DESC
      `, [days]),
        ])

        return NextResponse.json({
            overview: overviewResult[0],
            overTime: overTimeResult,
            topPages: topPagesResult,
            topCountries: topCountriesResult,
            deviceTypes: deviceTypesResult,
        })
    } catch (e: any) {
        console.error('Analytics error:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
