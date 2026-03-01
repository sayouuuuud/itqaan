"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle } from "lucide-react"

export function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (!email || !email.includes("@")) {
      setMessage({ type: "error", text: "يرجى إدخال بريد إلكتروني صحيح." })
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: data.message })
        setEmail("")
      } else {
        setMessage({ type: "error", text: data.error || "حدث خطأ أثناء الاشتراك." })
      }
    } catch (error) {
      console.error("Subscription error:", error)
      setMessage({ type: "error", text: "حدث خطأ في الشبكة. يرجى المحاولة مرة أخرى." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative z-10 space-y-2">
      <Input
        type="email"
        placeholder="البريد الإلكتروني"
        className="w-full rounded-lg border-none px-4 py-2 text-gray-900 focus:ring-2 focus:ring-secondary"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
      />
      <Button
        type="submit"
        className="w-full bg-secondary hover:bg-yellow-600 text-white font-bold py-2 rounded-lg transition-colors"
        disabled={loading}
      >
        {loading ? "جاري الاشتراك..." : "اشتراك الآن"}
      </Button>
      {message && (
        <p className={`text-sm mt-2 flex items-center gap-2 ${message.type === "success" ? "text-green-300" : "text-red-300"}`}>
          {message.type === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {message.text}
        </p>
      )}
    </form>
  )
}


import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle } from "lucide-react"

export function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (!email || !email.includes("@")) {
      setMessage({ type: "error", text: "يرجى إدخال بريد إلكتروني صحيح." })
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: data.message })
        setEmail("")
      } else {
        setMessage({ type: "error", text: data.error || "حدث خطأ أثناء الاشتراك." })
      }
    } catch (error) {
      console.error("Subscription error:", error)
      setMessage({ type: "error", text: "حدث خطأ في الشبكة. يرجى المحاولة مرة أخرى." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative z-10 space-y-2">
      <Input
        type="email"
        placeholder="البريد الإلكتروني"
        className="w-full rounded-lg border-none px-4 py-2 text-gray-900 focus:ring-2 focus:ring-secondary"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
      />
      <Button
        type="submit"
        className="w-full bg-secondary hover:bg-yellow-600 text-white font-bold py-2 rounded-lg transition-colors"
        disabled={loading}
      >
        {loading ? "جاري الاشتراك..." : "اشتراك الآن"}
      </Button>
      {message && (
        <p className={`text-sm mt-2 flex items-center gap-2 ${message.type === "success" ? "text-green-300" : "text-red-300"}`}>
          {message.type === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {message.text}
        </p>
      )}
    </form>
  )
}

