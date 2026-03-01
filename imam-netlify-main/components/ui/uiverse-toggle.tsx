'use client'

import { cn } from '@/lib/utils'

interface UiverseToggleProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function UiverseToggle({
  checked,
  onCheckedChange,
  disabled = false,
  className
}: UiverseToggleProps) {
  return (
    <label className={cn("switch", className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onCheckedChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="slider"></span>
    </label>
  )
}