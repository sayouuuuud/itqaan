"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Public page error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-4 font-serif">
          حدث خطأ
        </h1>

        <p className="text-muted mb-8">
          عذراً، حدث خطأ غير متوقع في الصفحة. يرجى المحاولة مرة أخرى.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={reset}
            className="bg-primary hover:bg-primary-hover text-white"
          >
            <RefreshCw className="h-4 w-4 ml-2" />
            إعادة المحاولة
          </Button>

          <Link href="/">
            <Button variant="outline">
              <Home className="h-4 w-4 ml-2" />
              الرئيسية
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

