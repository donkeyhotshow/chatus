"use client";

import { memo } from 'react';
import { MessageCircle, PenTool, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavTab } from './layout/UnifiedLayout';

interface TabNavigationProps {
    activeTab: NavTab;
    onTabChange: (tab: NavTab) => void;
    className?: string;
}

const navTabs = [
    { id: 'chat' as const, label: 'Чат', icon: MessageCircle, color: '#7C3AED' },
    { id: 'canvas' as const, label: 'Холст', icon: PenTool, color: '#10B981' },
    { id: 'games' as const, label: 'Игры', icon: Gamepad2, color: '#A855F7' },
] as const;

/**
 * TabNavigation - Горизонтальные табы для десктопа
 * P0-01: Видимые табы Chat/Canvas/Games под header
 * 
 * Features:
 * - Активный таб подсвечен с анимированной полоской
 * - Переключение < 150ms (CSS transitions 120ms)
 * - Клавиатурная навигация (tab + enter/space)
 * - Accessibility ARIA labels
 */
export const TabNavigation = memo(function TabNavigation({
    activeTab,
    onTabChange,
    className
}: TabNavigationProps) {
    return (
        <nav
            className={cn(
                "flex items-center gap-1 px-4 bg-[var(--bg-secondary)]/60 backdrop-blur-lg border-b border-[var(--border-subtle)]",
                "h-14 min-h-[56px]",
                className
            )}
            role="tablist"
            aria-label="Основная навигация"
        >
            <div className="flex items-center gap-2 max-w-[var(--max-app-width)] mx-auto w-full">
                {navTabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={`${tab.id}-panel`}
                            className={cn(
                                "relative flex items-center gap-2 px-4 py-2.5 rounded-xl",
                                "min-h-[44px] min-w-[44px]",
                                "font-medium text-sm transition-all duration-150",
                                "hover:bg-[var(--bg-tertiary)]",
                                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]",
                                "active:scale-95",
                                isActive
                                    ? "text-white bg-[var(--bg-tertiary)]"
                                    : "text-[var(--text-muted)]"
                            )}
                        >
                            {/* Active indicator - top bar */}
                            {isActive && (
                                <span
                                    className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-[3px] rounded-b-full transition-all duration-150"
                                    style={{ backgroundColor: tab.color }}
                                    aria-hidden="true"
                                />
                            )}

                            <Icon
                                className={cn(
                                    "w-5 h-5 transition-all duration-150",
                                    isActive && "scale-110"
                                )}
                                style={isActive ? { color: tab.color } : undefined}
                                aria-hidden="true"
                            />
                            <span className={cn(
                                "transition-all duration-150",
                                isActive && "font-semibold"
                            )}>
                                {tab.label}
                            </span>

                            {/* Smooth underline on hover */}
                            <span
                                className={cn(
                                    "absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full transition-all duration-150",
                                    isActive
                                        ? "opacity-0"
                                        : "opacity-0 group-hover:opacity-30"
                                )}
                                style={{ backgroundColor: tab.color }}
                                aria-hidden="true"
                            />
                        </button>
                    );
                })}
            </div>
        </nav>
    );
});
