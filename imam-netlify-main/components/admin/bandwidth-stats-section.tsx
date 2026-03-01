'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, BookOpen, Download, Eye, Music, Headphones, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

interface BookStats {
    summary: {
        total_downloads: number
        total_views: number
        total_pages: number
        total_bandwidth_bytes: number
    }
    top_items: {
        id: string
        title: string
        downloads: number
        views: number
        pages: number
        bandwidth: number
    }[]
}

interface AudioStats {
    summary: {
        total_downloads: number
        total_streams: number
        total_duration_seconds: number
        total_bandwidth_bytes: number
    }
    top_items: {
        id: string
        type: string
        downloads: number
        streams: number
        duration: number
        bandwidth: number
    }[]
}

function formatBytes(bytes: number): string {
    if (!bytes || isNaN(bytes)) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDuration(seconds: number): string {
    if (!seconds) return '0 دقيقة'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
        return `${hours} ساعة ${minutes} دقيقة`
    }
    return `${minutes} دقيقة`
}

export function BandwidthStatsSection() {
    const [period, setPeriod] = useState('month')
    const [bookStats, setBookStats] = useState<BookStats | null>(null)
    const [audioStats, setAudioStats] = useState<AudioStats | null>(null)
    const [loadingBooks, setLoadingBooks] = useState(false)
    const [loadingAudio, setLoadingAudio] = useState(false)

    const fetchBookStats = async () => {
        setLoadingBooks(true)
        try {
            const res = await fetch(`/api/bandwidth/stats?type=books&period=${period}`)
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setBookStats(data)
        } catch (error) {
            console.error(error)
            toast.error('فشل في تحميل إحصائيات الكتب')
        } finally {
            setLoadingBooks(false)
        }
    }

    const fetchAudioStats = async () => {
        setLoadingAudio(true)
        try {
            const res = await fetch(`/api/bandwidth/stats?type=audio&period=${period}`)
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setAudioStats(data)
        } catch (error) {
            console.error(error)
            toast.error('فشل في تحميل إحصائيات الصوتيات')
        } finally {
            setLoadingAudio(false)
        }
    }

    useEffect(() => {
        fetchBookStats()
        fetchAudioStats()
    }, [period])

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        الإحصائيات التفصيلية
                    </CardTitle>
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">اليوم</SelectItem>
                            <SelectItem value="week">هذا الأسبوع</SelectItem>
                            <SelectItem value="month">هذا الشهر</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="books" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="books" className="gap-2">
                            <BookOpen className="h-4 w-4" />
                            الكتب
                        </TabsTrigger>
                        <TabsTrigger value="audio" className="gap-2">
                            <Music className="h-4 w-4" />
                            الصوتيات
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="books" className="space-y-4 mt-4">
                        {loadingBooks ? (
                            <div className="flex items-center justify-center h-48">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : bookStats ? (
                            <>
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 text-center">
                                        <Download className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                                        <div className="text-2xl font-bold">{bookStats.summary.total_downloads}</div>
                                        <div className="text-xs text-muted-foreground">تحميلات</div>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 text-center">
                                        <Eye className="h-5 w-5 mx-auto mb-1 text-green-600" />
                                        <div className="text-2xl font-bold">{bookStats.summary.total_views}</div>
                                        <div className="text-xs text-muted-foreground">قراءات</div>
                                    </div>
                                    <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4 text-center">
                                        <BookOpen className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                                        <div className="text-2xl font-bold">{bookStats.summary.total_pages.toLocaleString()}</div>
                                        <div className="text-xs text-muted-foreground">صفحات</div>
                                    </div>
                                    <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-4 text-center">
                                        <TrendingUp className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                                        <div className="text-2xl font-bold">{formatBytes(bookStats.summary.total_bandwidth_bytes)}</div>
                                        <div className="text-xs text-muted-foreground">باندويدث</div>
                                    </div>
                                </div>

                                {/* Top Books Table */}
                                <div>
                                    <h4 className="font-semibold mb-2">أكثر الكتب استهلاكاً</h4>
                                    {bookStats.top_items.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-8">لا توجد بيانات لهذه الفترة</p>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="text-right">#</TableHead>
                                                    <TableHead className="text-right">الكتاب</TableHead>
                                                    <TableHead className="text-center">تحميلات</TableHead>
                                                    <TableHead className="text-center">قراءات</TableHead>
                                                    <TableHead className="text-center">الباندويدث</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {bookStats.top_items.map((item, index) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell>{index + 1}</TableCell>
                                                        <TableCell className="font-medium">{item.title}</TableCell>
                                                        <TableCell className="text-center">{item.downloads}</TableCell>
                                                        <TableCell className="text-center">{item.views}</TableCell>
                                                        <TableCell className="text-center">{formatBytes(item.bandwidth)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </div>
                            </>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
                        )}
                    </TabsContent>

                    <TabsContent value="audio" className="space-y-4 mt-4">
                        {loadingAudio ? (
                            <div className="flex items-center justify-center h-48">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : audioStats ? (
                            <>
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 text-center">
                                        <Download className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                                        <div className="text-2xl font-bold">{audioStats.summary.total_downloads}</div>
                                        <div className="text-xs text-muted-foreground">تحميلات</div>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 text-center">
                                        <Headphones className="h-5 w-5 mx-auto mb-1 text-green-600" />
                                        <div className="text-2xl font-bold">{audioStats.summary.total_streams}</div>
                                        <div className="text-xs text-muted-foreground">استماع</div>
                                    </div>
                                    <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4 text-center">
                                        <Music className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                                        <div className="text-2xl font-bold">{formatDuration(audioStats.summary.total_duration_seconds)}</div>
                                        <div className="text-xs text-muted-foreground">المدة</div>
                                    </div>
                                    <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-4 text-center">
                                        <TrendingUp className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                                        <div className="text-2xl font-bold">{formatBytes(audioStats.summary.total_bandwidth_bytes)}</div>
                                        <div className="text-xs text-muted-foreground">باندويدث</div>
                                    </div>
                                </div>

                                {/* Top Audio Table */}
                                <div>
                                    <h4 className="font-semibold mb-2">أكثر الصوتيات استهلاكاً</h4>
                                    {audioStats.top_items.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-8">لا توجد بيانات لهذه الفترة</p>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="text-right">#</TableHead>
                                                    <TableHead className="text-right">النوع</TableHead>
                                                    <TableHead className="text-center">تحميلات</TableHead>
                                                    <TableHead className="text-center">استماع</TableHead>
                                                    <TableHead className="text-center">الباندويدث</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {audioStats.top_items.map((item, index) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell>{index + 1}</TableCell>
                                                        <TableCell className="font-medium">
                                                            {item.type === 'lesson' ? 'درس' : 'خطبة'}
                                                        </TableCell>
                                                        <TableCell className="text-center">{item.downloads}</TableCell>
                                                        <TableCell className="text-center">{item.streams}</TableCell>
                                                        <TableCell className="text-center">{formatBytes(item.bandwidth)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </div>
                            </>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
