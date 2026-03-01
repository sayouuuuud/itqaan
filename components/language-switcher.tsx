"use client"

import { useI18n } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'

export function LanguageSwitcher({ variant = 'default' }: { variant?: 'default' | 'ghost' | 'outline' }) {
  const { locale, toggleLocale } = useI18n()

  return (
    <Button
      variant={variant === 'default' ? 'outline' : variant}
      size="sm"
      onClick={toggleLocale}
      className="gap-1.5 text-xs font-semibold"
    >
      <Globe className="h-3.5 w-3.5" />
      {locale === 'ar' ? 'EN' : 'ع'}
    </Button>
  )
}
