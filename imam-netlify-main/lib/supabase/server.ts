import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Placeholder values for build time when env vars are not available
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

export async function createClient() {
  // In Next.js, `cookies()` can only be called inside a request scope.
  // Some code paths (like `generateStaticParams`) can run at build/SSG time,
  // where no request scope exists. In that case we fall back to an empty
  // cookie store so public reads can still work without crashing the build.
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null

  try {
    cookieStore = await cookies()
  } catch {
    cookieStore = null
  }

  return createSupabaseServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore ? cookieStore.getAll() : []
      },
      setAll(cookiesToSet) {
        try {
          if (!cookieStore) return
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

export const createServerClient = createClient
