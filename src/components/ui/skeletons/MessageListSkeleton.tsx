/**
 * MessageListSkeleton - Skeleton для списка сообщений
 * P2: Улучшенные skeleton screens
 */

'use client';

import { cn } from '@/lib/utils';

interface MessageSkeletonProps {
  isOwn?: boolean;
  showAvatar?: boolean;
  className?: string;
}

function MessageItemSkeleton({ isOwn = false, showAvatar = true, className }: MessageSkeletonProps) {
  return (
    <div
      className={cn(
        'flex gap-3 px-4 py-2',
        isOwn ? 'flex-row-reverse' : 'flex-row',
        className
      )}
    >
      {showAvatar && (
        <div className="w-9 h-9 rounded-full bg-bg-tertiary skeleton-wave flex-shrink-0" />
      )}
      <div className={cn('flex flex-col gap-1.5', isOwn ? 'items-end' : 'items-start')}>
        {!isOwn && (
          <div className="h-3 w-20 bg-bg-tertiary rounded skeleton-wave" />
        )}
        <div
          className={cn(
            'rounded-2xl p-3 space-y-2',
            isOwn
              ? 'bg-accent-primary/10 rounded-br-sm'
              : 'bg-bg-tertiary rounded-bl-sm'
          )}
        >
          <div className="h-4 w-48 bg-bg-hover rounded skeleton-wave" />
          <div className="h-4 w-32 bg-bg-hover rounded skeleton-wave" />
        </div>
        <div className="h-2.5 w-12 bg-bg-tertiary rounded skeleton-wave" />
      </div>
    </div>
  );
}

interface MessageListSkeletonProps {
  count?: number;
  className?: string;
}

export function MessageListSkeleton({ count = 8, className }: MessageListSkeletonProps) {
  // Создаём паттерн сообщений: чередуем свои и чужие
  const pattern = [false, false, true, false, true, true, false, false];

  return (
    <div className={cn('flex flex-col py-4 space-y-1', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <MessageItemSkeleton
          key={i}
          isOwn={pattern[i % pattern.length]}
          showAvatar={i === 0 || pattern[i % pattern.length] !== pattern[(i - 1) % pattern.length]}
        />
      ))}
    </div>
  );
}

export { MessageItemSkeleton };
