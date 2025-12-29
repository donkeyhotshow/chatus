"use client";

import { memo, useCallback, useRef } from 'react';
import { MessageCircle, Gamepad2, PenTool } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useScrollDirection } from '@/hooks/useScrollDirection';

export type MobileTab = 'chat' | 'games' | 'canvas' | 'users' | 'more' | 'stats';

interface MobileNavigationProps {
    activeTab: MobileTab;
    onTabChange: (tab: MobileTab) => void;
    isCollabSpaceVisible?: boolean;
    onToggleCollabSpace?: () => void;
    unreadCount?: number;
    className?: string;
}

// Premium navigation with gradient accents
const tabs = [
    { id: 'chat' as const, label: 'Чат', icon: MessageCircle, color: '#7C3AED', gradient: 'from-violet-500 to-purple-600' },
    { id: 'canvas' as const, label: 'Холст', icon: PenTool, color: '#10B981', gradient: 'from-emerald-500 to-teal-600' },
    { id: 'games' as const, label: 'Игры', icon: Gamepad2, color: '#A855F7', gradient: 'from-purple-500 to-fuchsia-600' },
];

export const MobileNavigation = memo(function MobileNavigation({
    activeTab,
    onTabChange,
    unreadCount = 0,
    className
}: MobileNavigationProps) {
    const navRef = useRef<HTMLDivElement>(null);
    const scrollDirection = useScrollDirection(20);
    const isHidden = scrollDirection === 'down' && window.scrollY > 100;

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

        const buttons = navRef.current?.querySelectorAll('button[role="tab"]');
        if (buttons && buttons[newIndex]) {
            (buttons[newIndex] as HTMLButtonElement).focus();
        }
    }, []);

    return (
        <nav
            ref={navRef}
            className={cn(
                "fixed bottom-0 left-0 right-0 z-[100]",
                "bg-black/80 backdrop-blur-xl border-t border-white/[0.08]",
                "transition-transform duration-300 ease-in-out",
                isHidden ? "translate-y-full" : "translate-y-0",
                className
            )}
            style={{ 
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                height: 'calc(60px + env(safe-area-inset-bottom, 0px))'
            }}
            role="navigation"
            aria-label="Основная навигация"
        >
            <div
                className="flex items-center justify-around h-[60px] px-2 relative"
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
                                "relative flex flex-col items-center justify-center gap-0.5 flex-1",
                                "min-w-[64px] h-full rounded-xl mx-0.5",
                                "transition-all duration-300 ease-out touch-target",
                                "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
                                isActive
                                    ? "text-white"
                                    : "text-white/40 hover:text-white/60"
                            )}
                        >
                            <div className="relative">
                                <motion.div
                                    animate={{
                                        scale: isActive ? 1.1 : 1,
                                        y: isActive ? -1 : 0
                                    }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                >
                                    <tab.icon
                                        className={cn(
                                            "w-5 h-5 transition-colors duration-300",
                                            isActive ? "text-white" : ""
                                        )}
                                        style={isActive ? { color: tab.color } : undefined}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        aria-hidden="true"
                                    />
                                </motion.div>
                                {showBadge && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-red-500/30"
                                        aria-label={`${unreadCount} непрочитанных сообщений`}
                                    >
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </motion.span>
                                )}
                            </div>
                            <span className={cn(
                                "text-[10px] font-medium tracking-tight transition-all duration-300",
                                isActive ? "opacity-100" : "opacity-60"
                            )}
                            style={isActive ? { color: tab.color } : undefined}
                            >
                                {tab.label}
                            </span>

                            {/* Active indicator */}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className={cn(
                                        "absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full",
                                        "bg-gradient-to-r", tab.gradient
                                    )}
                                    style={{
                                        boxShadow: `0 0 10px ${tab.color}80`
                                    }}
                                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
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
