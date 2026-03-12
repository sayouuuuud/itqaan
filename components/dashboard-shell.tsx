"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'
import { LanguageSwitcher } from '@/components/language-switcher'
import { GlobalSearch } from '@/components/global-search'
import { NotificationDropdown } from '@/components/notification-dropdown'
import {
  LayoutDashboard, Mic, FileText, Calendar, Bell, User, LogOut,
  Menu, X, Users, Settings, BarChart3, ClipboardList, Clock, MessageSquare,
  Search, Plus, BookOpen, Award, UserCheck, CalendarCheck, CalendarDays,
  MessagesSquare, Megaphone, ScrollText, PieChart, Star, ShieldCheck,
  Globe, Home, Archive, Shield, Phone
} from 'lucide-react'

type NavItem = { href: string; label: string; icon: React.ElementType; badge?: number | string | null }
type NavSection = { title?: string; items: NavItem[] }

const getRoleConfig = (t: any): Record<'student' | 'reader' | 'admin' | 'student_supervisor' | 'reciter_supervisor', { sections: NavSection[], label: string, name: string, sublabel: string }> => ({
  student: {
    sections: [
      {
        items: [
          { href: '/student', label: t.student.dashboard, icon: LayoutDashboard },
          { href: '/student/recitations', label: t.student.recitations, icon: FileText },
          { href: '/student/sessions', label: t.student.sessions, icon: CalendarCheck },
          { href: '/student/chat', label: t.student.chat, icon: MessageSquare },
          { href: '/student/certificates', label: t.student.certificates || t.student.certificate, icon: Award },
        ]
      },
      {
        title: t.shell.account,
        items: [
          { href: '/student/notifications', label: t.student.notifications, icon: Bell },
          { href: '/student/profile', label: t.student.profile, icon: User },
        ]
      }
    ],
    label: t.shell?.studentPortal, name: t.auth.student, sublabel: t.auth.student
  },
  reader: {
    sections: [
      {
        items: [
          { href: '/reader', label: t.reader.dashboard, icon: LayoutDashboard },
          { href: '/reader/recitations', label: t.reader.reviewList, icon: ClipboardList },
          { href: '/reader/sessions', label: t.reader.sessions, icon: Calendar },
          { href: '/reader/schedule', label: t.reader.schedule, icon: Clock },
          { href: '/reader/chat', label: t.reader.chat, icon: MessageSquare },
          { href: '/reader/notifications', label: t.student.notifications, icon: Bell },
          { href: '/reader/profile', label: t.reader.profile, icon: User },
        ]
      }
    ],
    label: t.shell?.certifiedReader, name: t.shell?.certifiedReader, sublabel: t.shell?.certifiedReader
  },
  admin: {
    sections: [
      {
        title: t.main, items: [
          { href: '/admin', label: t.admin.dashboard, icon: LayoutDashboard },
        ]
      },
      {
        title: t.management, items: [
          { href: '/admin/users', label: t.admin.users, icon: Users },
          { href: '/admin/readers', label: t.admin.readers, icon: BookOpen },
          { href: '/admin/reader-applications', label: t.admin.readerApplications, icon: UserCheck },
          { href: '/admin/recitations', label: t.admin.recitations, icon: FileText },
          { href: '/admin/bookings', label: t.admin.bookings, icon: CalendarDays },
          { href: '/admin/conversations', label: t.admin.conversations, icon: MessagesSquare },
          { href: '/admin/certificates', label: t.admin.certificates.title, icon: Award },
        ]
      },
      {
        title: t.shell.statsAndReports, items: [
          { href: '/admin/reports', label: t.admin.reports, icon: BarChart3 },
          { href: '/admin/activity-logs', label: t.admin.activityLogs, icon: ScrollText },
        ]
      },
      {
        title: t.admin.settings, items: [
          { href: '/admin/notifications', label: t.student.notifications, icon: Bell },
          { href: '/admin/announcements', label: t.admin.announcements, icon: Megaphone },
          { href: '/admin/email-templates', label: t.admin.emailTemplates, icon: ScrollText },
          { href: '/admin/settings', label: t.admin.systemSettings, icon: Settings },
        ]
      },
      {
        title: t.shell.advancedTools, items: [
          { href: '/admin/homepage', label: t.admin.homepage, icon: Home },
          { href: '/admin/seo', label: t.admin.seo, icon: Globe },
          { href: '/admin/security', label: t.admin.security, icon: Shield },
          { href: '/admin/backup', label: t.admin.backup, icon: Archive },
        ]
      },
    ],
    label: t.shell?.generalSupervisor, name: t.shell?.generalSupervisor, sublabel: t.shell?.generalSupervisor
  },
  student_supervisor: {
    sections: [
      {
        items: [
          { href: '/admin', label: t.admin.dashboard, icon: LayoutDashboard },
          { href: '/admin/users', label: t.admin.users, icon: Users },
          { href: '/admin/recitations', label: t.admin.recitations, icon: FileText },
          { href: '/admin/conversations', label: t.admin.conversations, icon: MessagesSquare },
        ]
      },
      {
        title: t.shell.account,
        items: [
          { href: '/admin/profile', label: t.student.profile, icon: User },
        ]
      }
    ],
    label: t.auth.studentSupervisor, name: t.auth.studentSupervisor, sublabel: t.auth.studentSupervisor
  },
  reciter_supervisor: {
    sections: [
      {
        items: [
          { href: '/admin', label: t.admin.dashboard, icon: LayoutDashboard },
          { href: '/admin/readers', label: t.admin.readers, icon: BookOpen },
          { href: '/admin/reader-applications', label: t.admin.readerApplications, icon: UserCheck },
          { href: '/admin/recitations', label: t.admin.recitations, icon: FileText },
          { href: '/admin/conversations', label: t.admin.conversations, icon: MessagesSquare },
        ]
      },
      {
        title: t.shell.account,
        items: [
          { href: '/admin/profile', label: t.student.profile, icon: User },
        ]
      }
    ],
    label: t.auth.reciterSupervisor, name: t.auth.reciterSupervisor, sublabel: t.auth.reciterSupervisor
  }
})

