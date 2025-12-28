/**
 * ProfileSkeleton - Skeleton для профиля пользователя
 * P2: Улучшенные skeleton screens
 */

'use client';

import { cn } from '@/lib/utils';

interface ProfileSkeletonProps {
  variant?: 'full' | 'compact' | 'card';
  className?: string;
}

export function ProfileSkeleton({ variant = 'full', className }: ProfileSkeletonProps) {
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="w-10 h-10 rounded-full bg-bg-tertiary skeleton-wave" />
        <div className="space-y-1.5">
          <div className="h-4 w-24 bg-bg-tertiary rounded skeleton-wave" />
          <div className="h-3 w-16 bg-bg-tertiary rounded skeleton-wave" />
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn('p-4 rounded-xl bg-bg-secondary border border-border-primary', className)}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-bg-tertiary skeleton-wave" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-32 bg-bg-tertiary rounded skeleton-wave" />
            <div className="h-3.5 w-24 bg-bg-tertiary rounded skeleton-wave" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3.5 w-full bg-bg-tertiary rounded skeleton-wave" />
          <div className="h-3.5 w-3/4 bg-bg-tertiary rounded skeleton-wave" />
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className={cn('flex flex-col items-center p-6', className)}>
      {/* Avatar */}
      <div className="w-24 h-24 rounded-full bg-bg-tertiary skeleton-wave mb-4" />

      {/* Name */}
      <div className="h-6 w-40 bg-bg-tertiary rounded skeleton-wave mb-2" />

      {/* Status */}
      <div className="h-4 w-24 bg-bg-tertiary rounded skeleton-wave mb-6" />

      {/* Stats */}
      <div className="flex gap-8 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="h-5 w-8 bg-bg-tertiary rounded skeleton-wave" />
            <div className="h-3 w-12 bg-bg-tertiary rounded skeleton-wave" />
          </div>
        ))}
      </div>

      {/* Bio */}
      <div className="w-full max-w-sm space-y-2">
        <div className="h-4 w-full bg-bg-tertiary rounded skeleton-wave" />
        <div className="h-4 w-4/5 bg-bg-tertiary rounded skeleton-wave" />
        <div className="h-4 w-2/3 bg-bg-tertiary rounded skeleton-wave" />
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <div className="h-10 w-28 bg-bg-tertiary rounded-lg skeleton-wave" />
        <div className="h-10 w-28 bg-bg-tertiary rounded-lg skeleton-wave" />
      </div>
    </div>
  );
}
