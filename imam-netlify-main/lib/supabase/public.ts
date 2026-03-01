import { createClient } from "@supabase/supabase-js"

// Placeholder values for build time when env vars are not available
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

/**
 * Check if we have valid Supabase configuration
 */
export function hasValidSupabaseConfig(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co"
  )
}

/**
 * Public/anonymous Supabase client for Edge Runtime and server-side reads
 * that do NOT require authentication (e.g. public pages, static content).
 *
 * Using createClient from @supabase/supabase-js instead of @supabase/ssr
 * for better Edge Runtime compatibility (Cloudflare Workers).
 * 
 * Note: During build time, this may use placeholder values if env vars
 * are not available. Always check hasValidSupabaseConfig() before making
 * critical database calls.
 */
export function createPublicClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

