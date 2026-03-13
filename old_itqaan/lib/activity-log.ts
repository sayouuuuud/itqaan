import { query } from "@/lib/db"

/**
 * Log an admin action to activity_logs table
 */
export async function logAdminAction(options: {
    userId: string
    action: string
    entityType?: string
    entityId?: string
    description?: string
    details?: Record<string, unknown>
    status?: 'success' | 'failed'
}) {
    try {
        const { userId, action, entityType, entityId, description, details, status = 'success' } = options
        await query(
            `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, details, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [userId, action, entityType || null, entityId || null, description || null, JSON.stringify(details || {}), status]
        )
    } catch {
        // Never crash the main flow because of logging failure
    }
}
