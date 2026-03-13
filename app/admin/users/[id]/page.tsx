"use client"

import React, { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    Activity,
    AlertCircle,
    BarChart3,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Globe,
    Info,
    Laptop,
    List,
    Loader2,
    Mail,
    MessageSquare,
    Mic,
    Mic2,
    Pause,
    Phone,
    Play,
    Shield,
    Star,
    TrendingUp,
    User as UserIcon,
    XCircle,
    ClipboardList,
    Trash2,
    AlertTriangle,
} from "lucide-react"
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts'
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/status-badge"

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { t } = useI18n()
    const router = useRouter()
    const isAr = t.locale === "ar"
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState("info")
    const [isDeleting, setIsDeleting] = useState(false)
    const { id } = use(params)

    const handleDeleteUser = async () => {
        if (!window.confirm(isAr ? "هل أنت متأكد من حذف هذا المستخدم نهائياً؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to permanently delete this user? This action cannot be undone.")) {
            return
        }

        setIsDeleting(true)
        try {
            const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error(t.admin.failedToDeleteUser || "Failed to delete user")
            router.push('/admin/users')
        } catch (err: any) {
            alert(err.message)
            setIsDeleting(false)
        }
    }

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch(`/api/admin/users/${id}`)
                if (!res.ok) throw new Error(t.admin.failedToLoadData)
                const json = await res.json()
                setData(json)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [id, t.admin.failedToLoadData])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#1B5E3B]" />
                <p className="text-gray-500 font-medium">{t.loading}</p>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-destructive">
                <AlertCircle className="w-12 h-12" />
                <p className="text-lg font-bold">{error || t.admin.userNotFound}</p>
                <Button onClick={() => router.back()} variant="outline">{t.back}</Button>
            </div>
        )
    }

    const { user, metrics, lastSession } = data

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <button onClick={() => router.push('/admin/users')} className="hover:text-[#1B5E3B] transition-colors">
                        {t.admin.users}
                    </button>
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                    <span className="font-bold text-gray-800">{user.name}</span>
                </div>
                <div className="flex gap-3">
                    <Badge variant={user.is_active ? "default" : "destructive"} className="px-3 py-1">
                        {user.is_active ? t.active : t.blocked}
                    </Badge>
                    <Button 
                        variant="destructive" 
                        size="sm" 
                        className="gap-2 font-bold px-3 rounded-lg bg-red-600 hover:bg-red-700 h-8"
                        onClick={() => handleDeleteUser()}
                        disabled={isDeleting}
                    >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        {t.admin.deleteUser || "Delete"}
                    </Button>
                </div>
            </div>

            {/* Profile Overview Card */}
            <Card className="border-gray-100 shadow-sm overflow-hidden bg-white rounded-2xl">
                <CardContent className="p-6 sm:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        {/* User Info Left Side (RTL -> Right Side) */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-start gap-6">
                            <div className="relative w-24 h-24 shrink-0 shadow-sm rounded-2xl">
                                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center text-[#1B5E3B] font-black text-4xl border border-emerald-100 overflow-hidden">
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        user.name.charAt(0)
                                    )}
                                </div>
                                {user.is_online && (
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-card" title={t.admin.onlineNow} />
                                )}
                            </div>
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                                    <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 capitalize font-bold px-3 py-1 rounded-full">
                                        {user.role === 'student' ? (t.student.studentLabel || t.auth.student) : 
                                         user.role === 'reader' ? (t.reader.readerLabel || t.auth.reader) :
                                         user.role === 'student_supervisor' ? (t.auth.studentSupervisor || "Student Supervisor") :
                                         user.role === 'reciter_supervisor' ? (t.auth.reciterSupervisor || "Reciter Supervisor") :
                                         user.role === 'admin' ? t.auth.admin : user.role}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-gray-500 text-sm font-medium">
                                    <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100"><Mail className="w-4 h-4 text-gray-400" /> {user.email || "---"}</span>
                                    {user.phone && <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100"><Phone className="w-4 h-4 text-gray-400" /> {user.phone}</span>}
                                    <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        {t.admin.joinDate}: {new Date(user.created_at).toLocaleDateString(t.locale === 'ar' ? 'ar-SA' : 'en-US')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-center sm:justify-start gap-3 shrink-0">
                             {/* Chat integration removed - as per Phase 4 requirements */}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* TABS Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-gray-50/80 p-1.5 rounded-xl inline-flex flex-wrap w-full sm:w-auto justify-start mb-8 gap-2 border border-gray-100 shadow-sm">
                    <TabsTrigger value="info" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#1B5E3B] data-[state=active]:shadow-sm text-gray-500 hover:text-gray-900 font-bold gap-2 px-5 py-2.5 transition-all">
                        <Info className="w-4 h-4" />
                        {t.admin.basicInfo}
                    </TabsTrigger>
                    <TabsTrigger value="stats" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#1B5E3B] data-[state=active]:shadow-sm text-gray-500 hover:text-gray-900 font-bold gap-2 px-5 py-2.5 transition-all">
                        <BarChart3 className="w-4 h-4" />
                        {t.admin.statistics}
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2 rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <ClipboardList className="w-4 h-4" />
                        {user.role === 'student' ? t.admin.studentRecitationsHistory : t.admin.readerReviewsHistory}
                    </TabsTrigger>
                    {user.role === 'student' && (
                        <TabsTrigger value="errors" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#1B5E3B] data-[state=active]:shadow-sm text-gray-500 hover:text-gray-900 font-bold gap-2 px-5 py-2.5 transition-all">
                            <AlertCircle className="w-4 h-4" />
                            {t.admin.errorsLog || "Errors Log"}
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* INFO TAB */}
                <TabsContent value="info" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-gray-100 shadow-sm rounded-2xl bg-white">
                            <CardHeader className="border-b border-gray-50/80 pb-4 mb-4 bg-gray-50/30 rounded-t-2xl">
                                <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
                                    <UserIcon className="w-5 h-5 text-[#1B5E3B]" />
                                    {t.admin.accountDetails}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-gray-500 font-medium">{t.auth.role}</span>
                                    <Badge variant="outline" className="bg-gray-50 text-gray-700 capitalize border-gray-200">
                                        {user.role === 'student' ? (t.student.studentLabel || t.auth.student) : 
                                         user.role === 'reader' ? (t.reader.readerLabel || t.auth.reader) :
                                         user.role === 'student_supervisor' ? (t.auth.studentSupervisor || "Student Supervisor") :
                                         user.role === 'reciter_supervisor' ? (t.auth.reciterSupervisor || "Reciter Supervisor") :
                                         user.role === 'admin' ? t.auth.admin : user.role}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-gray-500 font-medium">{t.admin.joinDate}</span>
                                    <span className="text-gray-900 font-bold">{new Date(user.created_at).toLocaleDateString(t.locale === 'ar' ? 'ar-SA' : 'en-US')}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-gray-500 font-medium">{t.admin.lastLogin}</span>
                                    <span className="text-gray-900 font-bold">{user.last_login_at ? new Date(user.last_login_at).toLocaleString(t.locale === 'ar' ? 'ar-SA' : 'en-US') : "---"}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-gray-100 shadow-sm rounded-2xl bg-white">
                            <CardHeader className="border-b border-gray-50/80 pb-4 mb-4 bg-gray-50/30 rounded-t-2xl">
                                <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-[#1B5E3B]" />
                                    {t.admin.technicalData}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-gray-500 font-medium flex items-center gap-2.5">
                                        <Globe className="w-4 h-4 text-gray-400" /> {t.admin.country}
                                    </span>
                                    <span className="text-gray-900 font-bold px-2 py-1 rounded-md">{data.country || "N/A"}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-gray-500 font-medium flex items-center gap-2.5">
                                        <Globe className="w-4 h-4 text-gray-400" /> {t.admin.ipAddress}
                                    </span>
                                    <span className="text-gray-900 font-bold font-mono text-sm bg-gray-50 px-2 py-1 rounded-md border border-gray-100">{data.lastSession?.ip_address || "N/A"}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-gray-500 font-medium flex items-center gap-2.5">
                                        <Laptop className="w-4 h-4 text-gray-400" /> {isAr ? 'الجهاز والمنصفح' : 'Device & Browser'}
                                    </span>
                                    <span className="text-gray-900 font-bold text-xs max-w-[200px] truncate bg-gray-50 px-2 py-1 rounded-md border border-gray-100" title={data.lastSession?.user_agent}>
                                        {data.lastSession?.user_agent || "N/A"}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Reader Profile Additional Info */}
                    {user.role === 'reader' && (
                        <Card className="border-gray-100 shadow-sm rounded-2xl bg-white mt-6">
                            <CardHeader className="border-b border-gray-50/80 pb-4 mb-4 bg-gray-50/30 rounded-t-2xl">
                                <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
                                    <ClipboardList className="w-5 h-5 text-[#1B5E3B]" />
                                    {isAr ? 'بيانات التسجيل (مقرئ)' : 'Registration Details (Reader)'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                        <span className="text-gray-500 font-medium">{isAr ? 'الاسم الثلاثي' : 'Triple Full Name'}</span>
                                        <span className="text-gray-900 font-bold">{user.full_name_triple || "---"}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                        <span className="text-gray-500 font-medium">{isAr ? 'المدينة' : 'City'}</span>
                                        <span className="text-gray-900 font-bold">{user.city || "---"}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                        <span className="text-gray-500 font-medium">{isAr ? 'التخصص' : 'Specialization'}</span>
                                        <span className="text-gray-900 font-bold">{user.specialization || "---"}</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                        <span className="text-gray-500 font-medium">{isAr ? 'المؤهل' : 'Qualification'}</span>
                                        <span className="text-gray-900 font-bold">{user.qualification || "---"}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                        <span className="text-gray-500 font-medium">{isAr ? 'الأجزاء المحفوظة' : 'Memorized Parts'}</span>
                                        <span className="text-gray-900 font-bold">{user.memorized_parts || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                        <span className="text-gray-500 font-medium">{isAr ? 'سنوات الخبرة' : 'Years of Experience'}</span>
                                        <span className="text-gray-900 font-bold">{user.years_of_experience || 0}</span>
                                    </div>
                                </div>
                                {user.certificate_file_url && (
                                    <div className="md:col-span-2 pt-4">
                                        <Button asChild variant="outline" className="w-full border-dashed border-gray-300">
                                            <a href={user.certificate_file_url} target="_blank" rel="noopener noreferrer">
                                                {isAr ? 'عرض الشهادة المرفقة' : 'View Attached Certificate'}
                                            </a>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* STATS TAB */}
                <TabsContent value="stats" className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { label: t.admin.completedSessions, value: metrics.sessions.completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: t.admin.noShows, value: metrics.sessions.noShow, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
                            { label: t.admin.totalRecitations, value: metrics.recitations.monthly, icon: Mic, color: 'text-[#1B5E3B]', bg: 'bg-emerald-50/50' },
                        ].map((stat, i) => (
                            <Card key={i} className="border-gray-100 shadow-sm bg-white rounded-2xl">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-gray-500 mb-1">{stat.label}</p>
                                            <h3 className="text-3xl font-black text-gray-900">{stat.value}</h3>
                                        </div>
                                        <div className={`p-3 rounded-xl ${stat.bg}`}>
                                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Weekly Performance */}
                    <Card className="border-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden">
                        <CardHeader className="border-b border-gray-50/80 pb-4 mb-4 bg-gray-50/30">
                            <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-[#1B5E3B]" />
                                {t.admin.recitationActivity14Days}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.activityData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9ca3af', fontSize: 10 }}
                                            tickFormatter={(val) => {
                                                const d = new Date(val);
                                                return d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short' });
                                            }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9ca3af', fontSize: 10 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}
                                            labelFormatter={(val) => {
                                                const d = new Date(val);
                                                return d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });
                                            }}
                                        />
                                        <Bar
                                            dataKey="count"
                                            fill="#1B5E3B"
                                            radius={[4, 4, 0, 0]}
                                            barSize={24}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* HISTORY TAB */}
                <TabsContent value="history" className="space-y-6">
                    {data.history && data.history.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {data.history.map((item: any) => (
                                <Card key={item.id} className="border-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden hover:shadow-md transition-shadow group relative">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4 p-5">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                            <Mic2 className="w-6 h-6" />
                                        </div>
                                        <div className="flex-grow space-y-1 relative">
                                            <Link href={`/admin/recitations/${item.id}`} className="absolute inset-0 z-10">
                                                <span className="sr-only">{t.admin.viewDetails}</span>
                                            </Link>
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-lg font-bold text-gray-800 group-hover:text-[#1B5E3B] transition-colors">
                                                    {t.reader.surah} {item.surah_name}
                                                    <span className="text-gray-400 text-sm font-normal mr-2">
                                                        ({t.reader.ayahs} {item.ayah_from} - {item.ayah_to})
                                                    </span>
                                                </h4>
                                                <StatusBadge status={item.status} className="h-6 relative z-20 pointer-events-none" />
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1.5 line-clamp-1">
                                                    <UserIcon className="w-4 h-4" />
                                                    {user.role === 'student' ? (
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {item.evaluator_name ? `${t.admin.evaluator}: ${item.evaluator_name}` : t.admin.pendingEvaluation}
                                                        </p>
                                                    ) : (
                                                        `${t.admin.student}: ${item.student_name}`
                                                    )}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(item.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </span>

                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 hidden md:flex relative z-20">
                                        <Link href={`/admin/recitations/${item.id}`} className="p-2 text-gray-400 hover:text-[#1B5E3B] hover:bg-gray-50 rounded-full transition-colors">
                                            <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                                        </Link>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white text-gray-500 min-h-[300px] flex items-center justify-center relative">
                            <div className="p-12 text-center text-gray-400">
                                <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>{user.role === 'student' ? t.admin.noStudentRecitations : t.admin.noReaderReviews}</p>
                            </div>
                        </Card>
                    )}
                </TabsContent>

                {/* CHAT TAB - REMOVED for Phase 4 */}
                
                {/* ERRORS TAB (Student only) */}
                {user.role === 'student' && (
                  <TabsContent value="errors" className="space-y-6">
                    {data.errorsLog && data.errorsLog.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {data.errorsLog.map((error: any, idx: number) => (
                          <Card key={idx} className="border-red-100 shadow-sm rounded-2xl bg-white overflow-hidden border">
                            <CardHeader className="bg-red-50/50 pb-3">
                              <CardTitle className="text-sm font-bold text-red-900 flex items-center justify-between">
                                <span>{t.reader.surah} {error.surah_name}</span>
                                <span className="text-red-700/60 font-medium">{new Date(error.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                              {error.error_markers && error.error_markers.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {error.error_markers.map((m: any, i: number) => (
                                    <Badge key={i} variant="outline" className="bg-red-50 text-red-700 border-red-100">
                                      {m.type === 'tajweed' ? (isAr ? 'تجويد' : 'Tajweed') : (isAr ? 'نطق' : 'Pronunciation')}: {m.note}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              <p className="text-gray-700 text-sm italic">{error.detailed_feedback}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white text-gray-500 min-h-[300px] flex items-center justify-center relative">
                          <div className="p-12 text-center text-gray-400">
                              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                              <p>{isAr ? 'لا يوجد سجل أخطاء مسجل لهذا الطالب.' : 'No errors log recorded for this student.'}</p>
                          </div>
                      </Card>
                    )}
                  </TabsContent>
                )}
            </Tabs>
        </div >
    )
}
