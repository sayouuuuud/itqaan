"use client"

import React, { useState } from "react"

interface ShareButtonsProps {
  title: string
  content: string
  author?: string
  readTime?: string
  url?: string
  showPrintAndPDF?: boolean
}

export function ShareButtons({ title, content, author, readTime, url, showPrintAndPDF = true }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "")

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: shareUrl,
        })
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink()
    }
  }

  const shareToTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank",
    )
  }

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank")
  }

  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${title} ${shareUrl}`)}`, "_blank")
  }

  const shareToTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`,
      "_blank",
    )
  }

  const handlePrint = () => {
    const printContent = document.getElementById('print-content')
    if (printContent) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        const htmlContent = printContent.innerHTML
        printWindow.document.write(`
          <!DOCTYPE html>
<html dir="rtl" lang="ar">
            <head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
              <style>
                * {
                  margin: 0;
                  padding: 0;
                }
                html {
                  direction: rtl;
                  lang: ar;
                }
                body {
                  font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
                  direction: rtl;
                  text-align: right;
                  line-height: 1.8;
                  padding: 40px;
                  color: #000;
                  background: #fff;
                }
                .print-header {
                  text-align: center;
                  border-bottom: 2px solid #333;
                  padding-bottom: 30px;
                  margin-bottom: 40px;
                }
                .print-header h1 {
                  font-size: 28px;
                  font-weight: 700;
                  margin-bottom: 20px;
                  color: #000;
                  line-height: 1.4;
                }
                .print-meta {
                  display: flex;
                  flex-direction: row-reverse;
                  justify-content: center;
                  gap: 30px;
                  font-size: 12px;
                  color: #555;
                }
                .print-meta span {
                  white-space: nowrap;
                }
                .print-content {
                  font-size: 14px;
                  line-height: 2;
                  color: #000;
                }
                .print-content h2,
                .print-content h3,
                .print-content h4,
                .print-content h5,
                .print-content h6 {
                  color: #000;
                  font-weight: 700;
                  margin-top: 30px;
                  margin-bottom: 15px;
                  line-height: 1.6;
                }
                .print-content h2 {
                  font-size: 18px;
                }
                .print-content h3 {
                  font-size: 16px;
                }
                .print-content p {
                  margin-bottom: 15px;
                  text-align: justify;
                }
                .print-content blockquote {
                  border-right: 4px solid #666;
                  padding-right: 20px;
                  margin: 25px 0;
                  color: #333;
                  background-color: #f9f9f9;
                  padding: 15px 20px;
                }
                .print-content ul,
                .print-content ol {
                  margin: 15px 0;
                  padding-right: 30px;
                }
                .print-content li {
                  margin-bottom: 8px;
                  text-align: justify;
                }
                .print-content code {
                  background: #f5f5f5;
                  padding: 3px 6px;
                  border-radius: 3px;
                  font-family: 'Courier New', monospace;
                  font-size: 12px;
                }
                .print-content pre {
                  background: #f5f5f5;
                  padding: 15px;
                  border-radius: 5px;
                  overflow-x: auto;
                  margin: 20px 0;
                  font-family: 'Courier New', monospace;
                }
                .print-content img {
                  max-width: 100%;
                  height: auto;
                  margin: 15px 0;
                }
                .quran-verse {
                  border-right: 4px solid #c8a165;
                  background-color: #faf8f3;
                  padding: 15px 20px;
                  margin: 20px 0;
                  border-radius: 4px;
                }
                @media print {
                  body {
                    margin: 0;
                    padding: 20px;
                  }
                  .print-header {
                    page-break-after: avoid;
                  }
                  .print-content h2,
                  .print-content h3 {
                    page-break-after: avoid;
                  }
                  .print-content blockquote {
                    page-break-inside: avoid;
                  }
                }
              </style>
</head>
            <body>
              ${htmlContent}
