"use client"

import type React from "react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface ContactSettings {
    important_notice: string
    email: string
    facebook_url: string
    youtube_url: string
    telegram_url: string
    subject_options?: string[]
}

interface ContactFormProps {
    initialSettings: ContactSettings
}

export function ContactForm({ initialSettings }: ContactFormProps) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    })
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
    const [errorMessage, setErrorMessage] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus("loading")
        setErrorMessage("")

        try {
            console.log("[CONTACT] Sending message:", formData)
            const supabase = createClient()
            const { error, data } = await supabase.from("contact_messages").insert({
                name: formData.name,
                email: formData.email,
                subject: formData.subject,
                message: formData.message,
            }).select()

            if (error) {
                console.error("[CONTACT] Error sending message:", error)
                throw error
            }

            console.log("[CONTACT] Message sent successfully:", data)
            setStatus("success")
            setFormData({ name: "", email: "", subject: "", message: "" })
        } catch (error) {
            console.error("[CONTACT] Failed to send message:", error)
            setStatus("error")
            setErrorMessage("حدث خطأ أثناء إرسال الرسالة، يرجى المحاولة مرة أخرى")
        }
    }

    return (
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-16">
                <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary dark:text-secondary text-sm font-medium mb-4 border border-primary/20">
                    الدعم والمساعدة
                </span>
                <h1 className="text-4xl lg:text-5xl font-extrabold text-foreground mb-6 leading-tight font-serif">
                    تواصل معنا
                </h1>
                <p className="text-lg text-text-muted dark:text-text-subtext leading-relaxed">
                    نسعد باستقبال استفساراتكم واقتراحاتكم. يرجى ملء النموذج أدناه وسيتم التواصل معكم في أقرب وقت ممكن.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                {/* Sidebar */}
                <div className="lg:col-span-5 space-y-8 order-2 lg:order-1">
                    {/* Contact Info Card */}
                    <div className="bg-surface dark:bg-card rounded-2xl p-8 shadow-sm border border-border dark:border-border">
                        <h3 className="text-xl font-bold text-primary dark:text-white mb-6 flex items-center gap-2">
                            <span className="material-icons-outlined">info</span>
                            معلومات التواصل
                        </h3>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                                    <span className="material-icons-outlined">email</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-foreground dark:text-foreground mb-1">البريد الإلكتروني</h4>
                                    <p className="text-text-muted dark:text-text-subtext text-sm">{initialSettings.email}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                                    <span className="material-icons-outlined">share</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-foreground dark:text-foreground mb-1">تابعنا على</h4>
                                    <div className="flex gap-4 mt-2">
                                        <a
                                            href={initialSettings.facebook_url}
                                            className="text-text-muted dark:text-text-subtext hover:text-primary transition-colors"
                                        >
                                            <span className="material-icons-outlined">facebook</span>
                                        </a>
                                        <a
                                            href={initialSettings.youtube_url}
                                            className="text-text-muted dark:text-text-subtext hover:text-red-500 transition-colors"
                                        >
                                            <span className="material-icons-outlined">smart_display</span>
                                        </a>
                                        <a
                                            href={initialSettings.telegram_url}
                                            className="text-text-muted dark:text-text-subtext hover:text-sky-500 transition-colors"
                                        >
                                            <span className="material-icons-outlined">send</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Warning Card - Now uses editable notice from DB */}
                    <div className="bg-accent border-r-4 border-accent-foreground rounded-lg p-6 flex gap-4 items-start shadow-sm">
                        <span className="material-icons-outlined text-accent-foreground text-3xl flex-shrink-0">
                            warning_amber
                        </span>
                        <div>
                            <h4 className="font-bold text-accent-foreground mb-2 text-lg">تنويه هام</h4>
                            <p className="text-accent-foreground text-sm leading-relaxed">
                                {initialSettings.important_notice}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="lg:col-span-7 order-1 lg:order-2">
                    {status === "success" ? (
                        <div className="bg-accent rounded-2xl p-8 text-center">
                            <span className="material-icons-outlined text-accent-foreground text-6xl mb-4">check_circle</span>
                            <h3 className="text-xl font-bold text-accent-foreground mb-2">تم إرسال رسالتك بنجاح!</h3>
                            <p className="text-green-700 dark:text-green-300">سيتم التواصل معكم في أقرب وقت ممكن.</p>
                            <button
                                onClick={() => setStatus("idle")}
                                className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                            >
                                إرسال رسالة أخرى
                            </button>
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                            className="bg-surface dark:bg-card rounded-2xl p-8 lg:p-10 shadow-sm border border-border dark:border-border space-y-6"
                        >
                            {errorMessage && (
                                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm">
                                    {errorMessage}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="block text-sm font-bold text-foreground dark:text-foreground">
                                        الاسم الكامل
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="أدخل اسمك هنا"
                                        suppressHydrationWarning
                                        className="w-full px-4 py-3 rounded-lg border border-border dark:border-border bg-background dark:bg-background-alt text-foreground dark:text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none placeholder-text-muted"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="block text-sm font-bold text-foreground dark:text-foreground">
                                        البريد الإلكتروني
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        placeholder="example@mail.com"
                                        suppressHydrationWarning
                                        className="w-full px-4 py-3 rounded-lg border border-border dark:border-border bg-background dark:bg-background-alt text-foreground dark:text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none placeholder-text-muted"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="subject" className="block text-sm font-bold text-foreground dark:text-foreground">
                                    موضوع الرسالة
                                </label>
                                <select
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-border dark:border-border bg-background dark:bg-background-alt text-foreground dark:text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                >
                                    <option value="" disabled>
                                        اختر موضوعاً...
                                    </option>
                                    {initialSettings.subject_options?.map((subject, index) => (
                                        <option key={index}
                                            value={subject}>
                                            {subject}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="message" className="block text-sm font-bold text-foreground dark:text-foreground">
                                    نص الرسالة
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows={6}
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    required
                                    placeholder="اكتب رسالتك هنا..."
                                    suppressHydrationWarning
                                    className="w-full px-4 py-3 rounded-lg border border-border dark:border-border bg-background dark:bg-background-alt text-foreground dark:text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none placeholder-text-muted resize-none"
                                ></textarea>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={status === "loading"}
                                    className="w-full md:w-auto px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-transform transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span>{status === "loading" ? "جاري الإرسال..." : "إرسال الرسالة"}</span>
                                    <span className="material-icons-outlined text-sm rtl-flip">send</span>
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </main>
    )
}
