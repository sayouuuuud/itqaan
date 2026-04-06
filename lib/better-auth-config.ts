import { betterAuth } from "better-auth"
import { postgresAdapter } from "better-auth/adapters/postgres"
import { emailOTP, passkey, twoFactor } from "better-auth/plugins"
import pool from "./db"

if (!pool) {
  throw new Error("Database pool is not initialized. Check your DATABASE_URL environment variable.")
}

/**
 * Better Auth Configuration
 * Integrates with existing PostgreSQL database and LMS schema
 * Supports email/password auth, email OTP, passkeys, and 2FA
 */

export const auth = betterAuth({
  database: postgresAdapter({
    client: pool as any,
  }),
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "your-secret-key-change-me",
  basePath: "/api/auth",
  emailAndPassword: {
    enabled: true,
    password: {
      minLength: 8,
      maxLength: 128,
    },
  },
  plugins: [
    emailOTP(),
    passkey(),
    twoFactor(),
  ],
  session: {
    cookieCache: {
      enabled: true,
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "student",
      },
      gender: {
        type: "string",
        defaultValue: null,
      },
      phone: {
        type: "string",
        defaultValue: null,
      },
      dateOfBirth: {
        type: "date",
        defaultValue: null,
      },
    },
  },
  hooks: {
    async afterSignUp({ user }) {
      // Assign student role to newly registered users by default
      if (!user.role || user.role === "student") {
        // The role will be handled in the additional fields
      }
    },
  },
})

export const getSession = () => auth.api.getSession()
