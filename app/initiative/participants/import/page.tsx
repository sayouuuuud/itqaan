"use client"

import { useState, useRef } from "react"
import { Upload, FileText, CheckCircle2, XCircle, AlertCircle, Loader2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImportResult {
  totalRows: number
  successCount: number
  skippedCount: number
  errorCount: number
  errors: { row: number; email: string; reason: string }[]
}

export default function ImportCSVPage() {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    if (!f.name.endsWith(".csv")) {
      setError("يُقبل فقط ملفات CSV")
      return
    }
    if (f.size > 2 * 1024 * 1024) {
      setError("حجم الملف يتجاوز 2 ميجابايت")
      return
    }
    setFile(f)
    setResult(null)
    setError(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/initiative/import-csv", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "فشل الاستيراد")
      setResult(data)
      setFile(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "فشل الاستيراد")
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const csv = "name,email,gender\nأحمد محمد,ahmed@example.com,male\nفاطمة علي,fatima@example.com,female"
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "students-template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div dir="rtl" className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">استيراد طلاب بالجملة</h1>
        <p className="text-sm text-muted-foreground mt-1">
          أضف طلاباً متعددين دفعةً واحدة عبر ملف CSV. سيصل لكل طالب بريد ترحيبي بكلمة مروره.
        </p>
      </div>

      {/* تعليمات */}
      <div className="bg-card border border-border rounded-3xl p-6 space-y-3">
        <h2 className="font-black text-foreground text-sm">تنسيق الملف المطلوب</h2>
        <div className="bg-muted/40 rounded-xl p-4 font-mono text-xs text-foreground" dir="ltr">
          name,email,gender<br />
          أحمد محمد,ahmed@example.com,male<br />
          فاطمة علي,fatima@example.com,female
        </div>
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
          <span>عمود <strong>gender</strong> اختياري (male / female). الحد الأقصى 500 طالب في كل عملية. الحسابات المسجّلة مسبقاً تُتخطى.</span>
        </div>
        <button
          onClick={downloadTemplate}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
        >
          <Download className="w-3.5 h-3.5" /> تحميل نموذج CSV
        </button>
      </div>

      {/* منطقة الرفع */}
      {!result && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-colors ${
            dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/60 hover:bg-muted/20"
          }`}
        >
          <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {file ? (
            <>
              <FileText className="w-10 h-10 text-primary" />
              <p className="font-black text-foreground">{file.name}</p>
              <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
            </>
          ) : (
            <>
              <Upload className="w-10 h-10 text-muted-foreground/60" />
              <div className="text-center">
                <p className="font-black text-foreground">اسحب ملف CSV هنا أو انقر للاختيار</p>
                <p className="text-sm text-muted-foreground mt-1">CSV فقط — حد أقصى 2 ميجابايت</p>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-2xl px-5 py-4 text-sm font-bold">
          <XCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {file && !result && (
        <Button onClick={handleSubmit} disabled={loading} className="rounded-2xl h-12 px-8 font-black gap-2 w-full">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          {loading ? "جارٍ الاستيراد..." : "بدء الاستيراد"}
        </Button>
      )}

      {/* نتائج الاستيراد */}
      {result && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <ResultCard label="إجمالي الصفوف" value={result.totalRows} color="text-foreground" />
            <ResultCard label="تم إضافتهم" value={result.successCount} color="text-green-700" bg="bg-green-50" />
            <ResultCard label="متخطى (موجود)" value={result.skippedCount} color="text-amber-700" bg="bg-amber-50" />
            <ResultCard label="أخطاء" value={result.errorCount} color="text-red-700" bg="bg-red-50" />
          </div>

          {result.successCount > 0 && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
              <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0" />
              <p className="text-sm font-bold text-green-800">
                تم تسجيل {result.successCount} طالب بنجاح وإرسال بيانات الدخول لبريدهم الإلكتروني.
              </p>
            </div>
          )}

          {result.errors.length > 0 && (
            <div className="bg-card border border-border rounded-3xl overflow-hidden">
              <div className="p-4 border-b border-border">
                <p className="font-black text-sm text-foreground">تفاصيل الأخطاء والتخطي</p>
              </div>
              <div className="divide-y divide-border max-h-64 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <div key={i} className="px-5 py-3 flex items-center gap-4 text-sm">
                    <span className="text-xs text-muted-foreground font-black w-12 shrink-0">صف {e.row}</span>
                    <span className="font-mono text-xs text-muted-foreground flex-1 truncate" dir="ltr">{e.email}</span>
                    <span className="text-xs font-bold text-amber-700 shrink-0">{e.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button variant="outline" onClick={() => { setResult(null); setFile(null) }} className="rounded-2xl h-11 px-6 font-black">
            استيراد ملف آخر
          </Button>
        </div>
      )}
    </div>
  )
}

function ResultCard({ label, value, color, bg }: { label: string; value: number; color: string; bg?: string }) {
  return (
    <div className={`rounded-2xl p-5 border border-border ${bg || "bg-card"}`}>
      <p className="text-2xl font-black text-foreground">{value}</p>
      <p className={`text-xs font-black mt-1 ${color}`}>{label}</p>
    </div>
  )
}
