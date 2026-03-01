'use client';

import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { cn } from '@/lib/utils';
import { Target, Eye, Sparkles } from 'lucide-react';

interface MissionVisionSectionProps {
  mission?: string;
  vision?: string;
}

const defaultMission = "نشر العلم الشرعي الصحيح المبني على الكتاب والسنة بفهم سلف الأمة، وتيسير العلم للناس بأسلوب واضح ومبسط يناسب جميع المستويات.";
const defaultVision = "بناء جيل متمسك بدينه، فاهم لعقيدته، عامل بسنة نبيه ﷺ، قادر على مواجهة تحديات العصر بثبات وعلم ووعي.";

export function MissionVisionSection({
  mission = defaultMission,
  vision = defaultVision,
}: MissionVisionSectionProps) {
  const { ref, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible: true,
  });

  return (
    <section
      ref={ref}
      className="relative py-20 overflow-hidden bg-gradient-to-b from-background via-background-alt/30 to-background"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="mission-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M40 0L80 40L40 80L0 40Z" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
              <circle cx="40" cy="40" r="8" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-secondary" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mission-pattern)" />
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
            <Sparkles className="w-5 h-5 text-secondary" />
            <div className="w-12 h-[2px] bg-gradient-to-l from-transparent to-secondary" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-primary dark:text-secondary font-['Cairo'] mb-3">
            الرسالة والرؤية
          </h2>
          
          <p className="text-lg text-text-muted max-w-xl mx-auto">
            منهجنا في نشر العلم وخدمة الدين
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Mission Card */}
          <div
            className={cn(
              'group relative transition-all duration-700 transform',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            )}
            style={{ transitionDelay: '200ms' }}
          >
            <div className="relative h-full p-8 rounded-3xl bg-gradient-to-br from-card via-card to-primary/5 dark:from-card dark:via-card dark:to-primary/10 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden">
              {/* Decorative Corner */}
              <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
                <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
                  <path d="M100 0 L100 100 L0 100 Q50 50 100 0" fill="currentColor" />
                </svg>
              </div>
              
              {/* Icon */}
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                  <Target className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-secondary rounded-full animate-pulse" />
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-foreground mb-4 font-['Cairo']">
                رسالتنا
              </h3>
              
              <p className="text-lg text-text-muted leading-relaxed font-['Cairo']">
                {mission}
              </p>

              {/* Bottom Decoration */}
              <div className="absolute bottom-4 left-4 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary/30" />
                <div className="w-3 h-3 rounded-full bg-primary/50" />
                <div className="w-2 h-2 rounded-full bg-primary/30" />
              </div>
            </div>
          </div>

          {/* Vision Card */}
          <div
            className={cn(
              'group relative transition-all duration-700 transform',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            )}
            style={{ transitionDelay: '400ms' }}
          >
            <div className="relative h-full p-8 rounded-3xl bg-gradient-to-br from-card via-card to-secondary/5 dark:from-card dark:via-card dark:to-secondary/10 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden">
              {/* Decorative Corner */}
              <div className="absolute top-0 left-0 w-24 h-24 opacity-10">
                <svg viewBox="0 0 100 100" className="w-full h-full text-secondary">
                  <path d="M0 0 L0 100 L100 100 Q50 50 0 0" fill="currentColor" />
                </svg>
              </div>
              
              {/* Icon */}
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-secondary-light flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                  <Eye className="w-8 h-8 text-secondary-foreground" />
                </div>
                <div className="absolute -top-1 -left-1 w-5 h-5 bg-primary rounded-full animate-pulse" />
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-foreground mb-4 font-['Cairo']">
                رؤيتنا
              </h3>
              
              <p className="text-lg text-text-muted leading-relaxed font-['Cairo']">
                {vision}
              </p>

              {/* Bottom Decoration */}
              <div className="absolute bottom-4 right-4 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-secondary/30" />
                <div className="w-3 h-3 rounded-full bg-secondary/50" />
                <div className="w-2 h-2 rounded-full bg-secondary/30" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Blurs */}
      <div className="absolute top-1/4 left-0 w-64 h-64 bg-primary rounded-full blur-3xl opacity-[0.02] -translate-x-1/2" />
      <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-secondary rounded-full blur-3xl opacity-[0.02] translate-x-1/2" />
    </section>
  );
}
