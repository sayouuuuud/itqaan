"use client"

import Link from "next/link"
import { MonitorPlay, BookOpen, GraduationCap, FileText, Mic, ArrowLeft } from "lucide-react"

export function ExploreSections() {
    return (
        <section className="py-20 bg-muted/30 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm mb-4">
                        <BookOpen className="h-6 w-6 text-[#035d44] dark:text-emerald-400" />
                    </div>
                    <h2 className="text-4xl font-bold mb-4 font-serif text-foreground">استكشف العلم أكثر</h2>
                    <p className="text-muted-foreground max-w-xl mx-auto">تصفح أقسام الموقع المتنوعة للوصول إلى المحتوى.</p>
                </div>

                {/* Grid Container */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Khutba Card (1/3 width) - Placed FIRST to appear on Right in RTL */}
                    <div className="lg:col-span-1">
                        <Link
                            href="/khutba"
                            className="h-full bg-emerald-900 rounded-3xl p-8 relative overflow-hidden group flex flex-col justify-center items-center text-center min-h-[250px] lg:min-h-[400px]"
                        >
                            {/* Icon */}
                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm">
                                <Mic className="h-8 w-8 text-white" />
                            </div>

                            <h3 className="text-3xl font-bold text-white mb-4 font-serif">الخطب المنبرية</h3>
                            <p className="text-gray-300 mb-8 leading-relaxed text-sm">
                                استمع إلى خطب الجمعة والأعياد والمناسبات الدينية، مرتبة ومؤرشفة للرجوع إليها في أي وقت.
                            </p>

                            <span className="inline-flex items-center gap-2 text-sm font-bold bg-yellow-500 text-white px-6 py-3 rounded-xl hover:bg-yellow-600 transition-colors shadow-sm w-full justify-center">
                                استمع الآن
                                <ArrowLeft className="h-4 w-4" />
                            </span>
                        </Link>
                    </div>

                    {/* Stacked Cards (2/3 width) - Placed SECOND to appear on Left in RTL */}
                    <div className="lg:col-span-2 grid grid-cols-1 gap-6">

                        {/* Top Row: Dars (Full Width) */}
                        <Link
                            href="/dars"
                            className="group bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all flex items-center justify-between"
                        >
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-foreground mb-2 font-serif text-right">الدروس العلمية</h3>
                                <p className="text-sm text-muted-foreground text-right">سلاسل علمية متكاملة في الفقه والعقيدة والسيرة.</p>
                            </div>
                            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center mr-4">
                                <GraduationCap className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                            </div>
                        </Link>

                        {/* Middle Row: Articles (Full Width) */}
                        <Link
                            href="/articles"
                            className="group bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all flex items-center justify-between"
                        >
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-foreground mb-2 font-serif text-right">المقالات والبحوث</h3>
                                <p className="text-sm text-muted-foreground text-right">كتابات دورية تناقش القضايا المعاصرة برؤية شرعية.</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-4">
                                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </Link>

                        {/* Bottom Row: 2 Columns (Videos & Books) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Videos */}
                            <Link
                                href="/videos"
                                className="group bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all flex items-center justify-between"
                            >
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-foreground mb-2 font-serif text-right">المرئيات</h3>
                                    <p className="text-sm text-muted-foreground text-right">مقاطع مرئية قصيرة.</p>
                                </div>
                                <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mr-4 shrink-0">
                                    <MonitorPlay className="h-6 w-6 text-red-600 dark:text-red-400" />
                                </div>
                            </Link>

                            {/* Books */}
                            <Link
                                href="/books"
                                className="group bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all flex items-center justify-between"
                            >
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-foreground mb-2 font-serif text-right">المكتبة المقروءة</h3>
                                    <p className="text-sm text-muted-foreground text-right">مؤلفات الشيخ وكتب.</p>
                                </div>
                                <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-4 shrink-0">
                                    <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </Link>
                        </div>

                    </div>

                </div>
            </div>
        </section>
    )
}
