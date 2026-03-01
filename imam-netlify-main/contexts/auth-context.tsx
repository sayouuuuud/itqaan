"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    }) 
    return () => subscription?.unsubscribe()
  }, [])

  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      console.log("[AUTH] User check:", user?.email)
    } catch (error) {
      console.error("[AUTH] Auth check failed:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function login(email: string, password: string) {
    try {
      console.log("[AUTH] Attempting login with email:", email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      setUser(data.user)
      console.log("[AUTH] Login successful:", data.user?.email)
      router.push("/admin")
      router.refresh()
    } catch (error: any) {
      console.error("[AUTH] Login failed:", error)
      throw new Error(
        error.message === "Invalid login credentials"
          ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
          : error.message || "حدث خطأ أثناء تسجيل الدخول"
      )
    }
  }

  async function logout() {
    try {
      await supabase.auth.signOut()
      setUser(null)
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("[AUTH] Logout failed:", error)
    }
  }

  async function refreshUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      console.log("[AUTH] User refreshed:", user?.email)
    } catch (error) {
      console.error("[AUTH] Refresh user failed:", error)
    }
  } 
  return <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
{children}</AuthContext.Provider>

 }

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
