"use client";

import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Skeleton - Loading placeholder component
 */
export function Skeleton({
    className,
    variant = 'text',
    width,
    height,
    animation = 'wave',
}: SkeletonProps) {
    const variantClasses = {
        text: 'rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-none',
        rounded: 'rounded-xl',
    };

    const animationClasses = {
        pulse: 'animate-pulse',
        wave: 'skeleton-wave',
        none: '',
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
                width: width,
                height: height || (variant === 'text' ? '1em' : undefined),
            }}
        />
    );
}

/**
 * MessageSkeleton - Skeleton for chat messages
 */
export function MessageSkeleton({ isOwn = false }: { isOwn?: boolean }) {
    return (
        <div className={cn('flex gap-3 p-3', isOwn && 'flex-row-reverse')}>
            <Skeleton variant="circular" width={40} height={40} />
            <div className={cn('flex flex-col gap-2', isOwn && 'items-end')}>
                <Skeleton width={80} height={14} />
                <Skeleton
                    variant="rounded"
                    width={Math.random() * 100 + 150}
                    height={Math.random() * 20 + 40}
                />
                <Skeleton width={50} height={12} />
            </div>
        </div>
    );
}

/**
 * ChatListSkeleton - Skeleton for chat list
 */
export function ChatListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="flex flex-col">
            {Array.from({ length: count }).map((_, i) => (
                <MessageSkeleton key={i} isOwn={i % 3 === 0} />
            ))}
        </div>
    );
}

/**
 * UserListSkeleton - Skeleton for user/room list
 */
export function UserListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="flex flex-col gap-2 p-2">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                    <Skeleton variant="circular" width={48} height={48} />
                    <div className="flex-1 flex flex-col gap-2">
                        <Skeleton width="60%" height={16} />
                        <Skeleton width="40%" height={12} />
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * GameCardSkeleton - Skeleton for game cards
 */
export function GameCardSkeleton() {
    return (
        <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
            <Skeleton variant="rounded" width="100%" height={120} className="mb-4" />
            <Skeleton widtheight={20} className="mb-2" />
            <Skeleton width="50%" height={14} />
        </div>
    );
}

/**
 * ProfileSkeleton - Skeleton for profile view
 */
export function ProfileSkeleton() {
    return (
        <div className="flex flex-col items-center gap-4 p-6">
            <Skeleton variant="circular" width={96} height={96} />
            <Skeleton width={150} height={24} />
            <Skeleton width={200} height={16} />
            <div className="w-full flex gap-4 mt-4">
                <Skeleton variant="rounded" width="100%" height={44} />
                <Skeleton variant="rounded" width="100%" height={44} />
            </div>
        </div>
    );
}
