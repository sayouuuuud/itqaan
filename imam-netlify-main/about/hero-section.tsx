'use client';

import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { cn } from '@/lib/utils';
import { IslamicPattern, AnimatedBorder } from './islamic-patterns';
import Image from 'next/image';
import { Facebook, Twitter, Instagram, Youtube, Mail, Globe, Award, MapPin } from 'lucide-react';

interface SocialLink {
  platform: string;
  url: string;
}

interface HeroSectionProps {
  sheikhName: string;
  imagePath: string;
  title: string;
  position: string;
  location: string;
  socialLinks?: SocialLink[];
}

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  email: Mail,
  website: Globe,
};

export function HeroSection({
  sheikhName,
  imagePath,
  title,
  position,
  location,
  socialLinks = [],
}: HeroSectionProps) {
  const { ref: heroRef, isVisible: heroVisible } = useIntersectionObserver({
    threshold: 0.2,
    freezeOnceVisible: true,
  });

  const { ref: imageRef, isVisible: imageVisible } = useIntersectionObserver({
    threshold: 0.3,
    freezeOnceVisible: true,
  });

  return (
    <section
      ref={heroRef}
      className="relative min-h-[85vh] flex items-center overflow-hidden bg-gradient-to-br from-[#0a2018] via-[#0d2d22] to-[#1a4d3e]"
    >
      {/* Animated Background Patterns */}
      <IslamicPattern
        variant="geometric"
        animated
        opacity={0.06}
        color="#d4af37"
        className="z-0"
      />
      
      <IslamicPattern
        variant="mandala"
        animated
        opacity={0.04}
        color="#ffffff"
        className="z-0"
      />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#d4af37] rounded-full opacity-20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${8 + Math.random() * 12}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className={cn(
          'grid grid-cols-1 lg:grid-cols-12 gap-12 items-center',
          'transition-all duration-1000 transform',
          heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        )}>
          {/* Content Side */}
          <div className="lg:col-span-7 text-white">
            {/* Badge */}
            <div className={cn(
              'inline-flex items-center gap-3 px-5 py-2.5 bg-[#d4af37]/10 backdrop-blur-sm rounded-full',
              'border border-[#d4af37]/30 mb-8',
              'transition-all duration-700 delay-100',
              heroVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            )}>
              <Award className="w-5 h-5 text-[#d4af37]" />
              <span className="text-[#d4af37] font-medium text-sm">بسم الله الرحمن الرحيم</span>
            </div>

            {/* Name */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold font-['Cairo'] leading-tight mb-4 relative">
              <span className="relative z-10">{sheikhName}</span>
              <span className="absolute -bottom-2 left-0 w-24 h-1.5 bg-gradient-to-r from-[#d4af37] to-transparent rounded-full" />
            </h1>

            {/* Title */}
            {title && (
              <p className="text-2xl md:text-3xl font-['Amiri'] text-[#d4af37] mb-6 opacity-90">
                {title}
              </p>
            )}

            {/* Position */}
            {position && (
              <div className="flex items-center gap-3 text-lg text-gray-200 mb-4">
                <Award className="w-5 h-5 text-[#d4af37]" />
                <span>{position}</span>
              </div>
            )}

            {/* Location */}
            {location && (
              <div className="flex items-center gap-3 text-base text-gray-400 mb-8">
                <MapPin className="w-4 h-4 text-[#d4af37]" />
                <span>{location}</span>
              </div>
            )}

            {/* Divider */}
            <div className="w-32 h-0.5 bg-gradient-to-r from-[#d4af37] to-transparent rounded-full mb-8" />

            {/* Social Links */}
            {socialLinks && socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((link, index) => {
                  const Icon = socialIcons[link.platform.toLowerCase()] || Globe;
                  return (
                    <a
                      key={link.platform}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'group relative flex items-center justify-center w-11 h-11 rounded-xl',
                        'bg-white/5 backdrop-blur-sm border border-white/10',
                        'hover:bg-[#d4af37] hover:border-[#d4af37]',
                        'transition-all duration-500 transform hover:scale-105 hover:-translate-y-1',
                        'overflow-hidden'
                      )}
                      style={{
                        transitionDelay: `${300 + index * 100}ms`,
                        opacity: heroVisible ? 1 : 0,
                        transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
                      }}
                    >
                      <div className="absolute inset-0 bg-[#d4af37] opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                      <Icon className="w-5 h-5 relative z-10 text-white group-hover:text-white transition-colors duration-300" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Image Side */}
          <div
            ref={imageRef}
            className={cn(
              'lg:col-span-5 flex justify-center',
              'transition-all duration-1000 delay-300 transform',
              imageVisible ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-12 scale-95'
            )}
          >
            <div className="relative">
              {/* Outer Glow */}
              <div className="absolute -inset-4 bg-gradient-to-br from-[#d4af37]/20 via-[#035d44]/15 to-[#d4af37]/20 rounded-[2.5rem] blur-xl" />
              
              {/* Decorative Frame */}
              <div className="absolute -inset-2 border border-[#d4af37]/20 rounded-[2rem]" />
              
              {/* Main Image Container */}
              <div className="relative w-72 h-80 md:w-80 md:h-[450px] rounded-[2rem] overflow-hidden shadow-2xl shadow-[#035d44]/30">
                <Image
                  src={imagePath || '/placeholder.svg'}
                  alt={sheikhName}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  priority
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a2018]/80 via-transparent to-transparent" />
                
                {/* Bottom Info */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0a2018] to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#d4af37] flex items-center justify-center">
                      <Award className="w-5 h-5 text-[#0a2018]" />
                    </div>
                    <div>
                      <p className="text-white font-['Cairo'] font-semibold text-sm">{position}</p>
                      <p className="text-[#d4af37] text-xs">{location}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-[#d4af37] to-[#b8941f] rounded-full flex items-center justify-center shadow-xl animate-bounce-slow">
                <Award className="w-8 h-8 text-[#0a2018]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" className="w-full h-auto block" preserveAspectRatio="none">
          <defs>
            <linearGradient id="hero-wave" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0a2018" />
              <stop offset="50%" stopColor="#0d2d22" />
              <stop offset="100%" stopColor="#1a4d3e" />
            </linearGradient>
          </defs>
          <path fill="url(#hero-wave)" d="M0,30 C200,60 400,0 600,30 C800,60 1000,20 1200,30 C1333,37 1400,30 1440,30 L1440,60 L0,60 Z" />
        </svg>
      </div>
    </section>
  );
}