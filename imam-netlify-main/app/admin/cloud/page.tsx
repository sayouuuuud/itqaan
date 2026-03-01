"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Server, Database, Activity, HardDrive, AlertTriangle, Cloud } from "lucide-react"
import { BandwidthSettingsForm } from "@/components/admin/bandwidth-settings-form"
import { BandwidthStatsSection } from "@/components/admin/bandwidth-stats-section"
import { UploadThingStats } from "@/components/admin/uploadthing-stats"

interface BandwidthData {
    plan: string
    last_updated: string
    bandwidth: {
        usage: number
        limit: number
        used_percent: number
        credits_limit?: number
    }
    storage?: {
        usage: number
    }
    credits?: {
        usage: number
        limit: number
    }
}

export default function CloudPage() {
    const [data, setData] = useState<BandwidthData | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true)
        else setLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/bandwidth/current')
            if (!res.ok) throw new Error('Failed to fetch data')
            const jsonData = await res.json()
            setData(jsonData)
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Error loading data')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const formatBytes = (bytes: number) => {
        if (!bytes || isNaN(bytes)) return '0 B'
        // Using 1024 (Binary) - THIS IS WHAT CLOUDINARY USES IN DASHBOARD FOR GB/MB
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const getProgressColor = (percent: number) => {
        if (percent > 90) return "bg-red-500"
        if (percent > 70) return "bg-yellow-500"
        return "bg-green-500"
    }

    // Credits Calculation (Main Limit)
    // Cloudinary Free Plan limit of 25 is CREDITS. 1 Credit = 1 GB
    const creditLimit = data?.bandwidth?.credits_limit || 25
    const limitBytes = creditLimit * 1024 * 1024 * 1024

    const totalUsageBytes = data?.bandwidth?.usage || 0
    const storageUsageBytes = data?.storage?.usage || 0
    // Real Bandwidth = Total Credits Consumed - Storage
    const realBandwidthBytes = Math.max(0, totalUsageBytes - storageUsageBytes)

    // Manual calculation to match what the user sees on screen (Bandwidth + Storage)
    const usedPercent = limitBytes > 0 ? (totalUsageBytes / limitBytes) * 100 : 0

    // Remaining (Total Limit - Total Usage)
    const remainingBytes = Math.max(0, limitBytes - totalUsageBytes)
    const remainingPercent = 100 - usedPercent

    return (
        <div className="space-y-8 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Cloud className="h-8 w-8 text-primary" />
                        معلومات السحابة
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        مراقبة استهلاك الباندويدث للصوتيات
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => fetchData(true)}
                        disabled={loading || refreshing}
                        className="gap-2"
                    >
                        {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        تحديث البيانات
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    {error}
                </div>
            )}

            {loading && !data ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : data && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Limit Card */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    الحد الشهري (Credits)
                                </CardTitle>
                                <Server className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatBytes(data.bandwidth.limit)}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    من خطة: <span className="font-semibold text-primary">{data.plan}</span>
                                </p>
                            </CardContent>
                        </Card>

                        {/* Used Card (Total) */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    الاستهلاك الكلي
                                </CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                {/* API 'bandwidth.usage' is actually the Total Usage (Bandwidth + Storage) */}
                                <div className="text-2xl font-bold">{formatBytes(data.bandwidth.usage)}</div>
                                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                                    <div className="flex justify-between">
                                        <span>الباندويدث:</span>
                                        {/* Real Bandwidth = Total - Storage */}
                                        <span>{formatBytes(realBandwidthBytes)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>التخزين:</span>
                                        <span>{formatBytes(data.storage?.usage || 0)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Remaining Card */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    الرصيد المتبقي
                                </CardTitle>
                                <HardDrive className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                {/* Remaining is calculated from the Total Limit - Total Usage */}
                                <div className="text-2xl font-bold">{formatBytes(remainingBytes)}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {remainingPercent.toFixed(1)}% متبقي من الباقة
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Progress Section */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>نسبة استهلاك الباقة </span>
                                    <span className="font-bold">{usedPercent.toFixed(2)}%</span>
                                </div>
                                <Progress
                                    value={usedPercent}
                                    className="h-4"
                                    indicatorClassName={getProgressColor(usedPercent)}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground pt-1">
                                    <span>0%</span>
                                    <span>50%</span>
                                    <span>100%</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* UploadThing Storage Stats */}
                    <UploadThingStats />

                </>
            )
            }
        </div >
    )
}
