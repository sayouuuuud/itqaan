import { createAuthClient } from "better-auth/react"

/**
 * Client-side Better Auth instance
 * Used in React components for authentication
 */

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
})

export const useAuth = () => {
  return authClient.useSession()
}

export const useSignIn = () => {
  return authClient.signIn
}

export const useSignUp = () => {
  return authClient.signUp
}

export const useSignOut = () => {
  return authClient.signOut
}
