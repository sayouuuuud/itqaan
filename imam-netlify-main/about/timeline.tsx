'use client'

import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { BookOpen, Briefcase, GraduationCap, Medal, Building2, Scroll } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TimelineItem } from '@/lib/timeline-utils'

interface TimelineProps {
  items: TimelineItem[]
  className?: string
}

const iconMap = {
  book: BookOpen,
  briefcase: Briefcase,
  graduation: GraduationCap,
  medal: Medal,
  building: Building2,
  scroll: Scroll,
}

function TimelineItemComponent({ item, index }: { item: TimelineItem; index: number }) {
  const { ref: elementRef, isVisible } = useIntersectionObserver({
    threshold: 0.2,
    freezeOnceVisible: true,
  })

  const Icon = iconMap[item.icon || 'graduation']
  const isLeft = index % 2 === 0

  return (
    <div
      ref={elementRef}
      className={cn(
        'relative flex items-center gap-8 transition-all duration-700',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
      style={{
        transitionDelay: `${index * 150}ms`,
      }}
    >
      {/* Desktop: Alternating Layout */}
      <div className="hidden lg:contents">
        {isLeft ? (
          <>
            {/* Content - Right Side */}
            <div className="flex-1 text-right">
              <TimelineCard item={item} align="right" />
            </div>

            {/* Center Node */}
            <div className="relative flex flex-col items-center">
              <TimelineNode icon={Icon} type={item.type} />
            </div>

            {/* Empty Space - Left Side */}
            <div className="flex-1" />
          </>
        ) : (
          <>
            {/* Empty Space - Right Side */}
            <div className="flex-1" />

            {/* Center Node */}
            <div className="relative flex flex-col items-center">
              <TimelineNode icon={Icon} type={item.type} />
            </div>

            {/* Content - Left Side */}
            <div className="flex-1">
              <TimelineCard item={item} align="left" />
            </div>
          </>
        )}
      </div>

      {/* Mobile/Tablet: Single Column Layout */}
      <div className="flex lg:hidden gap-4 w-full">
        <div className="relative flex flex-col items-center">
          <TimelineNode icon={Icon} type={item.type} />
        </div>
        <div className="flex-1">
          <TimelineCard item={item} align="left" />
        </div>
      </div>
    </div>
  )
}

function TimelineNode({ icon: Icon, type }: { icon: any; type: string }) {
  const colorClasses = {
    education: 'bg-blue-500/10 border-blue-500 text-blue-600',
    career: 'bg-[#035d44]/10 border-[#035d44] text-[#035d44]',
    achievement: 'bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37]',
  }

  return (
    <div className="relative z-10">
      {/* Islamic Geometric Pattern Background */}
      <div className="absolute inset-0 -z-10 animate-pulse opacity-50">
        <svg width="60" height="60" className="text-current">
          <pattern id="node-pattern" x="0" width="0" y="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1" fill="currentColor" opacity="0.2" />
          </pattern>
          <rect width="60" height="60" fill="url(#node-pattern)" />
        </svg>
      </div>

      {/* Decorative Outer Ring */}
      <div className={cn(
        'w-16 h-16 rounded-full border-2 flex items-center justify-center',
        'bg-white dark:bg-gray-950 shadow-lg',
        'transition-all duration-500 hover:scale-110 hover:rotate-12',
        'group relative overflow-hidden',
        colorClasses[type as keyof typeof colorClasses] || colorClasses.education
      )}>
        {/* Animated Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent 
          translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        
        {/* Icon */}
        <Icon className="w-7 h-7 relative z-10" strokeWidth={2} />

        {/* Islamic Corner Decorations */}
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-current opacity-30 rounded-tr" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-current opacity-30 rounded-bl" />
      </div>
    </div>
  )
}

function TimelineCard({ item, align }: { item: TimelineItem; align: 'left' | 'right' }) {
  const alignClasses = align === 'right' ? 'items-end text-right' : 'items-start text-left'

  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-6 rounded-xl border-2 border-gray-200 dark:border-gray-800',
        'bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950',
        'shadow-md hover:shadow-xl transition-all duration-300',
        'group hover:scale-[1.02] hover:border-[#d4af37]/50',
        'relative overflow-hidden',
        alignClasses
      )}
    >
      {/* Islamic Pattern Overlay */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#035d44] via-[#d4af37] to-[#035d44] 
        opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Decorative Corner */}
      <div className="absolute top-2 right-2 w-8 h-8 opacity-10">
        <svg viewBox="0 0 32 32" className="text-[#035d44]">
          <path d="M0,0 L32,0 L32,32 Z" fill="currentColor" />
        </svg>
      </div>

      {/* Date Badge */}
      {item.date && (
        <div className={cn(
          'inline-flex px-3 py-1 rounded-full text-xs font-semibold',
          'bg-[#035d44]/10 text-[#035d44] dark:bg-[#035d44]/20',
          'border border-[#035d44]/20'
        )}>
          {item.date}
        </div>
      )}

      {/* Title */}
      <h3 className="text-xl font-bold text-gray-900 dark:text-white font-['Cairo']">
        {item.title}
      </h3>

      {/* Subtitle */}
      {item.subtitle && (
        <p className="text-sm font-medium text-[#035d44] dark:text-[#d4af37]">
          {item.subtitle}
        </p>
      )}

      {/* Description */}
      {item.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {item.description}
        </p>
      )}

      {/* Bottom Accent */}
      <div className={cn(
        'h-1 w-0 group-hover:w-full transition-all duration-500 rounded-full',
        'bg-gradient-to-r from-[#035d44] to-[#d4af37]',
        align === 'right' ? 'mr-auto' : 'ml-auto'
      )} />
    </div>
  )
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn('relative py-12', className)}>
      {/* Vertical Connecting Line - Desktop */}
      <div className="hidden lg:block absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2 w-0.5 
        bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent" />

      {/* Vertical Connecting Line - Mobile/Tablet */}
      <div className="lg:hidden absolute top-0 bottom-0 left-8 w-0.5 
        bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent" />

      {/* Timeline Items */}
      <div className="space-y-16 lg:space-y-24">
        {items.map((item, index) => (
          <TimelineItemComponent key={item.id} item={item} index={index} />
        ))}
      </div>

      {/* Islamic Decorative Element at Bottom */}
      <div className="flex justify-center mt-12">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#035d44] to-[#d4af37] 
          flex items-center justify-center shadow-lg animate-pulse">
          <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-950 flex items-center justify-center">
            <svg className="w-6 h-6 text-[#035d44]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}