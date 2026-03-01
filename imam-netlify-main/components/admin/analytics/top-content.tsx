"use client"

import { useState } from "react"
import { Eye, Calendar, Filter } from "lucide-react"

interface TopContentProps {
    initialData: any[] // We'll fetch this from the server
}

export function TopContent({ initialData }: TopContentProps) {
    const [period, setPeriod] = useState("week") // week, month, year

    // Helper to format type
    const formatType = (type: string) => {
        switch (type) {
            case 'khutba': return 'خطبة';
            case 'dars': return 'درس';
            case 'book': return 'كتاب';
            case 'article': return 'مقال';
            default: return 'صفحة';
        }
    }

    return (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Filter className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-foreground">المحتوى الأكثر مشاهدة</h3>
                </div>

                <div className="flex bg-muted rounded-lg p-1">
                    {/* Time filters are currently visual-only because strictly speaking
                        'top pages' data comes pre-aggregated from the database view.
                        To implement real filtering, we would need to pass period to server
                        or have daily stats for pages. For now, we keep the UI ready. 
                    */}
                    <button
                        onClick={() => setPeriod("week")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === "week"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-text-muted hover:text-foreground"
                            }`}
                    >
                        أسبوع
                    </button>
                    <button
                        onClick={() => setPeriod("month")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === "month"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-text-muted hover:text-foreground"
                            }`}
                    >
                        شهر
                    </button>
                    <button
                        onClick={() => setPeriod("year")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === "year"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-text-muted hover:text-foreground"
                            }`}
                    >
                        سنة
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-text-muted">
                        <tr>
                            <th className="px-4 py-3 text-right font-medium">العنوان</th>
                            <th className="px-4 py-3 text-right font-medium">النوع</th>
                            <th className="px-4 py-3 text-right font-medium">المشاهدات</th>
                            <th className="px-4 py-3 text-right font-medium">تاريخ النشر</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {initialData && initialData.length > 0 ? (
                            initialData.map((item, i) => (
                                <tr key={i} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate" title={item.title}>
                                        {item.title}
                                    </td>
                                    <td className="px-4 py-3 text-text-muted">
                                        {formatType(item.type)}
                                    </td>
                                    <td className="px-4 py-3 text-foreground font-bold flex items-center gap-1">
                                        <Eye className="h-3 w-3 text-text-muted" />
                                        {item.views.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-text-muted">
                                        {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("ar-EG") : "-"}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-text-muted">
                                    لا توجد بيانات متاحة لهذه الفترة
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
