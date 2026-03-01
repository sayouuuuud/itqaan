"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts"
import { Globe, Smartphone, Monitor, Tablet } from "lucide-react"

interface VisitorStatsProps {
    countryData: { country: string; count: number }[]
    deviceData: { device_type: string; count: number; percentage: number }[]
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

const DeviceIcon = ({ type }: { type: string }) => {
    switch (type.toLowerCase()) {
        case "desktop":
            return <Monitor className="h-4 w-4" />
        case "mobile":
            return <Smartphone className="h-4 w-4" />
        case "tablet":
            return <Tablet className="h-4 w-4" />
        default:
            return <Monitor className="h-4 w-4" />
    }
}

export function VisitorStats({ countryData, deviceData }: VisitorStatsProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Countries Stats */}
            <div className="bg-surface rounded-xl border border-border p-5">
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                        <Globe className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-foreground">أعلى الدول</h3>
                </div>

                <div className="space-y-4">
                    {countryData.map((item, index) => (
                        <div key={item.country} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium w-6 text-text-muted">
                                    #{index + 1}
                                </span>
                                <span className="text-sm font-medium text-foreground">
                                    {(() => {
                                        try {
                                            if (item.country === "Unknown" || !item.country || item.country.length !== 2) {
                                                return "غير معروف"
                                            }
                                            return new Intl.DisplayNames(['ar'], { type: 'region' }).of(item.country) || item.country
                                        } catch {
                                            return item.country === "Unknown" ? "غير معروف" : item.country
                                        }
                                    })()}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 flex-1 mx-4">
                                <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full"
                                        style={{
                                            width: `${(item.count / Math.max(...countryData.map((d) => d.count))) * 100}%`,
                                        }}
                                    />
                                </div>
                            </div>
                            <span className="text-sm font-bold text-foreground">
                                {item.count.toLocaleString()}
                            </span>
                        </div>
                    ))}

                    {countryData.length === 0 && (
                        <div className="text-center py-8 text-text-muted">لا توجد بيانات</div>
                    )}
                </div>
            </div>

            {/* Devices Stats */}
            <div className="bg-surface rounded-xl border border-border p-5">
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                        <Smartphone className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-foreground">الأجهزة المستخدمة</h3>
                </div>

                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={deviceData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="count"
                                nameKey="device_type"
                            >
                                {deviceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip />
                            <Legend
                                layout="vertical"
                                verticalAlign="middle"
                                align="right"
                                formatter={(value, entry: any) => (
                                    <span className="text-sm text-foreground mr-2">{value === 'desktop' ? 'كمبيوتر' : value === 'mobile' ? 'موبايل' : 'تابلت'} ({entry.payload.percentage}%)</span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