export function DashboardShell({ role, children, headerTitle }: { role: 'student' | 'reader' | 'admin' | 'student_supervisor' | 'reciter_supervisor'; children: React.ReactNode; headerTitle?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { t } = useI18n()
  const [user, setUser] = useState<{ name: string; email: string; role: string; avatar_url?: string | null } | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  // Heartbeat to track online presence
  useEffect(() => {
    const pingHeartbeat = async () => {
      try {
        await fetch('/api/auth/heartbeat', { method: 'POST' })
      } catch (e) { }
    }

    // Initial ping on load
    pingHeartbeat()

    // Ping every 2 minutes while dashboard is open
    const interval = setInterval(pingHeartbeat, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        }
      } catch (err) {
        console.error("Failed to fetch user session", err)
      }
    }
    async function fetchCounts() {
      try {
        const res = await fetch('/api/unread-counts')
        if (res.ok) {
          const data = await res.json()
          setUnreadCount(data.notifications || 0)
          setUnreadMessages(data.messages || 0)
        }
      } catch { }
    }
    fetchUser()
    fetchCounts()
    const interval = setInterval(fetchCounts, 30000)
    return () => clearInterval(interval)
  }, [])

  const rawConfig = getRoleConfig(t)[role]

  // Inject unread direct message counts into the sidebar items
  const sectionsWithBadges = rawConfig.sections.map(section => ({
    ...section,
    items: section.items.map(item => {
      // For student/reader 'chat' or admin 'admin/chat' or 'conversations'
      const isChat = item.href.endsWith('/chat') || item.href.endsWith('/conversations')
      if (isChat && unreadMessages > 0) {
        return { ...item, badge: unreadMessages }
      }
      return item
    })
  }))

  const userName = user?.name || rawConfig.name
  const config = { ...rawConfig, name: userName, sections: sectionsWithBadges }
  const isReader = role === 'reader'

  const sidebarBase = 'bg-white border-l border-gray-200'

  const isActive = (href: string) => pathname === href || (href !== `/${role}` && pathname.startsWith(href + '/'))

  return (
    <div className="theme-islamic h-screen flex overflow-hidden bg-slate-50 transition-colors duration-500">
      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 right-0 z-50 w-72 flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static shadow-sm',
        sidebarOpen ? 'translate-x-0' : 'translate-x-full',
        sidebarBase
      )}>
        <div className="w-full flex items-center border-b border-gray-100">
          <Link href="/" className="w-full">
            <img 
              src="/branding/dashboard-logo.png" 
              alt="Itqan Dashboard Logo" 
              className="w-full h-auto object-cover" 
            />
          </Link>
          <button className="lg:hidden absolute left-4 p-1" onClick={() => setSidebarOpen(false)} aria-label="close">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {config.sections.map((section, si) => (
            <div key={si}>
              {section.title && (
                <div className={cn('text-xs font-semibold uppercase tracking-wider mb-4 px-2', si > 0 && 'mt-8', 'text-gray-400')}>
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm group',
                      active
                        ? role === 'admin' ? 'bg-[#0B3D2E]/10 text-[#0B3D2E] font-bold shadow-sm' : 'bg-[#0B3D2E]/5 text-[#0B3D2E] font-bold border border-[#0B3D2E]/10'
                        : role === 'admin' ? 'text-gray-600 hover:bg-[#0B3D2E]/5 hover:text-[#0B3D2E]' : 'text-slate-500 hover:text-[#0B3D2E] hover:bg-slate-50'
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="font-medium">{item.label}</span>
                    {item.badge ? (
                      <span className="mr-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{item.badge}</span>
                    ) : (item.label === t.student.notifications || item.label === t.notifications.title || item.href.includes('notifications')) ? (
                      unreadCount > 0 && (
                        <span className="mr-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )
                    ) : null}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-2 bg-slate-50 border border-slate-100 transition-colors">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-emerald-100 text-[#0B3D2E] flex items-center justify-center font-bold text-sm ring-2 ring-white shadow-sm shrink-0">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={config.name} className="w-full h-full object-cover" />
              ) : (
                <span>{(config.name || t.userFallbackLetter || 'U')[0]}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{config.name}</p>
              <p className="text-xs text-slate-500 truncate">{config.sublabel}</p>
            </div>
          </div>

          <Link href="/" className="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm text-slate-500 hover:text-[#0B3D2E]">
            <Globe className="w-4 h-4" />
            <span>عرض الموقع</span>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <header className={cn(
          'border-b border-gray-200 flex items-center justify-between px-6 lg:px-8 bg-white/80 backdrop-blur-md z-10 sticky top-0',
          role === 'student' ? 'h-20' : 'h-16'
        )}>
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-slate-500 hover:text-[#0B3D2E]" onClick={() => setSidebarOpen(true)} aria-label="open menu">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-700 hidden lg:block">{headerTitle || config.label}</h2>
          </div>
          <div className="flex items-center gap-4">
            {role !== 'student' && (
              <div className="hidden md:block">
                <GlobalSearch role={role as 'admin' | 'reader'} />
              </div>
            )}
            <LanguageSwitcher variant="outline" />

            <NotificationDropdown
              role={role}
              unreadCount={unreadCount}
              onRefresh={async () => {
                const res = await fetch('/api/unread-counts')
                if (res.ok) {
                  const data = await res.json()
                  setUnreadCount(data.notifications || 0)
                }
              }}
            />

            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' })
                router.push('/')
                router.refresh()
              }}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title={t.logout}
            >
              <LogOut className="w-5 h-5" />
            </button>

          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
