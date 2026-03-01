"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Upload, FileJson, CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react"

interface ImportLog {
    title: string
    status: "success" | "error" | "pending"
    message?: string
}

export default function BulkImportPage() {
    const [jsonInput, setJsonInput] = useState("")
    const [importing, setImporting] = useState(false)
    const [progress, setProgress] = useState(0)
    const [logs, setLogs] = useState<ImportLog[]>([])
    const [stats, setStats] = useState({ total: 0, success: 0, failed: 0 })

    const handleImport = async () => {
        try {
            let books = []
            try {
                const parsed = JSON.parse(jsonInput)
                // Support both array directly or object with data.books
                if (Array.isArray(parsed)) {
                    books = parsed
                } else if (parsed.data && Array.isArray(parsed.data.books)) {
                    books = parsed.data.books
                } else if (parsed.books && Array.isArray(parsed.books)) {
                    books = parsed.books
                } else {
                    throw new Error("تنسيق JSON غير صحيح. يجب أن يكون مصفوفة كتب.")
                }
            } catch (e) {
                alert("تنسيق JSON غير صالح: " + (e as Error).message)
                return
            }

            setImporting(true)
            setLogs([])
            setStats({ total: books.length, success: 0, failed: 0 })
            setProgress(0)

            for (let i = 0; i < books.length; i++) {
                const book = books[i]

                // Update Log as Pending
                setLogs(prev => [{ title: book.title || `Book ${i + 1}`, status: "pending" }, ...prev])

                try {
                    const response = await fetch("/api/import-book", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(book),
                    })

                    const result = await response.json()

                    if (result.success) {
                        setStats(prev => ({ ...prev, success: prev.success + 1 }))
                        setLogs(prev => prev.map((log, idx) => idx === 0 ? { ...log, status: "success", message: "تم الاستيراد بنجاح" } : log))
                    } else {
                        setStats(prev => ({ ...prev, failed: prev.failed + 1 }))
                        setLogs(prev => prev.map((log, idx) => idx === 0 ? { ...log, status: "error", message: result.error } : log))
                    }

                } catch (error) {
                    setStats(prev => ({ ...prev, failed: prev.failed + 1 }))
                    setLogs(prev => prev.map((log, idx) => idx === 0 ? { ...log, status: "error", message: "فشل الاتصال" } : log))
                }

                setProgress(Math.round(((i + 1) / books.length) * 100))
            }

        } catch (error) {
            console.error("Import error:", error)
            alert("حدث خطأ غير متوقع")
        } finally {
            setImporting(false)
        }
    }

    return (
        <div className="container mx-auto py-8 space-y-8 max-w-4xl">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <FileJson className="h-8 w-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-primary font-serif">الاستيراد الجماعي</h1>
                    <p className="text-muted-foreground">استيراد الكتب من ملف JSON مع تحميل الملفات تلقائياً</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Input Section */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>بيانات الكتب (JSON)</CardTitle>
                            <CardDescription>
                                الصق مصفوفة الكتب هنا. سيقوم النظام بتحميل الـ PDF والصور تلقائياً ورفعها للخادم.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder='[ { "title": "...", "pdf_external_url": "..." }, ... ]'
                                className="font-mono text-xs min-h-[400px]"
                                dir="ltr"
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                                disabled={importing}
                            />
                            <Button
                                onClick={handleImport}
                                disabled={importing || !jsonInput}
                                className="w-full"
                                size="lg"
                            >
                                {importing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                                        جاري الاستيراد...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 ml-2" />
                                        بدء الاستيراد
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Progress & Logs Section */}
                <div className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <div className="text-2xl font-bold">{stats.total}</div>
                                <div className="text-xs text-muted-foreground">الإجمالي</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-green-50/50 border-green-200">
                            <CardContent className="pt-6 text-center">
                                <div className="text-2xl font-bold text-green-600">{stats.success}</div>
                                <div className="text-xs text-green-600">ناجح</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-red-50/50 border-red-200">
                            <CardContent className="pt-6 text-center">
                                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                                <div className="text-xs text-red-600">فشل</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Progress Bar */}
                    {importing && (
                        <Card>
                            <CardContent className="pt-6 py-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>التقدم العام</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <Progress value={progress} />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Logs Information */}
                    <Card className="flex-1 flex flex-col min-h-[300px] max-h-[500px]">
                        <CardHeader>
                            <CardTitle>سجل العمليات</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-3">
                            {logs.length === 0 ? (
                                <div className="text-center text-muted-foreground py-10">
                                    لا توجد عمليات حالياً
                                </div>
                            ) : (
                                logs.map((log, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 text-sm">
                                        {log.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />}
                                        {log.status === 'error' && <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
                                        {log.status === 'pending' && <Loader2 className="h-5 w-5 text-blue-500 animate-spin shrink-0" />}
                                        <div className="flex-1">
                                            <div className="font-medium">{log.title}</div>
                                            {log.message && <div className="text-xs text-muted-foreground mt-1">{log.message}</div>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
