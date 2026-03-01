import { query } from "@/lib/db"

export type NotificationType =
    | "recitation_received"      // reader: new recitation to review
    | "recitation_reviewed"      // student: reader submitted review
    | "mastered"                  // student: verdict mastered
    | "needs_session"             // student: verdict needs_session
    | "session_booked"            // student+reader: booking confirmed
    | "session_reminder"          // student+reader: 1h before session
    | "new_reader_application"    // admin: new reader applied
    | "reader_approved"           // reader: admin approved
    | "reader_rejected"           // reader: admin rejected
    | "new_recitation_admin"      // admin: new unassigned recitation
    | "general"

export interface CreateNotificationInput {
    userId: string
    type: NotificationType
    title: string
    message: string
    category?: "recitation" | "session" | "account" | "general"
    link?: string                 // optional navigation link
    relatedRecitationId?: string
    relatedBookingId?: string
}

/**
 * Creates a notification record in the database.
 * Safe to call from any API route or server action.
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
    try {
        await query(
            `INSERT INTO notifications (
        user_id, type, title, message, category, link,
        related_recitation_id, related_booking_id, is_read, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, NOW())`,
            [
                input.userId,
                input.type,
                input.title,
                input.message,
                input.category || "general",
                input.link || null,
                input.relatedRecitationId || null,
                input.relatedBookingId || null,
            ]
        )
    } catch (err) {
        // Never let notification failure break the main flow
        console.error("Failed to create notification:", err)
    }
}

/**
 * Bulk-create notifications for multiple users at once.
 */
export async function createNotificationForMany(
    userIds: string[],
    data: Omit<CreateNotificationInput, "userId">
): Promise<void> {
    for (const userId of userIds) {
        await createNotification({ ...data, userId })
    }
}
