"use client"

import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'

export function PublicFooter() {
  const { t } = useI18n()

  return (
    <footer className="bg-muted border-t border-border pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            <h3 className="text-3xl font-bold text-[#0B3D2E] mb-4">{t.appName}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              {t.footer.desc}
            </p>
            <div className="flex gap-3">
              {['FB', 'TW', 'IG'].map((s) => (
                <span key={s} className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-xs text-muted-foreground hover:bg-[#0B3D2E] hover:text-white transition-colors cursor-pointer">{s}</span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-4">{t.footer.quickLinks}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-[#0B3D2E] transition-colors">{t.home}</Link></li>
              <li><Link href="/about" className="hover:text-[#0B3D2E] transition-colors">{t.about}</Link></li>
              <li><Link href="/contact" className="hover:text-[#0B3D2E] transition-colors">{t.contact}</Link></li>
              <li><Link href="/sitemap-page" className="hover:text-[#0B3D2E] transition-colors">{t.footer.sitemap}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-4">{t.footer.support}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-[#0B3D2E] transition-colors">{t.footer.faq}</Link></li>
              <li><Link href="#" className="hover:text-[#0B3D2E] transition-colors">{t.footer.terms}</Link></li>
              <li><Link href="#" className="hover:text-[#0B3D2E] transition-colors">{t.footer.privacy}</Link></li>
              <li><Link href="/contact" className="hover:text-[#0B3D2E] transition-colors">{t.contact}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-4">{t.footer.newsletter}</h4>
            <p className="text-xs text-muted-foreground mb-4">{t.footer.newsletterDesc}</p>
            <form className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder={t.footer.emailPlaceholder}
                className="px-4 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:border-[#0B3D2E]"
                suppressHydrationWarning={true}
              />
              <button type="submit" className="bg-[#0B3D2E] text-white py-2 px-4 rounded-lg text-sm hover:bg-[#0A3527] transition-colors font-medium">
                {t.footer.subscribe}
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          {'2026 '}{t.appName}{'. '}{t.footer.rights}{'.'}
        </div>
      </div>
    </footer>
  )
}