</body>
          </html>
        `)
        printWindow.document.close()
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 250)
      }
    } else {
      window.print()
    }
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const printContent = document.getElementById('print-content')
      if (!printContent) {
        throw new Error('محتوى المقال غير متوفر')
      }

      const element = document.createElement('div')
      element.style.padding = '20px'
      element.style.width = '210mm'
      element.style.backgroundColor = '#ffffff'
      element.style.direction = 'rtl'
      element.style.textAlign = 'right'
      element.style.fontFamily = 'Arial, sans-serif'

      element.innerHTML = `
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="font-size: 24px; font-weight: bold; margin: 0 0 15px 0; color: #000;">${title}</h1>
          <p style="font-size: 12px; color: #666; margin: 5px 0;">الكاتب: ${author || 'مستخدم تجريبي'}</p>
          <p style="font-size: 12px; color: #666; margin: 5px 0;">التاريخ: ${new Date().toLocaleDateString('ar-EG')}</p>
          <p style="font-size: 12px; color: #666; margin: 5px 0;">وقت القراءة: ${readTime || '5'} دقائق</p>
        </div>
        <div style="font-size: 13px; line-height: 1.8; color: #000; direction: rtl; text-align: right;">
          ${printContent.innerHTML}
        </div>
      `

      document.body.appendChild(element)

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowHeight: element.scrollHeight,
      })

      document.body.removeChild(element)

      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const pdf = new jsPDF('p', 'mm', 'a4')

      const pageHeight = pdf.internal.pageSize.getHeight()
      let heightLeft = imgHeight
      let position = 0

      const imgData = canvas.toDataURL('image/png')

      while (heightLeft > 0) {
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
        position -= pageHeight
        if (heightLeft > 0) {
          pdf.addPage()
        }
      }

      pdf.save(`${title.replace(/[^\w\s\u0600-\u06FF]/g, '').trim() || 'مقالة'}.pdf`)
    } catch (error) {
      console.error('PDF export error:', error)
      alert(`حدث خطأ في تصدير PDF: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleShare}
        className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 px-4 py-2.5 rounded-xl text-sm text-primary dark:text-secondary font-medium hover:bg-gradient-to-r hover:from-primary/20 hover:to-secondary/20 hover:border-primary/30 transition-all duration-200 shadow-sm"
        title="مشاركة"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
        مشاركة
      </button>
      <button
        onClick={shareToWhatsApp}
        className="w-11 h-11 flex items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        title="مشاركة عبر واتساب"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488" />
        </svg>
      </button>

      <button
        onClick={shareToTelegram}
        className="w-11 h-11 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        title="مشاركة عبر تيليجرام"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      </button>
      <button
        onClick={shareToTwitter}
        className="w-11 h-11 flex items-center justify-center rounded-xl bg-gradient-to-br from-gray-900 to-black text-white hover:from-gray-800 hover:to-gray-900 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        title="مشاركة عبر تويتر"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </button>

      <button
        onClick={shareToFacebook}
        className="w-11 h-11 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        title="مشاركة عبر فيسبوك"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </button>
      <button
        onClick={handleCopyLink}
        className={`w-11 h-11 flex items-center justify-center rounded-xl border-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${copied
            ? "bg-gradient-to-br from-green-500 to-green-600 text-white border-green-500 shadow-green-200"
            : "bg-gradient-to-br from-surface to-card border-border text-text-muted hover:text-primary hover:border-primary dark:from-card dark:to-background-alt"
          }`}
        title={copied ? "تم النسخ!" : "نسخ الرابط"}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {copied ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5 13l4 4L19 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          )}
        </svg>
      </button>

      {showPrintAndPDF && (
        <>
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition flex items-center gap-2 text-foreground"
            title="طباعة المقال"
          >
            <span className="material-icons-outlined text-lg">print</span>
            طباعة
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-6 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg transition flex items-center gap-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            title={isExporting ? "جاري التصدير..." : "تصدير PDF"}
          >
            {isExporting ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                جاري...
              </>
            ) : (
              <>
                <span className="material-icons-outlined text-lg">file_download</span>
                تحميل PDF
              </>
            )}
          </button>
        </>
      )}
    </div>
  )
}

