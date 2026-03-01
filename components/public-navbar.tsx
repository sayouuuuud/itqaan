"use client"

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { LanguageSwitcher } from '@/components/language-switcher'

export function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { t } = useI18n()

  return (
    <nav className="absolute top-0 left-0 right-0 z-20">
      <div className="container mx-auto px-6 py-5 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold tracking-tighter text-[#D4A843]" style={{ textShadow: '0 0 20px rgba(212,168,67,0.3)' }}>
          {t.appName}
        </Link>

        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher variant="ghost" />
           <div className="h-6 w-px bg-white/10 mx-1" />
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium px-5 py-2.5 rounded-full transition-all text-white border border-[#D4A843]/40 hover:bg-[#D4A843]/10">
              {t.login}
            </Link>
            <Link href="/register" className="text-sm font-semibold px-6 py-2.5 rounded-full transition-all bg-[#D4A843] text-white hover:bg-[#C49A3A] shadow-lg shadow-[#D4A843]/20">
              {t.register}
            </Link>
          </div>
         
        </div>

        <div className="md:hidden flex items-center gap-2">
          {!mobileOpen && <LanguageSwitcher variant="ghost" />}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-white"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#0B3D2E]/95 backdrop-blur-md border-t border-white/10">
          <div className="container mx-auto px-6 py-4 flex flex-col gap-4">
            <div className="flex gap-3">
              <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm font-medium py-2.5 rounded-full text-white border border-[#D4A843]/40">{t.login}</Link>
              <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm font-semibold py-2.5 rounded-full bg-[#D4A843] text-white">{t.register}</Link>
            </div>
            <div className="flex justify-center pt-2 border-t border-white/5">
              <LanguageSwitcher variant="outline" />
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

