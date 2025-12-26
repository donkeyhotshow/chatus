"use client";

/**
 * Skeleton для страницы холста
 * P2 Fix: Добавление skeleton-загрузчиков
 */

// Skeleton для панели инструментов
export function ToolbarSkeleton() {
    return (
        <div className="fixed bottom-24 right-4 z-30 flex flex-col items-end gap-3">
            <div className="w-14 h-14 skeleton rounded-full" />
        </div>
    );
}

// Skeleton для холста
export function CanvasAreaSkeleton() {
    return (
        <div className="flex-1 relative bg-[var(--bg-primary)]">
            {/* Canvas area */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto skeleton rounded-xl" />
                    <div className="h-4 w-40 mx-auto skeleton rounded" />
                    <div className="h-3 w-32 mx-auto skeleton rounded" />
                </div>
            </div>

            {/* Grid pattern overlay */}
            <div
                className="absolute inset-0 opacity-5"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px'
                }}
            />
        </div>
    );
}

// Полный skeleton для страницы холста
export function CanvasSkeleton() {
    return (
        <div className="flex flex-col h-full bg-[var(--bg-primary)] relative">
            <CanvasAreaSkeleton />
            <ToolbarSkeleton />
        </div>
    );
}
