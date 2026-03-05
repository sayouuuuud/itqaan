"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import { MessageSquare, Mail, User, Calendar, Clock, ExternalLink, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ContactMessage {
    id: string
    name: string
    email: string
    subject: string
    message: string
    created_at: string
    is_read?: boolean
}

export default function ContactMessagesPage() {
    const { t } = useI18n()
    const [messages, setMessages] = useState<ContactMessage[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)

    useEffect(() => {
        fetchMessages()
    }, [])

    const fetchMessages = async () => {
        try {
            const res = await fetch("/api/admin/contact-messages")
            if (res.ok) {
                const data = await res.json()
                setMessages(data.messages || [])
            }
        } catch (error) {
            console.error("Failed to fetch contact messages:", error)
        } finally {
            setLoading(false)
        }
    }

    const markAsRead = async (messageId: string) => {
        try {
            await fetch("/api/admin/contact-messages", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messageId, action: "mark_read" })
            })
            setMessages(prev => 
                prev.map(msg => 
                    msg.id === messageId ? { ...msg, is_read: true } : msg
                )
            )
        } catch (error) {
            console.error("Failed to mark message as read:", error)
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B3D2E]"></div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">رسائل التواصل</h1>
                <p className="text-gray-600">إدارة الرسائل الواردة من نموذج التواصل</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Messages List */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                جميع الرسائل ({messages.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                            {messages.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">لا توجد رسائل</p>
                            ) : (
                                messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                            selectedMessage?.id === message.id
                                                ? "border-[#0B3D2E] bg-[#0B3D2E]/5"
                                                : "border-gray-200 hover:border-gray-300"
                                        } ${!message.is_read ? "font-semibold" : ""}`}
                                        onClick={() => {
                                            setSelectedMessage(message)
                                            if (!message.is_read) {
                                                markAsRead(message.id)
                                            }
                                        }}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{message.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{message.email}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatDate(message.created_at)}
                                                </p>
                                            </div>
                                            {!message.is_read && (
                                                <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1"></div>
                                            )}
                                        </div>
                                        {message.subject && (
                                            <p className="text-xs text-gray-600 mt-2 truncate">{message.subject}</p>
                                        )}
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Message Details */}
                <div className="lg:col-span-2">
                    {selectedMessage ? (
                        <Card>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <User className="w-5 h-5" />
                                            <span className="font-semibold">{selectedMessage.name}</span>
                                            {!selectedMessage.is_read && (
                                                <Badge variant="secondary">جديدة</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Mail className="w-4 h-4" />
                                            <span>{selectedMessage.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar className="w-4 h-4" />
                                            <span>{formatDate(selectedMessage.created_at)}</span>
                                        </div>
                                        {selectedMessage.subject && (
                                            <div className="text-sm">
                                                <span className="font-medium">الموضوع: </span>
                                                <span>{selectedMessage.subject}</span>
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(`mailto:${selectedMessage.email}`, '_blank')}
                                    >
                                        <ExternalLink className="w-4 h-4 ml-2" />
                                        الرد عبر البريد
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-medium mb-2">الرسالة:</h4>
                                    <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                                </div>
                                {!selectedMessage.is_read && (
                                    <div className="mt-4 flex justify-end">
                                        <Button
                                            onClick={() => markAsRead(selectedMessage.id)}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <CheckCircle className="w-4 h-4 ml-2" />
                                            تحديد كمقروءة
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">اختر رسالة للعرض</h3>
                                <p className="text-gray-500 text-center">اختر رسالة من القائمة لعرض تفاصيلها</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
