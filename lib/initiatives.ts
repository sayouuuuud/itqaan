import { queryOne } from "@/lib/db"
import type { JWTPayload } from "@/lib/auth"

export interface InitiativeRecord {
  id: string
  name: string
  type: string | null
  status: string
  join_code: string | null
  join_enabled: boolean
  target_students_count: number | null
  admin_user_id: string | null
}

// Resolve the initiative that an initiative_admin manages.
// The admin is linked through initiatives.admin_user_id.
export async function getManagedInitiative(session: JWTPayload | null): Promise<InitiativeRecord | null> {
  if (!session) return null
  return queryOne<InitiativeRecord>(
    `SELECT id, name, type, status, join_code, join_enabled, target_students_count, admin_user_id
     FROM initiatives WHERE admin_user_id = $1 LIMIT 1`,
    [session.sub]
  )
}

// Generate a short, human-friendly, unambiguous join code (no 0/O/1/I).
const JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export function generateJoinCode(length = 8): string {
  let code = ""
  for (let i = 0; i < length; i++) {
    code += JOIN_CODE_ALPHABET[Math.floor(Math.random() * JOIN_CODE_ALPHABET.length)]
  }
  return code
}

// Generate a long, URL-safe, hard-to-guess token for email invitations.
export function generateInviteToken(length = 40): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let token = ""
  for (let i = 0; i < length; i++) {
    token += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return token
}

export const INITIATIVE_TYPE_LABELS: Record<string, string> = {
  university: "جامعة",
  ministry: "وزارة / جهة حكومية",
  restaurant: "مطعم",
  cafe: "مقهى",
  school: "مدرسة",
  charity: "جمعية خيرية",
  company: "شركة",
  other: "أخرى",
}
