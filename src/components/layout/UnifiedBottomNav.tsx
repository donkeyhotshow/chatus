"use client";

import { memo, useCallback } from 'react';
import { MessageCircle, PenTool, Gamepad2, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavTab } from './UnifiedLayout';

interface UnifiedBottomNavProps {
    activeTab: NavTab;
    onTabChange: (tab: NavTab) => void;
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
 * P1 Fix: Увеличенные touch-зоны (min 48x48px)
 */
export const UnifiedBottomNav = memo(function UnifiedBottomNav({
    activeTab,
    onTabChange,
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
                "bg-black/90 backdrop-blur-xl border-t border-white/10",
                className
            )}
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            role="navigation"
            aria-label="Основная навигация"
        >
            <div className="flex items-center justify-around min-h-[72px] px-1">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleTabClick(item.id)}
                            aria-label={item.label}
                            aria-current={isActive ? 'page' : undefined}
                            className={cn(
                                "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all duration-150",
                                // P1 Fix: Увеличенные touch-зоны
                                "min-w-[48px] min-h-[48px] touch-target",
                                // Убираем tap highlight
                                "[-webkit-tap-highlight-color:transparent]",
                                isActive
                                    ? "opacity-100"
                                    : "text-[var(--text-muted)] opacity-60",
                                // Active state feedback
                                "active:scale-95 active:opacity-80"
                            )}
                            style={isActive ? { color: item.color } : undefined}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-transform duration-150",
                                isActive && "scale-110"
                            )} />
                            <span className="text-[10px] font-medium">
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
});
