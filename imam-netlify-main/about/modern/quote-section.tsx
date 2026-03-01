'use client';

import { Quote } from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { IslamicPattern, GeometricDivider } from './islamic-patterns';

interface QuoteSectionProps {
  quote: string;
  quoteText?: string;
  quoteAuthor?: string;
}

export function QuoteSection({ quote, quoteText, quoteAuthor }: QuoteSectionProps) {
  const { ref: quoteRef, isVisible: quoteVisible } = useIntersectionObserver({ threshold: 0.3 });
  
  const displayQuote = quoteText || quote;
  const displayAuthor = quoteAuthor || 'الشيخ';

  if (!displayQuote?.trim()) {
    return null;
  }

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a2018]/5 via-[#0d2d22]/3 to-[#1a4d3e]/5" />
      
      {/* Animated Patterns */}
      <IslamicPattern
        variant="geometric"
        className="absolute top-10 left-10 w-40 h-40 text-[#035d44] opacity-[0.03]"
        animated
      />
      <IslamicPattern
        variant="arabesque"
        className="absolute bottom-10 right-10 w-48 h-48 text-[#d4af37] opacity-[0.03]"
        animated
      />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-[#d4af37] rounded-full opacity-15 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 15}s`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div
            ref={quoteRef}
            className={`relative transition-all duration-1000 ${
              quoteVisible 
                ? 'opacity-100 translate-y-0 scale-100' 
                : 'opacity-0 translate-y-10 scale-95'
            }`}
          >
            {/* Outer Glow */}
            <div className="absolute -inset-2 bg-gradient-to-br from-[#d4af37]/15 via-[#035d44]/10 to-[#d4af37]/15 rounded-[2.5rem] blur-xl" />
            
            {/* Main Card Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#035d44] to-[#024534] rounded-[2.5rem] transform rotate-0.5" />
            
            {/* Golden Accent */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 to-transparent rounded-[2.5rem]" />

            {/* Border */}
            <div className="absolute inset-0 rounded-[2.5xl] p-0.5 bg-gradient-to-br from-[#d4af37]/40 via-transparent to-[#d4af37]/40" />

            <div className="relative bg-white dark:bg-gray-800 rounded-[2.5rem] p-10 md:p-14 lg:p-16 shadow-2xl">
              {/* Top Decorative Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#035d44] via-[#d4af37] to-[#035d44] rounded-t-[2.5rem]" />

              {/* Center Pattern */}
              <IslamicPattern
                variant="mandala"
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] text-[#035d44] opacity-[0.02]"
                animated
              />

              <div className="relative z-10">
                {/* Icon */}
                <div className="flex justify-center mb-10">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37] to-[#b8941f] rounded-full blur-xl opacity-40 animate-pulse" />
                    <div className="relative bg-gradient-to-br from-[#035d44] to-[#024534] p-5 rounded-full shadow-xl">
                      <Quote className="w-10 h-10 text-[#d4af37] transform rotate-180" />
                    </div>
                  </div>
                </div>

                {/* Quote */}
                <blockquote className="text-center">
                  <div className="relative inline-block">
                    <span className="absolute -top-6 -right-3 text-7xl text-[#d4af37]/20 font-serif leading-none">"</span>
                    <p className="text-2xl md:text-3xl lg:text-4xl font-['Amiri'] text-gray-800 dark:text-gray-100 leading-relaxed px-8 py-4">
                      {displayQuote}
                    </p>
                    <span className="absolute -bottom-6 -left-3 text-7xl text-[#d4af37]/20 font-serif leading-none">"</span>
                  </div>
                  
                  {/* Author */}
                  <footer className="flex items-center justify-center gap-5 mt-12">
                    <div className="h-[2px] w-20 bg-gradient-to-r from-transparent to-[#d4af37]" />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#035d44] to-[#024534] flex items-center justify-center">
                        <span className="text-[#d4af37] font-bold text-lg">د</span>
                      </div>
                      <cite className="not-italic text-lg md:text-xl font-['Cairo'] font-bold text-[#035d44] dark:text-[#d4af37]">
                        {displayAuthor}
                      </cite>
                    </div>
                    <div className="h-[2px] w-20 bg-gradient-to-l from-transparent to-[#d4af37]" />
                  </footer>
                </blockquote>

                {/* Corner Decorations */}
                <div className="absolute top-8 right-8 w-20 h-20">
                  <IslamicPattern
                    variant="crescent"
                    className="w-full h-full text-[#d4af37] opacity-20"
                    animated
                  />
                </div>
                <div className="absolute bottom-8 left-8 w-20 h-20">
                  <IslamicPattern
                    variant="crescent"
                    className="w-full h-full text-[#035d44] opacity-20 rotate-180"
                    animated
                  />
                </div>
              </div>

              {/* Bottom Overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#035d44]/5 to-transparent rounded-b-[2.5rem] pointer-events-none" />
            </div>
          </div>

          {/* Divider */}
          <div className="mt-20">
            <GeometricDivider />
          </div>
        </div>
      </div>
    </section>
  );
}