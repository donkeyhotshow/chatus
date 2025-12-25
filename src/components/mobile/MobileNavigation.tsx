"use client";

import { memo } from 'react';
import { MessageCircle, Gamepad2, PenTool } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MobileTab = 'chat' | 'games' | 'canvas' | 'users' | 'more' | 'stats';

interface MobileNavigationProps {
    activeTab: MobileTab;
    onTabChange: (tab: MobileTab) => void;
    isCollabSpaceVisible?: boolean;
    onToggleCollabSpace?: () => void;
    unreadCount?: number;
    className?: string;
}

// Упрощенная навигация - фокус на чате з функціональними кольорами
const tabs = [
    { id: 'chat' as const, label: 'Чат', icon: MessageCircle, color: 'var(--chat-primary)' },
    { id: 'canvas' as const, label: 'Рисовать', icon: PenTool, color: 'var(--draw-primary)' },
    { id: 'games' as const, label: 'Игры', icon: Gamepad2, color: 'var(--game-primary)' },
];

export const MobileNavigation = memo(function MobileNavigation({
    activeTab,
    onTabChange,
    unreadCount = 0,
    className
}: MobileNavigationProps) {
    return (
        <nav
            className={cn(
                "shrink-0 z-50 bg-[var(--bg-secondary)]/95 backdrop-blur-lg border-t border-[var(--border-primary)]",
                className
            )}
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            role="navigation"
            aria-label="Основная навигация"
        >
            {/* P0-002 FIX: Ensure min-height 72px for proper touch targets */}
            <div className="flex items-center justify-around min-h-[72px] px-2">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const showBadge = tab.id === 'chat' && unreadCount > 0;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => {
                                if ('vibrate' in navigator) {
                                    navigator.vibrate(5);
                                }
                                onTabChange(tab.id);
                            }}
                            aria-label={tab.label}
                            aria-current={isActive ? 'page' : undefined}
                            className={cn(
                                // P0-002 FIX: Explicit 48x48px minimum touch target (>44px requirement)
                                "relative flex flex-col items-center justify-center gap-1.5 flex-1",
                                "min-w-[48px] min-h-[48px] py-3",
                                "transition-all duration-200 touch-target",
                                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2",
                                isActive ? "opacity-100" : "text-[var(--text-muted)] opacity-50"
                            )}
                            style={isActive ? { color: tab.color } : undefined}
                        >
                            <div className="relative">
                                <tab.icon
                                    className={cn(
                                        "w-6 h-6 transition-all duration-200",
                                        isActive && "scale-110"
                                    )}
                                    aria-hidden="true"
                                />
                                {showBadge && (
                                    <span
                                        className="absolute -top-2 -right-2 min-w-[20px] h-[20px] px-1 bg-[var(--error)] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg"
                                        aria-label={`${unreadCount} непрочитанных сообщений`}
                                    >
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </div>
                            <span className="text-[11px] font-semibold tracking-tight">
                                {tab.label}
                            </span>
                            {/* Active indicator - pill style */}
                            {isActive && (
                                <div
                                    className="absolute bottom-2 w-10 h-1 rounded-full shadow-sm"
                                    style={{ backgroundColor: tab.color }}
                                    aria-hidden="true"
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
});

// Экспорт для обратной совместимости
export function MobileNavigationLegacy({
    activeTab,
    onTabChange,
    onToggleCollabSpace
}: {
    activeTab: 'chat' | 'games' | 'canvas' | 'users';
    onTabChange: (tab: 'chat' | 'games' | 'canvas' | 'users') => void;
    isCollabSpaceVisible: boolean;
    onToggleCollabSpace: () => void;
}) {
    return (
        <MobileNavigation
            activeTab={activeTab}
            onTabChange={(tab) => {
                if (tab === 'more') {
                    onToggleCollabSpace();
                } else {
                    onTabChange(tab as 'chat' | 'games' | 'canvas' | 'users');
                }
            }}
        />
    );
}
