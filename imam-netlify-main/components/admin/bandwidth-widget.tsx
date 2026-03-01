'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Activity, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface BandwidthData {
    bandwidth: {
        usage: number
        limit: number
        credits_limit?: number
    }
    storage?: {
        usage: number
    }
}

function formatBytes(bytes: number): string {
    if (!bytes || isNaN(bytes)) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function getProgressColor(percent: number): string {
    if (percent >= 90) return 'bg-red-500'
    if (percent >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
}

export function BandwidthWidget() {
    const [data, setData] = useState<BandwidthData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/bandwidth/current')
                if (res.ok) {
                    const json = await res.json()
                    setData(json)
                }
            } catch (error) {
                console.error('Error fetching bandwidth:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        ملخص الباندويدث
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-16 flex items-center justify-center">
                        <div className="animate-pulse bg-muted h-4 w-24 rounded" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!data) {
        return null
    }

    // Calculate values
    const creditLimit = data.bandwidth.credits_limit || 25
    const limitBytes = creditLimit * 1024 * 1024 * 1024
    const totalUsageBytes = data.bandwidth.usage || 0
    const remainingBytes = Math.max(0, limitBytes - totalUsageBytes)
    const usedPercent = limitBytes > 0 ? (totalUsageBytes / limitBytes) * 100 : 0

    return (
        <Link href="/admin/bandwidth">
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-primary" />
                            ملخص الباندويدث
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-[-4px] transition-transform" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">المستهلك:</span>
                        <span className="font-medium">{formatBytes(totalUsageBytes)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">المتبقي:</span>
                        <span className="font-medium text-green-600">{formatBytes(remainingBytes)}</span>
                    </div>
                    <div className="space-y-1">
                        <Progress
                            value={usedPercent}
                            className="h-2"
                            indicatorClassName={getProgressColor(usedPercent)}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{usedPercent.toFixed(1)}%</span>
                            <span>{formatBytes(limitBytes)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
