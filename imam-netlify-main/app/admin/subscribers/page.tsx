"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { Pagination } from "@/components/admin/pagination"
import { Users, CheckCircle, XCircle, Search, Download, Loader2, ToggleLeft, ToggleRight, Trash2 } from "lucide-react"

interface Subscriber {
  id: string
  email?: string
  whatsapp_number?: string
  telegram_username?: string
  subscribed_at: string
  active: boolean
}

const ITEMS_PER_PAGE = 20

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [exporting, setExporting] = useState(false)
  const { user } = useAuth()
  const isVisitor = user?.email === 'visitor@gmail.com'
  const supabase = createClient()

  const fetchSubscribers = async () => {
    setLoading(true)
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE - 1
    const { data, count, error } = await supabase
      .from("subscribers")
      .select("*", { count: "exact" })
      .order("subscribed_at", { ascending: false })
      .range(start, end)
    if (!error) {
      setSubscribers(data || [])
      setTotalCount(count || 0)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchSubscribers()
  }, [currentPage])

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("subscribers")
      .update({ active: !currentStatus })
      .eq("id", id)
    if (!error) fetchSubscribers()
  }

  const handleDeleteSubscriber = async (id: string) => {
    if (isVisitor) return
    if (!confirm("هل أنت متأكد من حذف هذا المشترك؟")) return
    const { error } = await supabase.from("subscribers").delete().eq("id", id)
    if (!error) fetchSubscribers()
  }

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const { data: allSubscribers, error } = await supabase
        .from("subscribers")
        .select("whatsapp_number, telegram_username, email, subscribed_at, active")
        .order("subscribed_at", { ascending: false })

      if (error || !allSubscribers || allSubscribers.length === 0) {
        alert("لا يوجد مشتركون للتصدير")
        return
      }

      const csvHeader = "رقم الواتساب,معرف التليجرام,البريد الإلكتروني,تاريخ الاشتراك,الحالة\n"
      const csvRows = allSubscribers
        .map((sub) => {
          const date = new Date(sub.subscribed_at).toLocaleDateString("ar-EG")
          const status = sub.active ? "نشط" : "غير نشط"
          return `${sub.whatsapp_number || ""},${sub.telegram_username || ""},${sub.email || ""},${date},${status}`
        })
        .join("\n")

      const csvContent = "\uFEFF" + csvHeader + csvRows
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `subscribers-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Export error:", err)
      alert("حدث خطأ أثناء التصدير")
    } finally {
      setExporting(false)
    }
  }

  const filteredSubscribers = subscribers.filter(
    (s) =>
      s.whatsapp_number?.includes(searchQuery) ||
      s.telegram_username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const activeCount = subscribers.filter((s) => s.active).length
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            إدارة المشتركين
          </h1>
          <p className="text-sm text-text-muted mt-1">
            قائمة المشتركين في مجموعات الواتساب والتليجرام
          </p>
        </div>

        <Button
          onClick={handleExportCSV}
          disabled={exporting || isVisitor}
          className="bg-primary hover:bg-primary-hover text-white"
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              جاري التصدير...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 ml-2" />
              تصدير إلى CSV
            </>
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-5 rounded-xl border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-text-muted">إجمالي المشتركين</p>
            <p className="text-2xl font-bold text-foreground">{totalCount}</p>
          </div>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-text-muted">نشط</p>
            <p className="text-2xl font-bold text-foreground">{activeCount}</p>
          </div>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-gray-500">
            <XCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-text-muted">غير نشط</p>
            <p className="text-2xl font-bold text-foreground">{totalCount - activeCount}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-card p-4 rounded-xl border border-border">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute top-1/2 right-3 transform -translate-y-1/2 text-text-muted h-5 w-5" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 bg-muted"
            placeholder="ابحث برقم الواتساب أو معرف التليجرام..."
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-text-muted flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin" />
            جاري التحميل...
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="p-12 text-center text-text-muted">
            {searchQuery ? "لا توجد نتائج" : "لا يوجد مشتركون بعد"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-right px-6 py-4 text-sm font-bold text-foreground">#</th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-foreground">
                    رقم الواتساب
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-foreground">
                    معرف التليجرام
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-foreground">
                    تاريخ الاشتراك
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-foreground">الحالة</th>
                  <th className="text-center px-6 py-4 text-sm font-bold text-foreground">
                    الإجراءات
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filteredSubscribers.map((subscriber, index) => (
                  <tr key={subscriber.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-text-muted">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-foreground" dir="ltr">
                        {subscriber.whatsapp_number || "-"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-medium text-foreground" dir="ltr">
                        {subscriber.telegram_username || "-"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-text-muted">
                      {new Date(subscriber.subscribed_at).toLocaleDateString("ar-EG")}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs font-bold rounded-full ${subscriber.active
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-500"
                          }`}
                      >
                        {subscriber.active ? "نشط" : "غير نشط"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggleActive(subscriber.id, subscriber.active)}
                          className={`p-2 rounded-lg transition-colors ${subscriber.active
                              ? "text-gray-500 hover:bg-muted"
                              : "text-green-600 hover:bg-green-50"
                            }`}
                          title={subscriber.active ? "إلغاء التفعيل" : "تفعيل"}
                          disabled={isVisitor}
                        >
                          {subscriber.active ? (
                            <ToggleRight className="h-5 w-5" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteSubscriber(subscriber.id)}
                          className={`p-2 rounded-lg transition-colors ${isVisitor ? "text-gray-300 cursor-not-allowed" : "text-red-500 hover:bg-red-50"
                            }`}
                          title="حذف"
                          disabled={isVisitor}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-border">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalCount}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      </div>
    </div>
  )
}