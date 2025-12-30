"use client";

import { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
                "bg-black/60 backdrop-blur-2xl border-t border-white/10",
                "shadow-[0_-10px_40px_rgba(0,0,0,0.5)]",
                className
            )}
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            role="navigation"
            aria-label="Основная навигация"
        >
            <div className="flex items-center justify-around min-h-[76px] px-2">
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
                                "relative flex flex-col items-center justify-center gap-1.5 flex-1 py-2",
                                "transition-all duration-300 ease-out",
                                "min-w-[48px] min-h-[60px] touch-target",
                                "[-webkit-tap-highlight-color:transparent]",
                                isActive ? "text-white" : "text-white/40",
                                "hover:text-white/80"
                            )}
                        >
                            {/* Active indicator - bottom dot with glow */}
                            {isActive && (
                                <motion.span
                                    layoutId="nav-indicator"
                                    className="absolute -bottom-1 w-1.5 h-1.5 rounded-full shadow-[0_0_12px_rgba(124,58,237,0.8)]"
                                    style={{ backgroundColor: item.color }}
                                />
                            )}

                            {/* Icon container */}
                            <div
                                className={cn(
                                    "relative flex items-center justify-center w-12 h-9 rounded-2xl transition-all duration-300",
                                    isActive && "bg-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "w-6 h-6 transition-all duration-300",
                                        isActive ? "scale-110" : "scale-100"
                                    )}
                                    style={isActive ? { 
                                        color: item.color,
                                        filter: `drop-shadow(0 0 8px ${item.color}40)`
                                    } : undefined}
                                />

                                {/* Badge for unread messages */}
                                <AnimatePresence>
                                    {showBadge && (
                                        <motion.span 
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-black rounded-full shadow-lg border-2 border-black"
                                        >
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Label */}
                            <span
                                className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest transition-all duration-300",
                                    isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
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
