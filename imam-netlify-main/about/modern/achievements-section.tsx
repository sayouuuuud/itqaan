'use client';

import { Award, BookOpen, Trophy, Star, Sparkles, Medal } from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { IslamicCornerDecoration, GeometricDivider } from './islamic-patterns';

interface Achievement {
  text: string;
  year?: string;
}

interface AchievementsSectionProps {
  achievements: string;
}

const iconVariants = [
  { Icon: Award, color: 'from-amber-400 to-yellow-600', bg: 'bg-amber-50 dark:bg-amber-950/20' },
  { Icon: Trophy, color: 'from-emerald-400 to-green-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
  { Icon: Medal, color: 'from-blue-400 to-indigo-600', bg: 'bg-blue-50 dark:bg-blue-950/20' },
  { Icon: Star, color: 'from-purple-400 to-violet-600', bg: 'bg-purple-50 dark:bg-purple-950/20' },
  { Icon: BookOpen, color: 'from-rose-400 to-pink-600', bg: 'bg-rose-50 dark:bg-rose-950/20' },
  { Icon: Sparkles, color: 'from-cyan-400 to-teal-600', bg: 'bg-cyan-50 dark:bg-cyan-950/20' },
];

function parseAchievements(achievementsString: string): Achievement[] {
  return achievementsString
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      const yearMatch = line.match(/(\d{4})/);
      return {
        text: line.trim(),
        year: yearMatch ? yearMatch[1] : undefined,
      };
    });
}

export function AchievementsSection({ achievements }: AchievementsSectionProps) {
  const { ref: headerRef, isVisible: headerVisible } = useIntersectionObserver({ threshold: 0.2 });
  const achievementsList = parseAchievements(achievements);

  return (
    <section className="relative py-20 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.01]"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 50%, #035d44 0%, transparent 50%),
                           radial-gradient(circle at 70% 50%, #d4af37 0%, transparent 50%)`,
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div
          ref={headerRef}
          className={`text-center mb-16 transition-all duration-1000 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37] to-[#d4af37]" />
            <Trophy className="w-8 h-8 text-[#d4af37]" />
            <div className="w-12 h-[2px] bg-gradient-to-l from-transparent via-[#d4af37] to-[#d4af37]" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[#035d44] dark:text-[#d4af37] font-['Amiri'] mb-3">
            الإنجازات والتكريمات
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            مسيرة حافلة بالعطاء والإنجازات في خدمة الدين والعلم
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievementsList.map((achievement, index) => {
            const variant = iconVariants[index % iconVariants.length];
            return (
              <AchievementCard
                key={index}
                achievement={achievement}
                Icon={variant.Icon}
                colorGradient={variant.color}
                bgColor={variant.bg}
                index={index}
              />
            );
          })}
        </div>

        <div className="mt-16">
          <GeometricDivider />
        </div>
      </div>
    </section>
  );
}

interface AchievementCardProps {
  achievement: Achievement;
  Icon: React.ComponentType<{ className?: string }>;
  colorGradient: string;
  bgColor: string;
  index: number;
}

function AchievementCard({ achievement, Icon, colorGradient, bgColor, index }: AchievementCardProps) {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={`group relative transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#035d44]/5 to-[#d4af37]/5 rounded-2xl transform group-hover:scale-105 transition-transform duration-500" />
      
      <div
        className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-500 blur-xl"
        style={{
          background: `linear-gradient(135deg, rgba(3, 93, 68, 0.1) 0%, rgba(212, 175, 55, 0.1) 100%)`,
        }}
      />

      <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 overflow-hidden">
        <IslamicCornerDecoration
          position="top-right"
          className="text-[#d4af37] opacity-10"
        />
        <IslamicCornerDecoration
          position="bottom-left"
          className="text-[#035d44] opacity-10 rotate-180"
        />

        <div className="relative z-10 flex items-start gap-4 group-hover:transform group-hover:scale-[1.02] transition-transform duration-500">
          <div
            className={`${bgColor} p-3 rounded-xl shadow-md group-hover:shadow-lg transition-all duration-500 group-hover:rotate-12 group-hover:scale-110`}
          >
            <div className={`bg-gradient-to-br ${colorGradient} bg-clip-text`}>
              <Icon className="w-7 h-7 text-transparent" />
            </div>
          </div>

          <div className="flex-1">
            {achievement.year && (
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 bg-gradient-to-r ${colorGradient} text-white shadow-sm`}>
                {achievement.year}
              </span>
            )}
            <p className="text-gray-700 dark:text-gray-200 leading-relaxed font-['Cairo']">
              {achievement.text.replace(/^\d{4}\s*-?\s*/, '')}
            </p>
          </div>
        </div>

        <div
          className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${colorGradient} transform origin-right scale-x-0 group-hover:scale-x-100 transition-transform duration-700`}
          style={{ width: '100%' }}
        />

        <div
          className="absolute inset-0 bg-gradient-to-t from-white/50 to-transparent dark:from-gray-800/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        />
      </div>
    </div>
  );
}