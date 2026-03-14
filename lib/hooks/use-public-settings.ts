"use client"

import { useState, useEffect } from "react"

interface Branding {
  logoUrl: string
  dashboardLogoUrl: string
  faviconUrl: string
}

interface ContactInfo {
  email: string
  phone: string
  address: string
}

interface PublicSettings {
  branding: Branding
  contactInfo: ContactInfo
  loading: boolean
}

const defaultBranding: Branding = {
  logoUrl: "/branding/main-logo.png",
  dashboardLogoUrl: "/branding/dashboard-logo.png",
  faviconUrl: "/favicon.png"
}

const defaultContact: ContactInfo = {
  email: "info@itqaan.com",
  phone: "+966 50 000 0000",
  address: "الرياض، المملكة العربية السعودية"
}

export function usePublicSettings(): PublicSettings {
  const [branding, setBranding] = useState<Branding>(defaultBranding)
  const [contactInfo, setContactInfo] = useState<ContactInfo>(defaultContact)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/public-settings")
        if (res.ok) {
          const data = await res.json()
          if (data.branding) setBranding(data.branding)
          if (data.contactInfo) setContactInfo(data.contactInfo)
        }
      } catch (error) {
        console.error("Failed to fetch public settings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  return { branding, contactInfo, loading }
}
