"use client";

import { cn } from '@/lib/utils';

// P0 FIX: Shimmer effect для skeleton
const shimmerClass = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent";

// Skeleton для сообщений чата
export function MessageSkeleton({ isOwn = false }: { isOwn?: boolean }) {
    return (
        <div className={cn(
            "flex gap-3 px-4 py-2",
            isOwn ? "flex-row-reverse" : "flex-row"
        )}>
            {/* Avatar */}
            <div className={cn(
                "w-9 h-9 rounded-full bg-[var(--bg-tertiary)] shrink-0",
                shimmerClass
            )} />

            {/* Content */}
            <div className={cn(
                "flex flex-col gap-1 max-w-[70%]",
                isOwn ? "items-end" : "items-start"
            )}>
                {!isOwn && (
                    <div className={cn("h-3 w-20 bg-[var(--bg-tertiary)] rounded", shimmerClass)} />
                )}
                <div className={cn(
                    "rounded-2xl px-4 py-3 space-y-2",
                    isOwn
                        ? "bg-[var(--accent-primary)]/20 rounded-br-md"
                        : "bg-[var(--bg-secondary)] rounded-bl-md"
                )}>
                    <div className={cn("h-3 w-36 bg-[var(--bg-tertiary)] rounded", shimmerClass)} />
                    <div className={cn("h-3 w-24 bg-[var(--bg-tertiary)] rounded", shimmerClass)} />
                </div>
            </div>
        </div>
    );
}

// Skeleton для списка сообщений
export function ChatListSkeleton() {
    return (
        <div className="flex-1 overflow-hidden p-2">
            <MessageSkeleton />
            <MessageSkeleton isOwn />
            <MessageSkeleton />
            <MessageSkeleton />
            <MessageSkeleton isOwn />
            <MessageSkeleton />
        </div>
    );
}

// Skeleton для header чата
export function ChatHeaderSkeleton() {
    return (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
            <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] animate-pulse" />
            <div className="flex-1 space-y-1.5">
                <div className="h-4 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse" />
                <div className="h-3 w-16 bg-[var(--bg-tertiary)] rounded animate-pulse" />
            </div>
        </div>
    );
}

// Полный skeleton для чата
export function ChatSkeleton() {
    return (
        <div className="flex flex-col h-full bg-[var(--bg-primary)]">
            <ChatHeaderSkeleton />
            <ChatListSkeleton />
            {/* Input skeleton */}
            <div className="p-3 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] animate-pulse" />
                    <div className="flex-1 h-10 rounded-2xl bg-[var(--bg-tertiary)] animate-pulse" />
                    <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] animate-pulse" />
                </div>
            </div>
        </div>
    );
}
