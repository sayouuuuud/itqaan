"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: string
}

const mainNavItems: NavItem[] = [
  { href: "/admin", label: "لوحة التحكم", icon: "dashboard" },
  { href: "/admin/lessons", label: "الدروس والمحاضرات", icon: "menu_book" },
  { href: "/admin/articles", label: "المقالات العلمية", icon: "article" },
  { href: "/admin/books", label: "مكتبة الكتب", icon: "library_books" },
  { href: "/admin/khutba", label: "الخطب المنبرية", icon: "mic" },
  { href: "/admin/media", label: "المرئيات والصوتيات", icon: "video_library" },
]

const managementNavItems: NavItem[] = [
  { href: "/admin/categories", label: "التصنيفات", icon: "category" },
  { href: "/admin/comments", label: "إدارة التعليقات", icon: "comment" },
  { href: "/admin/subscribers", label: "المشتركين", icon: "people" },
  { href: "/admin/settings", label: "الإعدادات", icon: "settings" },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-72 bg-primary text-white hidden md:flex flex-col shadow-xl z-20 relative min-h-screen">
      {/* Logo Header */}
      <div className="p-8 flex items-center gap-3 border-b border-white/10">
        <div className="bg-background/20 p-2 rounded-lg">
          <span className="material-icons-outlined text-3xl text-secondary">
            mosque
          </span>
        </div>

        <div>
          <h1 className="font-bold text-lg leading-tight font-serif">
            الشيخ السيد مراد
          </h1>
          <p className="text-xs text-gray-300 opacity-80">
            لوحة الإدارة العامة
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {/* Main Navigation */}
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-4">
            الرئيسية
          </h3>
          <ul className="space-y-1">
            {mainNavItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-xl transition-all group",
                    pathname === item.href
                      ? "bg-background/10 text-secondary font-medium"
                      : "text-gray-300 hover:bg-background/5 hover:text-white"
                  )}
                >
                  <span className="material-icons-outlined">{item.icon}</span>
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Management */}
        <div>
          <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-4">
            الإدارة
          </h3>
          <ul className="space-y-1">
            {managementNavItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-xl transition-all group",
                    pathname === item.href
                      ? "bg-background/10 text-secondary font-medium"
                      : "text-gray-300 hover:bg-background/5 hover:text-white"
                  )}
                >
                  <span className="material-icons-outlined">{item.icon}</span>
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </aside>
  )
}