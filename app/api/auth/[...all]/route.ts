import { auth } from "@/lib/better-auth-config"
import { toNextJsHandler } from "better-auth/next-js"

/**
 * Better Auth Route Handler
 * Handles all authentication endpoints
 */

export const { GET, POST } = toNextJsHandler(auth)
