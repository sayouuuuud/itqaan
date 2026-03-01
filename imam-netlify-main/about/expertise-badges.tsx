'use client';

import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { IslamicCornerDecoration } from './islamic-patterns';
import { BookOpen, Scroll, Scale, Cross, Microscope, PenTool } from 'lucide-react';

export interface ExpertiseCategory {
  id: string;
  title: string;
  icon: 'book' | 'scroll' | 'scale' | 'cross' | 'microscope' | 'pen';
  skills: {
    name: string;
    level: number;
    color?: string;
  }[];
}

interface ExpertiseBadgesProps {
  categories?: ExpertiseCategory[];
  className?: string;
}

const iconMap = {
  book: BookOpen,
  scroll: Scroll,
  scale: Scale,
  cross: Cross,
  microscope: Microscope,
  pen: PenTool,
};

const defaultCategories: ExpertiseCategory[] = [
  {
    id: 'quran',
    title: 'علوم القرآن الكريم',
    icon: 'book',
    skills: [
      { name: 'التفسير والتأويل', level: 95, color: 'emerald' },
      { name: 'علوم التجويد والقراءات', level: 98, color: 'emerald' },
      { name: 'أسباب النزول', level: 90, color: 'emerald' },
      { name: 'الناسخ والمنسوخ', level: 88, color: 'emerald' },
    ],
  },
  {
    id: 'hadith',
    title: 'علوم الحديث',
    icon: 'scroll',
    skills: [
      { name: 'علم الرواية والدراية', level: 92, color: 'blue' },
      { name: 'تخريج الأحاديث', level: 90, color: 'blue' },
      { name: 'علم الجرح والتعديل', level: 85, color: 'blue' },
      { name: 'شرح الأحاديث النبوية', level: 93, color: 'blue' },
    ],
  },
  {
    id: 'fiqh',
    title: 'الفقه وأصوله',
    icon: 'scale',
    skills: [
      { name: 'الفقه المقارن', level: 90, color: 'amber' },
      { name: 'أصول الفقه', level: 88, color: 'amber' },
      { name: 'القواعد الفقهية', level: 87, color: 'amber' },
      { name: 'فقه النوازل المعاصرة', level: 85, color: 'amber' },
    ],
  },
  {
    id: 'aqeedah',
    title: 'العقيدة والتوحيد',
    icon: 'cross',
    skills: [
      { name: 'أصول العقيدة الإسلامية', level: 95, color: 'violet' },
      { name: 'الرد على الشبهات', level: 90, color: 'violet' },
      { name: 'علم الكلام', level: 85, color: 'violet' },
      { name: 'الفرق والمذاهب', level: 88, color: 'violet' },
    ],
  },
  {
    id: 'teaching',
    title: 'التدريس والدعوة',
    icon: 'microscope',
    skills: [
      { name: 'الخطابة والوعظ', level: 96, color: 'rose' },
      { name: 'أساليب التدريس الحديثة', level: 88, color: 'rose' },
      { name: 'الدعوة والإرشاد', level: 92, color: 'rose' },
      { name: 'التربية الإسلامية', level: 90, color: 'rose' },
    ],
  },
  {
    id: 'language',
    title: 'اللغة والأدب',
    icon: 'pen',
    skills: [
      { name: 'النحو والصرف', level: 92, color: 'cyan' },
      { name: 'البلاغة العربية', level: 88, color: 'cyan' },
      { name: 'الأدب الإسلامي', level: 85, color: 'cyan' },
      { name: 'فقه اللغة', level: 87, color: 'cyan' },
    ],
  },
];

const colorClasses = {
  emerald: {
    bg: 'bg-emerald-500/20',
    bar: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
    glow: 'shadow-emerald-500/50',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: 'text-emerald-500',
  },
  blue: {
    bg: 'bg-blue-500/20',
    bar: 'bg-gradient-to-r from-blue-500 to-blue-400',
    glow: 'shadow-blue-500/50',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-500',
  },
  amber: {
    bg: 'bg-amber-500/20',
    bar: 'bg-gradient-to-r from-amber-500 to-amber-400',
    glow: 'shadow-amber-500/50',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    icon: 'text-amber-500',
  },
  violet: {
    bg: 'bg-violet-500/20',
    bar: 'bg-gradient-to-r from-violet-500 to-violet-400',
    glow: 'shadow-violet-500/50',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-200 dark:border-violet-800',
    icon: 'text-violet-500',
  },
  rose: {
    bg: 'bg-rose-500/20',
    bar: 'bg-gradient-to-r from-rose-500 to-rose-400',
    glow: 'shadow-rose-500/50',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800',
    icon: 'text-rose-500',
  },
  cyan: {
    bg: 'bg-cyan-500/20',
    bar: 'bg-gradient-to-r from-cyan-500 to-cyan-400',
    glow: 'shadow-cyan-500/50',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-200 dark:border-cyan-800',
    icon: 'text-cyan-500',
  },
};

