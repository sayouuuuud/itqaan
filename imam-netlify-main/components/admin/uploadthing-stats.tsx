"use client"

import { useState, useEffect, useMemo } from "react"
import { RefreshCw, Loader2, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts"

export function UploadThingStats() {
    const [data, setData] = useState<{
        usedBytes: number,
        filesCount: number,
        history: { date: string, count: number }[]
    } | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/storage-stats')
            if (res.ok) {
                const jsonData = await res.json()
                setData({
                    usedBytes: jsonData.usedBytes,
                    filesCount: jsonData.filesCount,
                    history: jsonData.history || []
                })
            }
        } catch (error) {
            console.error("Failed to fetch storage stats", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    // Mobile detection
    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const chartData = useMemo(() => {
        if (!data?.history) return []
        return data.history.map(item => {
            const date = new Date(item.date)
            return {
                fullDate: date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
                name: date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
                uploaded: item.count,
                rawDate: item.date
            }
        })
    }, [data])

    // Filter data for mobile (last 7 days) if needed
    const displayData = isMobile ? chartData.slice(-7) : chartData

    const limitBytes = 2 * 1024 * 1024 * 1024
    const usedBytes = data?.usedBytes || 0
    const usedPercent = (usedBytes / limitBytes) * 100

    // Force explicit ticks starting from the VERY LAST element (Index 29 / Today)
    const historyTicks = useMemo(() => {
        if (!chartData.length) return [];
        const t = [];
        // Loop backwards from exactly the last index to ensure Today is the first tick displayed on the right
        for (let i = chartData.length - 1; i >= 0; i -= 3) {
            t.push(chartData[i].name);
        }
        return t;
    }, [chartData]);

    // Custom Tooltip Matching Screenshot
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card border border-border p-3 rounded-xl shadow-lg text-right">
                    <p className="text-xs font-bold mb-2 text-foreground">{payload[0].payload.fullDate}</p>
                    <div className="flex items-center justify-between gap-8">
                        <span className="text-red-600 font-bold ml-2">{payload[0].value}</span>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <span>المرفوع</span>
                            <div className="w-2 h-2 rounded-full bg-red-600"></div>
                        </div>
                    </div>
                </div>
            )
        }
        return null
    }



    return (
        <Card className="w-full mt-8 overflow-hidden border-border bg-card dark:bg-zinc-950/40 shadow-sm" dir="rtl">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 px-6 py-6 transition-colors">
                <div className="space-y-1 text-right">
                    <CardTitle className="text-lg md:text-2xl font-bold tracking-tight text-foreground">
                        معلومات التخزين للكتب والصور
                    </CardTitle>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        عرض إحصائيات الرفع {isMobile ? "أخر 7 أيام" : "أخر شهر"}
                    </p>
                </div>
                <div className="flex items-center">
                    <div className="px-8 text-right border-l border-border last:border-l-0 hidden md:block">
                        <p className="text-xs text-muted-foreground font-medium mb-1 uppercase tracking-wide">الملفات المرفوعة</p>
                        <p className="text-3xl font-bold tracking-tighter text-foreground">{(data?.filesCount || 0).toLocaleString()}</p>
                        <p className="text-xs text-green-600 dark:text-green-500 font-bold mt-1">إجمالي الملفات</p>
                    </div>
                    <div className="px-4 md:px-8 text-right">
                        <p className="text-[10px] md:text-xs text-muted-foreground font-medium mb-1 uppercase tracking-wide">المساحة</p>
                        <p className="text-xl md:text-3xl font-bold tracking-tighter text-foreground">{(usedBytes / 1024 / 1024).toFixed(0)} ميجا</p>
                        <p className="text-[10px] md:text-xs text-muted-foreground mt-1">من أصل 2 جيجا</p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                <div className="h-[300px] w-full mt-4" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                        {isMobile ? (
                            <BarChart
                                data={displayData}
                                layout="vertical"
                                margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                            >
                                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.8, fontWeight: 'bold' }}
                                    width={50}
                                />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ fill: 'currentColor', opacity: 0.05 }}
                                />
                                <Bar
                                    name="المرفوع"
                                    dataKey="uploaded"
                                    fill="#ef4444"
                                    radius={[0, 4, 4, 0]}
                                    barSize={20}
                                />
                            </BarChart>
                        ) : (
                            <BarChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 20 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.8, fontWeight: 'bold' }}
                                    ticks={historyTicks} // Direct array to force Jan 29 to show
                                    interval={0} // Force show all items in the 'ticks' array
                                    reversed={true}
                                    padding={{ right: 20, left: 20 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }}
                                    orientation="right"
                                />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ fill: 'currentColor', opacity: 0.05 }}
                                />
                                <Legend
                                    align="center"
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    formatter={() => <span className="text-foreground text-sm font-medium mr-2">المرفوع</span>}
                                />
                                <Bar
                                    name="المرفوع"
                                    dataKey="uploaded"
                                    fill="#ef4444"
                                    radius={[4, 4, 0, 0]}
                                    barSize={30}
                                    className="transition-opacity hover:opacity-80"
                                />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>

                <div className="mt-8 space-y-4">
                    <div className="space-y-2">
                        <Progress
                            value={usedPercent}
                            className="h-4 bg-muted/50 bg-primary/10 rounded-full"
                            indicatorClassName="bg-red-600 transition-all duration-1000"
                        />
                        <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-sm font-bold bg-muted/30 p-3 rounded-lg border border-border/50 shadow-inner">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-red-600" />
                            <span dir="ltr" className="text-xs md:text-sm">{(usedBytes / 1024 / 1024).toFixed(2)}MB / 2.00GB مستخدم</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchData}
                            disabled={loading}
                            className="h-8 gap-1 md:gap-2 text-[10px] md:text-sm text-muted-foreground hover:text-foreground hover:bg-muted px-2"
                        >
                            {loading ? <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" /> : <RefreshCw className="h-3 w-3 md:h-4 md:w-4" />}
                            تحديث
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
