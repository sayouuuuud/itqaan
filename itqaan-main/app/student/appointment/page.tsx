"use client"

import { useState } from "react"
import { useI18n } from "@/lib/i18n/context"
import Link from "next/link"
import { Calendar, Clock, Video, User, MessageSquare, ChevronLeft, Send, ExternalLink } from "lucide-react"

const mockAppointment = {
  id: "1",
  date: "2024-10-15",
  time: "10:30 AM",
  duration: "45", // mins
  status: "confirmed",
  readerName: "Sheikh Abdullah",
  meetingLink: "https://zoom.us/j/123456789",
  comments: [
    { id: "1", author: "Sheikh Abdullah", role: "reader", text: "Assalamu Alaikum, I am ready for the session.", createdAt: "2024-10-14T10:00:00" },
    { id: "2", author: "You", role: "student", text: "Wa Alaikum Assalam, Jazakallah Khair Sheikh.", createdAt: "2024-10-14T11:30:00" },
  ]
}

export default function AppointmentPage() {
  const { t, locale } = useI18n()
  const [newComment, setNewComment] = useState("")
  const [comments, setComments] = useState(mockAppointment.comments)

  const handleSendComment = () => {
    if (!newComment.trim()) return
    setComments([...comments, {
      id: String(comments.length + 1),
      author: t.student.you,
      role: "student",
      text: newComment.trim(),
      createdAt: new Date().toISOString()
    }])
    setNewComment("")
  }

  const statusLabel = t.student.confirmedStatus
  const statusColor = "bg-emerald-100 text-emerald-700"

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/student" className="hover:text-primary transition-colors">{t.student.dashboard}</Link>
        <ChevronLeft className="w-3 h-3 rotate-180 rtl:rotate-0" />
        <span className="text-foreground font-medium">{t.student.appointment}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">{t.student.appointment}</h1>
          <p className="text-muted-foreground">{t.student.fatihaSessionSubtitle}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${statusColor} self-start`}>{statusLabel}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card rounded-xl border border-border p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">{t.student.instructor || t.student.readerLabel}</p>
                <p className="font-bold text-foreground">{mockAppointment.readerName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">{t.student.dateLabel || t.student.date}</p>
                <p className="font-medium text-foreground">
                  {new Date(mockAppointment.date).toLocaleDateString(locale === 'ar' ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">{t.student.timeLabel}</p>
                <p className="font-medium text-foreground">{mockAppointment.time}</p>
                <p className="text-xs text-muted-foreground">{mockAppointment.duration} {t.student.fortyFiveMinutes}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">{t.student.meetingLink}</p>
                <a
                  href={mockAppointment.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline font-medium flex items-center gap-1"
                >
                  {t.student.joinSession}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          <button className="w-full py-2.5 text-sm font-medium text-destructive border border-destructive/20 rounded-xl hover:bg-destructive/5 transition-colors">
            {t.student.cancelAppointment}
          </button>
        </div>

        {/* Comments Section */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl border border-border flex flex-col h-[500px]">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-foreground">{t.student.commentsAndNotes}</h3>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{comments.length}</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comments.map((c) => (
                <div key={c.id} className={`flex ${c.role === "student" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${c.role === "student"
                      ? "bg-muted text-foreground rounded-br-sm"
                      : "bg-primary text-primary-foreground rounded-bl-sm"
                    }`}>
                    <p className="text-xs font-semibold mb-1 opacity-80">{c.author === "You" || c.author === "أنت" ? t.student.you : c.author}</p>
                    <p className="text-sm leading-relaxed">{c.text}</p>
                    <p className="text-[10px] opacity-50 mt-1">
                      {new Date(c.createdAt).toLocaleTimeString(locale === 'ar' ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border flex items-center gap-3">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
                placeholder={t.student.writeCommentPlaceholder}
                className="flex-1 bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={handleSendComment}
                disabled={!newComment.trim()}
                className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Send className="w-5 h-5 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
