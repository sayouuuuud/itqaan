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
import { Mail, Edit, Check, Loader2, Eye } from "lucide-react"

export default function AdminEmailTemplatesPage() {
    const { t } = useI18n()

    const [templates, setTemplates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [editTemplate, setEditTemplate] = useState<any>(null)
    const [editForm, setEditForm] = useState<any>({})
    const [saving, setSaving] = useState(false)
    const [previewLang, setPreviewLang] = useState<'ar' | 'en'>('ar')

    const fetchTemplates = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/email-templates')
            if (res.ok) {
                const data = await res.json()
                setTemplates(data.templates || [])
            }
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchTemplates() }, [fetchTemplates])

    const openEdit = (tmpl: any) => {
        setEditTemplate(tmpl)
        setEditForm({
            subject_ar: tmpl.subject_ar || '',
            subject_en: tmpl.subject_en || '',
            body_ar: tmpl.body_ar || '',
            body_en: tmpl.body_en || '',
            is_active: !!tmpl.is_active,
        })
    }

    const handleSave = async () => {
        if (!editTemplate) return
        setSaving(true)
        try {
            await fetch(`/api/admin/email-templates/${editTemplate.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            })
            setEditTemplate(null)
            fetchTemplates()
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">قوالب البريد الإلكتروني</h1>
                <p className="text-sm text-muted-foreground mt-1">تعديل قوالب الرسائل الإلكترونية التلقائية</p>
            </div>

            {loading ? (
                <div className="flex justify-center p-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
            ) : templates.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>لا توجد قوالب بريد محددة</p>
                    <p className="text-xs mt-1">يمكن إضافتها من قاعدة البيانات</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {templates.map(tmpl => (
                        <div key={tmpl.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`w-2 h-2 rounded-full ${tmpl.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                        <h3 className="font-bold text-foreground">{tmpl.template_name_ar}</h3>
                                        <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{tmpl.template_key}</code>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{tmpl.template_name_en}</p>
                                    <div className="mt-3 bg-muted/30 rounded-xl p-3">
                                        <p className="text-xs font-medium text-muted-foreground mb-1">الموضوع:</p>
                                        <p className="text-sm font-medium text-foreground">{tmpl.subject_ar}</p>
                                    </div>
                                    {tmpl.variables?.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {tmpl.variables.map((v: string) => (
                                                <code key={v} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">{`{{${v}}}`}</code>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${tmpl.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {tmpl.is_active ? 'مفعّل' : 'معطل'}
                                    </span>
                                    <Button variant="outline" size="sm" onClick={() => openEdit(tmpl)}>
                                        <Edit className="w-4 h-4 ml-1" /> تعديل
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={!!editTemplate} onOpenChange={() => setEditTemplate(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>تعديل قالب: {editTemplate?.template_name_ar}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {/* Preview Lang Toggle */}
                        <div className="flex items-center gap-2 bg-muted rounded-xl p-1 w-fit">
                            <button
                                onClick={() => setPreviewLang('ar')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${previewLang === 'ar' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
                            >
                                عربي
                            </button>
                            <button
                                onClick={() => setPreviewLang('en')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${previewLang === 'en' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
                            >
                                English
                            </button>
                        </div>

                        {previewLang === 'ar' ? (
                            <>
                                <div className="space-y-2">
                                    <Label>موضوع الرسالة (عربي)</Label>
                                    <Input value={editForm.subject_ar || ''} onChange={e => setEditForm((f: any) => ({ ...f, subject_ar: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>نص الرسالة (عربي)</Label>
                                    <textarea
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm min-h-[180px] resize-y"
                                        value={editForm.body_ar || ''}
                                        onChange={e => setEditForm((f: any) => ({ ...f, body_ar: e.target.value }))}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <Label>Email Subject (English)</Label>
                                    <Input dir="ltr" value={editForm.subject_en || ''} onChange={e => setEditForm((f: any) => ({ ...f, subject_en: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email Body (English)</Label>
                                    <textarea
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm min-h-[180px] resize-y"
                                        dir="ltr"
                                        value={editForm.body_en || ''}
                                        onChange={e => setEditForm((f: any) => ({ ...f, body_en: e.target.value }))}
                                    />
                                </div>
                            </>
                        )}

                        {editTemplate?.variables?.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                <p className="text-xs font-bold text-amber-800 mb-2">⚡ المتغيرات المتاحة:</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {editTemplate.variables.map((v: string) => (
                                        <code key={v} className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">{`{{${v}}}`}</code>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <Switch
                                checked={!!editForm.is_active}
                                onCheckedChange={c => setEditForm((f: any) => ({ ...f, is_active: c }))}
                            />
                            <Label>تفعيل هذا القالب</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditTemplate(null)}>إلغاء</Button>
                        <Button onClick={handleSave} className="bg-[#0B3D2E] text-white" disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Check className="w-4 h-4 ml-1" />}
                            حفظ القالب
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
