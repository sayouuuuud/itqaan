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
    const isAr = t.locale === 'ar'

    const [templates, setTemplates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [editTemplate, setEditTemplate] = useState<any>(null)
    const [editForm, setEditForm] = useState<any>({})
    const [saving, setSaving] = useState(false)
    const [previewLang, setPreviewLang] = useState<'ar' | 'en'>('ar')
    const [searchTerm, setSearchTerm] = useState('')
    const [sendingTest, setSendingTest] = useState(false)
    const [testEmail, setTestEmail] = useState('')

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

    const handleSendTest = async () => {
        if (!testEmail || !editTemplate) return
        setSendingTest(true)
        try {
            const res = await fetch('/api/admin/email-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: testEmail,
                    subject: previewLang === 'ar' ? editForm.subject_ar : editForm.subject_en,
                    body: previewLang === 'ar' ? editForm.body_ar : editForm.body_en,
                    variables: { userName: 'تجربة', studentName: 'تجربة', readerName: 'تجربة', certificateLink: '#' }
                }),
            })
            if (res.ok) {
                alert(t.admin.testEmailSent)
            }
        } finally {
            setSendingTest(false)
        }
    }

    const filteredTemplates = templates.filter(tmpl =>
        tmpl.template_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tmpl.template_name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tmpl.template_name_en.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    return (
        <div className="space-y-6 md:space-y-8 max-w-7xl">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                        {t.admin.emailTemplates}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {t.admin.emailTemplatesDesc}
                    </p>
                </div>

                <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none rtl:left-0 rtl:right-auto rtl:pl-3">
                        {!loading && <Eye className="w-4 h-4 text-slate-400" />}
                        {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                    </div>
                    <Input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder={t.admin.searchTemplates}
                        className="h-11 pr-10 rtl:pl-10 rtl:pr-4 rounded-xl border-slate-200 bg-white"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-20">
                    <Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" />
                </div>
            ) : filteredTemplates.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl py-24 text-center shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5">
                        <Mail className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="text-lg font-medium text-slate-700 mb-1">
                        {searchTerm ? t.admin.noTemplatesFound : (isAr ? 'لا توجد قوالب بريد' : 'No Email Templates')}
                    </p>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                        {t.admin.noTemplatesDesc}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    {filteredTemplates.map(tmpl => (
                        <div key={tmpl.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col h-full group">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                        <Mail className="w-6 h-6 text-[#0B3D2E]" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-slate-800 text-lg">{isAr ? tmpl.template_name_ar : tmpl.template_name_en}</h3>
                                            <span className={`flex h-2 w-2 rounded-full ${tmpl.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => copyToClipboard(tmpl.template_key)}
                                                className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md text-slate-500 font-mono tracking-wider hover:bg-slate-200 transition-colors"
                                                title="Click to copy key"
                                            >
                                                {tmpl.template_key}
                                            </button>
                                            <span className={`text-[10px] items-center px-1.5 py-0.5 rounded-md font-medium border
                                                ${tmpl.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                {tmpl.is_active
                                                    ? t.active
                                                    : (isAr ? 'معطل' : 'Inactive')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEdit(tmpl)}
                                    className="border-slate-200 text-slate-600 hover:text-[#0B3D2E] hover:border-[#0B3D2E]/30 hover:bg-[#0B3D2E]/5 h-9 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                >
                                    <Edit className="w-4 h-4 ml-1.5 rtl:mr-1.5 rtl:ml-0" />
                                    {t.edit}
                                </Button>
                            </div>

                            <div className="flex-1 bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-baseline mb-2">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            {t.admin.subject}
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700 mb-4 line-clamp-2 leading-relaxed">
                                        {isAr ? tmpl.subject_ar : tmpl.subject_en}
                                    </p>
                                </div>

                                {tmpl.variables?.length > 0 && (
                                    <div className="pt-3 border-t border-slate-200/60 mt-auto">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                            {t.admin.availableVariables}
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(typeof tmpl.variables === 'string' ? JSON.parse(tmpl.variables) : tmpl.variables).map((v: string) => (
                                                <div key={v} className="bg-white border border-slate-200 shadow-sm text-slate-600 text-[10px] px-2 py-1 rounded-lg font-mono flex items-center gap-1">
                                                    <span className="text-slate-400">{`{{`}</span>
                                                    <span className="font-semibold text-[#0B3D2E]">{v}</span>
                                                    <span className="text-slate-400">{`}}`}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={!!editTemplate} onOpenChange={(open) => !open && setEditTemplate(null)}>
                <DialogContent className="max-w-3xl rounded-[2rem] p-0 overflow-hidden border-0 shadow-2xl">
                    <DialogHeader className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                <Edit className="w-4 h-4 text-[#0B3D2E]" />
                            </div>
                            {isAr ? `تعديل القالب: ${editTemplate?.template_name_ar}` : `Edit Template: ${editTemplate?.template_name_en}`}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
                        {/* Status Toggle */}
                        <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                            <div>
                                <h4 className="font-bold text-sm text-slate-800">{t.admin.templateStatus}</h4>
                                <p className="text-xs text-slate-500 mt-0.5">{t.admin.templateStatusDesc}</p>
                            </div>
                            <Switch
                                checked={!!editForm.is_active}
                                onCheckedChange={c => setEditForm((f: any) => ({ ...f, is_active: c }))}
                                className="data-[state=checked]:bg-[#0B3D2E]"
                            />
                        </div>

                        {/* Editor Tabs Toggle */}
                        <div className="flex justify-center">
                            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 inline-flex">
                                <button
                                    onClick={() => setPreviewLang('ar')}
                                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${previewLang === 'ar' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    النسخة العربية
                                </button>
                                <button
                                    onClick={() => setPreviewLang('en')}
                                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${previewLang === 'en' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    English Version
                                </button>
                            </div>
                        </div>

                        {previewLang === 'ar' ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="space-y-1.5">
                                    <Label className="text-slate-700 font-bold ml-1">موضوع الرسالة</Label>
                                    <Input
                                        value={editForm.subject_ar || ''}
                                        onChange={e => setEditForm((f: any) => ({ ...f, subject_ar: e.target.value }))}
                                        className="h-12 border-slate-200 bg-white focus-visible:ring-1 focus-visible:ring-[#0B3D2E] rounded-xl px-4"
                                        placeholder="اكتب عنوان البريد الإلكتروني هنا..."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-slate-700 font-bold ml-1">نص الرسالة</Label>
                                    <textarea
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm min-h-[240px] resize-y focus:outline-none focus:ring-1 focus:ring-[#0B3D2E] leading-relaxed transition-shadow"
                                        value={editForm.body_ar || ''}
                                        onChange={e => setEditForm((f: any) => ({ ...f, body_ar: e.target.value }))}
                                        placeholder="اكتب محتوى الرسالة هنا. يمكنك استخدام المتغيرات المتاحة..."
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="space-y-1.5">
                                    <Label className="text-slate-700 font-bold mr-1 flex justify-end">Subject</Label>
                                    <Input
                                        dir="ltr"
                                        value={editForm.subject_en || ''}
                                        onChange={e => setEditForm((f: any) => ({ ...f, subject_en: e.target.value }))}
                                        className="h-12 border-slate-200 bg-white focus-visible:ring-1 focus-visible:ring-[#0B3D2E] rounded-xl px-4 text-left"
                                        placeholder="Enter the email subject here..."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-slate-700 font-bold mr-1 flex justify-end">Body</Label>
                                    <textarea
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm min-h-[240px] resize-y focus:outline-none focus:ring-1 focus:ring-[#0B3D2E] leading-relaxed transition-shadow text-left"
                                        dir="ltr"
                                        value={editForm.body_en || ''}
                                        onChange={e => setEditForm((f: any) => ({ ...f, body_en: e.target.value }))}
                                        placeholder="Type the email content here. You can use available variables..."
                                    />
                                </div>
                            </div>
                        )}

                        {/* Send Test Email Section */}
                        <div className="pt-6 border-t border-slate-100">
                            <h4 className="font-bold text-sm text-slate-800 mb-3">{t.admin.sendTestEmail}</h4>
                            <div className="flex gap-2">
                                <Input
                                    value={testEmail}
                                    onChange={e => setTestEmail(e.target.value)}
                                    placeholder={t.admin.testEmailPlaceholder}
                                    className="h-10 border-slate-200 rounded-xl"
                                />
                                <Button
                                    onClick={handleSendTest}
                                    disabled={sendingTest || !testEmail}
                                    variant="outline"
                                    className="h-10 px-4 rounded-xl border-[#D4A843] text-[#D4A843] hover:bg-[#D4A843]/10"
                                >
                                    {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4 ml-1.5 rtl:mr-1.5 rtl:ml-0" />}
                                    {t.send}
                                </Button>
                            </div>
                        </div>

                        {editTemplate?.variables?.length > 0 && (
                            <div className="bg-[#D4A843]/10 border border-[#D4A843]/30 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-lg">⚡</span>
                                    <div>
                                        <p className="text-xs font-bold text-[#b58f35]">
                                            {t.admin.supportedDynamicVariables}
                                        </p>
                                        <p className="text-[10px] text-[#b58f35]/80 mt-0.5">
                                            {t.admin.copyVariableDesc}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(typeof editTemplate.variables === 'string' ? JSON.parse(editTemplate.variables) : editTemplate.variables).map((v: string) => (
                                        <button
                                            key={v}
                                            onClick={() => {
                                                navigator.clipboard.writeText(`{{${v}}}`)
                                            }}
                                            className="text-xs bg-white border border-[#D4A843]/40 text-[#b58f35] px-3 py-1.5 rounded-lg hover:bg-[#D4A843]/20 hover:border-[#D4A843]/60 transition-colors font-mono cursor-copy flex items-center gap-1 group/var"
                                            title="Click to copy"
                                        >
                                            <span className="opacity-60">{`{{`}</span>
                                            <span className="font-bold group-hover/var:text-[#a07e2f] transition-colors">{v}</span>
                                            <span className="opacity-60">{`}}`}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex-row gap-3 sm:justify-end rtl:sm:justify-start">
                        <Button
                            variant="outline"
                            onClick={() => setEditTemplate(null)}
                            className="rounded-xl px-6 h-11 border-slate-200 hover:bg-slate-100"
                        >
                            {t.cancel}
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="bg-[#0B3D2E] text-white rounded-xl px-8 h-11 hover:bg-[#0a2e23] shadow-md shadow-[#0B3D2E]/20"
                            disabled={saving}
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin ml-2 rtl:mr-2 rtl:ml-0" />
                            ) : (
                                <Check className="w-4 h-4 ml-2 rtl:mr-2 rtl:ml-0" />
                            )}
                            {t.profile.saveChanges}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

