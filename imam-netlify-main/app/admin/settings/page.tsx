"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Download, Database, Loader2, FileJson, RefreshCw, Trash2, Upload, HardDrive, Merge, AlertTriangle, Mic, BookOpen, FileText, Book, Video, Users, Globe } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AdminSettingsPage() {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importMode, setImportMode] = useState<"replace" | "merge">("replace")
  const [clearingCache, setClearingCache] = useState(false)
  const [clearingTable, setClearingTable] = useState<string | null>(null)
  const [showArrayImportModal, setShowArrayImportModal] = useState(false)
  const [pendingImportData, setPendingImportData] = useState<any[]>([])
  const [selectedTargetTable, setSelectedTargetTable] = useState<string>("media")
  const [message, setMessage] = useState({ type: "", text: "" })
  const [stats, setStats] = useState({
    sermons: 0,
    lessons: 0,
    articles: 0,
    books: 0,
    media: 0,
    subscribers: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { user } = useAuth()
  const isVisitor = user?.email === 'visitor@gmail.com'

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    setLoading(true)
    try {
      const [
        sermons,
        lessons,
        articles,
        books,
        media,
        subscribers,
      ] = await Promise.all([
        supabase.from("sermons").select("id", { count: "exact" }),
        supabase.from("lessons").select("id", { count: "exact" }),
        supabase.from("articles").select("id", { count: "exact" }),
        supabase.from("books").select("id", { count: "exact" }),
        supabase.from("media").select("id", { count: "exact" }),
        supabase.from("subscribers").select("id", { count: "exact" }),
      ])

      setStats({
        sermons: sermons.count || 0,
        lessons: lessons.count || 0,
        articles: articles.count || 0,
        books: books.count || 0,
        media: media.count || 0,
        subscribers: subscribers.count || 0,
      })
    } catch (error) {
      console.error("[v0] Error fetching stats:", error)
    }
    setLoading(false)
  }

  async function exportDatabase() {
    setExporting(true)
    setMessage({ type: "", text: "" })

    try {
      // Fetch all data from each table
      const [
        sermons,
        lessons,
        articles,
        books,
        media,
        subscribers,
        siteSettings,
        heroSection,
        aboutPage,
        aboutTimeline,
        aboutQuotes,
        categories,
        weeklySchedule,
        socialLinks,
        notifications,

        contactSubmissions,
        appearanceSettings,
      ] = await Promise.all([
        supabase.from("sermons").select("*"),
        supabase.from("lessons").select("*"),
        supabase.from("articles").select("*"),
        supabase.from("books").select("*"),
        supabase.from("media").select("*"),
        supabase.from("subscribers").select("*"),
        supabase.from("site_settings").select("*"),
        supabase.from("hero_section").select("*"),
        supabase.from("about_page").select("*"),
        supabase.from("about_timeline").select("*"),
        supabase.from("about_quotes").select("*"),
        supabase.from("categories").select("*"),
        supabase.from("weekly_schedule").select("*"),
        supabase.from("social_links").select("*"),
        supabase.from("notifications").select("*"),

        supabase.from("contact_submissions").select("*"),
        supabase.from("appearance_settings").select("*"),
      ])

      const exportData = {
        exported_at: new Date().toISOString(),
        version: "2.1",
        type: "full_backup",
        data: {
          // Independent Tables (Settings & Base Data)
          site_settings: siteSettings.data || [],
          appearance_settings: appearanceSettings.data || [],
          social_links: socialLinks.data || [],
          categories: categories.data || [], // Important: Categories first for FK constraints
          hero_section: heroSection.data || [],
          about_page: aboutPage.data || [],
          about_timeline: aboutTimeline.data || [],
          about_quotes: aboutQuotes.data || [],
          weekly_schedule: weeklySchedule.data || [],


          // Content Tables (Dependent on Categories)
          sermons: sermons.data || [],
          lessons: lessons.data || [],
          articles: articles.data || [],
          books: books.data || [],
          media: media.data || [],

          // User Interaction Data
          subscribers: subscribers.data || [],
          contact_submissions: contactSubmissions.data || [],
          notifications: notifications.data || [],
        },
      }

      // Create and download JSON file
      const jsonString = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonString], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `imam-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setMessage({
        type: "success",
        text: "تم تصدير قاعدة البيانات بنجاح (نسخة كاملة)!",
      })
    } catch (error: any) {
      console.error("[v0] Export error:", error)
      setMessage({
        type: "error",
        text: "حدث خطأ أثناء التصدير: " + error.message,
      })
    }
    setExporting(false)
  }

  // Separate execution function to be called from both direct upload and array modal
  async function executeImport(dataToImport: any) {
    setImporting(true)
    setMessage({ type: "", text: "" })

    try {
      // Confirm before importing
      const confirmMessage = importMode === "replace"
        ? "تحذير هام: سيتم حذف البيانات الحالية واستبدالها بالبيانات من ملف النسخة الاحتياطية.\n\nهل أنت متأكد تماماً من المتابعة؟"
        : "سيتم إضافة البيانات الجديدة بدون حذف البيانات الحالية. في حالة تكرار الـ ID سيتم تخطي العنصر.\n\nهل تريد المتابعة؟"

      if (!confirm(confirmMessage)) {
        setImporting(false)
        return
      }

      // Define import order strictly to handle Foreign Keys
      // Parent tables MUST come before Child tables for INSERT
      const tableOrder = [
        // 1. Base Settings & Lookups
        'site_settings',
        'appearance_settings',
        'social_links',
        'categories', // Critical: Categories must exist before content

        // 2. Single Pages content (Independent)
        'about_page',
        'about_timeline',
        'about_quotes',
        'weekly_schedule',

        // 3. Main Content (Dependent on Categories)
        'sermons',
        'lessons',
        'articles',
        'books',
        'media',

        // 4. Content dependent pages (Must come AFTER content)
        'hero_section', // Dependent on books, media, etc.

        // 5. User Data
        'subscribers',
        'contact_submissions',
        'notifications'
      ];

      let successCount = 0
      let skippedCount = 0
      let failureCount = 0
      let lastError: any = null

      // For REPLACE mode: Delete in REVERSE order first (children before parents)
      // Check ALL tables for deletion, not just ones with records in backup
      // This is crucial for "Replace" to truly replace everything
      if (importMode === "replace") {
        const reverseOrder = [...tableOrder].reverse()
        console.log("Deleting tables in reverse order for FK constraints...")

        for (const table of reverseOrder) {
          console.log(`Checking/Clearing table: ${table}...`)
          // Try to delete everything
          const { error } = await supabase
            .from(table)
            .delete()
            .gte("created_at", "1970-01-01")

          if (error) {
            console.error(`Failed to clear ${table}:`, error)

            // Try alternative method (sometimes created_at check fails if column doesn't exist or is null)
            const { error: error2 } = await supabase
              .from(table)
              .delete()
              .not("id", "is", null)

            if (error2) {
              // If both methods fail, this is a blocker.
              // We CANNOT proceed with "Replace" if we can't delete old data.
              console.error(`CRITICAL: Failed to clear table ${table}`, error2)
              throw new Error(`فشل حذف البيانات القديمة من جدول ${table}: ${error2.message}. يرجى حذف البيانات يدوياً أو استخدام وضع "دمج".\nالتفاصيل: ${error2.details || error2.hint || ''}`)
            }
          }
        }
      }

      // Sanitize data before import (fix common issues like double timestamps)
      function sanitizeData(records: any[]) {
        return records.map(record => {
          const newRecord = { ...record }
          for (const key in newRecord) {
            if (typeof newRecord[key] === 'string') {
              // Fix double timezone offset error: "2013-06-22T10:31:45+00:00+00:00"
              if (newRecord[key].endsWith('+00:00+00:00')) {
                newRecord[key] = newRecord[key].replace('+00:00+00:00', '+00:00')
              }
            }
          }
          return newRecord
        })
      }

      // Now process tables in correct order for INSERT
      const BATCH_SIZE = 500; // Process in chunks to avoid timeout and improve speed

      for (const table of tableOrder) {
        let records = dataToImport[table]

        if (records && Array.isArray(records) && records.length > 0) {
          console.log(`Processing table: ${table} with ${records.length} records...`)

          // Apply sanitization
          records = sanitizeData(records)

          // Process in batches
          for (let i = 0; i < records.length; i += BATCH_SIZE) {
            const batch = records.slice(i, i + BATCH_SIZE);
            const isLastBatch = i + BATCH_SIZE >= records.length;

            console.log(`  > Processing batch ${i / BATCH_SIZE + 1}/${Math.ceil(records.length / BATCH_SIZE)} for ${table}...`)

            if (importMode === "replace") {
              // Replace mode: Bulk Insert
              const { error: insertError } = await supabase.from(table).insert(batch)

              if (insertError) {
                console.error(`Failed to insert batch int ${table}:`, insertError)
                failureCount += batch.length
                lastError = insertError
                // For replace mode, a failure in the middle is bad, but we continue to try and get as much data as possible?
                // Or maybe we should stop? For now, we log and continue.
              } else {
                successCount += batch.length
              }
            } else {
              // Merge mode: Bulk Upsert (Ignore Duplicates)
              // this is MUCH faster than one-by-one
              const { error } = await supabase.from(table).upsert(batch, {
                onConflict: 'id',
                ignoreDuplicates: true
              })

              if (error) {
                console.error(`Failed to upsert batch into ${table}:`, error)
                failureCount += batch.length
                lastError = error
              } else {
                // In upsert with ignoreDuplicates, successful means we processed them. 
                // We don't distinctly know how many were skipped vs inserted without return values,
                // but for speed we assume success.
                successCount += batch.length
              }
            }
          }
        }
      }

      const mergeMessage = importMode === "merge" ? ` (تم تخطي ${skippedCount} عنصر مكرر)` : ""
      const failureMessage = failureCount > 0 ? ` ❌ فشل إضافة ${failureCount} عنصر. السبب الأخير: ${lastError?.message || 'غير معروف'} ${lastError?.details ? `(${lastError.details})` : ''}` : ""

      setMessage({
        type: failureCount > 0 ? "warning" : "success",
        text: `تم إنهاء العملية. تم إضافة ${successCount} عنصر${mergeMessage}.${failureMessage}`,
      })

      fetchStats()
    } catch (error: any) {
      console.error("[v0] Import error:", error)
      setMessage({
        type: "error",
        text: "حدث خطأ أثناء الاستيراد: " + error.message,
      })
    }

    setImporting(false)
  }

  async function handleImportBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Don't set importing=true here yet, wait until we know what we're doing
    setMessage({ type: "", text: "" })

    try {
      const text = await file.text()
      const importData = JSON.parse(text)

      // Check if it's a simple array (direct table data) or full backup format
      if (Array.isArray(importData)) {
        // It's a direct array - Open Modal
        setPendingImportData(importData)
        setShowArrayImportModal(true)
        // Reset file input
        e.target.value = ""
        return
      }

      if (importData.data && importData.version) {
        // It's a full backup format - Execute immediately
        await executeImport(importData.data)
      } else {
        throw new Error("ملف النسخة الاحتياطية غير صالح - يجب أن يكون array أو ملف backup كامل")
      }
    } catch (error: any) {
      console.error("File parse error:", error)
      setMessage({
        type: "error",
        text: "خطأ في قراءة الملف: " + error.message
      })
    }

    // Reset file input
    e.target.value = ""
  }

  async function processArrayImport() {
    setShowArrayImportModal(false)
    const dataToImport = { [selectedTargetTable]: pendingImportData }
    await executeImport(dataToImport)
  }

  // Clear specific table data
  async function clearTableData(tableName: string, displayName: string) {
    if (!confirm(`هل أنت متأكد من حذف جميع ${displayName}؟ لا يمكن التراجع عن هذا الإجراء!`)) {
      return
    }

    setClearingTable(tableName)
    setMessage({ type: "", text: "" })

    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000")

      if (error) throw error

      setMessage({
        type: "success",
        text: `تم حذف جميع ${displayName} بنجاح!`,
      })
      fetchStats()
    } catch (error: any) {
      console.error(`Error clearing ${tableName}:`, error)
      setMessage({
        type: "error",
        text: `فشل حذف ${displayName}: ${error.message}`,
      })
    }

    setClearingTable(null)
  }

  async function clearCache() {
    setClearingCache(true)
    setMessage({ type: "", text: "" })

    try {
      // Call revalidate API endpoint
      const response = await fetch("/api/revalidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path: "/" }),
      })

      if (!response.ok) {
        throw new Error("فشل في مسح الكاش")
      }

      setMessage({
        type: "success",
        text: "تم مسح الكاش بنجاح! سيتم تحديث الصفحات عند زيارتها.",
      })
    } catch (error: any) {
      console.error("[v0] Clear cache error:", error)
      setMessage({
        type: "error",
        text: "حدث خطأ أثناء مسح الكاش: " + error.message,
      })
    }

    setClearingCache(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground font-serif flex items-center gap-3">
          <Database className="h-6 w-6 md:h-8 md:w-8 text-primary" />
          الإعدادات العامة والنسخ الاحتياطي
        </h1>
        <p className="text-text-muted mt-2">
          إدارة وتصدير واستيراد بيانات الموقع
        </p>
      </div>

      {/* Message */}
      {message.text && (
        <div
          className={`p-4 rounded-xl text-center ${message.type === "error"
            ? "bg-red-100 text-red-700"
            : "bg-green-100 text-green-700"
            }`}
        >
          {message.text}
        </div>
      )}

      {/* Database Stats */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileJson className="h-5 w-5 text-primary" />
            إحصائيات قاعدة البيانات
          </h2>
          <Button variant="outline" size="sm" onClick={fetchStats}>
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-primary">{stats.sermons}</p>
            <p className="text-sm text-text-muted">الخطب</p>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-primary">{stats.lessons}</p>
            <p className="text-sm text-text-muted">الدروس</p>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-primary">{stats.articles}</p>
            <p className="text-sm text-text-muted">المقالات</p>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-primary">{stats.books}</p>
            <p className="text-sm text-text-muted">الكتب</p>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-primary">{stats.media}</p>
            <p className="text-sm text-text-muted">المرئيات</p>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-primary">{stats.subscribers}</p>
            <p className="text-sm text-text-muted">المشتركين</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Section */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            تصدير النسخة الاحتياطية
          </h2>
          <p className="text-text-muted mb-6 text-sm">
            قم بتصدير جميع بيانات الموقع إلى ملف JSON للنسخ الاحتياطي. يتضمن
            التصدير: الخطب، الدروس، المقالات، الكتب، المرئيات، المشتركين، وجميع
            الإعدادات.
          </p>
          <Button
            onClick={exportDatabase}
            disabled={exporting || isVisitor}
            className="w-full bg-primary hover:bg-primary-hover text-white"
          >
            {exporting ? (
              <>
                <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                جاري التصدير...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 ml-2" />
                تصدير قاعدة البيانات
              </>
            )}
          </Button>
        </div>

        {/* Import Section */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            استيراد نسخة احتياطية
          </h2>

          {/* Import Mode Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">وضع الاستيراد</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={importMode === "replace" ? "default" : "outline"}
                className={importMode === "replace" ? "bg-primary text-white" : "bg-transparent"}
                onClick={() => setImportMode("replace")}
                disabled={isVisitor}
              >
                <RefreshCw className="h-4 w-4 ml-2" />
                استبدال كامل
              </Button>
              <Button
                type="button"
                variant={importMode === "merge" ? "default" : "outline"}
                className={importMode === "merge" ? "bg-green-600 text-white hover:bg-green-700" : "bg-transparent"}
                onClick={() => setImportMode("merge")}
                disabled={isVisitor}
              >
                <Merge className="h-4 w-4 ml-2" />
                دمج (إضافة فقط)
              </Button>
            </div>
          </div>

          {/* Mode Description */}
          <div className={`rounded-xl p-4 mb-4 border ${importMode === "replace" ? "bg-yellow-50 border-yellow-200" : "bg-green-50 border-green-200"}`}>
            <p className={`text-sm ${importMode === "replace" ? "text-yellow-800" : "text-green-800"}`}>
              {importMode === "replace" ? (
                <>
                  <strong>استبدال كامل:</strong> سيتم حذف جميع البيانات الحالية واستبدالها بالبيانات الجديدة.
                </>
              ) : (
                <>
                  <strong>دمج:</strong> سيتم إضافة البيانات الجديدة فقط. العناصر المكررة (نفس الـ ID) سيتم تخطيها.
                </>
              )}
            </p>
          </div>

          <label className="block">
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
              disabled={importing || isVisitor}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full bg-transparent"
              disabled={importing || isVisitor}
              onClick={() =>
                document.querySelector<HTMLInputElement>('input[type="file"]')?.click()
              }
            >
              {importing ? (
                <>
                  <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                  جاري الاستيراد...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 ml-2" />
                  اختيار ملف النسخة الاحتياطية
                </>
              )}
            </Button>
          </label>
        </div>
      </div>



      {/* Clear Data Section */}
      <div className="bg-red-50 dark:bg-red-950/30 rounded-2xl p-6 border-2 border-red-200 dark:border-red-900">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-700 dark:text-red-400">منطقة خطرة</h2>
            <p className="text-sm text-red-600/80 dark:text-red-400/70">حذف البيانات نهائياً - لا يمكن التراجع</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { table: "sermons", name: "الخطب", count: stats.sermons, color: "text-green-700 dark:text-green-400", bg: "bg-green-600", iconColor: "text-white", Icon: Mic },
            { table: "lessons", name: "الدروس", count: stats.lessons, color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-600", iconColor: "text-white", Icon: BookOpen },
            { table: "articles", name: "المقالات", count: stats.articles, color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-600", iconColor: "text-white", Icon: FileText },
            { table: "books", name: "الكتب", count: stats.books, color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-600", iconColor: "text-white", Icon: Book },
            { table: "media", name: "المرئيات", count: stats.media, color: "text-pink-700 dark:text-pink-400", bg: "bg-pink-600", iconColor: "text-white", Icon: Video },
            { table: "subscribers", name: "المشتركين", count: stats.subscribers, color: "text-cyan-700 dark:text-cyan-400", bg: "bg-cyan-600", iconColor: "text-white", Icon: Users },
          ].map((item) => (
            <div
              key={item.table}
              className="bg-card rounded-xl p-4 border border-red-200 dark:border-red-900/50 hover:border-red-400 dark:hover:border-red-800 transition-all shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center`}>
                    <item.Icon className={`h-4 w-4 ${item.iconColor}`} />
                  </div>
                  <span className={`font-semibold ${item.color}`}>{item.name}</span>
                </div>
                <span className="text-sm px-2 py-0.5 bg-red-600 text-white rounded-full font-medium">
                  {item.count}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-red-400 text-red-600 hover:bg-red-500 hover:text-white dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/50"
                disabled={clearingTable === item.table || item.count === 0 || isVisitor}
                onClick={() => clearTableData(item.table, item.name)}
              >
                {clearingTable === item.table ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 ml-1" />
                    حذف الكل
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Cache Section */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-primary" />
          إدارة الكاش
        </h2>
        <p className="text-text-muted mb-6">
          مسح الكاش يؤدي إلى إعادة تحميل جميع الصفحات من قاعدة البيانات. استخدم
          هذا الخيار إذا لم تظهر التغييرات الجديدة على الموقع.
        </p>
        <Button
          onClick={clearCache}
          disabled={clearingCache || isVisitor}
          className="bg-secondary hover:bg-secondary-hover text-secondary-foreground"
        >
          {clearingCache ? (
            <>
              <Loader2 className="h-5 w-5 ml-2 animate-spin" />
              جاري مسح الكاش...
            </>
          ) : (
            "مسح الكاش الآن"
          )}
        </Button>
      </div>

      {/* Sitemap Section */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          خريطة الموقع (Sitemap)
        </h2>
        <p className="text-text-muted mb-6">
          خريطة الموقع تساعد محركات البحث (مثل Google) على أرشفة محتوى موقعك بشكل أسرع.
          يتم تحديث خريطة الموقع تلقائياً.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="outline"
            onClick={() => window.open('/sitemap.xml', '_blank')}
          >
            عرض خريطة الموقع
          </Button>
          <Button
            variant="default"
            onClick={() => {
              const url = `${window.location.origin}/sitemap.xml`;
              navigator.clipboard.writeText(url);
              setMessage({ type: "success", text: "تم نسخ رابط خريطة الموقع!" });
            }}
          >
            نسخ الرابط لتقديمه لـ Google
          </Button>
        </div>
      </div>

      {/* Array Import Modal */}
      <Dialog open={showArrayImportModal} onOpenChange={setShowArrayImportModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>استيراد جدول مباشر</DialogTitle>
            <DialogDescription>
              الملف الذي تحاول استيراده عبارة عن مصفوفة (Array). يرجى تحديد الجدول الذي تريد إضافة هذه البيانات إليه.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">الجدول المستهدف</label>
            <Select value={selectedTargetTable} onValueChange={setSelectedTargetTable}>
              <SelectTrigger className="w-full text-right" dir="rtl">
                <SelectValue placeholder="اختر الجدول" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="media">المرئيات (media)</SelectItem>
                <SelectItem value="sermons">الخطب (sermons)</SelectItem>
                <SelectItem value="lessons">الدروس (lessons)</SelectItem>
                <SelectItem value="articles">المقالات (articles)</SelectItem>
                <SelectItem value="books">الكتب (books)</SelectItem>
                <SelectItem value="subscribers">المشتركين (subscribers)</SelectItem>
                <SelectItem value="categories">الأقسام (categories)</SelectItem>
              </SelectContent>
            </Select>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-sm text-blue-800">
                سيتم استيراد {pendingImportData.length} عنصر إلى جدول <b>{selectedTargetTable}</b>
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowArrayImportModal(false)}>إلغاء</Button>
            <Button onClick={processArrayImport}>استيراد البيانات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}