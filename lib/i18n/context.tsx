"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { ar } from './locales/ar'
import { en } from './locales/en'

export type Locale = 'ar' | 'en'
type Translations = {
  [key: string]: any
}

const translations: Record<Locale, Translations> = { ar: ar as Translations, en: en as Translations }

interface I18nContextType {
  locale: Locale
  dir: 'rtl' | 'ltr'
  t: Translations
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ar')

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    document.documentElement.lang = newLocale
    document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr'
  }, [])

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'ar' ? 'en' : 'ar')
  }, [locale, setLocale])

  return (
    <I18nContext.Provider
      value={{
        locale,
        dir: locale === 'ar' ? 'rtl' : 'ltr',
        t: translations[locale],
        setLocale,
        toggleLocale,
      }}
    >
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used within LanguageProvider')
  return context
}
