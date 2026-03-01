"use client"

import { useState, useCallback } from "react"
import { FileText, Printer, Share2 } from "lucide-react"

interface ArticleInteractionsProps {
    articleTitle: string
    contentId?: string
}

export function ArticleInteractions({ articleTitle, contentId = "article-content" }: ArticleInteractionsProps) {
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

    const handleDownloadPDF = useCallback(async () => {
        setIsGeneratingPdf(true)

        try {
            // Dynamic import of html2pdf
            const html2pdf = (await import('html2pdf.js')).default

            const element = document.getElementById(contentId)
            if (!element) {
                console.error(`${contentId} element not found`)
                setIsGeneratingPdf(false)
                return
            }

            const opt = {
                margin: 10,
                filename: `${articleTitle || 'article'}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    letterRendering: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    removeContainer: true,
                    onclone: (clonedDoc: Document) => {
                        // Force all text to be black and backgrounds white for PDF generation
                        const selectors = `#${contentId}, #${contentId} *`;
                        const allElements = clonedDoc.querySelectorAll(selectors);
                        allElements.forEach((el: Element) => {
                            const element = el as HTMLElement;
                            if (element.style) {
                                element.style.color = '#000000 !important';
                                element.style.backgroundColor = '#ffffff !important';
                                element.style.borderColor = '#cccccc !important';
                            }
                        });

                        // Ensure article content specifically is black on white
                        const contentEl = clonedDoc.getElementById(contentId);
                        if (contentEl) {
                            (contentEl as HTMLElement).style.color = '#000000';
                            (contentEl as HTMLElement).style.backgroundColor = '#ffffff';
                        }
                    }
                },
                jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
            }

            console.log('Generating PDF...')
            await html2pdf().set(opt).from(element).save()
            console.log('PDF generated successfully')
        } catch (err) {
            console.error('PDF generation error:', err)
            alert("حدث خطأ أثناء إنشاء ملف PDF")
        } finally {
            setIsGeneratingPdf(false)
        }
    }, [articleTitle, contentId])

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: articleTitle || 'مقال',
                url: window.location.href,
            }).catch(() => { })
        } else {
            navigator.clipboard.writeText(window.location.href)
            alert("تم نسخ الرابط")
        }
    }

    return (
        <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-gray-100 dark:border-gray-800/15">
            <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf}
                className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 cursor-pointer"
            >
                <FileText className="h-4 w-4" />
                {isGeneratingPdf ? 'جاري التحميل...' : 'تحميل PDF'}
            </button>
            <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-background border border-border hover:bg-accent transition-all font-medium px-6 py-3 rounded-lg cursor-pointer"
            >
                <Printer className="h-4 w-4" />
                طباعة
            </button>
            <button
                onClick={handleShare}
                className="flex items-center gap-2 bg-background border border-border hover:bg-accent transition-all font-medium px-6 py-3 rounded-lg ml-auto cursor-pointer"
            >
                <Share2 className="h-4 w-4" />
                مشاركة
            </button>
        </div>
    )
}
