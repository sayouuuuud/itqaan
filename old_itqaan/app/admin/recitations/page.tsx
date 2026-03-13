"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/status-badge"
import {
  Search, Download, Plus, Eye, UserPlus, Filter, Loader2
} from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import Link from "next/link"

export default function AdminRecitationsPage() {
  const { t } = useI18n()
  const isAr = t.locale === "ar"

  const [recitations, setRecitations] = useState<any[]>([])
  const [readers, setReaders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState("")
  const [readerFilter, setReaderFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const [reassignDialog, setReassignDialog] = useState(false)
  const [selectedRecitationId, setSelectedRecitationId] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchRecitations()
    fetchReaders()
  }, [])

  const fetchRecitations = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append("search", searchQuery)
      if (readerFilter) params.append("reader", readerFilter)
      if (statusFilter) params.append("status", statusFilter)

      const res = await fetch(`/api/admin/recitations?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setRecitations(data.recitations || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchReaders = async () => {
    try {
      const res = await fetch("/api/admin/users?role=reader")
      if (res.ok) {
        const data = await res.json()
        setReaders(data.users || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchRecitations()
  }

  const handleReassign = async (readerId: string) => {
    if (!selectedRecitationId) return
    setProcessing(true)
    try {
      const res = await fetch("/api/admin/recitations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recitationId: selectedRecitationId, readerId })
      })
      if (res.ok) {
        setReassignDialog(false)
        fetchRecitations()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }

  const openReassignDialog = (recId: string) => {
    setSelectedRecitationId(recId)
    setReassignDialog(true)
  }

  const avatarColors = [
    "bg-blue-100 text-blue-600",
    "bg-green-100 text-green-600",
    "bg-[#8b5cf6]/15 text-[#8b5cf6]",
    "bg-red-100 text-red-600",
    "bg-indigo-100 text-indigo-600",
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {t.admin.recitationsManagement}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {t.admin.recitationsManagementDesc}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="flex items-center gap-2 border-gray-200 text-gray-600 hover:text-gray-900">
            <Download className="w-4 h-4" />
            {t.admin.exportReport}
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pr-10 border-gray-200 focus:border-[#0B3D2E] focus:ring-[#0B3D2E]/20"
              placeholder={t.admin.searchRecitationsPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="md:col-span-3">
            <select
              className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E]"
              value={readerFilter}
              onChange={(e) => setReaderFilter(e.target.value)}
            >
              <option value="">{t.admin.allReaders}</option>
              {readers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <select
              className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">{t.admin.allStatuses}</option>
              <option value="pending">{t.pending}</option>
              <option value="in_review">{t.inReview}</option>
              <option value="mastered">{t.mastered}</option>
              <option value="needs_session">{t.needsSession}</option>
              <option value="session_booked">{t.sessionBooked}</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <Button type="submit" className="w-full h-10 flex items-center justify-center rounded-xl bg-[#0B3D2E] hover:bg-[#0a3326] text-white">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex justify-center p-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" />
            </div>
          ) : (
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">ID</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">
                    {t.auth.student}
                  </th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">
                    {t.admin.surahAyahs}
                  </th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">
                    {t.admin.assignedReader}
                  </th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">
                    {t.admin.sessionReader}
                  </th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">
                    {t.reader.status}
                  </th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">
                    {t.admin.submissionDate}
                  </th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap text-center">
                    {t.admin.action}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recitations.length > 0 ? recitations.map((rec, idx) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">
                      <Link href={`/admin/recitations/${rec.id}`} className="hover:text-[#0B3D2E] hover:underline">
                        #{rec.id.substring(0, 8)}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${avatarColors[idx % avatarColors.length]}`}
                        >
                          {(rec.studentName || t.userFallbackLetter).charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {rec.studentName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {rec.studentEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {rec.surah} ({rec.fromAyah}-{rec.toAyah})
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {rec.assignedReaderName || "---"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {rec.sessionReaderName ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-emerald-700">{rec.sessionReaderName}</span>
                          {rec.bookingSlotStart && (
                            <span className="text-xs text-muted-foreground mt-0.5">
                              {new Date(rec.bookingSlotStart).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">---</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={rec.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      <div className="flex flex-col text-xs">
                        <span>
                          {new Date(rec.createdAt).toLocaleDateString(
                            isAr ? "ar-SA" : "en-US"
                          )}
                        </span>
                        <span className="opacity-75">
                          {new Date(rec.createdAt).toLocaleTimeString(
                            isAr ? "ar-SA" : "en-US",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/admin/recitations/${rec.id}`}
                          className="p-1.5 text-gray-400 hover:text-[#0B3D2E] hover:bg-emerald-50 rounded-lg transition-colors"
                          title={t.viewDetails}
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        <button
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title={t.admin.assignReader}
                          onClick={() => openReassignDialog(rec.id)}
                        >
                          <UserPlus className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8} className="py-20 text-center text-muted-foreground">
                      {t.admin.noRecitationsFound}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Total Count */}
        <div className="bg-muted/30 px-6 py-4 border-t border-border flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t.admin.totalResults.replace('{count}', recitations.length.toString())}
          </div>
        </div>
      </div>

      {/* Reassign Dialog */}
      <Dialog open={reassignDialog} onOpenChange={setReassignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t.admin.assignReader}
            </DialogTitle>
            <DialogDescription>
              {t.admin.assignReaderDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4 max-h-[400px] overflow-y-auto">
            {readers.length > 0 ? readers.map((reader) => (
              <button
                key={reader.id}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-right"
                onClick={() => handleReassign(reader.id)}
                disabled={processing}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {reader.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.auth.reader}
                  </p>
                </div>
                <span className="text-xs text-primary font-medium">
                  {reader.rating || "---"}/5
                </span>
              </button>
            )) : (
              <p className="text-center text-muted-foreground py-4">{t.admin.noReadersFound}</p>
            )}
            <button
              className="w-full flex items-center justify-center p-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors mt-4 text-sm font-bold"
              onClick={() => handleReassign("")}
              disabled={processing}
            >
              {t.admin.unassignReader}
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignDialog(false)}>
              {t.cancel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
