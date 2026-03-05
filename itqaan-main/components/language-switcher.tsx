"use client"

import { useI18n } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LanguageSwitcher({
  variant = 'default',
  className
}: {
  variant?: 'default' | 'ghost' | 'outline',
  className?: string
}) {
  const { locale, toggleLocale } = useI18n()

  return (
    <Button
      variant={variant === 'default' ? 'outline' : variant}
      size="sm"
      onClick={toggleLocale}
      className={cn("gap-1.5 text-xs font-semibold", className)}
    >
      <Globe className="h-3.5 w-3.5" />
      {locale === 'ar' ? 'EN' : 'ع'}
    </Button>
  )
}
