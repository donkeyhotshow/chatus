"use client";

import { memo, useCallback } from 'react';
import { MessageCircle, PenTool, Gamepad2, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavTab } from './UnifiedLayout';

interface UnifiedBottomNavProps {
    activeTab: NavTab;
    onTabChange: (tab: NavTab) => void;
    unreadCount?: number;
    className?: string;
}

const navItems = [
    { id: 'chat' as const, label: 'Чат', icon: MessageCircle, color: '#7C3AED' },
    { id: 'canvas' as const, label: 'Холст', icon: PenTool, color: '#10B981' },
    { id: 'games' as const, label: 'Игры', icon: Gamepad2, color: '#A855F7' },
    { id: 'users' as const, label: 'Люди', icon: Users, color: '#7C3AED' },
    { id: 'settings' as const, label: 'Ещё', icon: Settings, color: '#7C3AED' },
];

/**
 * UnifiedBottomNav - Нижняя навигация для мобильных устройств
 * Этап 1: Улучшенные стили, active indicator, badge для непрочитанных
 */
export const UnifiedBottomNav = memo(function UnifiedBottomNav({
    activeTab,
    onTabChange,
    unreadCount = 0,
    className
}: UnifiedBottomNavProps) {
    const handleTabClick = useCallback((tabId: NavTab) => {
        // Haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(5);
        }
        onTabChange(tabId);
    }, [onTabChange]);

    return (
        <nav
            className={cn(
                "fixed bottom-0 left-0 right-0 z-50",
                "bg-[var(--bg-secondary)]/95 backdrop-blur-xl border-t border-white/[0.08]",
                className
            )}
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            role="navigation"
            aria-label="Основная навигация"
        >
            <div className="flex items-center justify-around min-h-[72px] px-1">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const showBadge = item.id === 'chat' && unreadCount > 0;

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleTabClick(item.id)}
                            aria-label={item.label}
                            aria-current={isActive ? 'page' : undefined}
                            className={cn(
                                "relative flex flex-col items-center justify-center gap-1 flex-1 py-2",
                                "transition-all duration-200 ease-out",
                                // Touch targets
                                "min-w-[48px] min-h-[56px] touch-target",
                                // Убираем tap highlight
                                "[-webkit-tap-highlight-color:transparent]",
                                // States
                                isActive
                                    ? "text-white"
                                    : "text-[var(--text-muted)]",
                                // Hover/Active feedback
                                "hover:text-white",
                                "active:scale-95 active:opacity-80"
                            )}
                        >
                            {/* Active indicator - top bar */}
                            {isActive && (
                                <span
                                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full transition-all duration-200"
                                    style={{ backgroundColor: item.color }}
                                />
                            )}

                            {/* Icon container with background on active */}
                            <span
                                className={cn(
                                    "relative flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-200",
                                    isActive && "bg-white/[0.08]"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "w-5 h-5 transition-all duration-200",
                                        isActive && "scale-105"
                                    )}
                                    style={isActive ? { color: item.color } : undefined}
                                />

                                {/* Badge for unread messages */}
                                {showBadge && (
                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-[var(--error)] text-white text-[10px] font-bold rounded-full">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </span>

                            {/* Label */}
                            <span
                                className={cn(
                                    "text-[11px] font-medium transition-all duration-200",
                                    isActive ? "opacity-100" : "opacity-70"
                                )}
                                style={isActive ? { color: item.color } : undefined}
                            >
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
});
