"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, ArrowLeft } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { LanguageSwitcher } from '@/components/language-switcher'
import { usePathname } from 'next/navigation'

export function PublicNavbar({ initialUser = null }: { initialUser?: { role: string } | null }) {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<{ role: string } | null>(initialUser)
  const [loading, setLoading] = useState(!initialUser)
  const { t } = useI18n()

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/status')
        if (res.ok) {
          const data = await res.json()
          if (data.authenticated) {
            setUser(data.user)
          } else {
            setUser(null)
          }
        }
      } catch (err) {
        console.error("Failed to check auth state", err)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  return (
    <nav className={`${isHome ? 'absolute' : 'sticky bg-[#0B3D2E] shadow-md'} top-0 left-0 right-0 z-40 transition-all duration-300`}>
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <img src="/branding/main-logo.png" alt={t.appName} className="h-22 w-30 object-contain" />
        </Link>

        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher variant="ghost" className="text-white hover:text-white/80" />
          <div className="h-6 w-px bg-white/10 mx-1" />
          <div className="flex items-center gap-3">
            {!loading && (
              user ? (
                <Link href={`/${user.role}`} className="text-sm font-semibold px-6 py-2.5 rounded-full transition-all bg-[#D4A843] text-white hover:bg-[#C49A3A] shadow-lg shadow-[#D4A843]/20 flex items-center gap-2">
                  {t.locale === 'ar' ? 'الدخول للحساب' : 'Go to Account'}
                  <ArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
                </Link>
              ) : (
                <Link href="/login" className="text-sm font-medium px-8 py-2.5 rounded-full transition-all text-white border border-[#D4A843]/40 hover:bg-[#D4A843]/10">
                  {t.login}
                </Link>
              )
            )}
          </div>

        </div>

        <div className="md:hidden flex items-center gap-2">
          {!mobileOpen && <LanguageSwitcher variant="ghost" className="text-white" />}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-white"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {
        mobileOpen && (
          <div className="md:hidden bg-[#0B3D2E]/95 backdrop-blur-md border-t border-white/10">
            <div className="container mx-auto px-6 py-4 flex flex-col gap-4">
              {!loading && (
                user ? (
                  <Link href={`/${user.role}`} onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm font-semibold py-2.5 rounded-full bg-[#D4A843] text-white flex items-center justify-center gap-2">
                    {t.locale === 'ar' ? 'الدخول للحساب' : 'Go to Account'}
                    <ArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
                  </Link>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm font-medium py-3 rounded-full text-white border border-[#D4A843]/40">{t.login}</Link>
                  </>
                )
              )}
              <div className="flex justify-center pt-2 border-t border-white/5">
                <LanguageSwitcher variant="ghost" className="text-white border border-white/10 hover:bg-white/5 rounded-full px-6 h-10" />
              </div>
            </div>
          </div>
        )
      }
    </nav >
  )
}

