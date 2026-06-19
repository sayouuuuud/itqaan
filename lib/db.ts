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

export const hasDatabase = () => !!pool

export default pool
