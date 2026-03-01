'use client';

import { useState } from 'react';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { cn } from '@/lib/utils';
import { IslamicPattern, GeometricDivider, IslamicCornerDecoration } from './islamic-patterns';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface BiographySectionProps {
  biography: string;
  maxPreviewLength?: number;
  className?: string;
}

export function BiographySection({
  biography,
  maxPreviewLength = 300,
  className,
}: BiographySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { ref, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible: true,
  });

  const needsExpansion = biography.length > maxPreviewLength;
  const displayText = isExpanded || !needsExpansion
    ? biography
    : biography.slice(0, maxPreviewLength) + '...';

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <section
      ref={ref}
      className={cn(
        'relative py-16 md:py-24 overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50',
        className
      )}
    >
      <IslamicPattern
        variant="arabesque"
        animated
        opacity={0.04}
        color="#035d44"
        className="z-0"
      />

      <div className="relative z-10 container mx-auto px-4">
        <div
          className={cn(
            'transition-all duration-1000 transform',
            isVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-12'
          )}
        >
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-16 h-[2px] bg-gradient-to-r from-transparent to-[#d4af37]" />
              <h2 className="text-3xl md:text-4xl font-bold font-['Cairo'] text-[#035d44]">
                السيرة الذاتية
              </h2>
              <div className="w-16 h-[2px] bg-gradient-to-l from-transparent to-[#d4af37]" />
            </div>
            <p className="text-gray-600 font-['Amiri'] text-lg">
              رحلة علمية ودعوية مباركة
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative group">
              <IslamicCornerDecoration
                position="top-right"
                size={80}
                className="opacity-20 group-hover:opacity-30 transition-opacity duration-500"
              />
              <IslamicCornerDecoration
                position="bottom-left"
                size={80}
                className="opacity-20 group-hover:opacity-30 transition-opacity duration-500"
              />

              <div className="absolute -inset-1 bg-gradient-to-br from-[#035d44]/10 via-[#d4af37]/5 to-[#035d44]/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200/50 p-8 md:p-12 backdrop-blur-sm">
                <div className="absolute top-0 right-8 w-1 h-12 bg-gradient-to-b from-[#d4af37] to-transparent" />

                <div
                  className={cn(
                    'relative overflow-hidden transition-all duration-700 ease-in-out',
                    isExpanded ? 'max-h-[10000px]' : 'max-h-[400px]'
                  )}
                >
                  <div className="prose prose-lg prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed font-['Amiri'] text-lg md:text-xl whitespace-pre-wrap">
                      {displayText}
                    </p>
                  </div>

                  {!isExpanded && needsExpansion && (
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none" />
                  )}
                </div>

                {needsExpansion && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={toggleExpanded}
                      className="group/btn relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#035d44] to-[#024832] text-white rounded-xl font-['Cairo'] font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      <span className="relative z-10">
                        {isExpanded ? 'عرض أقل' : 'اقرأ المزيد'}
                      </span>
                      
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 transition-transform duration-300 group-hover/btn:translate-y-[-2px]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 transition-transform duration-300 group-hover/btn:translate-y-[2px]" />
                      )}

                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8941f] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                      
                      <div className="absolute inset-0 rounded-xl bg-[#d4af37] opacity-0 group-hover/btn:opacity-20 blur-lg transition-opacity duration-300" />
                    </button>
                  </div>
                )}

                <div className="mt-8 flex items-center justify-center gap-2 text-[#035d44]">
                  <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-[#035d44]" />
                  <div className="w-2 h-2 rotate-45 border-r-2 border-b-2 border-[#d4af37]" />
                  <div className="w-2 h-2 rotate-45 border-r-2 border-b-2 border-[#d4af37]" />
                  <div className="w-2 h-2 rotate-45 border-r-2 border-b-2 border-[#d4af37]" />
                  <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-[#035d44]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <GeometricDivider className="mt-16" />
      </div>
    </section>
  );
}