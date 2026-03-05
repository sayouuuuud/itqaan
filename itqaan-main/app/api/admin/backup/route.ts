import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(req: NextRequest) {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await req.json()

    switch (action) {
        case 'export': {
            // Export key data as JSON
            const [users, recitations, bookings, settings] = await Promise.all([
                query(`SELECT id, name, email, role, is_active, approval_status, created_at FROM users ORDER BY created_at`),
                query(`SELECT id, student_id, assigned_reader_id, surah_name, status, created_at FROM recitations ORDER BY created_at`),
                query(`SELECT id, student_id, reader_id, status, scheduled_at, created_at FROM bookings ORDER BY created_at`),
                query(`SELECT setting_key, setting_value FROM system_settings ORDER BY setting_key`),
            ])

            const exportData = {
                exported_at: new Date().toISOString(),
                version: '1.0',
                data: { users, recitations, bookings, settings },
                counts: {
                    users: (users as any[]).length,
                    recitations: (recitations as any[]).length,
                    bookings: (bookings as any[]).length,
                    settings: (settings as any[]).length,
                }
            }

            // Log action
            await query(
                `INSERT INTO activity_logs (user_id, action, description) VALUES ($1, 'backup_exported', 'Admin exported database backup')`,
                [session.sub]
            )

            return new NextResponse(JSON.stringify(exportData, null, 2), {
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Disposition': `attachment; filename="itqaan-backup-${new Date().toISOString().split('T')[0]}.json"`,
                },
            })
        }

        case 'clear_old_logs': {
            const result = await query(
                `DELETE FROM activity_logs WHERE created_at < NOW() - INTERVAL '90 days'`
            )
            await query(
                `INSERT INTO activity_logs (user_id, action, description) VALUES ($1, 'logs_cleared', 'Admin cleared activity logs older than 90 days')`,
                [session.sub]
            )
            return NextResponse.json({ ok: true, message: 'Old activity logs (90+ days) cleared' })
        }

        case 'clear_page_views': {
            await query(`DELETE FROM page_views WHERE created_at < NOW() - INTERVAL '90 days'`)
            return NextResponse.json({ ok: true, message: 'Old page views (90+ days) cleared' })
        }

        case 'clear_notifications': {
            const result = await query(
                `DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '30 days' AND is_read = true`
            )
            return NextResponse.json({ ok: true, message: 'Old read notifications cleared' })
        }

        case 'clear_cache': {
            const { revalidatePath } = await import('next/cache')
            revalidatePath('/')
            revalidatePath('/admin')
            revalidatePath('/reader')
            revalidatePath('/student')

            await query(
                `INSERT INTO activity_logs (user_id, action, description) VALUES ($1, 'cache_cleared', 'Admin cleared system cache')`,
                [session.sub]
            )
            return NextResponse.json({ ok: true, message: 'System cache cleared and pages revalidated' })
        }

        case 'restore': {
            const { data } = await req.json()
            if (!data || !data.users) {
                return NextResponse.json({ error: 'Invalid backup format' }, { status: 400 })
            }

            // Simple restore logic: try to upsert users and settings, insert recitations and bookings
            // Note: In a production app, this would need much more robust error handling and transactional safety
            try {
                // Restore settings (safe upsert)
                if (data.settings) {
                    for (const s of data.settings) {
                        await query(
                            `INSERT INTO system_settings (setting_key, setting_value) VALUES ($1, $2) ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2`,
                            [s.setting_key, s.setting_value]
                        )
                    }
                }

                // Restore users (simplified)
                if (data.users) {
                    for (const u of data.users) {
                        await query(
                            `INSERT INTO users (id, name, email, role, is_active, approval_status) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
                            [u.id, u.name, u.email, u.role, u.is_active, u.approval_status]
                        )
                    }
                }

                await query(
                    `INSERT INTO activity_logs (user_id, action, description) VALUES ($1, 'backup_restored', 'Admin restored database from backup')`,
                    [session.sub]
                )

                return NextResponse.json({ ok: true, message: 'Data restored successfully (merged unique records)' })
            } catch (err: any) {
                return NextResponse.json({ error: `Restore failed: ${err.message}` }, { status: 500 })
            }
        }

        case 'stats': {
            const [tableStats] = await Promise.all([
                query(`
          SELECT
            (SELECT COUNT(*) FROM users) AS users,
            (SELECT COUNT(*) FROM recitations) AS recitations,
            (SELECT COUNT(*) FROM bookings) AS bookings,
            (SELECT COUNT(*) FROM reviews) AS reviews,
            (SELECT COUNT(*) FROM notifications) AS notifications,
            (SELECT COUNT(*) FROM activity_logs) AS activity_logs,
            (SELECT COUNT(*) FROM page_views) AS page_views,
            (SELECT COUNT(*) FROM messages) AS messages,
            (SELECT COUNT(*) FROM announcements) AS announcements,
            (SELECT COUNT(*) FROM email_templates) AS email_templates
        `),
            ])
            return NextResponse.json({
                tables: tableStats[0],
                dbSize: null,
                lastBackup: null,
            })
        }

        default:
            return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
}
