"use client";

import { memo, useState, useCallback } from 'react';
import { MessageCircle, Settings, LogOut, Snowflake, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '../icons/logo';
import { SnowEffect } from '../effects/SnowEffect';

export type ChatTab = 'chat' | 'canvas' | 'games' | 'users' | 'stats';

interface ChatSidebarProps {
    onLogout: () => void;
    onSettings: () => void;
    className?: string;
}

// Ширина сайдбара
const SIDEBAR_WIDTH_EXPANDED = 240;
const SIDEBAR_WIDTH_COLLAPSED = 72;

/**
 * ChatSidebar - Боковая панель навигации
 * По умолчанию развёрнута на десктопе, с кнопкой сворачивания
 */
export const ChatSidebar = memo(function ChatSidebar({
    onLogout,
    onSettings,
    className
}: ChatSidebarProps) {
    // По умолчанию развёрнут
    const [isExpanded, setIsExpanded] = useState(true);
    const [snowEnabled, setSnowEnabled] = useState(false);

    const toggleSidebar = useCallback(() => {
        setIsExpanded(prev => !prev);
    }, []);

    return (
        <>
            <SnowEffect enabled={snowEnabled} />
            <aside
                className={cn(
                    "flex flex-col h-full bg-black/95 border-r border-white/[0.06] transition-all duration-300 ease-out z-40 relative",
                    className
                )}
                style={{ width: isExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED }}
            >
                {/* Toggle Button - Интегрирован в границу */}
                <button
                    onClick={toggleSidebar}
                    className={cn(
                        "absolute -right-3 top-20 z-50",
                        "w-6 h-12 rounded-r-xl",
                        "bg-black border border-l-0 border-white/10",
                        "flex items-center justify-center",
                        "text-white/40 hover:text-white hover:bg-white/5",
                        "transition-all duration-200 group/toggle",
                        "shadow-[4px_0_12px_rgba(0,0,0,0.5)]"
                    )}
                    title={isExpanded ? "Свернуть" : "Развернуть"}
                    aria-label={isExpanded ? "Свернуть боковую панель" : "Развернуть боковую панель"}
                >
                    <div className="absolute inset-y-2 left-0 w-[1px] bg-white/5 group-hover/toggle:bg-white/20 transition-colors" />
                    {isExpanded ? (
                        <ChevronLeft className="w-4 h-4 transition-transform group-hover/toggle:-translate-x-0.5" />
                    ) : (
                        <ChevronRight className="w-4 h-4 transition-transform group-hover/toggle:translate-x-0.5" />
                    )}
                </button>

                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
                            <Logo className="w-5 h-5 text-white" />
                        </div>
                        <span className={cn(
                            "font-semibold text-white whitespace-nowrap transition-all duration-300 overflow-hidden",
                            isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
                        )}>
                            ChatUs
                        </span>
                    </div>
                    {/* Theme Toggles - visible in both states */}
                    {isExpanded && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => {
                                    const isNeon = !document.documentElement.classList.contains('neon-mode');
                                    document.documentElement.classList.toggle('neon-mode', isNeon);
                                    localStorage.setItem('neon-mode', isNeon ? 'true' : 'false');
                                }}
                                className={cn(
                                    "p-2 rounded-lg transition-all duration-200 touch-target shrink-0",
                                    "text-violet-400 hover:bg-violet-500/10"
                                )}
                                title="Neon Mode"
                            >
                                <Zap className={cn("w-5 h-5", "animate-pulse")} />
                            </button>
                            <button
                                onClick={() => setSnowEnabled(!snowEnabled)}
                                className={cn(
                                    "p-2 rounded-lg transition-all duration-200 touch-target shrink-0",
                                    snowEnabled
                                        ? "bg-sky-500/20 text-sky-400"
                                        : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                                )}
                                title={snowEnabled ? "Выключить снег" : "Включить снег"}
                                aria-label={snowEnabled ? "Выключить снег" : "Включить снег"}
                            >
                                <Snowflake
                                    className={cn("w-5 h-5", snowEnabled && "animate-spin")}
                                    style={snowEnabled ? { animationDuration: '3s' } : undefined}
                                />
                            </button>
                        </div>
                    )}
                </div>

                {/* Navigation - Global items */}
                <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-hidden">
                    <div className="px-3 py-2 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                        {isExpanded ? "Глобальное" : "•••"}
                    </div>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.06] transition-all duration-200 touch-target group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 group-hover:bg-violet-500/20 flex items-center justify-center shrink-0 transition-colors">
                            <MessageCircle className="w-5 h-5 text-violet-400" />
                        </div>
                        <span className={cn(
                            "text-sm font-medium whitespace-nowrap transition-all duration-300 overflow-hidden",
                            isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
                        )}>
                            Все комнаты
                        </span>
                    </button>
                </nav>

                {/* Bottom Actions */}
                <div className="px-3 py-4 space-y-1.5 border-t border-white/[0.06]">
                    {/* Snow Toggle - collapsed state only */}
                    {!isExpanded && (
                        <button
                            onClick={() => setSnowEnabled(!snowEnabled)}
                            className={cn(
                                "w-full flex items-center justify-center px-3 py-3 rounded-xl transition-all duration-200 touch-target",
                                snowEnabled
                                    ? "bg-sky-500/20 text-sky-400"
                                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                            )}
                            title={snowEnabled ? "Выключить снег" : "Включить снег"}
                            aria-label={snowEnabled ? "Выключить снег" : "Включить снег"}
                        >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                                <Snowflake
                                    className={cn("w-5 h-5", snowEnabled && "animate-spin")}
                                    style={snowEnabled ? { animationDuration: '3s' } : undefined}
                                />
                            </div>
                        </button>
                    )}

                    <button
                        onClick={onSettings}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.06] transition-all duration-200 touch-target group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-white/[0.04] group-hover:bg-white/[0.08] flex items-center justify-center shrink-0 transition-colors">
                            <Settings className="w-5 h-5" />
                        </div>
                        <span className={cn(
                            "text-sm font-medium whitespace-nowrap transition-all duration-300 overflow-hidden",
                            isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
                        )}>
                            Настройки
                        </span>
                    </button>

                    <button
                        onClick={() => {
                            console.log('[ChatSidebar] Logout button clicked');
                            onLogout();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-white/70 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 touch-target group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-white/[0.04] group-hover:bg-red-500/10 flex items-center justify-center shrink-0 transition-colors">
                            <LogOut className="w-5 h-5" />
                        </div>
                        <span className={cn(
                            "text-sm font-medium whitespace-nowrap transition-all duration-300 overflow-hidden",
                            isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
                        )}>
                            Выйти
                        </span>
                    </button>
                </div>
            </aside>
        </>
    );
});
