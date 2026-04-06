import { betterAuth } from "better-auth"
import { postgresAdapter } from "better-auth/adapters/postgres"
import { emailAndPassword, magicLink } from "better-auth/plugins"
import pool from "./db"

if (!pool) {
  throw new Error("Database pool is not initialized. Check your DATABASE_URL environment variable.")
}

/**
 * Better Auth Configuration
 * Seamlessly integrates with existing PostgreSQL users table
 * Migrates from custom JWT to Better Auth sessions
 */

export const auth = betterAuth({
  database: postgresAdapter({
    client: pool as any,
  }),
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  basePath: "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET || "your-secret-key-change-me",
  
  // Email & Password with existing password column support
  plugins: [
    emailAndPassword({
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      requireEmailVerification: false,
    }),
    magicLink(),
  ],

  // User schema mapping with existing fields
  user: {
    fields: {
      email: "email",
      name: "name",
      image: "image",
      emailVerified: "emailVerified",
    },
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update every day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  // Hooks for custom logic
  hooks: {
    async afterSignUp({ user }) {
      console.log("[v0] User signed up:", user.email)
    },
    async afterSignIn({ user }) {
      console.log("[v0] User signed in:", user.email)
    },
  },

  // Advanced options
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    crossSubDomainCookies: process.env.NODE_ENV === "production",
  },
})

export async function getSession() {
  try {
    // @ts-ignore - Better Auth API
    return await auth.api.getSession()
  } catch (error) {
    return null
  }
}
