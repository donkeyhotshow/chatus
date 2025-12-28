/**
 * RoomListSkeleton - Skeleton для списка комнат/чатов
 * P2: Улучшенные skeleton screens
 */

'use client';

import { cn } from '@/lib/utils';

interface RoomItemSkeletonProps {
  className?: string;
}

function RoomItemSkeleton({ className }: RoomItemSkeletonProps) {
  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-xl', className)}>
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-bg-tertiary skeleton-wave flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="h-4 w-28 bg-bg-tertiary rounded skeleton-wave" />
          <div className="h-3 w-10 bg-bg-tertiary rounded skeleton-wave" />
        </div>
        <div className="h-3.5 w-full max-w-[200px] bg-bg-tertiary rounded skeleton-wave" />
      </div>
    </div>
  );
}

interface RoomListSkeletonProps {
  count?: number;
  className?: string;
}

export function RoomListSkeleton({ count = 6, className }: RoomListSkeletonProps) {
  return (
    <div className={cn('flex flex-col gap-1 p-2', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <RoomItemSkeleton key={i} />
      ))}
    </div>
  );
}

export { RoomItemSkeleton };
