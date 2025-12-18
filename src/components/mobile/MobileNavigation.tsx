"use client";

import { useState, useEffect } from 'react';
import { MessageCircle, Gamepad2, PenTool, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';

type MobileNavigationProps = {
    activeTab: 'chat' | 'games' | 'canvas' | 'users';
    onTabChange: (tab: 'chat' | 'games' | 'canvas' | 'users') => void;
    isCollabSpaceVisible: boolean;
    onToggleCollabSpace: () => void;
    unreadCount?: number;
    isTyping?: boolean;
    connectionStatus?: string;
};

export function MobileNavigation({
    activeTab,
    onTabChange,
    isCollabSpaceVisible,
    onToggleCollabSpace
}: MobileNavigationProps) {
    const [_isMenuOpen, _setIsMenuOpen] = useState(false);

    // Close menu when tab changes
    useEffect(() => {
        _setIsMenuOpen(false);
    }, [activeTab]);

    const tabs = [
        { id: 'chat' as const, label: 'Чат', icon: MessageCircle },
        { id: 'games' as const, label: 'Игры', icon: Gamepad2 },
        { id: 'canvas' as const, label: 'Холст', icon: PenTool },
        { id: 'users' as const, label: 'Люди', icon: Users },
    ];

    return (
        <>
            {/* Mobile Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-secondary)] border-t border-[var(--border-primary)] safe-bottom">
                <div className="flex items-center justify-around px-2 py-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                if ('vibrate' in navigator) {
                                    navigator.vibrate(10);
                                }
                                onTabChange(tab.id);
                            }}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 touch-target",
                                activeTab === tab.id
                                    ? "bg-[var(--accent-light)] text-[var(--accent-primary)]"
                                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                            )}
                        >
                            <tab.icon className="w-5 h-5" />
                            <span className="text-xs font-medium">{tab.label}</span>
                        </button>
                    ))}

                    {/* Profile/Menu Button */}
                    <button
                        onClick={() => {
                            if ('vibrate' in navigator) {
                                navigator.vibrate(10);
                            }
                            onToggleCollabSpace();
                        }}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 touch-target relative",
                            isCollabSpaceVisible
                                ? "bg-[var(--accent-light)] text-[var(--accent-primary)]"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                        )}
                    >
                        <User className="w-5 h-5" />
                        <span className="text-xs font-medium">Профиль</span>

                        {/* Online indicator */}
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--success)] rounded-full border-2 border-[var(--bg-secondary)]" />
                    </button>
                </div>
            </nav>

            {/* Spacer for bottom navigation */}
            <div className="md:hidden flex-shrink-0 h-20 safe-bottom" />
        </>
    );
}
