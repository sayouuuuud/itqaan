"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { PublicNavbar } from '@/components/public-navbar'
import { Mic, CheckCircle, Calendar, ArrowLeft, ChevronDown, BookOpen, Shield, Award, Star } from 'lucide-react'

export default function LandingPage() {
  const { t } = useI18n()
  const [masteredStudents, setMasteredStudents] = useState(0)

  useEffect(() => {
    fetch('/api/public/stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.masteredStudents) setMasteredStudents(data.masteredStudents) })
      .catch(() => { })
  }, [])

  return (
    <div className="overflow-hidden">
      {/* ========== HERO (unchanged) ========== */}
      <section className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden px-4 py-20 text-center text-white bg-[#0B3D2E]">
        <PublicNavbar />
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 opacity-5" style={{ background: 'radial-gradient(circle at center, #D4A843 0%, transparent 50%)' }} />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4A843] rounded-full mix-blend-multiply blur-3xl opacity-5 animate-blob-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#0B3D2E] rounded-full mix-blend-multiply blur-3xl opacity-10 animate-blob-float-delayed" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-6">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight">
            {t.landing.heroTitle}
            <span className="text-[#D4A843]" style={{ textShadow: '0 0 20px rgba(212,168,67,0.3)' }}>{t.landing.heroFatiha}</span>
          </h1>

          {/* Ayah — inline between h1 and tagline */}
          <div className="flex items-center gap-4 w-full justify-center py-1">
            <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-[#D4A843]/40" />
            <div className="text-center select-none">
              <p
                className="text-lg md:text-2xl font-bold tracking-[0.15em] leading-relaxed"
                style={{
                  fontFamily: 'var(--font-quran, Georgia, serif)',
                  color: 'rgba(212,168,67,0.55)',
                }}
              >
                {t.landing.heroAyah}
              </p>
              <p className="text-[10px] tracking-[0.25em] text-[#D4A843]/30 mt-1 uppercase">
                {t.landing.heroAyahSource}
              </p>
            </div>
            <div className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-[#D4A843]/40" />
          </div>
          <p className="text-xl md:text-2xl font-medium text-white/90 max-w-2xl text-balance">
            {t.landing.heroSubtitle}
          </p>
          <p className="max-w-xl mx-auto text-white/60 text-sm md:text-base leading-relaxed">
            {t.landing.heroDesc}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full justify-center">
            <Link href="/register" className="group bg-[#D4A843] text-white hover:bg-[#C49A3A] font-bold py-4 px-10 rounded-full transition-all duration-300 hover:scale-105 shadow-xl shadow-[#D4A843]/20 flex items-center justify-center gap-2 min-w-[200px]">
              <span>{t.landing.startNow}</span>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <Link href="#how-it-works" className="group border-2 border-[#D4A843]/40 text-[#D4A843] hover:bg-[#D4A843]/10 font-medium py-4 px-10 rounded-full transition-all duration-300 backdrop-blur-sm flex items-center justify-center gap-2 min-w-[200px]">
              <span>{t.landing.howItWorksBtn}</span>
            </Link>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <Link href="#how-it-works" className="text-[#D4A843]/60 hover:text-[#D4A843] transition-colors">
            <ChevronDown className="w-10 h-10" />
          </Link>
        </div>
      </section>

      {/* ========== HOW IT WORKS - Stacked alternating rows ========== */}
      <section id="how-it-works" className="relative py-28 md:py-36 px-4 bg-[#FAF8F4] overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute top-20 right-10 w-[500px] h-[500px] rounded-full bg-[#D4A843]/[0.04] blur-[120px] animate-blob-float pointer-events-none" />
        <div className="absolute bottom-20 left-10 w-[400px] h-[400px] rounded-full bg-[#0B3D2E]/[0.04] blur-[100px] animate-blob-float-delayed pointer-events-none" />

        {/* Decorative top border */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-l from-transparent via-[#D4A843]/30 to-transparent" />

        <div className="container mx-auto max-w-6xl relative z-10">
          {/* Section heading */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-[#0B3D2E]/10" />
            <span className="text-[#D4A843] text-xs font-bold tracking-[0.3em] uppercase">{t.landing.stepsLabel}</span>
            <div className="h-px flex-1 bg-[#0B3D2E]/10" />
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0B3D2E] text-center mb-6 text-balance leading-tight">
            {t.landing.fatihaMasteryTitle}
          </h2>
          <p className="text-center text-[#0B3D2E]/50 text-lg mb-16 md:mb-24 max-w-xl mx-auto">
            {t.landing.fatihaMasteryDesc}
          </p>

          {/* Steps - alternating rows */}
          <div className="flex flex-col gap-8 md:gap-0">
            {/* Step 1 */}
            <div className="group relative md:grid md:grid-cols-2 md:gap-16 items-center">
              {/* Visual side */}
              <div className="relative flex items-center justify-center mb-8 md:mb-0">
                <div className="relative w-48 h-48 md:w-64 md:h-64 mx-auto">
                  {/* Outer ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#D4A843]/20 group-hover:border-[#D4A843]/40 transition-colors duration-700 group-hover:animate-[spin_20s_linear_infinite]" />
                  {/* Inner circle */}
                  <div className="absolute inset-4 md:inset-6 rounded-full bg-gradient-to-br from-[#0B3D2E] to-[#16503A] shadow-2xl shadow-[#0B3D2E]/30 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                    <Mic className="w-14 h-14 md:w-20 md:h-20 text-white/90" />
                  </div>
                  {/* Number badge */}
                  <div className="absolute -top-2 -right-2 md:top-0 md:right-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#D4A843] shadow-lg shadow-[#D4A843]/30 flex items-center justify-center text-white font-bold text-xl md:text-2xl rotate-12 group-hover:rotate-0 transition-transform duration-500">
                    1
                  </div>
                </div>
              </div>
              {/* Text side */}
              <div className="text-center md:text-right">
                <h3 className="text-2xl md:text-3xl font-bold text-[#0B3D2E] mb-4">{t.landing.step1Title}</h3>
                <p className="text-[#0B3D2E]/55 text-base md:text-lg leading-relaxed max-w-md mx-auto md:mx-0 md:mr-0">
                  {t.landing.step1Desc}
                </p>
              </div>
            </div>

            {/* Connector */}
            <div className="hidden md:flex items-center justify-center py-4">
              <div className="w-px h-20 bg-gradient-to-b from-[#D4A843]/30 to-[#D4A843]/10" />
            </div>

            {/* Step 2 - reversed */}
            <div className="group relative md:grid md:grid-cols-2 md:gap-16 items-center">
              {/* Text side (first on desktop for reverse) */}
              <div className="text-center md:text-right order-2 md:order-1">
                <h3 className="text-2xl md:text-3xl font-bold text-[#0B3D2E] mb-4">{t.landing.step2Title}</h3>
                <p className="text-[#0B3D2E]/55 text-base md:text-lg leading-relaxed max-w-md mx-auto md:mx-0 md:mr-0">
                  {t.landing.step2Desc}
                </p>
              </div>
              {/* Visual side */}
              <div className="relative flex items-center justify-center mb-8 md:mb-0 order-1 md:order-2">
                <div className="relative w-48 h-48 md:w-64 md:h-64 mx-auto">
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#D4A843]/20 group-hover:border-[#D4A843]/40 transition-colors duration-700 group-hover:animate-[spin_20s_linear_infinite]" />
                  <div className="absolute inset-4 md:inset-6 rounded-full bg-gradient-to-br from-[#D4A843] to-[#C49A3A] shadow-2xl shadow-[#D4A843]/30 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                    <CheckCircle className="w-14 h-14 md:w-20 md:h-20 text-white/90" />
                  </div>
                  <div className="absolute -top-2 -right-2 md:top-0 md:right-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#0B3D2E] shadow-lg shadow-[#0B3D2E]/30 flex items-center justify-center text-white font-bold text-xl md:text-2xl rotate-12 group-hover:rotate-0 transition-transform duration-500">
                    2
                  </div>
                </div>
              </div>
            </div>

            {/* Connector */}
            <div className="hidden md:flex items-center justify-center py-4">
              <div className="w-px h-20 bg-gradient-to-b from-[#D4A843]/30 to-[#D4A843]/10" />
            </div>

            {/* Step 3 */}
            <div className="group relative md:grid md:grid-cols-2 md:gap-16 items-center">
              {/* Visual side */}
              <div className="relative flex items-center justify-center mb-8 md:mb-0">
                <div className="relative w-48 h-48 md:w-64 md:h-64 mx-auto">
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#D4A843]/20 group-hover:border-[#D4A843]/40 transition-colors duration-700 group-hover:animate-[spin_20s_linear_infinite]" />
                  <div className="absolute inset-4 md:inset-6 rounded-full bg-gradient-to-br from-[#0B3D2E] to-[#16503A] shadow-2xl shadow-[#0B3D2E]/30 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                    <Calendar className="w-14 h-14 md:w-20 md:h-20 text-white/90" />
                  </div>
                  <div className="absolute -top-2 -right-2 md:top-0 md:right-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#D4A843] shadow-lg shadow-[#D4A843]/30 flex items-center justify-center text-white font-bold text-xl md:text-2xl rotate-12 group-hover:rotate-0 transition-transform duration-500">
                    3
                  </div>
                </div>
              </div>
              {/* Text side */}
              <div className="text-center md:text-right">
                <h3 className="text-2xl md:text-3xl font-bold text-[#0B3D2E] mb-4">{t.landing.step3Title}</h3>
                <p className="text-[#0B3D2E]/55 text-base md:text-lg leading-relaxed max-w-md mx-auto md:mx-0 md:mr-0">
                  {t.landing.step3Desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== WHY THIS INITIATIVE - Asymmetric bento ========== */}
      <section className="relative py-32 px-4 bg-[#0B3D2E] text-white overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-[#D4A843]/[0.05] blur-[150px] animate-blob-float pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-[#16503A]/30 blur-[120px] animate-blob-float-delayed pointer-events-none" />

        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4A843' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />

        <div className="container mx-auto max-w-6xl relative z-10">
          {/* Section label */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[#D4A843] text-xs font-bold tracking-[0.3em] uppercase">{t.landing.whyLabel}</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-6 leading-tight text-balance">
            {t.landing.whyTitle}
          </h2>
          <p className="text-center text-white/40 text-lg mb-16 max-w-xl mx-auto">
            {t.landing.whyDesc}
          </p>

          {/* Bento grid */}
          <div className="grid md:grid-cols-12 gap-4 md:gap-5">
            {/* Large card */}
            <div className="md:col-span-7 group relative bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] rounded-3xl p-10 md:p-12 hover:bg-white/[0.09] transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-[#D4A843] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="w-14 h-14 bg-[#D4A843]/15 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#D4A843]/25 transition-colors">
                <BookOpen className="w-7 h-7 text-[#D4A843]" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">{t.landing.reason1Title}</h3>
              <p className="text-white/50 text-lg leading-relaxed max-w-lg">
                {t.landing.reason1Desc}
              </p>
            </div>

            {/* Stacked small cards */}
            <div className="md:col-span-5 flex flex-col gap-4 md:gap-5">
              <div className="group relative bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] rounded-3xl p-8 hover:bg-white/[0.09] transition-all duration-500 flex-1 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-[#D4A843] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-12 h-12 bg-[#D4A843]/15 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#D4A843]/25 transition-colors">
                  <Shield className="w-6 h-6 text-[#D4A843]" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t.landing.reason2Title}</h3>
                <p className="text-white/50 leading-relaxed text-[15px]">
                  {t.landing.reason2Desc}
                </p>
              </div>

              <div className="group relative bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] rounded-3xl p-8 hover:bg-white/[0.09] transition-all duration-500 flex-1 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-[#D4A843] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-12 h-12 bg-[#D4A843]/15 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#D4A843]/25 transition-colors">
                  <Award className="w-6 h-6 text-[#D4A843]" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t.landing.reason3Title}</h3>
                <p className="text-white/50 leading-relaxed text-[15px]">
                  {t.landing.reason3Desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== STATS - Elegant counter strip ========== */}
      <section className="relative py-24 px-4 bg-[#FAF8F4] overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full bg-[#D4A843]/[0.04] blur-[100px] animate-blob-float-delayed-2 pointer-events-none" />
        <div className="absolute bottom-1/3 left-0 w-[350px] h-[350px] rounded-full bg-[#0B3D2E]/[0.03] blur-[100px] animate-blob-float pointer-events-none" />

        <div className="absolute inset-0 opacity-[0.02]" style={{ background: 'radial-gradient(circle at 30% 50%, #D4A843 0%, transparent 50%), radial-gradient(circle at 70% 50%, #0B3D2E 0%, transparent 50%)' }} />

        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 md:gap-8">
            {/* Large stat */}
            <div className="text-center md:text-right flex-1">
              <div className="text-7xl md:text-8xl lg:text-9xl font-bold text-[#0B3D2E] leading-none" style={{ fontFeatureSettings: '"tnum"' }}>
                {masteredStudents.toLocaleString(t.locale === 'ar' ? 'ar-SA' : 'en-US')}
              </div>
              <p className="text-[#0B3D2E]/60 text-lg font-medium mt-2">{t.landing.statsMastered}</p>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-28 bg-gradient-to-b from-transparent via-[#D4A843]/40 to-transparent" />
            <div className="md:hidden h-px w-28 bg-gradient-to-l from-transparent via-[#D4A843]/40 to-transparent" />

            {/* Description */}
            <div className="flex-1 text-center md:text-right">
              <div className="flex items-center gap-1.5 justify-center md:justify-start mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#D4A843] text-[#D4A843]" />
                ))}
              </div>
              <p className="text-[#0B3D2E]/80 text-lg leading-relaxed font-medium">
                {t.landing.freeInitiative}
              </p>
              <p className="text-[#0B3D2E]/50 text-[15px] leading-relaxed mt-1">
                {t.landing.initiativeGoal}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FINAL CTA - Bold full-width ========== */}
      <section className="relative py-32 px-4 bg-[#0B3D2E] overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4A843] rounded-full blur-[200px] opacity-[0.06] animate-blob-float" />
          <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[#16503A] rounded-full blur-[150px] opacity-20 animate-blob-float-delayed" />
        </div>

        <div className="container mx-auto max-w-3xl relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight text-balance">
            {t.landing.finalCtaTitle}
          </h2>

          <p className="text-white/50 text-lg md:text-xl leading-relaxed mb-10 max-w-xl mx-auto">
            {t.landing.finalCtaDesc}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register" className="group bg-[#D4A843] text-white hover:bg-[#C49A3A] font-bold py-4 px-12 rounded-full transition-all duration-300 hover:scale-105 shadow-xl shadow-[#D4A843]/20 flex items-center gap-3 text-lg">
              <span>{t.landing.finalCtaBtn}</span>
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <Link href="/reader-register" className="text-white/40 hover:text-[#D4A843] text-sm transition-colors border-b border-white/10 hover:border-[#D4A843]/40 pb-0.5">
              {t.landing.readerJoin}
            </Link>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="py-8 px-4 bg-[#082A1F] border-t border-white/[0.06]">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-sm">
            {'2026 '}{t.appName}{'. '}{t.footer.rights}
          </p>
          <div className="flex items-center gap-6">
            <Link href="/reader-register" className="text-white/30 hover:text-[#D4A843] text-sm transition-colors">
              {t.landing.footerJoin}
            </Link>
            <span className="text-white/10">|</span>
            <Link href="/login" className="text-white/30 hover:text-[#D4A843] text-sm transition-colors">
              {t.landing.footerLogin}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
