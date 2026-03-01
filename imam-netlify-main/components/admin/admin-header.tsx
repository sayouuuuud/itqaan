"use client"

import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { NotificationBell } from "@/components/admin/notification-bell"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { toggleMobileSidebar } from "./admin-sidebar"

const pageTitles: Record<string, string> = {
  "/admin": "لوحة التحكم",
  "/admin/khutba": "إدارة الخطب",
  "/admin/dars": "إدارة الدروس",
  "/admin/articles": "إدارة المقالات",
  "/admin/books": "إدارة الكتب",
  "/admin/videos": "إدارة المرئيات",
  "/admin/media": "إدارة المرئيات",
  "/admin/categories": "التصنيفات",
  "/admin/subscribers": "المشتركين",
  "/admin/messages": "الرسائل",
  "/admin/settings": "الإعدادات",
  "/admin/about": "صفحة عن الشيخ",
  "/admin/hero": "إدارة القسم الرئيسي",
  "/admin/schedule": "جدول الدروس",
  "/admin/navbar": "القائمة العلوية",
  "/admin/notifications": "الإشعارات",
  "/admin/security": "الأمان",
  "/admin/contact-form": "رسائل التواصل",
  "/admin/profile": "الملف الشخصي",
  "/admin/logo": "إدارة الشعار",
  "/admin/search": "البحث",
}

export function AdminHeader({ user }: { user: any }) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()
  const title = pageTitles[pathname] || "لوحة التحكم"
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      // Redirect to global admin search page
      router.push(`/admin/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const getInitials = (fullName?: string, email?: string) => {
    if (fullName) {
      return fullName[0].toUpperCase()
    }
    if (email) {
      return email[0].toUpperCase()
    }
    return "م"
  }

  const getUserName = (user: any) => {
    return user?.user_metadata?.full_name || "المدير"
  }

  const getAvatarUrl = (user: any) => {
    return user?.user_metadata?.avatar_url
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background h-16 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden text-foreground p-2 hover:bg-muted rounded-lg transition-colors"
          onClick={toggleMobileSidebar}
          aria-label="فتح القائمة"
        >
          <span className="material-icons-outlined">menu</span>
        </button>

        <h1 className="text-xl font-bold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-muted rounded-lg px-3 py-2 border border-border">
          <span className="material-icons-outlined text-muted-foreground text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="بحث... (Enter)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="bg-transparent border-none outline-none text-sm w-40 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <ThemeToggle />
        <NotificationBell />
        {/* User Menu with Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              {getAvatarUrl(user) ? (
                <img
                  src={getAvatarUrl(user)}
                  alt="صورة الملف الشخصي"
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
                  {getInitials(getUserName(user), user?.email)}
                </div>
              )}
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-foreground">
                  {getUserName(user)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.email || "admin@site.com"}
                </p>
              </div>

              <span className="material-icons-outlined text-text-muted text-lg hidden md:block">
                expand_more
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{getUserName(user)}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>

            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/admin/security" className="flex items-center gap-2 cursor-pointer">
                <span className="material-icons-outlined text-lg">person</span>
                <span>الملف الشخصي</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/admin/settings" className="flex items-center gap-2 cursor-pointer">
                <span className="material-icons-outlined text-lg">settings</span>
                <span>الإعدادات</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/" target="_blank" className="flex items-center gap-2 cursor-pointer" rel="noreferrer">
                <span className="material-icons-outlined text-lg">open_in_new</span>
                <span>عرض الموقع</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
            >
              <span className="material-icons-outlined text-lg">logout</span>
              <span>تسجيل الخروج</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}