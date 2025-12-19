"use client";

import { memo } from 'react';
import { MessageCircle, PenTool, Gamepad2, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavTab } from './UnifiedLayout';

interface UnifiedBottomNavProps {
    activeTab: NavTab;
    onTabChange: (tab: NavTab) => void;
    className?: string;
}

const navItems = [
    { id: 'chat' as const, label: 'Чат', icon: MessageCircle, color: 'var(--chat-primary)' },
    { id: 'canvas' as const, label: 'Холст', icon: PenTool, color: 'var(--draw-primary)' },
    { id: 'games' as const, label: 'Игры', icon: Gamepad2, color: 'var(--game-primary)' },
    { id: 'users' as const, label: 'Люди', icon: Users, color: 'var(--accent-primary)' },
    { id: 'settings' as const, label: 'Ещё', icon: Settings, color: 'var(--accent-primary)' },
];

export const UnifiedBottomNav = memo(function UnifiedBottomNav({
    activeTab,
    onTabChange,
    className
}: UnifiedBottomNavProps) {
    return (
        <nav className={cn(
            "fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-secondary)] border-t border-[var(--border-primary)] safe-bottom",
            className
        )}>
            <div className="flex items-center justify-around h-[var(--nav-height-mobile)] px-1">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                if ('vibrate' in navigator) {
                                    navigator.vibrate(5);
                                }
                                onTabChange(item.id);
                            }}
                            className={cn(
                                "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all duration-150 touch-target",
                                isActive
                                    ? "opacity-100"
                                    : "text-[var(--text-muted)] opacity-60"
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
