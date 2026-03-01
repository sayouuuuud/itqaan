"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Save, Code, ExternalLink } from "lucide-react"

export default function DeveloperSettingsPage() {
    const [developerLink, setDeveloperLink] = useState("")
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState({ type: "", text: "" })

    const supabase = createClient()

    useEffect(() => {
        loadSettings()
    }, [])

    async function loadSettings() {
        setLoading(true)
        const { data } = await supabase
            .from("site_settings")
            .select("*")
            .eq("key", "developer_link")
            .single()

        if (data) {
            setDeveloperLink(data.value || "")
        }
        setLoading(false)
    }

    async function saveSettings() {
        setSaving(true)
        setMessage({ type: "", text: "" })

        try {
            await supabase.from("site_settings").upsert(
                {
                    key: "developer_link",
                    value: developerLink,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "key" }
            )

            setMessage({
                type: "success",
                text: "تم حفظ الإعدادات بنجاح!",
            })
        } catch (error: any) {
            setMessage({
                type: "error",
                text: "حدث خطأ أثناء الحفظ: " + error.message,
            })
        }

        setSaving(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Code className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-foreground">
                    إعدادات المطور
                </h1>
                <p className="text-text-muted mt-2">
                    صفحة خاصة بالمطور لإدارة رابط التواصل
                </p>
            </div>

            {/* Message */}
            {message.text && (
                <div
                    className={`p-4 rounded-xl text-center ${message.type === "error"
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                >
                    {message.text}
                </div>
            )}

            {/* Settings Card */}
            <div className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-6">
                <div className="space-y-2">
                    <Label className="text-base font-medium">رابط التواصل مع المطور</Label>
                    <p className="text-sm text-text-muted">
                        هذا الرابط سيظهر في الفوتر عند الضغط على كلمة "المطور"
                    </p>
                    <Input
                        value={developerLink}
                        onChange={(e) => setDeveloperLink(e.target.value)}
                        placeholder="https://wa.me/201XXXXXXXXX"
                        dir="ltr"
                        className="bg-muted"
                    />
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                    <Button
                        onClick={saveSettings}
                        disabled={saving}
                        className="bg-primary hover:bg-primary-hover text-white"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                                جاري الحفظ...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 ml-2" />
                                حفظ الإعدادات
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <ExternalLink className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                        <p className="text-blue-800 font-medium">ملاحظة</p>
                        <p className="text-blue-700 text-sm mt-1">
                            هذه الصفحة مخفية ولا تظهر في القائمة الجانبية. فقط الشخص الذي يعرف الرابط يمكنه الوصول إليها.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
