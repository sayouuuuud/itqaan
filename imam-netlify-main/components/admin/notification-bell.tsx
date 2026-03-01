"use client"

import { useState, useEffect } from "react"
import { Bell, CheckCheck, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    loadNotifications()

    // Subscribe to real-time notifications
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        console.log('[NOTIFICATION-BELL] Real-time update:', payload.eventType, payload.new?.is_read)
        loadNotifications()
      })
      .subscribe((status) => {
        console.log('[NOTIFICATION-BELL] Subscription status:', status)
      })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function loadNotifications() {
    console.log("[NOTIFICATION-BELL] Loading notifications...")
    const { data, count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(5)

    if (error) {
      console.error("[NOTIFICATION-BELL] Error loading notifications:", error)
    } else if (data) {
      console.log("[NOTIFICATION-BELL] Loaded notifications:", data.length, "unread count:", count)
      setNotifications(data)
      setUnreadCount(count || 0)
      console.log("[NOTIFICATION-BELL] Updated unread count to:", count || 0)
    }
  }

  async function markAsRead(id: string) {
    console.log("[NOTIFICATION-BELL] Marking notification as read:", id)
    await supabase.from("notifications").update({ is_read: true }).eq("id", id)
    loadNotifications()
  }

  async function markAllAsRead() {
    console.log("[NOTIFICATION-BELL] Marking all notifications as read")
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false)
    loadNotifications()
  }

  async function clearAllRead() {
    if (confirm("هل أنت متأكد من حذف جميع الإشعارات المقروءة؟")) {
      console.log("[NOTIFICATION-BELL] Clearing all read notifications")
      await supabase.from("notifications").delete().eq("is_read", true)
      loadNotifications()
    }
  }

  return (
    <DropdownMenu>
<DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
<Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm">
              {unreadCount > 99 ? "99+" : unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
<div className="px-4 py-3 border-b border-border">
          <h4 className="font-bold text-foreground">الإشعارات</h4>
</div>
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground">
<Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">لا توجد إشعارات جديدة</p>
</div>
        ) : (
          notifications.map((notification) => {
            // Determine the link based on notification type
            const getNotificationLink = (notification: any) => {
              if (notification.source_type === "contact_message") {
                return `/admin/contact-form?id=${notification.source_id}`
              } else if (notification.source_type === "subscriber") {
                return `/admin/subscribers`
              }
              return null
            }

const notificationLink = getNotificationLink(notification)
            const NotificationWrapper = notificationLink ? Link : 'div'

            return (
              <NotificationWrapper
                key={notification.id}
                {...(notificationLink ? { href: notificationLink } : {})}
              >
<DropdownMenuItem
              className="px-4 py-3 cursor-pointer"
                  onClick={(e) => {
                    if (!notificationLink) {
                      e.preventDefault()
                      markAsRead(notification.id)
                    }
                  }}
            >
              <div>
<p className="font-medium text-foreground text-sm">{notification.title}</p>
<p className="text-xs text-muted-foreground line-clamp-1">{notification.message}</p>
</div>
            </DropdownMenuItem>
</NotificationWrapper>
            )
          })
        )}
        <DropdownMenuSeparator />
<div className="p-2 space-y-1">
          <DropdownMenuItem
            onClick={markAllAsRead}
disabled = {unreadCount === 0}
className="flex items-center gap-2 cursor-pointer"
          >
<CheckCheck className="h-4 w-4" />
            <span>تحديد الكل كمقروء</span>
</DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => {
              if (confirm("هل أنت متأكد من حذف جميع الإشعارات؟")) {
                console.log("[NOTIFICATION-BELL] Clearing all notifications")
                const { error } = await supabase
                  .from("notifications")
                  .delete()
                  .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all (dummy condition)

                if (error) {
                  console.error("Error clearing all notifications:", error)
                } else {
                  console.log("[NOTIFICATION-BELL] ✅ All notifications cleared")
                  loadNotifications()
                }
              }
            }}
disabled = {notifications.length === 0}
className="flex items-center gap-2 cursor-pointer text-destructive"
          >
            <Trash2 className="h-4 w-4" />
<span>حذف الكل</span>
</DropdownMenuItem>
        </div>
<DropdownMenuSeparator />
        <div className="px-4 py-2">
<Link href="/admin/notifications" className="text-sm text-primary hover:underline block text-center">
            عرض الكل
          </Link>
</div>
      </DropdownMenuContent>
</DropdownMenu>
  )
}
