"use client"

import { useState } from "react"
import { ChevronDown, Download, TrendingUp, Eye, Users } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface AnalyticsData {
    date: string
    views_count: number
    visitors_count?: number
}

interface ViewsChartProps {
    data: AnalyticsData[]
}

export function ViewsChart({ data }: ViewsChartProps) {
    const [selectedDay, setSelectedDay] = useState<number | null>(null)
    const [hoveredDay, setHoveredDay] = useState<number | null>(null)
    const [metric, setMetric] = useState<"views" | "visitors">("views")
    const [period, setPeriod] = useState("آخر 30 يوم")

    // Generate chart data ensuring all days in the period are represented
    const totalDays = period === "آخر 7 أيام" ? 7 : period === "آخر 30 يوم" ? 30 : 90

    const chartData = Array.from({ length: totalDays }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (totalDays - 1 - i))
        const dateStr = d.toISOString().split('T')[0] // YYYY-MM-DD

        // Find matching data for this date
        const matchingItem = data.find(item => item.date?.startsWith(dateStr))

        return {
            day: i + 1,
            value: matchingItem
                ? (metric === "views" ? (matchingItem.views_count || 0) : ((matchingItem as any).visitors_count || matchingItem.views_count || 0))
                : 0,
            date: d.toLocaleDateString("ar-EG", {
                month: "short",
                day: "numeric",
            }),
            fullDate: dateStr,
        }
    })

    const maxValue = Math.max(...chartData.map((d) => d.value), 10) // Min max value of 10 to avoid 0 division
    const totalValue = chartData.reduce((sum, d) => sum + d.value, 0)
    const avgValue = Math.round(totalValue / chartData.length)
    const dotSize = 8
    const dotsPerColumn = 10

    const renderDots = (value: number, day: number) => {
        const normalizedValue = Math.min(value, maxValue)
        const filledDots = maxValue > 0 ? Math.round((normalizedValue / maxValue) * dotsPerColumn) : 0
        const isSelected = selectedDay === day
        const isHovered = hoveredDay === day

        return (
            <div
                className="flex flex-col-reverse gap-[2px] cursor-pointer relative group"
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
                onClick={() => setSelectedDay(selectedDay === day ? null : day)}
            >
                {/* Tooltip */}
                {isHovered && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-10 shadow-lg">
                        {chartData[day - 1]?.date}: {value.toLocaleString("ar-EG")}{" "}
                        {metric === "views" ? "مشاهدة" : "زائر"}
                    </div>
                )}
                {Array.from({ length: dotsPerColumn }).map((_, index) => (
                    <div
                        key={index}
                        className={`rounded-full transition-colors duration-200 ${index >= filledDots ? 'bg-gray-200/50 dark:bg-white/5' : ''}`}
                        style={{
                            width: dotSize,
                            height: dotSize,
                            backgroundColor:
                                index < filledDots
                                    ? isSelected || isHovered
                                        ? "#0B3D2E"
                                        : "#86efac"
                                    : undefined,
                        }}
                    />
                ))}
            </div>
        )
    }

    const targetValue = Math.round(maxValue * 0.7)

    return (
        <div className="w-full p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h3 className="font-bold text-lg text-gray-900">
                        إحصائيات الزيارات
                    </h3>
                    <p className="text-sm text-gray-500">
                        الإجمالي: {totalValue.toLocaleString("ar-EG")} | المتوسط:{" "}
                        {avgValue.toLocaleString("ar-EG")} يومياً
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Metric Toggle */}
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-100">
                        <button
                            onClick={() => setMetric("views")}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${metric === "views"
                                ? "bg-[#0B3D2E] text-white shadow-sm"
                                : "text-gray-500 hover:text-gray-900"
                                }`}
                        >
                            <Eye className="h-4 w-4" />
                            المشاهدات
                        </button>
                        <button
                            onClick={() => setMetric("visitors")}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${metric === "visitors"
                                ? "bg-[#0B3D2E] text-white shadow-sm"
                                : "text-gray-500 hover:text-gray-900"
                                }`}
                        >
                            <Users className="h-4 w-4" />
                            الزوار
                        </button>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="text-gray-700 bg-white border-gray-200 hover:bg-gray-50 gap-1 h-9">
                                {period}
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="font-sans text-right" align="end">
                            <DropdownMenuItem onClick={() => setPeriod("آخر 7 أيام")} className="cursor-pointer justify-end">
                                آخر 7 أيام
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPeriod("آخر 30 يوم")} className="cursor-pointer justify-end">
                                آخر 30 يوم
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPeriod("آخر 90 يوم")} className="cursor-pointer justify-end">
                                آخر 90 يوم
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="outline" size="icon" className="text-gray-500 bg-white border-gray-200 hover:bg-gray-50 h-9 w-9">
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                    <p className="text-2xl font-bold text-gray-900">
                        {totalValue.toLocaleString("ar-EG")}
                    </p>
                    <p className="text-xs text-gray-500">
                        إجمالي {metric === "views" ? "المشاهدات" : "الزوار"}
                    </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                    <p className="text-2xl font-bold text-gray-900">
                        {avgValue.toLocaleString("ar-EG")}
                    </p>
                    <p className="text-xs text-gray-500">متوسط يومي</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                    <p className="text-2xl font-bold text-gray-900">
                        {Math.max(...chartData.map((d) => d.value)).toLocaleString("ar-EG")}
                    </p>
                    <p className="text-xs text-gray-500">أعلى يوم</p>
                </div>
            </div>

            {/* Chart Area */}
            <div className="relative mt-8">
                {/* Y-axis labels */}
                <div className="absolute right-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-400 font-medium z-0">
                    <span>{maxValue}</span>
                    <span>{Math.round(maxValue * 0.66)}</span>
                    <span>{Math.round(maxValue * 0.33)}</span>
                    <span>0</span>
                </div>

                {/* Target line with tooltip */}
                <div
                    className="absolute right-8 left-0 flex items-center z-0"
                    style={{ top: `${((maxValue - targetValue) / maxValue) * 100}%` }}
                >
                    <div className="bg-[#0B3D2E] text-white text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span className="font-bold">{targetValue}</span>
                    </div>
                    <div
                        className="flex-1 border-t border-dashed border-[#0B3D2E]/20"
                        style={{ marginRight: 8 }}
                    />
                </div>

                {/* Dots Chart */}
                <div
                    className="mr-12 flex items-end justify-between gap-1 overflow-x-auto overflow-y-hidden pb-4 scrollbar-hide z-10 relative"
                    style={{ height: 220 }}
                >
                    {chartData.map((item) => (
                        <div key={item.day} className="flex flex-col items-center flex-shrink-0 px-[1px]">
                            {renderDots(item.value, item.day)}
                        </div>
                    ))}
                </div>

                {/* X-axis labels */}
                <div className="mr-12 flex justify-between mt-2 text-xs text-gray-400 font-medium">
                    {chartData
                        .filter((_, i) => (chartData.length - 1 - i) % (totalDays > 30 ? 10 : 5) === 0)
                        .map((item) => (
                            <span key={item.day}>
                                {item.date}
                            </span>
                        ))}
                </div>
            </div>
        </div>
    )
}
