"use client";

import { memo } from 'react';
import { MessageCircle, Gamepad2, PenTool, Users, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MobileTab = 'chat' | 'games' | 'canvas' | 'users' | 'more';

interface MobileNavigationProps {
    activeTab: MobileTab;
    onTabChange: (tab: MobileTab) => void;
    isCollabSpaceVisible?: boolean;
    onToggleCollabSpace?: () => void;
    unreadCount?: number;
    className?: string;
}

const tabs = [
    { id: 'chat' as const, label: 'Чат', icon: MessageCircle },
    { id: 'canvas' as const, label: 'Холст', icon: PenTool },
    { id: 'games' as const, label: 'Игры', icon: Gamepad2 },
    { id: 'users' as const, label: 'Люди', icon: Users },
    { id: 'more' as const, label: 'Ещё', icon: MoreHorizontal },
];

export const MobileNavigation = memo(function MobileNavigation({
    activeTab,
    onTabChange,
    unreadCount = 0,
    className
}: MobileNavigationProps) {
    return (
        <nav className={cn(
            "fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-secondary)] border-t border-[var(--border-primary)] safe-bottom",
            className
        )}>
            <div className="flex items-center justify-around h-[var(--nav-height-mobile)] px-1">
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
                            className={cn(
                                "relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors duration-150 touch-target",
                                isActive
                                    ? "text-[var(--accent-primary)]"
                                    : "text-[var(--text-muted)]"
                            )}
                        >
                            <div className="relative">
                                <tab.icon className={cn(
                                    "w-5 h-5 transition-transform duration-150",
                                    isActive && "scale-110"
                                )} />
                                {showBadge && (
                                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-[var(--error)] text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </div>
                            <span className={cn(
                                "text-[10px] font-medium",
                                isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]"
                            )}>
                                {tab.label}
                            </span>
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
    isCollabSpaceVisible,
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
