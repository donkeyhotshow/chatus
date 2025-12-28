"use client";

import { cn } from '@/lib/utils';

interface MessageSkeletonProps {
    count?: number;
    className?: string;
}

/**
 * MessageSkeleton - Skeleton для загрузки сообщений
 * Этап 4 + Этап 9: Enhanced shimmer loading states
 */
export function MessageSkeleton({ count = 5, className }: MessageSkeletonProps) {
    // Pre-generate widths to avoid hydration mismatch
    const widths = [140, 180, 120, 160, 100, 200, 150, 130, 170, 110];

    return (
        <div className={cn("flex flex-col gap-4 p-4", className)}>
            {Array.from({ length: count }).map((_, i) => {
                const isOwn = i % 3 === 0;
                const hasImage = i % 4 === 0;
                const textLines = (i % 3) + 1;

                return (
                    <div
                        key={i}
                        className={cn(
                            "flex gap-2.5 max-w-[75%]",
                            isOwn ? "ml-auto flex-row-reverse" : ""
                        )}
                        style={{ animationDelay: `${i * 100}ms` }}
                    >
                        {/* Avatar skeleton with shimmer */}
                        <div className="w-9 h-9 rounded-xl skeleton-shimmer shrink-0" />

                        <div className={cn("flex flex-col gap-1.5", isOwn ? "items-end" : "items-start")}>
                            {/* Name & time skeleton */}
                            <div className="flex items-center gap-2 px-1">
                                <div className="h-3 w-16 rounded skeleton-shimmer" />
                                <div className="h-2.5 w-10 rounded skeleton-shimmer" />
                            </div>

                            {/* Message bubble skeleton */}
                            <div className={cn(
                                "rounded-2xl p-4",
                                isOwn
                                    ? "bg-violet-600/20 rounded-tr-md"
                                    : "bg-white/[0.04] rounded-tl-md"
                            )}>
                                {hasImage && (
                                    <div className="w-48 h-32 rounded-lg skeleton-shimmer mb-2" />
                                )}
                                <div className="flex flex-col gap-1.5">
                                    {Array.from({ length: textLines }).map((_, j) => (
                                        <div
                                            key={j}
                                            className="h-3.5 rounded skeleton-shimmer"
                                            style={{ width: `${widths[(i * 3 + j) % widths.length]}px` }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/**
 * ChatListSkeleton - Skeleton для списка чатов
 * Этап 4 + Этап 9: Enhanced shimmer loading states
 */
export function ChatListSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="flex flex-col">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-3 p-3"
                    style={{ animationDelay: `${i * 50}ms` }}
                >
                    {/* Avatar with shimmer */}
                    <div className="w-12 h-12 rounded-xl skeleton-shimmer shrink-0" />

                    <div className="flex-1 min-w-0">
                        {/* Name */}
                        <div className="h-4 w-24 rounded skeleton-shimmer mb-2" />
                        {/* Last message */}
                        <div className="h-3 w-32 rounded skeleton-shimmer" />
                    </div>

                    {/* Time & badge */}
                    <div className="flex flex-col items-end gap-1.5">
                        <div className="h-2.5 w-10 rounded skeleton-shimmer" />
                        {i % 3 === 0 && (
                            <div className="w-5 h-5 rounded-full skeleton-shimmer" />
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * InputSkeleton - Skeleton для поля ввода
 * Этап 9: Enhanced shimmer
 */
export function InputSkeleton() {
    return (
        <div className="p-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl skeleton-shimmer" />
                <div className="flex-1 h-12 rounded-xl skeleton-shimmer" />
                <div className="w-10 h-10 rounded-xl skeleton-shimmer" />
            </div>
        </div>
    );
}

/**
 * GameCardSkeleton - Skeleton для карточки игры
 * Этап 9: New skeleton component
 */
export function GameCardSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="games-grid">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="skeleton-shimmer min-h-[160px] rounded-2xl"
                    style={{ animationDelay: `${i * 100}ms` }}
                />
            ))}
        </div>
    );
}

/**
 * ProfileSkeleton - Skeleton для профиля пользователя
 * Этап 9: New skeleton component
 */
export function ProfileSkeleton() {
    return (
        <div className="flex flex-col items-center gap-4 p-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full skeleton-shimmer" />
            {/* Name */}
            <div className="h-6 w-32 rounded skeleton-shimmer" />
            {/* Status */}
            <div className="h-4 w-24 rounded skeleton-shimmer" />
            {/* Stats */}
            <div className="flex gap-8 mt-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                        <div className="h-6 w-12 rounded skeleton-shimmer" />
                        <div className="h-3 w-16 rounded skeleton-shimmer" />
                    </div>
                ))}
            </div>
        </div>
    );
}
