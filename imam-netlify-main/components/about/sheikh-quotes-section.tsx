'use client';

import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { cn } from '@/lib/utils';
import { Quote, Sparkles } from 'lucide-react';

interface SheikhQuote {
    id: string;
    text: string;
    context?: string;
}

interface SheikhQuotesSectionProps {
    quotes?: SheikhQuote[];
    sheikhName?: string;
}

const defaultQuotes: SheikhQuote[] = [
    {
        id: '1',
        text: 'العلم نور يبدد ظلمات الجهل ويهدي إلى سواء السبيل',
        context: 'في أهمية طلب العلم',
    },
    {
        id: '2',
        text: 'من أراد الدنيا فعليه بالعلم، ومن أراد الآخرة فعليه بالعلم، ومن أرادهما معاً فعليه بالعلم',
        context: 'في فضل العلم',
    },
    {
        id: '3',
        text: 'التوحيد هو أساس كل خير وأصل كل فلاح في الدنيا والآخرة',
        context: 'في العقيدة',
    },
    {
        id: '4',
        text: 'الصبر على طلب العلم من أعظم أنواع الصبر، وثمرته لا تنفد',
        context: 'في الصبر على التعلم',
    },
];

function QuoteCard({ quote, index, isVisible }: { quote: SheikhQuote; index: number; isVisible: boolean }) {
    return (
        <div
            className={cn(
                'group relative transition-all duration-700 transform',
                isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
            )}
            style={{ transitionDelay: `${index * 150}ms` }}
        >
            <div className="relative h-full p-8 rounded-3xl bg-gradient-to-br from-[#0d2818] via-[#1a4d3e] to-[#0d2818] text-white shadow-xl overflow-hidden group-hover:shadow-2xl transition-all duration-500">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                        <defs>
                            <pattern id={`quote-pattern-${quote.id}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                <path d="M10 0 Q15 5 10 10 Q5 5 10 0" fill="none" stroke="currentColor" strokeWidth="0.3" />
                                <circle cx="10" cy="10" r="1" fill="currentColor" />
                            </pattern>
                        </defs>
                        <rect fill={`url(#quote-pattern-${quote.id})`} width="100" height="100" />
                    </svg>
                </div>

                {/* Quote Icon */}
                <div className="absolute top-4 right-4 text-6xl text-emerald-400/20 font-serif leading-none">"</div>
                <div className="absolute bottom-4 left-4 text-6xl text-emerald-400/20 font-serif leading-none rotate-180">"</div>

                {/* Decorative Corners */}
                <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-emerald-400/30 rounded-tl-lg" />
                <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-emerald-400/30 rounded-br-lg" />

                <div className="relative z-10">
                    {/* Icon */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center border border-emerald-400/30">
                            <Quote className="h-5 w-5 text-emerald-400" />
                        </div>
                        {quote.context && (
                            <span className="text-sm text-emerald-300 font-medium px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-400/20">
                                {quote.context}
                            </span>
                        )}
                    </div>

                    {/* Quote Text */}
                    <p className="text-lg md:text-xl text-emerald-100 leading-relaxed font-['Cairo'] font-medium">
                        {quote.text}
                    </p>

                    {/* Bottom Decoration */}
                    <div className="mt-6 flex items-center gap-2">
                        <div className="w-8 h-0.5 bg-gradient-to-r from-emerald-400 to-transparent rounded-full" />
                        <Sparkles className="w-4 h-4 text-emerald-400/50" />
                    </div>
                </div>

                {/* Hover Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
        </div>
    );
}

export function SheikhQuotesSection({
    quotes = defaultQuotes,
    sheikhName = 'الشيخ السيد مراد',
}: SheikhQuotesSectionProps) {
    const { ref, isVisible } = useIntersectionObserver({
        threshold: 0.1,
        freezeOnceVisible: true,
    });

    return (
        <section
            ref={ref}
            className="relative py-24 overflow-hidden bg-gradient-to-b from-background via-background-alt/30 to-background"
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.02]">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="quotes-section-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                            <path d="M50 0L100 50L50 100L0 50Z" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-primary" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#quotes-section-pattern)" />
                </svg>
            </div>

            <div className="relative z-10 container mx-auto px-4">
                {/* Section Header */}
                <div
                    className={cn(
                        'text-center mb-16 transition-all duration-1000 transform',
                        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
                    )}
                >
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-12 h-[2px] bg-gradient-to-r from-transparent to-secondary" />
                        <Quote className="w-5 h-5 text-secondary" />
                        <div className="w-12 h-[2px] bg-gradient-to-l from-transparent to-secondary" />
                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold text-primary dark:text-secondary font-['Cairo'] mb-3">
                        من أقوال الشيخ
                    </h2>

                    <p className="text-lg text-text-muted max-w-xl mx-auto">
                        كلمات منتقاة من دروس ومحاضرات {sheikhName}
                    </p>
                </div>

                {/* Quotes Grid */}
                <div className={cn(
                    "gap-6 mx-auto",
                    quotes.length === 1
                        ? "flex justify-center max-w-2xl"
                        : "grid md:grid-cols-2 max-w-5xl"
                )}>
                    {quotes.map((quote, index) => (
                        <div key={quote.id} className={quotes.length === 1 ? "w-full" : ""}>
                            <QuoteCard
                                quote={quote}
                                index={index}
                                isVisible={isVisible}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-1/4 left-0 w-48 h-48 bg-primary rounded-full blur-3xl opacity-[0.02] -translate-x-1/2" />
            <div className="absolute bottom-1/4 right-0 w-48 h-48 bg-secondary rounded-full blur-3xl opacity-[0.02] translate-x-1/2" />
        </section>
    );
}
