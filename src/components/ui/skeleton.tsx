"use client";

import { memo } from 'react';
import { cn } from '@/lib/utils';

// Enhanced shimmer animation class
const shimmerClass = cn(
  "relative overflow-hidden",
  "before:absolute before:inset-0 before:-translate-x-full",
  "before:animate-[shimmer_1.5s_infinite]",
  "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent"
);

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'rounded' | 'text';
  width?: string | number;
  height?: string | number;
  animation?: 'shimmer' | 'pulse' | 'wave';
  style?: React.CSSProperties;
}

export const Skeleton = memo(function Skeleton({
  className,
  variant = 'default',
  width,
  height,
  animation = 'shimmer',
  style,
}: SkeletonProps) {
  const variantClasses = {
    default: 'rounded-md',
    circular: 'rounded-full',
    rounded: 'rounded-xl',
    text: 'rounded h-4',
  };

  const animationClasses = {
    shimmer: shimmerClass,
    pulse: 'animate-pulse',
    wave: 'skeleton-wave',
  };

  return (
    <div
      className={cn(
        'bg-[var(--bg-tertiary)]',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
      role="status"
      aria-label="Загрузка..."
    />
  );
});

// Skeleton для списка элементов
export const SkeletonList = memo(function SkeletonList({
  count = 5,
  itemClassName,
  gap = 12,
}: {
  count?: number;
  itemClassName?: string;
  gap?: number;
}) {
  return (
    <div className="flex flex-col" style={{ gap: `${gap}px` }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn('h-16 w-full', itemClassName)} />
      ))}
    </div>
  );
});

// Skeleton для карточки чата в списке
export const ChatListItemSkeleton = memo(function ChatListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" height={14} />
        <Skeleton variant="text" width="80%" height={12} />
      </div>
      <Skeleton variant="text" width={40} height={10} />
    </div>
  );
});

// Skeleton для списка чатов
export const ChatListSkeleton = memo(function ChatListSkeleton({
  count = 6,
}: {
  count?: number;
}) {
  return (
    <div className="flex flex-col gap-2 p-2">
      {Array.from({ length: count }).map((_, i) => (
        <ChatListItemSkeleton key={i} />
      ))}
    </div>
  );
});

// Skeleton для участника
export const ParticipantSkeleton = memo(function ParticipantSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2">
      <Skeleton variant="circular" width={36} height={36} />
      <div className="flex-1 space-y-1.5">
        <Skeleton variant="text" width="50%" height={12} />
        <Skeleton variant="text" width="30%" height={10} />
      </div>
    </div>
  );
});

// Skeleton для списка участников
export const ParticipantListSkeleton = memo(function ParticipantListSkeleton({
  count = 4,
}: {
  count?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <ParticipantSkeleton key={i} />
      ))}
    </div>
  );
});

// Skeleton для игровой карточки
export const GameCardSkeleton = memo(function GameCardSkeleton() {
  return (
    <div className="bg-[var(--bg-tertiary)] rounded-2xl p-4 space-y-3">
      <Skeleton variant="rounded" width={56} height={56} />
      <Skeleton variant="text" width="70%" height={16} />
      <Skeleton variant="text" width="90%" height={12} />
      <Skeleton variant="text" width="40%" height={10} />
    </div>
  );
});

// Skeleton для сетки игр
export const GamesGridSkeleton = memo(function GamesGridSkeleton({
  count = 6,
}: {
  count?: number;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <GameCardSkeleton key={i} />
      ))}
    </div>
  );
});

// Skeleton для медиа галереи
export const MediaGridSkeleton = memo(function MediaGridSkeleton({
  count = 9,
}: {
  count?: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-square" variant="rounded" />
      ))}
    </div>
  );
});

// Skeleton для профиля
export const ProfileSkeleton = memo(function ProfileSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <Skeleton variant="circular" width={80} height={80} />
      <div className="space-y-2 text-center w-full">
        <Skeleton variant="text" width="50%" height={20} className="mx-auto" />
        <Skeleton variant="text" width="70%" height={14} className="mx-auto" />
      </div>
      <div className="w-full space-y-3 mt-4">
        <Skeleton variant="rounded" height={48} />
        <Skeleton variant="rounded" height={48} />
        <Skeleton variant="rounded" height={48} />
      </div>
    </div>
  );
});

export default Skeleton;
