'use client';

import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface PatternProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'geometric' | 'arabesque' | 'mandala' | 'mosque' | 'crescent' | 'calligraphic';
  animated?: boolean;
  opacity?: number;
  color?: string;
}

export function IslamicPattern({
  variant = 'geometric',
  animated = false,
  opacity = 0.1,
  color = 'currentColor',
  className,
  ...props
}: PatternProps) {
  const patterns = {
    geometric: (
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(animated && 'animate-pulse')}
      >
        <defs>
          <pattern
            id="geometric-pattern"
            x="0"
            y="0"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M40 0 L60 20 L40 40 L20 20 Z M0 40 L20 60 L0 80 L-20 60 Z M80 40 L100 60 L80 80 L60 60 Z"
              fill="none"
              stroke={color}
              strokeWidth="1"
              opacity={opacity}
            />
            <circle cx="40" cy="40" r="5" fill={color} opacity={opacity * 1.5} />
            <circle cx="0" cy="0" r="3" fill={color} opacity={opacity * 1.5} />
            <circle cx="80" cy="80" r="3" fill={color} opacity={opacity * 1.5} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#geometric-pattern)" />
      </svg>
    ),

    arabesque: (
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(animated && 'animate-[spin_30s_linear_infinite]')}
      >
        <defs>
          <pattern
            id="arabesque-pattern"
            x="0"
            y="0"
            width="120"
            height="120"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M60 10 Q80 30 60 50 Q40 70 60 90 M60 50 Q40 30 60 10"
              fill="none"
              stroke={color}
              strokeWidth="2"
              opacity={opacity}
            />
            <path
              d="M10 60 Q30 80 50 60 Q70 40 90 60 M50 60 Q30 40 10 60"
              fill="none"
              stroke={color}
              strokeWidth="2"
              opacity={opacity}
            />
            <circle cx="60" cy="60" r="8" fill="none" stroke={color} strokeWidth="2" opacity={opacity * 1.3} />
            <path
              d="M60 52 L68 60 L60 68 L52 60 Z"
              fill={color}
              opacity={opacity * 1.5}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#arabesque-pattern)" />
      </svg>
    ),

    mandala: (
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 200"
        className={cn(animated && 'animate-[spin_40s_linear_infinite]')}
      >
        <defs>
          <g id="mandala-petal">
            <path
              d="M100 100 Q105 80 100 60 Q95 80 100 100"
              fill={color}
              opacity={opacity}
            />
          </g>
        </defs>
        
        {[...Array(12)].map((_, i) => (
          <use
            key={i}
            href="#mandala-petal"
            transform={`rotate(${i * 30} 100 100)`}
          />
        ))}
        
        <circle
          cx="100"
          cy="100"
          r="50"
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity={opacity}
        />
        <circle
          cx="100"
          cy="100"
          r="30"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          opacity={opacity * 1.3}
        />
        <circle
          cx="100"
          cy="100"
          r="15"
          fill={color}
          opacity={opacity * 1.5}
        />
        
        {[...Array(8)].map((_, i) => (
          <circle
            key={i}
            cx={100 + 40 * Math.cos((i * Math.PI) / 4)}
            cy={100 + 40 * Math.sin((i * Math.PI) / 4)}
            r="5"
            fill={color}
            opacity={opacity * 1.2}
          />
        ))}
      </svg>
    ),

    mosque: (
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 200"
        className={cn(animated && 'animate-pulse')}
      >
        <path
          d="M100 30 Q95 40 95 50 L95 80 L85 80 L85 120 L70 120 L70 140 L130 140 L130 120 L115 120 L115 80 L105 80 L105 50 Q105 40 100 30 Z"
          fill={color}
          opacity={opacity}
        />
        
        <path
          d="M100 25 L105 30 L100 35 L95 30 Z"
          fill={color}
          opacity={opacity * 1.5}
        />
        
        <circle cx="60" cy="100" r="15" fill="none" stroke={color} strokeWidth="2" opacity={opacity} />
        <circle cx="140" cy="100" r="15" fill="none" stroke={color} strokeWidth="2" opacity={opacity} />
        
        <path
          d="M60 85 L65 90 L60 95 L55 90 Z"
          fill={color}
          opacity={opacity * 1.5}
        />
        <path
          d="M140 85 L145 90 L140 95 L135 90 Z"
          fill={color}
          opacity={opacity * 1.5}
        />
        
        <path
          d="M50 140 Q100 120 150 140"
          fill="none"
          stroke={color}
          strokeWidth="2"
          opacity={opacity}
        />
      </svg>
    ),

    crescent: (
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 200"
        className={cn(animated && 'animate-[pulse_3s_ease-in-out_infinite]')}
      >
        <defs>
          <pattern
            id="crescent-pattern"
            x="0"
            y="0"
            width="100"
            height="100"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M50 20 Q40 35 40 50 Q40 65 50 80 Q55 75 55 65 Q55 50 55 35 Q55 25 50 20 Z"
              fill={color}
              opacity={opacity}
            />
            <path
              d="M52 15 L56 18 L52 21 L48 18 Z"
              fill={color}
              opacity={opacity * 1.5}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#crescent-pattern)" />
      </svg>
    ),

    calligraphic: (
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(animated && 'animate-[fadeIn_2s_ease-in-out]')}
      >
        <defs>
          <pattern
            id="calligraphic-pattern"
            x="0"
            y="0"
            width="200"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M20 40 Q40 20 60 40 T100 40 T140 40 T180 40"
              fill="none"
              stroke={color}
              strokeWidth="2"
              opacity={opacity}
            />
            <path
              d="M30 40 Q30 30 40 30 Q50 30 50 40"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              opacity={opacity * 1.3}
            />
            <circle cx="70" cy="35" r="3" fill={color} opacity={opacity * 1.5} />
            <circle cx="110" cy="35" r="3" fill={color} opacity={opacity * 1.5} />
            <circle cx="150" cy="35" r="3" fill={color} opacity={opacity * 1.5} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#calligraphic-pattern)" />
      </svg>
    ),
  };

  return (
    <div
      className={cn('absolute inset-0 pointer-events-none overflow-hidden', className)}
      {...props}
    >
      {patterns[variant]}
    </div>
  );
}

