"use client";

import { cn } from '@/lib/utils';

// Этап 9: Enhanced shimmer effect для skeleton
const shimmerClass = cn(
    "relative overflow-hidden",
    "before:absolute before:inset-0 before:-translate-x-full",
    "before:animate-[shimmer_1.5s_infinite]",
    "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent"
);

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
            <div className={cn("w-10 h-10 rounded-full bg-[var(--bg-tertiary)]", shimmerClass)} />
            <div className="flex-1 space-y-1.5">
                <div className={cn("h-4 w-24 bg-[var(--bg-tertiary)] rounded", shimmerClass)} />
                <div className={cn("h-3 w-16 bg-[var(--bg-tertiary)] rounded", shimmerClass)} />
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
                    <div className={cn("w-10 h-10 rounded-lg bg-[var(--bg-tertiary)]", shimmerClass)} />
                    <div className={cn("flex-1 h-10 rounded-2xl bg-[var(--bg-tertiary)]", shimmerClass)} />
                    <div className={cn("w-10 h-10 rounded-full bg-[var(--bg-tertiary)]", shimmerClass)} />
                </div>
            </div>
        </div>
    );
}

// Этап 9: Skeleton для списка чатов в sidebar
export function ChatRoomListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="flex flex-col gap-2 p-2">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                    <div className={cn("w-12 h-12 rounded-full bg-[var(--bg-tertiary)]", shimmerClass)} />
                    <div className="flex-1 space-y-2">
                        <div className={cn("h-4 w-3/5 bg-[var(--bg-tertiary)] rounded", shimmerClass)} />
                        <div className={cn("h-3 w-4/5 bg-[var(--bg-tertiary)] rounded", shimmerClass)} />
                    </div>
                    <div className={cn("h-3 w-10 bg-[var(--bg-tertiary)] rounded", shimmerClass)} />
                </div>
            ))}
        </div>
    );
}

// Этап 9: Skeleton для участников
export function ParticipantsSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="flex flex-col gap-1 p-2">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                    <div className={cn("w-9 h-9 rounded-full bg-[var(--bg-tertiary)]", shimmerClass)} />
                    <div className="flex-1 space-y-1.5">
                        <div className={cn("h-3.5 w-24 bg-[var(--bg-tertiary)] rounded", shimmerClass)} />
                        <div className={cn("h-2.5 w-16 bg-[var(--bg-tertiary)] rounded", shimmerClass)} />
                    </div>
                    <div className={cn("w-2 h-2 rounded-full bg-[var(--bg-tertiary)]", shimmerClass)} />
                </div>
            ))}
        </div>
    );
}

// Этап 9: Skeleton для игровых карточек
export function GameCardSkeleton() {
    return (
        <div className="bg-[var(--bg-tertiary)] rounded-2xl p-4 space-y-3">
            <div className={cn("w-14 h-14 rounded-xl bg-[var(--bg-hover)]", shimmerClass)} />
            <div className={cn("h-4 w-3/4 bg-[var(--bg-hover)] rounded", shimmerClass)} />
            <div className={cn("h-3 w-full bg-[var(--bg-hover)] rounded", shimmerClass)} />
            <div className={cn("h-3 w-1/2 bg-[var(--bg-hover)] rounded", shimmerClass)} />
        </div>
    );
}

// Этап 9: Skeleton для сетки игр
export function GamesGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {Array.from({ length: count }).map((_, i) => (
                <GameCardSkeleton key={i} />
            ))}
        </div>
    );
}

// Этап 9: Skeleton для медиа галереи
export function MediaGallerySkeleton({ count = 9 }: { count?: number }) {
    return (
        <div className="grid grid-cols-3 gap-1 p-2">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className={cn("aspect-square rounded-lg bg-[var(--bg-tertiary)]", shimmerClass)} />
            ))}
        </div>
    );
}

// Этап 9: Skeleton для профиля
export function ProfileSkeleton() {
    return (
        <div className="flex flex-col items-center gap-4 p-6">
            <div className={cn("w-20 h-20 rounded-full bg-[var(--bg-tertiary)]", shimmerClass)} />
            <div className="space-y-2 text-center w-full">
                <div className={cn("h-5 w-32 mx-auto bg-[var(--bg-tertiary)] rounded", shimmerClass)} />
                <div className={cn("h-3 w-48 mx-auto bg-[var(--bg-tertiary)] rounded", shimmerClass)} />
            </div>
            <div className="w-full space-y-3 mt-4">
                <div className={cn("h-12 w-full bg-[var(--bg-tertiary)] rounded-xl", shimmerClass)} />
                <div className={cn("h-12 w-full bg-[var(--bg-tertiary)] rounded-xl", shimmerClass)} />
                <div className={cn("h-12 w-full bg-[var(--bg-tertiary)] rounded-xl", shimmerClass)} />
            </div>
        </div>
    );
}
