"use client";

import { memo, useCallback, useRef } from 'react';
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
    const navRef = useRef<HTMLDivElement>(null);

    // BUG-016 FIX: Handle keyboard navigation between tabs
    const handleKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
        let newIndex = currentIndex;

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            newIndex = (currentIndex + 1) % tabs.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        } else if (e.key === 'Home') {
            e.preventDefault();
            newIndex = 0;
        } else if (e.key === 'End') {
            e.preventDefault();
            newIndex = tabs.length - 1;
        } else {
            return;
        }

        // Focus the new tab button
        const buttons = navRef.current?.querySelectorAll('button[role="tab"]');
        if (buttons && buttons[newIndex]) {
            (buttons[newIndex] as HTMLButtonElement).focus();
        }
    }, []);

    return (
        <nav
            ref={navRef}
            className={cn(
                "shrink-0 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]",
                className
            )}
            role="navigation"
            aria-label="Основная навигация"
        >
            {/* BUG-016 FIX: Added role="tablist" for proper keyboard navigation */}
            <div
                className="flex items-center justify-around min-h-[56px] px-2"
                role="tablist"
                aria-label="Вкладки навигации"
            >
                {tabs.map((tab, index) => {
                    const isActive = activeTab === tab.id;
                    const showBadge = tab.id === 'chat' && unreadCount > 0;

                    return (
                        <button
                            key={tab.id}
                            role="tab"
                            aria-selected={isActive}
                            tabIndex={isActive ? 0 : -1}
                            onClick={() => {
                                if ('vibrate' in navigator) {
                                    navigator.vibrate(5);
                                }
                                onTabChange(tab.id);
                            }}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            aria-label={tab.label}
                            aria-current={isActive ? 'page' : undefined}
                            className={cn(
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
                            {/* Active indicator - pill style сверху */}
                            {isActive && (
                                <div
                                    className="absolute top-1 w-10 h-1 rounded-full shadow-sm"
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