export function GeometricDivider({
  className,
  color = '#035d44',
}: {
  className?: string;
  color?: string;
}) {
  return (
    <div className={cn('w-full flex justify-center my-8', className)}>
      <svg width="200" height="40" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M10 20 L30 10 L50 20 L30 30 Z M50 20 L70 10 L90 20 L70 30 Z M90 20 L110 10 L130 20 L110 30 Z M130 20 L150 10 L170 20 L150 30 Z M170 20 L190 10 L210 20 L190 30 Z"
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
        <circle cx="30" cy="20" r="4" fill={color} />
        <circle cx="70" cy="20" r="4" fill={color} />
        <circle cx="110" cy="20" r="4" fill={color} />
        <circle cx="150" cy="20" r="4" fill={color} />
        <circle cx="190" cy="20" r="4" fill={color} />
      </svg>
    </div>
  );
}

export function AnimatedBorder({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <div className="absolute inset-0 rounded-lg overflow-hidden">
        <div className="absolute inset-0 animate-[spin_8s_linear_infinite]">
          <div className="absolute inset-0 bg-gradient-to-r from-[#035d44] via-[#d4af37] to-[#035d44] opacity-20" />
        </div>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

export function IslamicCornerDecoration({
  position = 'top-left',
  className,
  size = 60,
}: {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
  size?: number;
}) {
  const positions = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0 rotate-90',
    'bottom-left': 'bottom-0 left-0 -rotate-90',
    'bottom-right': 'bottom-0 right-0 rotate-180',
  };

  return (
    <div className={cn('absolute pointer-events-none', positions[position], className)}>
      <svg
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 60 60"
      >
        <path
          d="M0 0 L20 0 Q15 10 15 20 L15 40 Q15 50 20 60 L0 60 Z"
          fill="currentColor"
          opacity="0.15"
        />
        <path
          d="M5 5 L15 5 Q12 10 12 15 L12 25 Q12 30 15 35 L5 35 Z"
          fill="currentColor"
          opacity="0.2"
        />
        <circle cx="10" cy="10" r="2" fill="currentColor" opacity="0.3" />
        <circle cx="10" cy="20" r="1.5" fill="currentColor" opacity="0.3" />
        <circle cx="10" cy="30" r="1.5" fill="currentColor" opacity="0.3" />
      </svg>
    </div>
  );
}
