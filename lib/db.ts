// Database connection helper
// Compatible with: Supabase, Vercel Postgres, any PostgreSQL

import { Pool } from "pg"
import dns from "dns"

// Fix for Node 18+ DNS resolution issues with Supabase IPv6 endpoints
dns.setDefaultResultOrder("ipv4first")

const pool = process.env.DATABASE_URL ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,                        // max concurrent connections
  min: 2,                         // keep 2 connections warm always
  idleTimeoutMillis: 30000,       // close idle connections after 30s
  connectionTimeoutMillis: 8000,  // give up after 8s
  allowExitOnIdle: false,
}) : null

// Warm up pool on startup (keeps 2 connections open so first requests are fast)
if (pool) {
  pool.connect().then(c => c.release()).catch(() => {})
  pool.connect().then(c => c.release()).catch(() => {})
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  if (!pool) {
    console.warn("[DB] No DATABASE_URL - Using mock data mode")
    return [] as T[]
  }

  try {
    // Use pool.query() directly — avoids acquire/release overhead per query
    const result = await pool.query(text, params as any[])
    return result.rows as T[]
  } catch (error) {
    console.error("[DB] Query error:", error)
    return [] as T[]
  }
}

// Arabic message shown to users when the database itself is unreachable.
// This must never be confused with a wrong email/password.
export const DB_UNAVAILABLE_MESSAGE =
  "تعذر الاتصال بقاعدة البيانات. يرجى المحاولة لاحقاً أو التواصل مع الدعم."

// Distinguishes "the database is unreachable / misconfigured" from a normal
// SQL error. Network-level failures have no SQLSTATE `code` at all, while
// connection/auth/database-level Postgres errors use the 08*, 28*, 3D* and
// 57P* classes (plus Supabase's pooler XX000 "tenant or user not found").
export function isDbConnectionError(error: unknown): boolean {
  if (!error) return false

  const err = error as { code?: string; message?: string }
  const code = typeof err.code === "string" ? err.code : ""
  const message = (err.message || String(error)).toLowerCase()

  const networkCodes = [
    "ECONNREFUSED",
    "ENOTFOUND",
    "EAI_AGAIN",
    "ETIMEDOUT",
    "ECONNRESET",
    "EHOSTUNREACH",
    "ENETUNREACH",
    "EPIPE",
    "CERT_HAS_EXPIRED",
    "SELF_SIGNED_CERT_IN_CHAIN",
  ]
  if (networkCodes.includes(code)) return true

  // Postgres connection/auth/database-availability classes.
  if (/^(08|28|3D|57P)/.test(code)) return true

  const messageSignals = [
    "no database_url",
    // Supabase/pgbouncer pooler: "(ENOTFOUND) tenant/user postgres.xxx not found"
    "not found",
    "enotfound",
    "connection terminated",
    "connection timeout",
    "timeout exceeded when trying to connect",
    "getaddrinfo",
    "server closed the connection",
    "terminating connection",
    "database system is starting up",
    "too many connections",
    "password authentication failed",
    "does not exist", // e.g. database "xxx" does not exist
  ]
  if (code === "XX000" || !code) {
    return messageSignals.some((s) => message.includes(s))
  }

  return false
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] || null
}

// Like query(), but rethrows the underlying error instead of swallowing it.
// Use this for writes where the caller needs to know if the operation failed.
export async function queryStrict<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  if (!pool) {
    throw new Error("No DATABASE_URL configured")
  }
  const result = await pool.query(text, params as any[])
  return result.rows as T[]
}

// The original schema constrained users.role to ('student','reader','admin').
// Newer roles (supervisors, initiative_admin) were added in the app but some
// databases never had the CHECK constraint widened, so inserting/updating
// those roles fails with a 23514 violation. This idempotently widens the
// constraint. Guarded by a module-level flag so it only runs once per boot.
let roleConstraintEnsured = false
export async function ensureUserRoleConstraint(): Promise<void> {
  if (!pool || roleConstraintEnsured) return
  try {
    await pool.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`)
    await pool.query(
      `ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('student','reader','admin','student_supervisor','reciter_supervisor','initiative_admin'))`
    )
    roleConstraintEnsured = true
    console.log("[DB] users_role_check constraint ensured")
  } catch (e) {
    console.error("[DB] ensureUserRoleConstraint error:", e)
  }
}

// Idempotently ensure the initiatives module schema exists. Some production
// databases have migration 011 (the initiatives table) but not 012 (join_code
// / join_enabled columns), or are missing users.initiative_id — which makes the
// create-initiative INSERT throw "column ... does not exist". This mirrors
// migrations 011 + 012 with IF NOT EXISTS so it is safe to run repeatedly.
// Runs once per boot.
let initiativesSchemaEnsured = false
export async function ensureInitiativesSchema(): Promise<void> {
  if (!pool || initiativesSchemaEnsured) return
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS initiatives (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(255) NOT NULL,
        type varchar(50),
        description text,
        logo_url text,
        contact_name varchar(255),
        contact_email varchar(255),
        contact_phone varchar(50),
        target_students_count integer,
        status varchar(20) NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending','approved','rejected','suspended')),
        admin_user_id uuid REFERENCES users(id),
        rejection_reason text,
        approved_by uuid REFERENCES users(id),
        approved_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `)
    // Columns that may be missing if an older migration version was applied.
    await pool.query(`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS logo_url text`)
    await pool.query(`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS rejection_reason text`)
    await pool.query(`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES users(id)`)
    await pool.query(`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS approved_at timestamptz`)
    await pool.query(`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS join_code varchar(12) UNIQUE`)
    await pool.query(`ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS join_enabled boolean NOT NULL DEFAULT true`)
    // Link columns on related tables.
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS initiative_id uuid REFERENCES initiatives(id)`)
    await pool.query(`ALTER TABLE recitations ADD COLUMN IF NOT EXISTS initiative_id uuid REFERENCES initiatives(id)`)
    initiativesSchemaEnsured = true
    console.log("[DB] initiatives schema ensured")
  } catch (e) {
    console.error("[DB] ensureInitiativesSchema error:", e)
  }
}

// Idempotently ensure the initiative_invites table exists. This backs the
// email-based invite flow where an initiative admin invites a specific student
// by email and the student registers tagged with that initiative. Runs once per boot.
let initiativeInvitesSchemaEnsured = false
export async function ensureInitiativeInvitesSchema(): Promise<void> {
  if (!pool || initiativeInvitesSchemaEnsured) return
  try {
    await ensureInitiativesSchema()
    await pool.query(`
      CREATE TABLE IF NOT EXISTS initiative_invites (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        initiative_id uuid NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
        email varchar(255) NOT NULL,
        token varchar(64) NOT NULL UNIQUE,
        status varchar(20) NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending','accepted','expired')),
        invited_by uuid REFERENCES users(id),
        accepted_user_id uuid REFERENCES users(id),
        expires_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        accepted_at timestamptz
      )
    `)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_initiative_invites_initiative ON initiative_invites(initiative_id)`)
    initiativeInvitesSchemaEnsured = true
    console.log("[DB] initiative_invites schema ensured")
  } catch (e) {
    console.error("[DB] ensureInitiativeInvitesSchema error:", e)
  }
}

export const hasDatabase = () => !!pool

export default pool
