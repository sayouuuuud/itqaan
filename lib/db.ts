// Database connection helper
// Replace with your actual database connection string
// Compatible with: Supabase, Neon, Vercel Postgres, any PostgreSQL

import { Pool } from "pg"
import dns from "dns"

// Fix for Node 18+ DNS resolution issues with Supabase IPv6 endpoints
dns.setDefaultResultOrder("ipv4first")

const pool = process.env.DATABASE_URL ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
}) : null

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  if (!pool) {
    console.warn("[DB] No DATABASE_URL - Using mock data mode")
    return [] as T[]
  }

  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result.rows as T[]
  } catch (error) {
    console.error("[DB] Query error:", error)
    // Return empty array instead of throwing to keep app functional
    return [] as T[]
  } finally {
    client.release()
  }
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] || null
}

export const hasDatabase = () => !!pool

export default pool
