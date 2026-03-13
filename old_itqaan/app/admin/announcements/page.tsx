"use client"

import { useState, useEffect, useCallback } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import {
    Megaphone, Plus, Edit, Trash2, CheckCircle, Clock,
    Users, GraduationCap, BookOpen, Loader2, Globe
} from "lucide-react"

const getAudienceOptions = (t: any) => [
    { value: 'all', label: t.admin.all, icon: Globe },
    { value: 'students', label: t.auth.student, icon: GraduationCap },
    { value: 'readers', label: t.auth.reader, icon: BookOpen },
]

const getPriorityOptions = (t: any) => [
    { value: 'low', label: t.admin.low, color: 'bg-gray-100 text-gray-600' },
    { value: 'normal', label: t.admin.normal, color: 'bg-blue-100 text-blue-600' },
    { value: 'high', label: t.admin.high, color: 'bg-orange-100 text-orange-600' },
    { value: 'urgent', label: t.admin.urgent, color: 'bg-red-100 text-red-600' },
]

const EMPTY_FORM = {
    title_ar: '', title_en: '', content_ar: '', content_en: '',
    target_audience: 'all', priority: 'normal', expires_at: '', is_published: false,
}

export default function AdminAnnouncementsPage() {
    const { t } = useI18n()
    const isAr = t.locale === 'ar'
    const AUDIENCE_OPTIONS = getAudienceOptions(t)
    const PRIORITY_OPTIONS = getPriorityOptions(t)

    const [announcements, setAnnouncements] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filterAudience, setFilterAudience] = useState('')
    const [filterPublished, setFilterPublished] = useState('')

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState({ ...EMPTY_FORM })
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const fetchAnnouncements = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filterAudience) params.set('audience', filterAudience)
            if (filterPublished) params.set('published', filterPublished)
            const res = await fetch(`/api/admin/announcements?${params}`)
            if (res.ok) {
                const data = await res.json()
                setAnnouncements(data.announcements)
            }
        } finally {
            setLoading(false)
        }
    }, [filterAudience, filterPublished])

    useEffect(() => { fetchAnnouncements() }, [fetchAnnouncements])

    const openCreate = () => { setEditingId(null); setForm({ ...EMPTY_FORM }); setIsDialogOpen(true) }
    const openEdit = (a: any) => {
        setEditingId(a.id)
        setForm({
            title_ar: a.title_ar || '', title_en: a.title_en || '',
            content_ar: a.content_ar || '', content_en: a.content_en || '',
            target_audience: a.target_audience || 'all',
            priority: a.priority || 'normal',
            expires_at: a.expires_at ? a.expires_at.slice(0, 10) : '',
            is_published: !!a.is_published,
        })
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!form.title_ar || !form.content_ar) return
        setSaving(true)
        try {
            if (editingId) {
                await fetch('/api/admin/announcements', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingId, ...form }),
                })
            } else {
                await fetch('/api/admin/announcements', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                })
            }
            setIsDialogOpen(false)
            fetchAnnouncements()
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm(t.admin.confirmDeleteAnnouncement)) return
        setDeletingId(id)
        try {
            await fetch('/api/admin/announcements', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            })
            fetchAnnouncements()
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t.admin.announcements}</h1>
                    <p className="text-sm text-muted-foreground mt-1">{t.admin.announcementsDesc}</p>
                </div>
                <Button onClick={openCreate} className="bg-[#0B3D2E] text-white hover:bg-[#0A3528]">
                    <Plus className="w-4 h-4 ml-2" /> {t.admin.newAnnouncement}
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <select
                    className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
                    value={filterAudience}
                    onChange={e => setFilterAudience(e.target.value)}
                >
                    <option value="">{t.admin.allAudiences}</option>
                    {AUDIENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select
                    className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
                    value={filterPublished}
                    onChange={e => setFilterPublished(e.target.value)}
                >
                    <option value="">{t.all}</option>
                    <option value="true">{t.admin.published}</option>
                    <option value="false">{t.admin.draft}</option>
                </select>
            </div>

            {/* Cards */}
            {loading ? (
                <div className="flex justify-center p-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
            ) : announcements.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>{t.admin.noAnnouncementsFound}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {announcements.map(a => {
                        const priority = PRIORITY_OPTIONS.find(p => p.value === a.priority)
                        const audience = AUDIENCE_OPTIONS.find(o => o.value === a.target_audience)
                        return (
                            <div key={a.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                            <h3 className="font-bold text-foreground text-base">{isAr ? a.title_ar : (a.title_en || a.title_ar)}</h3>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priority?.color}`}>
                                                {priority?.label}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {a.is_published ? t.admin.published : t.admin.draft}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{isAr ? a.content_ar : (a.content_en || a.content_ar)}</p>
                                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                            {audience && (
                                                <span className="flex items-center gap-1">
                                                    <audience.icon className="w-3.5 h-3.5" />
                                                    {audience.label}
                                                </span>
                                            )}
                                            {a.expires_at && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {t.admin.expiresAt}: {new Date(a.expires_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                                                </span>
                                            )}
                                            <span>{new Date(a.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button variant="ghost" size="sm" onClick={() => openEdit(a)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)} disabled={deletingId === a.id}>
                                            {deletingId === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-red-500" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingId ? t.admin.editAnnouncement : t.admin.newAnnouncement}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t.admin.titleAr}</Label>
                                <Input value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} placeholder={t.admin.titleAr.replace('*', '').trim()} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t.admin.titleEn}</Label>
                                <Input dir="ltr" value={form.title_en} onChange={e => setForm(f => ({ ...f, title_en: e.target.value }))} placeholder={t.admin.titleEn} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>{t.admin.contentAr}</Label>
                            <textarea
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm min-h-[100px] resize-none"
                                value={form.content_ar}
                                onChange={e => setForm(f => ({ ...f, content_ar: e.target.value }))}
                                placeholder={t.admin.contentAr.replace('*', '').trim()}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t.admin.contentEn}</Label>
                            <textarea
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm min-h-[80px] resize-none"
                                dir="ltr"
                                value={form.content_en}
                                onChange={e => setForm(f => ({ ...f, content_en: e.target.value }))}
                                placeholder={t.admin.contentEn}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>{t.admin.targetAudience}</Label>
                                <select
                                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
                                    value={form.target_audience}
                                    onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))}
                                >
                                    {AUDIENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>{t.admin.priority}</Label>
                                <select
                                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
                                    value={form.priority}
                                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                                >
                                    {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>{t.admin.expiryDate}</Label>
                                <Input
                                    type="date"
                                    value={form.expires_at}
                                    onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Switch
                                checked={form.is_published}
                                onCheckedChange={c => setForm(f => ({ ...f, is_published: c }))}
                            />
                            <Label>{t.admin.publishImmediately}</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t.cancel}</Button>
                        <Button onClick={handleSave} className="bg-[#0B3D2E] text-white" disabled={saving || !form.title_ar || !form.content_ar}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : null}
                            {editingId ? t.save : t.admin.newAnnouncement}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
