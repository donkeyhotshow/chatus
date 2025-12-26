"use client";

// cn removed - not currently used in this file

/**
 * Skeleton для страницы игр
 * P2 Fix: Добавление skeleton-загрузчиков
 */

// Skeleton для карточки игры
export function GameCardSkeleton() {
    return (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 space-y-3">
            {/* Icon */}
            <div className="w-12 h-12 rounded-lg skeleton" />

            {/* Title */}
            <div className="h-5 w-3/4 skeleton rounded" />

            {/* Description */}
            <div className="space-y-1.5">
                <div className="h-3 w-full skeleton rounded" />
                <div className="h-3 w-2/3 skeleton rounded" />
            </div>

            {/* Button */}
            <div className="h-10 w-full skeleton rounded-lg mt-4" />
        </div>
    );
}

// Skeleton для списка игр
export function GamesListSkeleton() {
    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="h-7 w-32 skeleton rounded" />
                <div className="h-9 w-24 skeleton rounded-lg" />
            </div>

            {/* Games grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <GameCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}

// Skeleton для TicTacToe
export function TicTacToeSkeleton() {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6 w-full max-w-sm">
                {/* Header */}
                <div className="text-center space-y-2 mb-6">
                    <div className="h-7 w-48 mx-auto skeleton rounded" />
                    <div className="h-4 w-32 mx-auto skeleton rounded" />
                </div>

                {/* Game board */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-[var(--bg-tertiary)] rounded-xl">
                    {[...Array(9)].map((_, i) => (
                        <div
                            key={i}
                            className="h-20 w-20 skeleton rounded-xl"
                        />
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-6 space-y-2">
                    <div className="h-10 w-full skeleton rounded-lg" />
                </div>
            </div>
        </div>
    );
}

// Полный skeleton для страницы игр
export function GamesSkeleton() {
    return (
        <div className="flex flex-col h-full bg-[var(--bg-primary)]">
            <GamesListSkeleton />
        </div>
    );
}
