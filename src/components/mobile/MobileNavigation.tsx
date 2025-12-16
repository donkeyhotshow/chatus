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
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Close menu when tab changes
    useEffect(() => {
        setIsMenuOpen(false);
    }, [activeTab]);

    const tabs = [
        { id: 'chat' as const, label: 'Чат', icon: MessageCircle },
        { id: 'games' as const, label: 'Игры', icon: Gamepad2 },
        { id: 'canvas' as const, label: 'Холст', icon: PenTool },
        { id: 'users' as const, label: 'Люди', icon: Users },
    ];

    return (
        <>
            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black via-neutral-900 to-neutral-800/90 backdrop-blur-lg border-t border-white/20 safe-area-bottom">
                <div className="flex items-center justify-around px-2 py-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 touch-target",
                                activeTab === tab.id
                                    ? "bg-gradient-to-t from-cyan-500/20 to-blue-500/20 text-cyan-400 scale-105"
                                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <tab.icon className="w-5 h-5" />
                            <span className="text-xs font-medium">{tab.label}</span>
                        </button>
                    ))}

                    {/* Toggle Collaboration Space */}
                    <button
                        onClick={onToggleCollabSpace}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 touch-target",
                            isCollabSpaceVisible
                                ? "bg-gradient-to-t from-orange-500/20 to-red-500/20 text-orange-400"
                                : "text-neutral-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        {isCollabSpaceVisible ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        <span className="text-xs font-medium">
                            {isCollabSpaceVisible ? 'Закрыть' : 'Меню'}
                        </span>
                    </button>
                </div>
            </nav>

            {/* Spacer for bottom navigation */}
            <div className="md:hidden h-20 flex-shrink-0" />
        </>
    );
}
