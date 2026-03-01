"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Trash2, Check, CheckCheck, Bell, MessageSquare, UserPlus, RefreshCw, MailOpen, Star } from "lucide-react"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error" | "contact" | "subscriber"
  is_read: boolean
  created_at: string
  link?: string
  source_id?: string
  source_type?: string
}

const typeColors = {
  info: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  success: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  warning: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  error: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  contact: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  subscriber: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
}

const typeLabels = {
  info: "معلومة",
  success: "نجاح",
  warning: "تحذير",
  error: "خطأ",
  contact: "رسالة تواصل",
  subscriber: "مشترك جديد",
}

const typeIcons = {
  info: Bell,
  success: Check,
  warning: Bell,
  error: Bell,
  contact: MessageSquare,
  subscriber: UserPlus,
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [checkingMessages, setCheckingMessages] = useState(false)
  const [checkingSubscribers, setCheckingSubscribers] = useState(false)
  const [lastRealtimeUpdate, setLastRealtimeUpdate] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const [manuallyMarkedRead, setManuallyMarkedRead] = useState<Set<string>>(new Set())
  const [sessionStartTime] = useState(Date.now())
  const supabase = createClient()

  const loadNotifications = useCallback(async () => {
    console.log("[NOTIFICATIONS] 📥 Loading notifications...")
    console.log("[NOTIFICATIONS] Querying notifications table...")

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[NOTIFICATIONS] ❌ Error loading notifications:", error)
      console.error("[NOTIFICATIONS] Error details:", {
        message: error.message,
        code: error.code,
      })
    } else if (data) {
      console.log("[NOTIFICATIONS] ✅ Loaded notifications:", data.length)
      console.log("[NOTIFICATIONS] 📋 Notifications summary:", data.map(n => ({
        id: n.id,
        title: n.title,
        type: n.type,
        is_read: n.is_read,
      })))

      const unreadCount = data.filter(n => !n.is_read).length
      console.log(`[NOTIFICATIONS] 📊 Total: ${data.length}, Unread: ${unreadCount}`)

      // Apply manual read status from local state, but respect database state
      const notificationsWithLocalStatus = data.map(notification => {
        // If notification is marked as read in database, remove from manual set
        if (notification.is_read && manuallyMarkedRead.has(notification.id)) {
          setManuallyMarkedRead(prev => {
            const newSet = new Set(prev)
            newSet.delete(notification.id)
            return newSet
          })
        }

        // Apply manual read status only if not already read in database
        return {
          ...notification,
          is_read: notification.is_read || manuallyMarkedRead.has(notification.id)
        }
      })

      setNotifications(notificationsWithLocalStatus)
    } else {
      console.log("[NOTIFICATIONS] ⚠️ No notifications data returned")
      setNotifications([])
    }
  }, [supabase])

  async function checkNewContactMessages() {
    if (checkingMessages || isInitialized) {
      console.log("[NOTIFICATIONS] ⏳ Already checking messages or initialized, skipping...")
      return
    }

    setCheckingMessages(true)
    try {
      console.log("[NOTIFICATIONS] 🔍 Checking for new contact messages...")
      console.log("[NOTIFICATIONS] Querying contact_messages table...")

      const { data: messages, error: messagesError } = await supabase
        .from("contact_messages")
        .select("id, name, subject, created_at")
        .eq("is_read", false)

      if (messagesError) {
        console.error("[NOTIFICATIONS] ❌ Error querying contact_messages:", messagesError)
        return
      }

      console.log("[NOTIFICATIONS] 📬 Found unread messages:", messages?.length || 0)

      if (messages && messages.length > 0) {
        console.log("[NOTIFICATIONS] 📋 Messages details:", messages.map(m => ({
          id: m.id,
          name: m.name,
        })))
      }

      if (!messages || messages.length === 0) {
        console.log("[NOTIFICATIONS] ℹ️ No unread messages found")
        return
      }

      // Create notifications for new messages that don't have one yet
      for (const m of messages) {
        console.log(`[NOTIFICATIONS] 🔎 Checking if notification exists for message ${m.id}...`)

        const { data: existing, error: existingError } = await supabase
          .from("notifications")
          .select("id")
          .eq("source_id", m.id)
          .eq("source_type", "contact_message")
          .limit(1)

        if (existingError) {
          console.error("[NOTIFICATIONS] ❌ Error checking existing notification:", existingError)
          continue
        }

        if (existing && existing.length > 0) {
          console.log(`[NOTIFICATIONS] ⏭️ Notification already exists for message ${m.id}`)
          continue
        }

        console.log(`[NOTIFICATIONS] 🆕 Creating notification for message ${m.id}...`)
        console.log(`[NOTIFICATIONS] Message details: ${m.name} - ${m.subject}`)

        const { data: newNotification, error: insertError } = await supabase
          .from("notifications")
          .insert({
            title: "رسالة تواصل جديدة",
            message: `رسالة من ${m.name || "زائر"}: ${m.subject || "بدون موضوع"}`,
            type: "contact",
            is_read: false,
            source_id: m.id,
            source_type: "contact_message",
          })
          .select()

        if (insertError) {
          console.error("[NOTIFICATIONS] ❌ Error creating notification:", insertError)
        } else {
          console.log("[NOTIFICATIONS] ✅ Notification created successfully:", newNotification?.[0]?.id)
        }
      }

      console.log("[NOTIFICATIONS] 🎉 Finished processing contact messages")
    } catch (error) {
      console.error("[NOTIFICATIONS] 💥 Unexpected error checking contact messages:", error)
    } finally {
      setCheckingMessages(false)
    }
  }

  async function checkNewSubscribers() {
    if (checkingSubscribers || isInitialized) {
      console.log("[NOTIFICATIONS] ⏳ Already checking subscribers or initialized, skipping...")
      return
    }

    setCheckingSubscribers(true)
    try {
      console.log("[NOTIFICATIONS] Checking for new subscribers...")
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: subscribers } = await supabase
        .from("subscribers")
        .select("id, whatsapp_number, telegram_username, subscribed_at")
        .gte("subscribed_at", oneDayAgo)

      console.log("[NOTIFICATIONS] Found recent subscribers:", subscribers?.length || 0)

      if (!subscribers || subscribers.length === 0) return

      for (const s of subscribers) {
        const { data: existing, error: existingError } = await supabase
          .from("notifications")
          .select("id")
          .eq("source_id", s.id)
          .eq("source_type", "subscriber")
          .limit(1)

        if (existingError) {
          console.error("[NOTIFICATIONS] ❌ Error checking existing subscriber notification:", existingError)
          continue
        }

        if (existing && existing.length > 0) {
          console.log("[NOTIFICATIONS] ⏭️ Notification already exists for subscriber:", s.id)
        } else {
          console.log("[NOTIFICATIONS] 🆕 Creating notification for subscriber:", s.id)
          const { error } = await supabase
            .from("notifications")
            .insert({
              title: "مشترك جديد",
              message: `انضم مشترك جديد: ${s.whatsapp_number || s.telegram_username || "بدون رقم"}`,
              type: "subscriber",
              is_read: false,
              source_id: s.id,
              source_type: "subscriber",
            })

          if (error) {
            console.error("[NOTIFICATIONS] ❌ Error creating subscriber notification:", error)
          } else {
            console.log("[NOTIFICATIONS] ✅ Subscriber notification created successfully")
          }
        }
      }
    } catch (error) {
      console.error("[NOTIFICATIONS] Error checking subscribers:", error)
    } finally {
      setCheckingSubscribers(false)
    }
  }

  useEffect(() => {
    if (isInitialized) {
      console.log('[NOTIFICATIONS] Already initialized, skipping...')
      return
    }

    console.log('[NOTIFICATIONS] Initializing notifications page...')

    async function init() {
      console.log('[NOTIFICATIONS] Starting initialization...')
      setIsInitialized(true)
      setLoading(true)

      // Only load existing notifications on page load
      // Don't check for new messages/subscribers to prevent duplicates
      await loadNotifications()

      setLoading(false)
      console.log('[NOTIFICATIONS] Initialization completed')
    }

    init()

    // Note: Database triggers now handle notification creation automatically
    // These realtime subscriptions are kept for immediate UI updates only
    console.log('[NOTIFICATIONS] Setting up contact messages subscription for UI updates...')
    const contactSubscription = supabase
      .channel('contact_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'contact_messages',
      }, async (payload) => {
        const now = Date.now()
        if (now - lastRealtimeUpdate < 5000) { // Debounce for 5 seconds
          console.log('[NOTIFICATION] ⏳ Debouncing contact message update...')
          return
        }
        setLastRealtimeUpdate(now)

        console.log('[NOTIFICATION] 🎯 New contact message detected (UI update):', payload.new?.id)

        // Only process if message is unread
        if (payload.new?.is_read === false) {
          console.log('[NOTIFICATION] 📬 Message is unread, checking for existing notification...')

          // Check if notification already exists for this message
          const { data: existing } = await supabase
            .from("notifications")
            .select("id")
            .eq("source_id", payload.new.id)
            .eq("source_type", "contact_message")
            .limit(1)

          if (!existing || existing.length === 0) {
            console.log('[NOTIFICATION] 🆕 No existing notification found, reloading...')
            await loadNotifications()
          } else {
            console.log('[NOTIFICATION] ⏭️ Notification already exists, skipping reload')
          }
        } else {
          console.log('[NOTIFICATION] 📭 Message is already read, ignoring')
        }

        console.log('[NOTIFICATION] UI updated for new contact message')
      })
      .subscribe((status) => {
        console.log('[NOTIFICATIONS] Contact subscription status:', status)
      })

    // Subscribe to real-time subscribers for UI updates
    console.log('[NOTIFICATIONS] Setting up subscribers subscription for UI updates...')
    const subscriberSubscription = supabase
      .channel('subscribers')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'subscribers',
      }, async (payload) => {
        const now = Date.now()
        if (now - lastRealtimeUpdate < 5000) { // Debounce for 5 seconds
          console.log('[NOTIFICATION] ⏳ Debouncing subscriber update...')
          return
        }
        setLastRealtimeUpdate(now)

        console.log('[NOTIFICATION] 👤 New subscriber detected (UI update):', payload.new?.id)

        // Check if notification already exists for this subscriber
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("source_id", payload.new.id)
          .eq("source_type", "subscriber")
          .limit(1)

        if (!existing || existing.length === 0) {
          console.log('[NOTIFICATION] 🆕 No existing notification found, reloading...')
          await loadNotifications()
        } else {
          console.log('[NOTIFICATION] ⏭️ Notification already exists, skipping reload')
        }

        console.log('[NOTIFICATION] UI updated for new subscriber')
      })
      .subscribe((status) => {
        console.log('[NOTIFICATIONS] Subscriber subscription status:', status)
      })

    // Periodic UI refresh every 5 minutes (database triggers handle creation)
    // Reduced frequency to prevent overriding optimistic updates
    console.log('[NOTIFICATIONS] Setting up periodic UI refresh every 5 minutes...')
    const interval = setInterval(async () => {
      console.log('[NOTIFICATION] ⏰ Periodic UI refresh...')
      await loadNotifications()
      console.log('[NOTIFICATION] ⏰ UI refresh completed')
    }, 300000) // 5 minutes

    // Subscribe to notification changes for UI consistency
    console.log('[NOTIFICATIONS] Setting up notifications subscription for UI consistency...')
    const notificationSubscription = supabase
      .channel('notification_changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
      }, async (payload) => {
        const now = Date.now()
        if (now - lastRealtimeUpdate < 10000) { // Longer debounce for updates
          console.log('[NOTIFICATION] ⏳ Debouncing notification update...')
          return
        }
        setLastRealtimeUpdate(now)

        console.log('[NOTIFICATION] 📝 Notification updated (UI sync):', payload.new?.id, payload.new?.is_read)
        // Only reload if this is an external change (not from this page)
        // This prevents overriding optimistic updates
        await loadNotifications()
      })
      .subscribe((status) => {
        console.log('[NOTIFICATIONS] Notification subscription status:', status)
      })

    return () => {
      console.log('[NOTIFICATIONS] Cleaning up subscriptions...')
      setIsInitialized(false)
      setManuallyMarkedRead(new Set()) // Clear manual read status on cleanup
      contactSubscription.unsubscribe()
      subscriberSubscription.unsubscribe()
      notificationSubscription.unsubscribe()
      clearInterval(interval)
      console.log('[NOTIFICATIONS] Cleanup completed')
    }
  }, [loadNotifications])

  async function handleRefresh() {
    if (refreshing) return // Prevent multiple simultaneous refreshes

    setRefreshing(true)
    try {
      // Only reload notifications, don't check for new messages/subscribers
      // The realtime subscriptions handle new messages automatically
      await loadNotifications()
    } finally {
      setRefreshing(false)
    }
  }

  async function markAsRead(id: string) {
    console.log("[NOTIFICATIONS] Marking notification as read:", id)

    // Add to manually marked read set
    setManuallyMarkedRead(prev => new Set([...prev, id]))

    // Optimistic update - mark as read immediately in UI
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, is_read: true } : n
    ))

    // Update in database with error handling
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)

      if (error) {
        console.error("Error marking notification as read:", error)
        // Revert optimistic update on error
        setNotifications(prev => prev.map(n =>
          n.id === id ? { ...n, is_read: false } : n
        ))
      } else {
        console.log("[NOTIFICATIONS] ✅ Notification marked as read in database")
      }
    } catch (err) {
      console.error("Unexpected error marking notification as read:", err)
      // Revert on any error
      setNotifications(prev => prev.map(n =>
        n.id === id ? { ...n, is_read: false } : n
      ))
    }
  }

  async function markAllAsRead() {
    console.log("[NOTIFICATIONS] Marking all notifications as read")

    // Add all notification IDs to manually marked read set
    setManuallyMarkedRead(prev => {
      const newSet = new Set(prev)
      notifications.forEach(n => newSet.add(n.id))
      return newSet
    })

    // Optimistic update - mark all as read immediately in UI
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))

    // Update in database with error handling
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("is_read", false)

      if (error) {
        console.error("Error marking all notifications as read:", error)
        // Reload to revert optimistic update on error
        await loadNotifications()
      } else {
        console.log("[NOTIFICATIONS] ✅ All notifications marked as read in database")
      }
    } catch (err) {
      console.error("Unexpected error marking all notifications as read:", err)
      // Reload on any error
      await loadNotifications()
    }
  }

  async function deleteNotification(id: string) {
    await supabase.from("notifications").delete().eq("id", id)
    loadNotifications()
  }

  async function clearAllRead() {
    console.log("[NOTIFICATIONS] === STARTING CLEAR ALL READ ===")

    if (!confirm("هل أنت متأكد من حذف جميع الإشعارات المقروءة؟")) {
      console.log("[NOTIFICATIONS] User cancelled clear all read")
      return
    }

    console.log("[NOTIFICATIONS] Clearing all read notifications")
    console.log("[NOTIFICATIONS] Current notifications state:", notifications.map(n => ({
      id: n.id,
      is_read: n.is_read,
    })))

    // Get IDs of notifications that are read (either in DB or manually marked)
    const readNotificationIds = notifications
      .filter(n => n.is_read || manuallyMarkedRead.has(n.id))
      .map(n => n.id)

    console.log("[NOTIFICATIONS] Read notification IDs to delete:", readNotificationIds)
    console.log("[NOTIFICATIONS] Total notifications before filter:", notifications.length)
    console.log("[NOTIFICATIONS] Read notifications count:", readNotificationIds.length)

    // Optimistic update - remove read notifications immediately from UI
    const beforeCount = notifications.length
    setNotifications(prev => {
      const filtered = prev.filter(n => !n.is_read && !manuallyMarkedRead.has(n.id))
      console.log("[NOTIFICATIONS] After optimistic update - before:", beforeCount, "after:", filtered.length)
      return filtered
    })

    // Clear from manually marked read set
    console.log("[NOTIFICATIONS] Clearing manually marked read set")
    setManuallyMarkedRead(new Set())

    // Delete from database with error handling
    try {
      if (readNotificationIds.length > 0) {
        console.log("[NOTIFICATIONS] Deleting from database with IDs:", readNotificationIds)

        const { error, count } = await supabase
          .from("notifications")
          .delete({ count: 'exact' })
          .in("id", readNotificationIds)

        console.log("[NOTIFICATIONS] Database delete result - error:", error, "count:", count)

        if (error) {
          console.error("Error clearing read notifications:", error)
          console.error("Error details:", {
            message: error.message,
            code: error.code,
          })
          // Reload to revert optimistic update on error
          await loadNotifications()
        } else {
          console.log("[NOTIFICATIONS] ✅ Read notifications cleared from database, deleted count:", count)

          // Double check - query database to see remaining notifications
          const { data: remaining, error: checkError } = await supabase
            .from("notifications")
            .select("id, is_read")
            .in("id", readNotificationIds)

          console.log("[NOTIFICATIONS] Double check - remaining notifications in DB:", remaining)
          if (checkError) console.error("Check error:", checkError)
        }
      } else {
        console.log("[NOTIFICATIONS] ℹ️ No read notifications to clear")
      }
    } catch (err) {
      console.error("Unexpected error clearing read notifications:", err)
      console.error("Error stack:", err.stack)
      // Reload on any error
      await loadNotifications()
    }

    console.log("[NOTIFICATIONS] === FINISHED CLEAR ALL READ ===")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-serif flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            الإشعارات
            {unreadCount > 0 && (
              <span className="text-sm px-2 py-1 rounded-full bg-primary text-white">{unreadCount} جديد</span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">إشعارات رسائل التواصل والمشتركين الجدد</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${refreshing ? "animate-spin" : ""}`} />
            تحديث
          </Button>

          <Button
            variant="outline"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="h-4 w-4 ml-2" />
            تحديد الكل كمقروء
          </Button>

          <Button
            variant="outline"
            onClick={clearAllRead}
            disabled={notifications.filter((n) => n.is_read).length === 0}
          >
            <Trash2 className="h-4 w-4 ml-2" />
            حذف المقروءة
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {notifications.filter((n) => n.type === "contact").length}
            </p>
            <p className="text-sm text-text-muted">رسائل التواصل</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {notifications.filter((n) => n.type === "subscriber").length}
            </p>
            <p className="text-sm text-text-muted">مشتركين جدد</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{unreadCount}</p>
            <p className="text-sm text-text-muted">غير مقروءة</p>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {notifications.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-text-muted opacity-50" />
            <h3 className="text-lg font-bold text-foreground mb-2">لا توجد إشعارات</h3>
            <p className="text-text-muted">ستظهر الإشعارات الجديدة هنا عند وصول رسائل تواصل أو اشتراك مشتركين جدد</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => {
              const IconComponent = typeIcons[notification.type] || Bell

              // Determine the link based on notification type
              const getNotificationLink = (notification: Notification) => {
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
                  className={`px-6 py-4 flex items-start gap-4 ${
                    !notification.is_read ? "bg-primary/5 dark:bg-primary/10" : ""
                  } ${notificationLink ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeColors[notification.type]}`}
                  >
                    <IconComponent className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-foreground">{notification.title}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[notification.type]}`}>
                        {typeLabels[notification.type]}
                      </span>
                      {!notification.is_read && (
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                      )}
                    </div>

                    <p className="text-sm text-text-muted">{notification.message}</p>

                    <p className="text-xs text-text-muted mt-2">
                      {new Date(notification.created_at).toLocaleDateString("ar-EG", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {notification.source_type === "contact_message" && notification.source_id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`/admin/contact-form?id=${notification.source_id}`, '_blank')}
                        title="عرض الرسالة"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}

                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </NotificationWrapper>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}