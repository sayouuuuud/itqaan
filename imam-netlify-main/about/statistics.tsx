'use client';

import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { useCounterAnimation } from '@/hooks/use-counter-animation';
import { cn } from '@/lib/utils';
import { BookOpen, Users, Award, Calendar, GraduationCap, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Statistic {
  id: string;
  label: string;
  value: number;
  suffix?: string;
  icon: 'book' | 'users' | 'award' | 'calendar' | 'graduation' | 'file';
  decimals?: number;
}

interface StatisticsProps {
  statistics?: Statistic[];
}

interface FloatingParticle {
  id: number;
  left: string;
  top: string;
  animationDelay: string;
  animationDuration: string;
}

const iconMap = {
  book: BookOpen,
  users: Users,
  award: Award,
  calendar: Calendar,
  graduation: GraduationCap,
  file: FileText,
};

const defaultStatistics: Statistic[] = [
  { id: 'years', label: 'سنوات الخدمة', value: 25, suffix: '+', icon: 'calendar' },
  { id: 'students', label: 'طلاب العلم', value: 5000, suffix: '+', icon: 'users' },
  { id: 'lectures', label: 'محاضرات ودروس', value: 1500, suffix: '+', icon: 'book' },
  { id: 'books', label: 'مؤلفات ومراجعات', value: 12, icon: 'file' },
  { id: 'awards', label: 'جوائز وتكريمات', value: 8, icon: 'award' },
  { id: 'courses', label: 'دورات علمية', value: 50, suffix: '+', icon: 'graduation' },
];

function StatCard({ stat, isVisible, index }: { stat: Statistic; isVisible: boolean; index: number }) {
  const { count } = useCounterAnimation({
    end: stat.value,
    duration: 2000,
    delay: index * 150,
    shouldStart: isVisible,
    decimals: stat.decimals || 0,
  });

  const Icon = iconMap[stat.icon];

  return (
    <div
      className={cn(
        'group relative transition-all duration-700 transform',
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-12'
      )}
      style={{
        transitionDelay: `${index * 100}ms`,
      }}
    >
      <div className="relative h-full p-8 rounded-[1.5rem] bg-card border-2 border-border shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden">
        {/* Hover Glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#035d44] via-[#d4af37] to-[#035d44] rounded-[1.5rem] opacity-0 group-hover:opacity-20 blur-lg transition-opacity duration-500" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-5">
          {/* Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-[#035d44] rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />

            <div className="relative w-18 h-18 rounded-2xl bg-gradient-to-br from-[#035d44] to-[#024534] flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              <Icon className="w-9 h-9 text-white group-hover:rotate-12 transition-transform duration-500" />
            </div>

            {/* Badge */}
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#d4af37] rounded-full animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>

          {/* Number */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl md:text-6xl font-bold font-['Cairo'] text-primary tabular-nums">
                {count.toLocaleString('ar-EG')}
              </span>
              {stat.suffix && (
                <span className="text-3xl font-bold text-primary">
                  {stat.suffix}
                </span>
              )}
            </div>

            {/* Divider */}
            <div className="h-1 w-16 mx-auto bg-gradient-to-r from-transparent via-primary to-transparent rounded-full opacity-50 group-hover:opacity-100 group-hover:w-24 transition-all duration-500" />

            {/* Label */}
            <p className="text-lg font-semibold text-card-foreground font-['Cairo']">
              {stat.label}
            </p>
          </div>
        </div>

        {/* Pattern */}
        <div className="absolute top-4 right-4 w-24 h-24 opacity-5">
          <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export function StatisticsSection({ statistics = defaultStatistics }: StatisticsProps) {
  const { ref, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible: true,
  });

  const [particles, setParticles] = useState<FloatingParticle[]>([]);

  useEffect(() => {
    // Generate particles only on client side to avoid hydration mismatch
    const generatedParticles: FloatingParticle[] = [...Array(12)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 15}s`,
      animationDuration: `${15 + Math.random() * 20}s`,
    }));
    setParticles(generatedParticles);
  }, []);

  return (
    <section ref={ref} className="relative py-24 bg-background overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="stats-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="2" fill="hsl(var(--primary))" />
              <path d="M30 0 L30 60 M0 30 L60 30" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#stats-grid)" />
        </svg>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1.5 h-1.5 bg-primary rounded-full opacity-10 animate-float"
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: particle.animationDelay,
              animationDuration: particle.animationDuration,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4">
        {/* Header */}
        <div
          className={cn(
            'text-center mb-16 transition-all duration-1000 transform',
            isVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 -translate-y-8'
          )}
        >
          <div className="inline-block mb-6">
            <div className="flex items-center gap-3 text-[#d4af37] text-sm font-medium">
              <div className="w-16 h-[2px] bg-[#d4af37]" />
              <span className="font-['Amiri'] text-xl">إنجازاتنا</span>
              <div className="w-16 h-[2px] bg-[#d4af37]" />
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-foreground font-['Cairo'] mb-4">
            مسيرة عطاء مباركة
          </h2>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-['Cairo']">
            أرقام تعكس رحلة طويلة في خدمة العلم والدعوة إلى الله
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {statistics.map((stat, index) => (
            <StatCard
              key={stat.id}
              stat={stat}
              isVisible={isVisible}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-[0.03] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-[0.03] translate-x-1/2 translate-y-1/2" />
    </section>
  );
}