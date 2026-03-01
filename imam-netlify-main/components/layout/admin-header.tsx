"use client"

import { ThemeToggle } from "@/components/ui/theme-toggle"

interface AdminHeaderProps {
  onAddNew?: () => void
}

export function AdminHeader({ onAddNew }: AdminHeaderProps) {
  return (
    <header className="h-20 bg-card border-b border-border flex items-center justify-between px-8 z-10 shadow-sm">
      {/* Search */}
      <div className="flex items-center flex-1 max-w-lg">
        <div className="relative w-full">
          <span className="material-icons-outlined absolute right-3 top-2.5 text-muted-foreground">
            search
          </span>
          <input
            type="text"
            placeholder="بحث في المحتوى، الدروس، المقالات..."
            className="w-full bg-background border-none rounded-xl py-2.5 pr-10 pl-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm placeholder-muted-foreground"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <button className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors relative">
          <span className="material-icons-outlined">
            notifications
          </span>
          <span className="absolute top-2 left-2 w-2 h-2 bg-red-500 rounded-full border border-background"></span>
        </button>

        {onAddNew && (
          <button
            onClick={onAddNew}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-md"
          >
            <span className="material-icons-outlined text-lg">
              add
            </span>
            <span>
              إضافة جديد
            </span>
          </button>
        )}
      </div>
    </header>
  )
}