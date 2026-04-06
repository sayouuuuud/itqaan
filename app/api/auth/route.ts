import { auth } from "@/lib/better-auth-config"

/**
 * Better Auth API Routes
 * Handles all authentication requests: login, signup, logout, etc.
 */

export const { GET, POST } = auth.toNextJsHandler()
