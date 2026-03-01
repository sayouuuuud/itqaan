"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect } from "react"

export function SessionManager() {
    useEffect(() => {
        const supabase = createClient()

        // Check session on mount and handle invalid tokens
        const checkSession = async () => {
            const { data, error } = await supabase.auth.getSession()
            if (error && error.message.includes("Refresh Token")) {
                console.warn("⚠️ Detected invalid refresh token, clearing session...")
                await supabase.auth.signOut()
            }
        }

        checkSession()

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                // Clear any stale data if needed
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    return null
}
