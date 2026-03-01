"use client"

import { useState } from "react"
import { ChevronDown, Download, TrendingUp, Eye, Users } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface AnalyticsData {
    date: string
    views_count: number
    visitors_count: number
}

interface ViewsChartProps {
    data: AnalyticsData[]
}

export function ViewsChart({ data }: ViewsChartProps) {
    const [selectedDay, setSelectedDay] = useState<number | null>(null)
    const [hoveredDay, setHoveredDay] = useState<number | null>(null)
    const [metric, setMetric] = useState<"views" | "visitors">("views")
    const [period, setPeriod] = useState("آخر 30 يوم")

    // Filter data based on period


    // Generate chart data from props or return empty structure for zero state
    // Generate chart data ensuring all days in the period are represented
    const totalDays = period === "آخر 7 أيام" ? 7 : period === "آخر 30 يوم" ? 30 : 90

    const chartData = Array.from({ length: totalDays }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (totalDays - 1 - i))
        const dateStr = d.toISOString().split('T')[0] // YYYY-MM-DD

        // Find matching data for this date
        const matchingItem = data.find(item => item.date.startsWith(dateStr))

        return {
            day: i + 1,
            value: matchingItem
                ? (metric === "views" ? matchingItem.views_count : matchingItem.visitors_count)
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
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-foreground text-background px-2 py-1 rounded text-xs whitespace-nowrap z-10">
                        {chartData[day - 1]?.date}: {value.toLocaleString("ar-EG")}{" "}
                        {metric === "views" ? "مشاهدة" : "زائر"}
                    </div>
                )}
                {Array.from({ length: dotsPerColumn }).map((_, index) => (
                    <div
                        key={index}
                        className={`rounded-full transition-colors duration-200 ${index >= filledDots ? 'bg-zinc-200/50 dark:bg-white/5' : ''}`}
                        style={{
                            width: dotSize,
                            height: dotSize,
                            backgroundColor:
                                index < filledDots
                                    ? isSelected || isHovered
                                        ? "var(--color-primary)"
                                        : "var(--color-primary-light, #86efac)"
                                    : undefined,
                        }}
                    />
                ))}
            </div>
        )
    }

    const targetValue = Math.round(maxValue * 0.7)

    return (
        <div className="w-full p-6 bg-card rounded-xl border border-border">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h3 className="font-bold text-lg text-foreground">
                        إحصائيات الزيارات
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        الإجمالي: {totalValue.toLocaleString("ar-EG")} | المتوسط:{" "}
                        {avgValue.toLocaleString("ar-EG")} يومياً
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Metric Toggle */}
                    <div className="flex items-center gap-2 bg-background rounded-lg p-1">
                        <button
                            onClick={() => setMetric("views")}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${metric === "views"
                                ? "bg-primary text-white"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Eye className="h-4 w-4" />
                            المشاهدات
                        </button>
                        <button
                            onClick={() => setMetric("visitors")}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${metric === "visitors"
                                ? "bg-primary text-white"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Users className="h-4 w-4" />
                            الزوار
                        </button>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="text-muted-foreground gap-1">
                                {period}
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setPeriod("آخر 7 أيام")}>
                                آخر 7 أيام
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPeriod("آخر 30 يوم")}>
                                آخر 30 يوم
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPeriod("آخر 90 يوم")}>
                                آخر 90 يوم
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-background rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">
                        {totalValue.toLocaleString("ar-EG")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        إجمالي {metric === "views" ? "المشاهدات" : "الزوار"}
                    </p>
                </div>

                <div className="bg-background rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">
                        {avgValue.toLocaleString("ar-EG")}
                    </p>
                    <p className="text-xs text-muted-foreground">متوسط يومي</p>
                </div>

                <div className="bg-background rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">
                        {Math.max(...chartData.map((d) => d.value)).toLocaleString("ar-EG")}
                    </p>
                    <p className="text-xs text-muted-foreground">أعلى يوم</p>
                </div>
            </div>

            {/* Chart Area */}
            <div className="relative">
                {/* Y-axis labels */}
                <div className="absolute right-0  top-0 bottom-8 flex flex-col justify-between text-sm text-muted-foreground">
                    <span>{maxValue}</span>
                    <span>{Math.round(maxValue * 0.66)}</span>
                    <span>{Math.round(maxValue * 0.33)}</span>
                    <span>0</span>
                </div>

                {/* Target line with tooltip */}
                <div
                    className="absolute right-12  left-0 flex items-center"
                    style={{ top: `${((maxValue - targetValue) / maxValue) * 100}%` }}
                >
                    <div className="bg-primary  text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {targetValue}
                    </div>
                    <div
                        className="flex-1 border-t-2  border-dashed border-primary/40"
                        style={{ marginRight: 8 }}
                    />
                </div>

                {/* Dots Chart */}
                <div
                    className="mr-12 flex items-end  justify-between gap-1 overflow-hidden"
                    style={{ height: 200 }}
                >
                    {chartData.map((item) => (
                        <div key={item.day} className="flex flex-col  items-center flex-shrink-0">
                            {renderDots(item.value, item.day)}
                        </div>
                    ))}
                </div>

                {/* X-axis labels */}
                <div className="mr-12 flex justify-between mt-4 text-sm text-muted-foreground">
                    {chartData
                        .filter((_, i) => (chartData.length - 1 - i) % 5 === 0)
                        .map((item) => (
                            <span
                                key={item.day}
                                className=""
                            >
                                {item.date}
                            </span>
                        ))}
                </div>
            </div>
        </div>
    )
}
