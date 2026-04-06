import { betterAuth } from "better-auth"
import { postgresAdapter } from "better-auth/adapters/postgres"
import { emailOTP, passkey, twoFactor } from "better-auth/plugins"
import pool from "./db"

/**
 * Better Auth Configuration
 * Integrates with existing PostgreSQL database and LMS schema
 * Supports email/password auth, email OTP, passkeys, and 2FA
 */

export const auth = betterAuth({
  database: postgresAdapter({
    client: pool,
  }),
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
