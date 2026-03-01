'use client'

import { useState, useEffect } from 'react'
import { Home, Save, AlertTriangle, Eye, EyeOff, Megaphone, Loader2, CheckCircle, Layout, Type } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useI18n } from '@/lib/i18n/context'

export default function AdminHomepagePage() {
    const { t } = useI18n()
    const isAr = t.locale === 'ar'

    const [settings, setSettings] = useState<Record<string, any>>({
        homepage_hero_title: 'أتقِن سورة الفاتحة',
        homepage_hero_subtitle: 'سجّل تلاوتك واحصل على تقييم مفصّل من مقرئين معتمدين',
        homepage_cta_primary_text: 'سجّل تلاوتك الآن',
        homepage_cta_primary_link: '/register',
        homepage_cta_secondary_text: 'تعرف على المنصة',
        homepage_show_stats: true,
        homepage_show_features: true,
        homepage_show_testimonials: true,
        maintenance_mode: false,
        maintenance_message: 'الموقع تحت الصيانة حاليًا، نعود قريبًا 🔧',
        maintenance_banner_color: '#f59e0b',
        maintenance_full_page: false,
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        fetch('/api/admin/homepage').then(r => r.json()).then(data => {
            if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }))
            setLoading(false)
        })
    }, [])

    const set = (key: string, value: any) => setSettings(prev => ({ ...prev, [key]: value }))

    const handleSave = async () => {
        setSaving(true)
        try {
            await fetch('/api/admin/homepage', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings })
            })
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } finally { setSaving(false) }
    }

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" /></div>

    const isMaintenance = settings.maintenance_mode === true || settings.maintenance_mode === 'true'

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Home className="w-8 h-8 text-[#0B3D2E]" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{isAr ? 'إدارة الصفحة الرئيسية' : 'Homepage Management'}</h1>
                        <p className="text-gray-500 text-sm">{isAr ? 'تحكم في محتوى ومظهر الصفحة الرئيسية' : 'Control homepage content and appearance'}</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-[#0B3D2E] hover:bg-[#0B3D2E]/90 text-white gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? (isAr ? 'تم الحفظ!' : 'Saved!') : (isAr ? 'حفظ' : 'Save')}
                </Button>
            </div>

            {/* Maintenance Alert if on */}
            {isMaintenance && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-amber-800">{isAr ? 'وضع الصيانة مُفعَّل حاليًا!' : 'Maintenance mode is ACTIVE!'}</p>
                        <p className="text-amber-700 text-sm">{isAr ? 'الزوار يرون رسالة الصيانة' : 'Visitors are seeing the maintenance message'}</p>
                    </div>
                </div>
            )}

            {/* 🔧 Maintenance Mode */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
                <div className="flex items-center gap-2 border-b pb-3">
                    <Megaphone className="w-5 h-5 text-amber-500" />
                    <h2 className="font-semibold text-gray-800 text-lg">{isAr ? 'وضع الصيانة' : 'Maintenance Mode'}</h2>
                </div>

                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div>
                        <p className="font-medium text-gray-800">{isAr ? 'تفعيل وضع الصيانة' : 'Enable Maintenance Mode'}</p>
                        <p className="text-sm text-gray-500">{isAr ? 'سيرى الزوار رسالة الصيانة' : 'Visitors will see the maintenance message'}</p>
                    </div>
                    <Switch
                        checked={!!isMaintenance}
                        onCheckedChange={v => set('maintenance_mode', v)}
                        className="data-[state=checked]:bg-amber-500"
                    />
                </div>

                <div className="space-y-2">
                    <Label>{isAr ? 'رسالة الصيانة' : 'Maintenance Message'}</Label>
                    <textarea
                        value={settings.maintenance_message}
                        onChange={e => set('maintenance_message', e.target.value)}
                        rows={3}
                        className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>{isAr ? 'لون البانر' : 'Banner Color'}</Label>
                        <div className="flex items-center gap-3">
                            <input type="color" value={settings.maintenance_banner_color} onChange={e => set('maintenance_banner_color', e.target.value)} className="w-10 h-10 rounded cursor-pointer border border-gray-200" />
                            <Input value={settings.maintenance_banner_color} onChange={e => set('maintenance_banner_color', e.target.value)} className="flex-1 font-mono text-sm" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                        <div>
                            <p className="font-medium text-gray-800 text-sm">{isAr ? 'صفحة صيانة كاملة' : 'Full Maintenance Page'}</p>
                            <p className="text-xs text-gray-500">{isAr ? 'بدلاً من مجرد بانر' : 'Instead of just a banner'}</p>
                        </div>
                        <Switch checked={!!settings.maintenance_full_page} onCheckedChange={v => set('maintenance_full_page', v)} />
                    </div>
                </div>
            </div>

            {/* 🏠 Hero Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
                <div className="flex items-center gap-2 border-b pb-3">
                    <Type className="w-5 h-5 text-blue-500" />
                    <h2 className="font-semibold text-gray-800 text-lg">{isAr ? 'قسم Hero' : 'Hero Section'}</h2>
                </div>

                <div className="space-y-2">
                    <Label>{isAr ? 'العنوان الرئيسي' : 'Hero Title'}</Label>
                    <Input value={settings.homepage_hero_title} onChange={e => set('homepage_hero_title', e.target.value)} />
                </div>

                <div className="space-y-2">
                    <Label>{isAr ? 'العنوان الفرعي' : 'Hero Subtitle'}</Label>
                    <textarea value={settings.homepage_hero_subtitle} onChange={e => set('homepage_hero_subtitle', e.target.value)} rows={3} className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/30" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>{isAr ? 'نص الزر الرئيسي' : 'Primary CTA Text'}</Label>
                        <Input value={settings.homepage_cta_primary_text} onChange={e => set('homepage_cta_primary_text', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>{isAr ? 'رابط الزر الرئيسي' : 'Primary CTA Link'}</Label>
                        <Input value={settings.homepage_cta_primary_link} onChange={e => set('homepage_cta_primary_link', e.target.value)} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>{isAr ? 'نص الزر الثانوي' : 'Secondary CTA Text'}</Label>
                    <Input value={settings.homepage_cta_secondary_text} onChange={e => set('homepage_cta_secondary_text', e.target.value)} className="max-w-sm" />
                </div>
            </div>

            {/* 🔲 Sections Visibility */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2 border-b pb-3">
                    <Layout className="w-5 h-5 text-purple-500" />
                    <h2 className="font-semibold text-gray-800 text-lg">{isAr ? 'أقسام الصفحة' : 'Page Sections'}</h2>
                </div>

                {[
                    { key: 'homepage_show_stats', label: isAr ? 'قسم الإحصائيات' : 'Statistics Section', desc: isAr ? 'عدد الطلاب، المقرئين، التلاوات...' : 'Students, readers, recitations count...' },
                    { key: 'homepage_show_features', label: isAr ? 'قسم المميزات' : 'Features Section', desc: isAr ? 'الخطوات وكيفية الاستخدام' : 'How it works and steps' },
                    { key: 'homepage_show_testimonials', label: isAr ? 'قسم الشهادات والآراء' : 'Testimonials Section', desc: isAr ? 'آراء المستخدمين' : 'User testimonials' },
                ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div>
                            <p className="font-medium text-gray-800">{item.label}</p>
                            <p className="text-sm text-gray-500">{item.desc}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {(settings[item.key] === true || settings[item.key] === 'true') ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                            <Switch
                                checked={settings[item.key] === true || settings[item.key] === 'true'}
                                onCheckedChange={v => set(item.key, v)}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
