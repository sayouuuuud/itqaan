'use client';

import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { cn } from '@/lib/utils';
import { GraduationCap, BookOpen, Award, Briefcase, Heart } from 'lucide-react';

interface TimelineEvent {
    id: string;
    year: string;
    title: string;
    description: string;
    icon: 'graduation' | 'book' | 'award' | 'work' | 'heart';
}

interface JourneyTimelineProps {
    events?: TimelineEvent[];
}

const iconMap = {
    graduation: GraduationCap,
    book: BookOpen,
    award: Award,
    work: Briefcase,
    heart: Heart,
};

const defaultEvents: TimelineEvent[] = [
    {
        id: '1',
        year: 'النشأة',
        title: 'النشأة والطفولة',
        description: 'نشأ في بيئة علمية محافظة، وحفظ القرآن الكريم في سن مبكرة.',
        icon: 'heart',
    },
    {
        id: '2',
        year: 'بداية الطلب',
        title: 'بداية طلب العلم',
        description: 'بدأ رحلة طلب العلم على يد مشايخ أفاضل، وتلقى العلوم الشرعية من أصولها.',
        icon: 'book',
    },
    {
        id: '3',
        year: 'التخرج',
        title: 'الإجازات العلمية',
        description: 'حصل على إجازات علمية في القراءات والحديث والفقه من علماء معتبرين.',
        icon: 'graduation',
    },
    {
        id: '4',
        year: 'الإمامة',
        title: 'العمل كإمام وخطيب',
        description: 'تولى الإمامة والخطابة في عدة مساجد، وأثر في مئات المصلين.',
        icon: 'work',
    },
    {
        id: '5',
        year: 'الحاضر',
        title: 'التعليم والدعوة',
        description: 'يواصل رسالته في نشر العلم الشرعي عبر الدروس والمحاضرات والمنصات الرقمية.',
        icon: 'award',
    },
];

function TimelineItem({ event, index, isVisible }: { event: TimelineEvent; index: number; isVisible: boolean }) {
    const Icon = iconMap[event.icon];
    const isEven = index % 2 === 0;

    return (
        <div
            className={cn(
                'relative flex items-center gap-8 transition-all duration-700 transform',
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
                isEven ? 'md:flex-row' : 'md:flex-row-reverse'
            )}
            style={{ transitionDelay: `${index * 150}ms` }}
        >
            {/* Content Card */}
            <div className={cn('flex-1', isEven ? 'md:text-left' : 'md:text-right')}>
                <div className="group relative p-6 rounded-2xl bg-card border border-border/50 shadow-md hover:shadow-lg transition-all duration-500">
                    {/* Year Badge */}
                    <div className={cn(
                        'inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-3',
                        'dark:bg-primary/20 dark:text-primary-foreground'
                    )}>
                        <span className="font-['Cairo']">{event.year}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-foreground font-['Cairo'] mb-2">
                        {event.title}
                    </h3>

                    {/* Description */}
                    <p className="text-text-muted leading-relaxed font-['Cairo']">
                        {event.description}
                    </p>

                    {/* Hover Decoration */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-b-2xl" />
                </div>
            </div>

            {/* Center Icon */}
            <div className="relative z-10 flex-shrink-0 hidden md:flex">
                <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-lg">
                        <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    {/* Pulse Animation */}
                    <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
                </div>
            </div>

            {/* Spacer for alignment */}
            <div className="flex-1 hidden md:block" />
        </div>
    );
}

export function JourneyTimeline({ events = defaultEvents }: JourneyTimelineProps) {
    const { ref, isVisible } = useIntersectionObserver({
        threshold: 0.1,
        freezeOnceVisible: true,
    });

    return (
        <section
            ref={ref}
            className="relative py-20 overflow-hidden bg-gradient-to-b from-background via-background-alt/20 to-background"
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.015]">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="timeline-bg-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                            <circle cx="30" cy="30" r="1.5" fill="currentColor" className="text-primary" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#timeline-bg-pattern)" />
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
                        <GraduationCap className="w-5 h-5 text-secondary" />
                        <div className="w-12 h-[2px] bg-gradient-to-l from-transparent to-secondary" />
                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold text-primary dark:text-secondary font-['Cairo'] mb-3">
                        مسيرة حافلة بالعطاء
                    </h2>

                    <p className="text-lg text-text-muted max-w-xl mx-auto">
                        محطات مضيئة في رحلة طلب العلم والدعوة
                    </p>
                </div>

                {/* Timeline */}
                <div className="relative max-w-4xl mx-auto">
                    {/* Center Line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-primary opacity-20 hidden md:block -translate-x-1/2" />

                    {/* Timeline Items */}
                    <div className="space-y-12">
                        {events.map((event, index) => (
                            <TimelineItem
                                key={event.id}
                                event={event}
                                index={index}
                                isVisible={isVisible}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-20 left-10 w-32 h-32 bg-primary rounded-full blur-3xl opacity-[0.02]" />
            <div className="absolute bottom-20 right-10 w-32 h-32 bg-secondary rounded-full blur-3xl opacity-[0.02]" />
        </section>
    );
}
