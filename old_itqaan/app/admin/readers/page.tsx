"use client"

import { useState, useEffect, useCallback } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    BookOpen, Search, Edit, CheckCircle, XCircle,
    TrendingUp, Star, Users, Loader2, Phone, MapPin
} from "lucide-react"

export default function AdminReadersPage() {
    const { t, locale } = useI18n()
    const isAr = locale === 'ar'

    const [readers, setReaders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [filterGender, setFilterGender] = useState('')

    const [editReader, setEditReader] = useState<any>(null)
    const [editForm, setEditForm] = useState<any>({})
    const [saving, setSaving] = useState(false)

    const fetchReaders = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page: String(page), status: 'approved' })
            if (search) params.set('search', search)
            if (filterGender) params.set('gender', filterGender)
            const res = await fetch(`/api/admin/readers?${params}`)
            if (res.ok) {
                const data = await res.json()
                setReaders(data.readers)
                setTotal(data.total)
            }
        } finally {
            setLoading(false)
        }
    }, [page, search, filterGender])

    useEffect(() => {
        const timeout = setTimeout(fetchReaders, 300)
        return () => clearTimeout(timeout)
    }, [fetchReaders])

    const openEdit = (r: any) => {
        setEditReader(r)
        setEditForm({
            name: r.name || '',
            phone: r.phone || '',
            city: r.city || '',
            qualification: r.qualification || '',
            memorized_parts: r.memorized_parts || '',
            years_of_experience: r.years_of_experience || 0,
            is_active: !!r.is_active,
        })
    }

    const handleSave = async () => {
        if (!editReader) return
        setSaving(true)
        try {
            await fetch('/api/admin/readers', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editReader.id, ...editForm }),
            })
            setEditReader(null)
            fetchReaders()
        } finally {
            setSaving(false)
        }
    }

    const toggleActive = async (id: string, current: boolean) => {
        await fetch('/api/admin/readers', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, is_active: !current }),
        })
        fetchReaders()
    }

    const totalPages = Math.ceil(total / 20)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{t.admin.adminReaders.title}</h1>
                <p className="text-sm text-gray-500 mt-1">{t.admin.adminReaders.description}</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input className="pr-10 border-gray-200" placeholder={t.admin.adminReaders.searchPlaceholder} value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
                </div>
                <select
                    className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900"
                    value={filterGender}
                    onChange={e => { setFilterGender(e.target.value); setPage(1) }}
                >
                    <option value="">{t.admin.adminReaders.allGenders}</option>
                    <option value="male">{t.auth.male}</option>
                    <option value="female">{t.auth.female}</option>
                </select>
            </div>

            {/* Cards */}
            {loading ? (
                <div className="flex justify-center p-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {readers.map(r => (
                        <div key={r.id} className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow ${!r.is_active ? 'opacity-60 border-red-200' : 'border-gray-100'}`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#0B3D2E] to-[#16503A] flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md">
                                        {r.name?.[0] || 'م'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-gray-900">{r.name}</h3>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${r.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                {r.is_active ? t.admin.adminReaders.active : t.admin.adminReaders.inactive}
                                            </span>
                                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                                                {r.gender === 'male' ? t.auth.male : r.gender === 'female' ? t.auth.female : ''}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">{r.email}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                            {r.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{r.phone}</span>}
                                            {r.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.city}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => toggleActive(r.id, r.is_active)}>
                                        {r.is_active ? <XCircle className="w-4 h-4 text-red-500" /> : <CheckCircle className="w-4 h-4 text-emerald-500" />}
                                    </Button>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                                <div className="text-center">
                                    <p className="text-lg font-bold text-gray-900">{r.total_reviews_completed || 0}</p>
                                    <p className="text-[10px] text-gray-500">{t.admin.adminReaders.reviewsLabel}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-gray-900">{r.sessions_done || 0}</p>
                                    <p className="text-[10px] text-gray-500">{t.admin.adminReaders.sessionsLabel}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-gray-900 flex items-center justify-center gap-1">
                                        {r.average_session_rating ? Number(r.average_session_rating).toFixed(1) : '—'}
                                        {r.average_session_rating && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                                    </p>
                                    <p className="text-[10px] text-gray-500">{t.admin.adminReaders.ratingLabel}</p>
                                </div>
                            </div>

                            {/* Qualification */}
                            {r.qualification && (
                                <div className="mt-3 pt-3 border-t border-border/50">
                                    <p className="text-xs text-muted-foreground">
                                        <span className="font-medium text-foreground">المؤهل:</span> {r.qualification}
                                        {r.memorized_parts && ` · حافظ ${r.memorized_parts} جزء`}
                                        {r.years_of_experience > 0 && ` · خبرة ${r.years_of_experience} سنوات`}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {readers.length === 0 && !loading && (
                <div className="text-center py-16 text-muted-foreground">
                    <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>{t.admin.adminReaders.noReadersYet}</p>
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>{t.admin.adminReaders.previous}</Button>
                    <span className="text-sm text-muted-foreground">{t.admin.adminReaders.page} {page} {t.admin.adminReaders.of} {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>{t.admin.adminReaders.next}</Button>
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={!!editReader} onOpenChange={() => setEditReader(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t.admin.adminReaders.editReader}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t.admin.adminReaders.name}</Label>
                                <Input value={editForm.name || ''} onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t.admin.adminReaders.phone}</Label>
                                <Input value={editForm.phone || ''} onChange={e => setEditForm((f: any) => ({ ...f, phone: e.target.value }))} dir="ltr" />
                            </div>
                            <div className="space-y-2">
                                <Label>{t.admin.adminReaders.city}</Label>
                                <Input value={editForm.city || ''} onChange={e => setEditForm((f: any) => ({ ...f, city: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t.admin.adminReaders.qualification}</Label>
                                <Input value={editForm.qualification || ''} onChange={e => setEditForm((f: any) => ({ ...f, qualification: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t.admin.adminReaders.memorizedParts}</Label>
                                <Input value={editForm.memorized_parts || ''} onChange={e => setEditForm((f: any) => ({ ...f, memorized_parts: e.target.value }))} type="number" min={0} max={30} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t.admin.adminReaders.yearsExperience}</Label>
                                <Input value={editForm.years_of_experience || 0} onChange={e => setEditForm((f: any) => ({ ...f, years_of_experience: Number(e.target.value) }))} type="number" min={0} />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" id="is_active" checked={!!editForm.is_active} onChange={e => setEditForm((f: any) => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4" />
                            <Label htmlFor="is_active">{t.admin.adminReaders.accountActive}</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditReader(null)}>{t.admin.adminReaders.cancel}</Button>
                        <Button onClick={handleSave} className="bg-[#0B3D2E] text-white" disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : null}
                            {t.admin.adminReaders.saveChanges}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
