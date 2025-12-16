"use client";

import { useState, useEffect } from 'react';
import { MessageCircle, Gamepad2, PenTool, X, Menu, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

type MobileNavigationProps = {
    activeTab: 'chat' | 'games' | 'canvas' | 'users';
    onTabChange: (tab: 'chat' | 'games' | 'canvas' | 'users') => void;
    isCollabSpaceVisible: boolean;
    onToggleCollabSpace: () => void;
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
        { id: 'canvas' as const, label: 'Холст', icon: PenTool, isCenter: true },
        { id: 'users' as const, label: 'Люди', icon: Users },
    ];

    return (
        <>
            {/* Gaming HUD Navigation with elevated center button */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 hud-panel border-t-0 rounded-t-3xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                <div className="flex items-end justify-around px-2 py-2 relative">
                    {tabs.map((tab) => {
                        const isCenter = 'isCenter' in tab && tab.isCenter;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    // Enhanced haptic feedback for center button
                                    if ('vibrate' in navigator) {
                                        navigator.vibrate(isCenter ? [15, 10, 15] : 10);
                                    }
                                    onTabChange(tab.id);
                                }}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 transition-all duration-300 min-w-[48px] min-h-[48px] touch-manipulation relative touch-target",
                                    isCenter
                                        ? "px-4 py-4 -mt-4 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 text-black shadow-2xl min-h-[68px] min-w-[68px] transform active:scale-90"
                                        : "px-4 py-4 rounded-2xl min-h-[48px] min-w-[48px] transform active:scale-95",
                                    activeTab === tab.id && !isCenter
                                        ? "bg-gradient-to-t from-cyan-500/30 to-blue-500/30 text-cyan-300 scale-105 neon-glow-cyan"
                                        : activeTab === tab.id && isCenter
                                            ? "neon-glow scale-110"
                                            : !isCenter && "text-neutral-400 hover:text-white hover:bg-white/10 hover:scale-105"
                                )}
                            >
                                <tab.icon className={cn(
                                    isCenter ? "w-7 h-7" : "w-5 h-5"
                                )} />
                                <span className={cn(
                                    "font-medium",
                                    isCenter ? "text-xs font-bold" : "text-xs"
                                )}>{tab.label}</span>

                                {/* Pulsing indicator for center button */}
                                {isCenter && activeTab === tab.id && (
                                    <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-500/20 animate-ping" />
                                )}
                            </button>
                        );
                    })}

                    {/* Profile Avatar instead of Menu */}
                    <button
                        onClick={() => {
                            if ('vibrate' in navigator) {
                                navigator.vibrate(10);
                            }
                            onToggleCollabSpace();
                        }}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 px-4 py-4 rounded-2xl transition-all duration-300 min-w-[48px] min-h-[48px] transform active:scale-95 touch-manipulation relative touch-target",
                            isCollabSpaceVisible
                                ? "bg-gradient-to-t from-orange-500/30 to-red-500/30 text-orange-300 scale-105 neon-glow-pink"
                                : "text-neutral-400 hover:text-white hover:bg-white/10 hover:scale-105"
                        )}
                    >
                        {/* Avatar circle */}
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-black text-xs font-bold">
                            А
                        </div>
                        <span className="text-xs font-medium">Профиль</span>

                        {/* Online indicator */}
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black animate-pulse" />
                    </button>
                </div>
            </nav>

            {/* Spacer for bottom navigation */}
            <div className="md:hidden flex-shrink-0" style={{ height: `calc(5rem + env(safe-area-inset-bottom))` }} />
        </>
    );
}
