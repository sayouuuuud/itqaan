'use client';

import { ReactNode, Children, cloneElement, isValidElement } from 'react';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { cn } from '@/lib/utils';

export type AnimationType = 'fade' | 'slide' | 'scale' | 'slide-fade';
export type SlideDirection = 'up' | 'down' | 'left' | 'right';

interface ScrollAnimationProps {
  children: ReactNode;
  animation?: AnimationType;
  direction?: SlideDirection;
  delay?: number;
  duration?: number;
  className?: string;
  threshold?: number;
  once?: boolean;
}

export function ScrollAnimation({
  children,
  animation = 'fade',
  direction = 'up',
  delay = 0,
  duration = 600,
  className,
  threshold = 0.1,
  once = true,
}: ScrollAnimationProps) {
  const { ref, isVisible } = useIntersectionObserver({
    threshold,
    freezeOnceVisible: once,
  });

  const getInitialState = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return 'opacity-100 translate-x-0 translate-y-0 scale-100';
    }

    switch (animation) {
      case 'fade':
        return 'opacity-0';
      case 'scale':
        return 'opacity-0 scale-95';
      case 'slide':
        return getSlideClasses(direction, false);
      case 'slide-fade':
        return `opacity-0 ${getSlideClasses(direction, false)}`;
      default:
        return 'opacity-0';
    }
  };

  const getAnimatedState = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return 'opacity-100 translate-x-0 translate-y-0 scale-100';
    }

    switch (animation) {
      case 'fade':
        return 'opacity-100';
      case 'scale':
        return 'opacity-100 scale-100';
      case 'slide':
        return `${getSlideClasses(direction, true)}`;
      case 'slide-fade':
        return `opacity-100 ${getSlideClasses(direction, true)}`;
      default:
        return 'opacity-100';
    }
  };

  const getSlideClasses = (dir: SlideDirection, visible: boolean) => {
    if (visible) {
      return 'translate-x-0 translate-y-0';
    }

    switch (dir) {
      case 'up':
        return 'translate-y-8';
      case 'down':
        return '-translate-y-8';
      case 'left':
        return 'translate-x-8';
      case 'right':
        return '-translate-x-8';
      default:
        return 'translate-y-8';
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all',
        isVisible ? getAnimatedState() : getInitialState(),
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {children}
    </div>
  );
}

interface StaggerAnimationProps {
  children: ReactNode;
  animation?: AnimationType;
  direction?: SlideDirection;
  staggerDelay?: number;
  duration?: number;
  className?: string;
  childClassName?: string;
  threshold?: number;
  once?: boolean;
}

export function StaggerAnimation({
  children,
  animation = 'fade',
  direction = 'up',
  staggerDelay = 100,
  duration = 600,
  className,
  childClassName,
  threshold = 0.1,
  once = true,
}: StaggerAnimationProps) {
  const childArray = Children.toArray(children);

  return (
    <div className={className}>
      {childArray.map((child, index) => (
        <ScrollAnimation
          key={index}
          animation={animation}
          direction={direction}
          delay={index * staggerDelay}
          duration={duration}
          threshold={threshold}
          once={once}
          className={childClassName}
        >
          {child}
        </ScrollAnimation>
      ))}
    </div>
  );
}

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  threshold?: number;
  once?: boolean;
}

export function FadeIn({ children, delay, duration, className, threshold, once }: FadeInProps) {
  return (
    <ScrollAnimation
      animation="fade"
      delay={delay}
      duration={duration}
      className={className}
      threshold={threshold}
      once={once}
    >
      {children}
    </ScrollAnimation>
  );
}

interface SlideInProps {
  children: ReactNode;
  direction?: SlideDirection;
  delay?: number;
  duration?: number;
  className?: string;
  threshold?: number;
  once?: boolean;
  fade?: boolean;
}

export function SlideIn({
  children,
  direction = 'up',
  delay,
  duration,
  className,
  threshold,
  once,
  fade = false,
}: SlideInProps) {
  return (
    <ScrollAnimation
      animation={fade ? 'slide-fade' : 'slide'}
      direction={direction}
      delay={delay}
      duration={duration}
      className={className}
      threshold={threshold}
      once={once}
    >
      {children}
    </ScrollAnimation>
  );
}

interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  threshold?: number;
  once?: boolean;
}

export function ScaleIn({ children, delay, duration, className, threshold, once }: ScaleInProps) {
  return (
    <ScrollAnimation
      animation="scale"
      delay={delay}
      duration={duration}
      className={className}
      threshold={threshold}
      once={once}
    >
      {children}
    </ScrollAnimation>
  );
}

interface RevealProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function Reveal({ children, delay = 0, duration = 800, className }: RevealProps) {
  const { ref, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible: true,
  });

  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all',
        !prefersReducedMotion && !isVisible && 'opacity-0 translate-y-8 blur-sm',
        !prefersReducedMotion && isVisible && 'opacity-100 translate-y-0 blur-0',
        prefersReducedMotion && 'opacity-100 translate-y-0 blur-0',
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {children}
    </div>
  );
}
