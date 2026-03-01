"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Code, LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DeveloperLayoutProps {
    children: React.ReactNode
}

const DEVELOPER_EMAIL = "sayedelshazly2006@gmail.com"

export default function DeveloperLayout({ children }: DeveloperLayoutProps) {
    const { user, loading, logout } = useAuth()
    const router = useRouter()
    const [checkingRole, setCheckingRole] = useState(true)
    const [isDeveloper, setIsDeveloper] = useState(false)

    useEffect(() => {
        async function checkDeveloperAccess() {
            if (loading) return

            if (!user) {
                router.push("/login")
                return
            }

            // Check if user is developer by email
            if (user.email === DEVELOPER_EMAIL) {
                setIsDeveloper(true)
            } else {
                // Not developer, show 404
                setIsDeveloper(false)
            }

            setCheckingRole(false)
        }

        checkDeveloperAccess()
    }, [user, loading, router])

    if (loading || checkingRole) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <div className="text-primary text-xl">جاري التحقق...</div>
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    // If not developer, show 404
    if (!isDeveloper) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
                    <p className="text-xl text-muted-foreground mb-6">الصفحة غير موجودة</p>
                    <Button onClick={() => router.push("/")} variant="outline">
                        العودة للرئيسية
                    </Button>
                </div>
            </div>
        )
    }

    // Developer layout - minimal, no sidebar
    return (
        <div className="min-h-screen bg-background" dir="rtl">
            {/* Simple Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-card h-16 px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                        <Code className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-primary text-sm">صفحة المطور</h1>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                        await logout()
                        router.push("/")
                    }}
                    className="text-muted-foreground hover:text-red-500"
                >
                    <LogOut className="h-4 w-4 ml-2" />
                    تسجيل الخروج
                </Button>
            </header>

            <main className="max-w-4xl mx-auto p-6">
                {children}
            </main>
        </div>
    )
}