function SkillBar({
  name,
  level,
  color = 'emerald',
  delay = 0,
}: {
  name: string;
  level: number;
  color?: keyof typeof colorClasses;
  delay?: number;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(barRef, { threshold: 0.3 });
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setAnimatedWidth(level);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isVisible, level, delay]);

  const colors = colorClasses[color] || colorClasses.emerald;

  return (
    <div ref={barRef} className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-['Cairo']">
          {name}
        </span>
        <span className={cn('text-sm font-bold', colors.text)}>
          {animatedWidth}%
        </span>
      </div>
      <div className="relative h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn(
            'absolute inset-y-0 right-0 rounded-full transition-all duration-1000 ease-out',
            colors.bar,
            isVisible && 'shadow-lg',
            isVisible && colors.glow
          )}
          style={{
            width: `${animatedWidth}%`,
            transformOrigin: 'right',
          }}
        />
      </div>
    </div>
  );
}

function CategoryCard({
  category,
  index,
}: {
  category: ExpertiseCategory;
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(cardRef, { threshold: 0.2 });

  const Icon = iconMap[category.icon] || BookOpen;
  const primaryColor = category.skills[0]?.color || 'emerald';
  const colors = colorClasses[primaryColor as keyof typeof colorClasses] || colorClasses.emerald;

  return (
    <div
      ref={cardRef}
      className={cn(
        'group relative',
        'transition-all duration-700 ease-out',
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8'
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div
        className={cn(
          'relative h-full',
          'bg-white dark:bg-gray-800',
          colors.border,
          'rounded-2xl p-6',
          'shadow-lg hover:shadow-2xl',
          'transition-all duration-500',
          'overflow-hidden',
          'hover:-translate-y-2'
        )}
      >
        {/* Hover Glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#035d44] via-[#d4af37] to-[#035d44] rounded-2xl opacity-0 group-hover:opacity-20 blur-lg transition-opacity duration-500" />

        {/* Gradient Overlay */}
        <div
          className={cn(
            'absolute inset-0 opacity-0 group-hover:opacity-100',
            'bg-gradient-to-br from-transparent via-transparent',
            colors.bg,
            'transition-opacity duration-500'
          )}
        />

        {/* Corner Decorations */}
        <IslamicCornerDecoration
          position="top-right"
          size={60}
          className="opacity-30"
        />
        <IslamicCornerDecoration
          position="bottom-left"
          size={60}
          className="opacity-30"
        />

        <div className="relative z-10 space-y-6">
          {/* Header with Icon */}
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'flex items-center justify-center',
                'w-14 h-14 rounded-xl',
                colors.bg,
                'border-2 border-current',
                colors.text,
                'transform transition-transform duration-500',
                'group-hover:scale-110 group-hover:rotate-6'
              )}
            >
              <Icon className={cn('w-7 h-7', colors.icon)} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white font-['Cairo']">
              {category.title}
            </h3>
          </div>

          {/* Skills */}
          <div className="space-y-4">
            {category.skills.map((skill, skillIndex) => (
              <SkillBar
                key={skill.name}
                name={skill.name}
                level={skill.level}
                color={skill.color as keyof typeof colorClasses}
                delay={index * 100 + skillIndex * 50}
              />
            ))}
          </div>
        </div>

        {/* Bottom Accent Bar */}
        <div
          className={cn(
            'absolute top-0 left-0 right-0 h-1',
            colors.bar,
            'transform scale-x-0 group-hover:scale-x-100',
            'transition-transform duration-500',
            'origin-right'
          )}
        />
      </div>
    </div>
  );
}

export function ExpertiseBadges({
  categories = defaultCategories,
  className,
}: ExpertiseBadgesProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(sectionRef, { threshold: 0.1 });

  return (
    <section
      ref={sectionRef}
      className={cn('relative py-20', className)}
    >
      {/* Background */}
      <div
        className={cn(
          'absolute inset-0',
          'bg-gradient-to-b from-transparent via-emerald-50/30 to-transparent',
          'dark:via-emerald-950/10',
          'pointer-events-none'
        )}
      />

      {/* Decorative Elements */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-10 right-20 w-64 h-64 bg-emerald-500 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-64 h-64 bg-blue-500 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div
          className={cn(
            'text-center mb-16',
            'transition-all duration-700',
            isVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 -translate-y-8'
          )}
        >
          <div className="inline-flex items-center gap-4 mb-4">
            <div className="w-24 h-[2px] bg-gradient-to-r from-transparent to-[#d4af37]" />
            <div className="relative">
              <div className="absolute inset-0 bg-[#d4af37] rounded-full blur-lg opacity-30 animate-pulse" />
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-[#035d44] to-[#024534] flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 text-[#d4af37]" strokeWidth={1.5} />
              </div>
            </div>
            <div className="w-24 h-[2px] bg-gradient-to-l from-transparent to-[#d4af37]" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white font-['Amiri'] mb-4">
            المجالات والخبرات
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-['Cairo']">
            خبرات متنوعة في مختلف العلوم الشرعية واللغوية
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              index={index}
            />
          ))}
        </div>

        {/* Decorative Bottom */}
        <div className="flex justify-center mt-16">
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent rounded-full" />
        </div>
      </div>
    </section>
  );
}