'use client'

import { useState, useEffect } from 'react'
import { Globe, Save, Eye, Search, ChevronRight, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/lib/i18n/context'

export default function AdminSeoPage() {
    const { t } = useI18n()
    const isAr = t.locale === 'ar'

    const [settings, setSettings] = useState({
        seo_site_title: '',
        seo_site_description: '',
        seo_keywords: '',
        seo_og_image: '',
        seo_robots: 'index, follow',
        seo_google_verification: '',
        seo_twitter_site: '',
        seo_canonical_base: '',
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        fetch('/api/admin/seo').then(r => r.json()).then(data => {
            if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }))
            setLoading(false)
        })
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            await fetch('/api/admin/seo', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings })
            })
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } finally { setSaving(false) }
    }

    const previewTitle = settings.seo_site_title || t.admin.seoPreviewTitleDefault
    const previewDesc = settings.seo_site_description || ''
    const previewUrl = settings.seo_canonical_base || 'https://itqaan.com'

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" /></div>

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Globe className="w-8 h-8 text-[#0B3D2E]" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t.admin.seoSettings}</h1>
                        <p className="text-gray-500 text-sm">{t.admin.seoSettingsDesc}</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-[#0B3D2E] hover:bg-[#0A3527] text-white gap-2 h-11 px-6 rounded-xl shadow-sm transition-all duration-200 font-bold">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? t.admin.savedSuccess : t.admin.saveSettings}
                </Button>
            </div>

            {/* Google Preview */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2 text-gray-800 font-bold">
                    <Search className="w-4 h-4 text-[#0B3D2E]" />
                    {t.admin.searchEnginePreview}
                </div>
                <div className="p-6">
                    <div className="border border-gray-100 rounded-xl p-5 bg-gray-50/50 max-w-2xl shadow-inner">
                        <p className="text-xs text-emerald-700 mb-1 font-mono flex items-center gap-1">
                            {previewUrl} <ChevronRight className="w-3 h-3 opacity-30" />
                        </p>
                        <p className="text-[#1a0dab] text-xl font-medium hover:underline cursor-pointer line-clamp-1 mb-1">{previewTitle}</p>
                        <p className="text-[#4d5156] text-sm line-clamp-2 leading-relaxed">{previewDesc || t.admin.seoDescPlaceholder}</p>
                    </div>
                </div>
            </div>

            {/* Main SEO Settings */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 font-bold text-gray-800">
                    {t.admin.basicSettings}
                </div>
                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-700">{t.admin.siteTitle}</Label>
                        <Input
                            value={settings.seo_site_title}
                            onChange={e => setSettings(p => ({ ...p, seo_site_title: e.target.value }))}
                            placeholder={t.admin.seoSiteTitlePlaceholder}
                            className="max-w-xl border-gray-100 bg-gray-50/30 rounded-xl focus:ring-[#0B3D2E]/20"
                        />
                        <div className="flex justify-between max-w-xl px-1">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t.admin.idealChars.replace('{count}', '50-60')}</p>
                            <p className={`text-[10px] font-black ${settings.seo_site_title.length > 60 ? 'text-red-500' : 'text-emerald-500'}`}>{settings.seo_site_title.length} / 60</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-700">{t.admin.metaDescription}</Label>
                        <textarea
                            value={settings.seo_site_description}
                            onChange={e => setSettings(p => ({ ...p, seo_site_description: e.target.value }))}
                            rows={4}
                            className="w-full max-w-xl border border-gray-100 bg-gray-50/30 rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 transition-all"
                            placeholder={t.admin.seoSiteDescriptionPlaceholder}
                        />
                        <div className="flex justify-between max-w-xl px-1">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t.admin.idealDescChars}</p>
                            <p className={`text-[10px] font-black ${settings.seo_site_description.length > 160 ? 'text-red-500' : 'text-emerald-500'}`}>{settings.seo_site_description.length} / 160</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-700">{t.admin.keywords}</Label>
                            <Input value={settings.seo_keywords} onChange={e => setSettings(p => ({ ...p, seo_keywords: e.target.value }))} placeholder={t.admin.seoKeywordsPlaceholder} className="border-gray-100 bg-gray-50/30 rounded-xl focus:ring-[#0B3D2E]/20" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-700">{t.admin.ogImageURL}</Label>
                            <Input value={settings.seo_og_image} onChange={e => setSettings(p => ({ ...p, seo_og_image: e.target.value }))} placeholder="https://..." className="border-gray-100 bg-gray-50/30 rounded-xl focus:ring-[#0B3D2E]/20" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced & Verification */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 font-bold text-gray-800">
                    {t.admin.verificationSocial}
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-700">{t.admin.canonicalURL}</Label>
                            <Input value={settings.seo_canonical_base} onChange={e => setSettings(p => ({ ...p, seo_canonical_base: e.target.value }))} placeholder="https://itqaan.com" className="border-gray-100 bg-gray-50/30 rounded-xl focus:ring-[#0B3D2E]/20" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-700">Robots</Label>
                            <select
                                value={settings.seo_robots}
                                onChange={e => setSettings(p => ({ ...p, seo_robots: e.target.value }))}
                                className="w-full border border-gray-100 bg-gray-50/30 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[position:left_10px_center] rtl:bg-[position:right_10px_center]"
                            >
                                <option value="index, follow">index, follow (recommended)</option>
                                <option value="noindex, follow">noindex, follow</option>
                                <option value="index, nofollow">index, nofollow</option>
                                <option value="noindex, nofollow">noindex, nofollow</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-50">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-700">Google Search Console Verification</Label>
                            <Input value={settings.seo_google_verification} onChange={e => setSettings(p => ({ ...p, seo_google_verification: e.target.value }))} placeholder="google-site-verification=..." className="border-gray-100 bg-gray-50/30 rounded-xl focus:ring-[#0B3D2E]/20" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-700">Twitter / X Account</Label>
                            <Input value={settings.seo_twitter_site} onChange={e => setSettings(p => ({ ...p, seo_twitter_site: e.target.value }))} placeholder="@username" className="border-gray-100 bg-gray-50/30 rounded-xl focus:ring-[#0B3D2E]/20" />
                        </div>
                    </div>
                </div>
            </div>

            {/* JSON-LD Schema info */}
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6">
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0 border border-emerald-100">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="font-bold text-emerald-900 text-lg">{t.admin.jsonLdReady}</p>
                        <p className="text-emerald-700/80 text-sm mt-1 leading-relaxed">
                            {t.admin.jsonLdDesc}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
