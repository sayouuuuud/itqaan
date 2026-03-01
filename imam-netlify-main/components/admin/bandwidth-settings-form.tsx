'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Loader2, Save, Settings, BookOpen, Music } from 'lucide-react'
import { toast } from 'sonner'

interface BandwidthSetting {
    id: string
    setting_type: string
    is_enabled: boolean
    limit_value: number
}

const SETTING_LABELS: Record<string, { label: string; description: string }> = {
    daily: { label: 'حد يومي', description: 'الحد الأقصى للاستهلاك اليومي' },
    weekly: { label: 'حد أسبوعي', description: 'الحد الأقصى للاستهلاك الأسبوعي' },
    monthly: { label: 'حد شهري مخصص', description: 'حد شهري أقل من حد Cloudinary' },
    book_view: { label: 'حد عرض الكتب', description: 'الحد الأقصى لقراءة الكتب' },
    book_download: { label: 'حد تحميل الكتب', description: 'الحد الأقصى لتحميل الكتب' },
    audio_stream: { label: 'حد الاستماع', description: 'الحد الأقصى للاستماع المباشر' },
    audio_download: { label: 'حد تحميل الصوت', description: 'الحد الأقصى لتحميل الصوتيات' },
}

function bytesToGB(bytes: number): number {
    return bytes / (1024 * 1024 * 1024)
}

function gbToBytes(gb: number): number {
    return gb * 1024 * 1024 * 1024
}

export function BandwidthSettingsForm() {
    const [settings, setSettings] = useState<BandwidthSetting[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/bandwidth/settings')
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setSettings(data.settings || [])
        } catch (error) {
            console.error(error)
            toast.error('فشل في تحميل الإعدادات')
        } finally {
            setLoading(false)
        }
    }

    const updateSetting = (settingType: string, field: 'is_enabled' | 'limit_value', value: boolean | number) => {
        setSettings(prev => prev.map(s =>
            s.setting_type === settingType
                ? { ...s, [field]: value }
                : s
        ))
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/bandwidth/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to save')
            }

            toast.success('تم حفظ الإعدادات بنجاح')
        } catch (error: any) {
            toast.error(error.message || 'فشل في حفظ الإعدادات')
        } finally {
            setSaving(false)
        }
    }

    const getSetting = (type: string) => settings.find(s => s.setting_type === type)

    const renderSettingRow = (type: string) => {
        const setting = getSetting(type)
        if (!setting) return null

        const info = SETTING_LABELS[type]

        return (
            <div key={type} className="flex items-center justify-between py-3 border-b last:border-0">
                <div className="flex items-center gap-4">
                    <Switch
                        checked={setting.is_enabled}
                        onCheckedChange={(checked) => updateSetting(type, 'is_enabled', checked)}
                    />
                    <div>
                        <Label className="font-medium">{info.label}</Label>
                        <p className="text-xs text-muted-foreground">{info.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        step="0.1"
                        min="0"
                        className="w-24 text-center"
                        value={bytesToGB(setting.limit_value).toFixed(2)}
                        onChange={(e) => updateSetting(type, 'limit_value', gbToBytes(parseFloat(e.target.value) || 0))}
                        disabled={!setting.is_enabled}
                    />
                    <span className="text-sm text-muted-foreground">GB</span>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-48">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Time-based Limits */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        الحدود الزمنية
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {renderSettingRow('daily')}
                    {renderSettingRow('weekly')}
                    {renderSettingRow('monthly')}
                </CardContent>
            </Card>

            {/* Book Limits */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        حدود الكتب
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {renderSettingRow('book_view')}
                    {renderSettingRow('book_download')}
                </CardContent>
            </Card>

            {/* Audio Limits */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Music className="h-5 w-5" />
                        حدود الصوتيات
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {renderSettingRow('audio_stream')}
                    {renderSettingRow('audio_download')}
                </CardContent>
            </Card>

            {/* Save Button */}
            <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                حفظ الإعدادات
            </Button>
        </div>
    )
}
