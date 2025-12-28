/**
 * NavigationSkeleton - Skeleton для навигации
 * P2: Улучшенные skeleton screens
 */

'use client';

import { cn } from '@/lib/utils';

interface NavigationSkeletonProps {
  variant?: 'bottom' | 'sidebar' | 'header';
  className?: string;
}

export function NavigationSkeleton({ variant = 'bottom', className }: NavigationSkeletonProps) {
  if (variant === 'header') {
    return (
      <div className={cn(
        'flex items-center justify-between px-4 h-14 bg-bg-secondary border-b border-border-primary',
        className
      )}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-bg-tertiary skeleton-wave" />
          <div className="h-5 w-32 bg-bg-tertiary rounded skeleton-wave" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-bg-tertiary skeleton-wave" />
          <div className="w-9 h-9 rounded-lg bg-bg-tertiary skeleton-wave" />
        </div>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={cn(
        'flex flex-col w-[72px] h-full bg-bg-secondary border-r border-border-primary py-4',
        className
      )}>
        {/* Logo */}
        <div className="w-10 h-10 mx-auto rounded-xl bg-bg-tertiary skeleton-wave mb-6" />

        {/* Nav items */}
        <div className="flex flex-col items-center gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-10 h-10 rounded-xl bg-bg-tertiary skeleton-wave" />
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-auto flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-bg-tertiary skeleton-wave" />
          <div className="w-8 h-8 rounded-full bg-bg-tertiary skeleton-wave" />
        </div>
      </div>
    );
  }

  // Bottom navigation
  return (
    <div className={cn(
      'flex items-center justify-around h-14 bg-bg-secondary border-t border-border-primary',
      className
    )}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div className="w-6 h-6 rounded bg-bg-tertiary skeleton-wave" />
          <div className="w-8 h-2 rounded bg-bg-tertiary skeleton-wave" />
        </div>
      ))}
    </div>
  );
}
