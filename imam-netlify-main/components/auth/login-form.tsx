"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await login(email, password)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm flex items-center gap-2">
          <span className="material-icons-outlined text-lg">error</span>
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <div className="relative">
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
            <span className="material-icons-outlined text-lg">email</span>
          </span>

          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            className="pr-10 bg-muted"
            required
            disabled={loading}
            dir="ltr"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">كلمة المرور</Label>
        <div className="relative">
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
            <span className="material-icons-outlined text-lg">lock</span>
          </span>

          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="pr-10 bg-muted"
            required
            disabled={loading}
            dir="ltr"
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-bold shadow-lg"
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="material-icons-outlined animate-spin">refresh</span>
            جاري التحميل...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span className="material-icons-outlined">login</span>
            تسجيل الدخول
          </span>
        )}
      </Button>
    </form>
  )
}