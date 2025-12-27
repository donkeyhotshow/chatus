"use client";

import { cn } from '@/lib/utils';

interface MessageSkeletonProps {
    count?: number;
    className?: string;
}

/**
 * MessageSkeleton - Skeleton для загрузки сообщений
 * Этап 4: Loading states
 */
export function MessageSkeleton({ count = 5, className }: MessageSkeletonProps) {
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
                            "flex gap-2.5 max-w-[75%] animate-pulse",
                            isOwn ? "ml-auto flex-row-reverse" : ""
                        )}
                        style={{ animationDelay: `${i * 100}ms` }}
                    >
                        {/* Avatar skeleton */}
                        <div className="w-9 h-9 rounded-xl bg-white/[0.06] shrink-0" />

                        <div className={cn("flex flex-col gap-1.5", isOwn ? "items-end" : "items-start")}>
                            {/* Name & time skeleton */}
                            <div className="flex items-center gap-2 px-1">
                                <div className="h-3 w-16 rounded bg-white/[0.06]" />
                                <div className="h-2.5 w-10 rounded bg-white/[0.04]" />
                            </div>

                            {/* Message bubble skeleton */}
                            <div className={cn(
                                "rounded-2xl p-4",
                                isOwn
                                    ? "bg-violet-600/20 rounded-tr-md"
                                    : "bg-white/[0.04] rounded-tl-md"
                            )}>
                                {hasImage && (
                                    <div className="w-48 h-32 rounded-lg bg-white/[0.06] mb-2" />
                                )}
                                <div className="flex flex-col gap-1.5">
                                    {Array.from({ length: textLines }).map((_, j) => (
                                        <div
                                            key={j}
                                            className="h-3.5 rounded bg-white/[0.06]"
                                            style={{ width: `${Math.random() * 100 + 80}px` }}
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
 * Этап 4: Loading states
 */
export function ChatListSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="flex flex-col">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-3 p-3 animate-pulse"
                    style={{ animationDelay: `${i * 50}ms` }}
                >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-white/[0.06] shrink-0" />

                    <div className="flex-1 min-w-0">
                        {/* Name */}
                        <div className="h-4 w-24 rounded bg-white/[0.08] mb-2" />
                        {/* Last message */}
                        <div className="h-3 w-32 rounded bg-white/[0.04]" />
                    </div>

                    {/* Time & badge */}
                    <div className="flex flex-col items-end gap-1.5">
                        <div className="h-2.5 w-10 rounded bg-white/[0.04]" />
                        {i % 3 === 0 && (
                            <div className="w-5 h-5 rounded-full bg-violet-600/30" />
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * InputSkeleton - Skeleton для поля ввода
 */
export function InputSkeleton() {
    return (
        <div className="p-3 border-t border-white/[0.06] animate-pulse">
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04]" />
                <div className="flex-1 h-12 rounded-xl bg-white/[0.04]" />
                <div className="w-10 h-10 rounded-xl bg-white/[0.04]" />
            </div>
        </div>
    );
}
