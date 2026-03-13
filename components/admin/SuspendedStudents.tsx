"use client"

import { useState, useEffect } from "react"
import { Users, Clock, Loader2, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

interface SuspendedStudent {
  id: string
  student_name: string
  email: string
  suspended_at: string
  suspension_reason: string
  last_reader_name: string
  recitation_id: string
}

interface Reader {
  id: string
  name: string
}

export function SuspendedStudents() {
  const { t } = useI18n()
  const isAr = t.locale === "ar"

  const [students, setStudents] = useState<SuspendedStudent[]>([])
  const [readers, setReaders] = useState<Reader[]>([])
  const [loading, setLoading] = useState(true)
  const [reassigningId, setReassigningId] = useState<string | null>(null)
  const [selectedReader, setSelectedReader] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchSuspended()
    fetchReaders()
  }, [])

  async function fetchSuspended() {
    try {
      const res = await fetch("/api/admin/students/suspended")
      if (res.ok) {
        const data = await res.json()
        setStudents(data.students || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchReaders() {
    try {
      const res = await fetch("/api/admin/readers?limit=100")
      if (res.ok) {
        const data = await res.json()
        setReaders(data.readers || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleReassign(studentId: string) {
    if (!selectedReader) return
    setSubmitting(true)
    setMessage(null)
    try {
      const res = await fetch("/api/admin/students/reassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, newReaderId: selectedReader })
      })
      if (res.ok) {
        setMessage({ type: 'success', text: isAr ? "تم تحويل الطالب بنجاح" : "Student reassigned successfully" })
        setReassigningId(null)
        setSelectedReader("")
        fetchSuspended()
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || (isAr ? "حدث خطأ" : "Error occurred") })
      }
    } catch (err) {
      setMessage({ type: 'error', text: isAr ? "خطأ في الاتصال" : "Connection error" })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center p-12">
      <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
    </div>
  )

  if (students.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-amber-50/50 p-6 border-b border-amber-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{t.reader.suspendedStudentsTitle}</h3>
            <p className="text-sm text-gray-500">{t.reader.suspendedDueToTimeout}</p>
          </div>
        </div>
        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
          {students.length} {isAr ? "طلاب" : "Students"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-amber-50 text-gray-400 bg-white">
              <th className={`py-4 px-6 font-semibold ${isAr ? 'text-right' : 'text-left'}`}>{t.admin.student}</th>
              <th className={`py-4 px-6 font-semibold ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? "المقرئ السابق" : "Last Reader"}</th>
              <th className={`py-4 px-6 font-semibold ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? "تاريخ التعليق" : "Suspended At"}</th>
              <th className={`py-4 px-6 font-semibold ${isAr ? 'text-center' : 'text-center'}`}>{isAr ? "إجراء" : "Action"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-50">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-amber-50/30 transition-colors">
                <td className="py-4 px-6">
                  <div className="font-bold text-gray-900">{student.student_name}</div>
                  <div className="text-xs text-gray-400">{student.email}</div>
                </td>
                <td className="py-4 px-6 text-gray-600 font-medium">
                  {student.last_reader_name || "---"}
                </td>
                <td className="py-4 px-6 text-gray-400 text-xs">
                  {new Date(student.suspended_at).toLocaleDateString(isAr ? "ar-SA" : "en-US")}
                </td>
                <td className="py-4 px-6">
                  {reassigningId === student.id ? (
                    <div className="flex flex-col gap-2 min-w-[200px]">
                      <select 
                        value={selectedReader}
                        onChange={(e) => setSelectedReader(e.target.value)}
                        className="w-full text-xs p-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">{isAr ? "اختر مقرئ جديد..." : "Select new reader..."}</option>
                        {readers.filter(r => r.id !== student.id).map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2">
                        <button 
                          disabled={!selectedReader || submitting}
                          onClick={() => handleReassign(student.id)}
                          className="flex-1 bg-amber-600 text-white text-[10px] font-bold py-1.5 rounded-md hover:bg-amber-700 disabled:opacity-50"
                        >
                          {submitting ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : (isAr ? "تأكيد" : "Confirm")}
                        </button>
                        <button 
                          onClick={() => setReassigningId(null)}
                          className="px-3 py-1.5 border border-amber-200 text-amber-700 text-[10px] font-bold rounded-md"
                        >
                          {t.cancel}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                        <button 
                        onClick={() => setReassigningId(student.id)}
                        className="inline-flex items-center gap-2 bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                        >
                        <UserPlus className="w-4 h-4" />
                        {t.reader.reassignStudent}
                        </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {message && (
        <div className={`p-4 text-center text-sm font-bold flex items-center justify-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}
    </div>
  )
}
