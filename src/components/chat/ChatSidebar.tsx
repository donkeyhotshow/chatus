"use client";

import { memo, useState, useCallback } from 'react';
import { MessageCircle, PenTool, Gamepad2, Settings, LogOut, Snowflake } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '../icons/logo';
import { preloadOnHover } from '@/components/lazy/LazyComponents';
import { SnowEffect } from '../effects/SnowEffect';

export type ChatTab = 'chat' | 'canvas' | 'games' | 'users' | 'stats';

interface ChatSidebarProps {
    activeTab: ChatTab;
    onTabChange: (tab: ChatTab) => void;
    onLogout: () => void;
    onSettings: () => void;
    className?: string;
}

const menuItems = [
    { id: 'chat' as const, label: 'Чат', icon: MessageCircle, color: '#7C3AED', gradient: 'from-violet-500 to-purple-600', preloadKey: null },
    { id: 'canvas' as const, label: 'Холст', icon: PenTool, color: '#10B981', gradient: 'from-emerald-500 to-teal-600', preloadKey: 'collaboration' },
    { id: 'games' as const, label: 'Игры', icon: Gamepad2, color: '#A855F7', gradient: 'from-purple-500 to-fuchsia-600', preloadKey: 'games' },
];

/**
 * ChatSidebar - Боковая панель навигации
 * P2 Fix: Предзагрузка страниц при наведении для ускорения переключения
 */
export const ChatSidebar = memo(function ChatSidebar({
    activeTab,
    onTabChange,
    onLogout,
    onSettings,
    className
}: ChatSidebarProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [snowEnabled, setSnowEnabled] = useState(false);

    // P2 Fix: Предзагрузка компонентов при наведении
    const handleMouseEnter = useCallback((preloadKey: string | null) => {
        if (preloadKey) {
            const preloader = preloadOnHover(preloadKey);
            preloader();
        }
    }, []);

    return (
        <>
            <SnowEffect enabled={snowEnabled} />
            <aside
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={cn(
                    "flex flex-col h-full bg-black/95 border-r border-white/[0.06] transition-all duration-300 ease-out z-40",
                    isHovered ? "w-[200px]" : "w-[72px]",
                    className
                )}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
                            <Logo className="w-5 h-5 text-white" />
                        </div>
                        <span className={cn(
                            "font-semibold text-white whitespace-nowrap transition-all duration-300",
                            isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none"
                        )}>
                            ChatUs
                        </span>
                    </div>
                    {/* Snow Toggle Button */}
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

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-hidden">
                {menuItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            onMouseEnter={() => handleMouseEnter(item.preloadKey)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 touch-target group relative",
                                isActive
                                    ? "bg-white/[0.06]"
                                    : "hover:bg-white/[0.04]"
                            )}
                        >
                            {/* Active indicator */}
                            {isActive && (
                                <div
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                                    style={{
                                        backgroundColor: item.color,
                                        boxShadow: `0 0 12px ${item.color}60`
                                    }}
                                />
                            )}
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200",
                                isActive
                                    ? `bg-gradient-to-br ${item.gradient} shadow-lg`
                                    : "bg-white/[0.04] group-hover:bg-white/[0.08]"
                            )}
                            style={isActive ? { boxShadow: `0 4px 12px ${item.color}40` } : undefined}
                            >
                                <item.icon className={cn(
                                    "w-5 h-5 transition-colors",
                                    isActive ? "text-white" : "text-white/50 group-hover:text-white/70"
                                )} />
                            </div>
                            <span className={cn(
                                "text-sm font-medium whitespace-nowrap transition-all duration-300",
                                isActive ? "text-white" : "text-white/50 group-hover:text-white/70",
                                isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none"
                            )}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="px-3 py-4 space-y-1.5 border-t border-white/[0.06]">
                <button
                    onClick={onSettings}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.04] transition-all duration-200 touch-target group"
                >
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] group-hover:bg-white/[0.08] flex items-center justify-center shrink-0 transition-colors">
                        <Settings className="w-5 h-5" />
                    </div>
                    <span className={cn(
                        "text-sm font-medium whitespace-nowrap transition-all duration-300",
                        isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none"
                    )}>
                        Настройки
                    </span>
                </button>

                <button
                    onClick={() => {
                        console.log('[ChatSidebar] Logout button clicked');
                        onLogout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 touch-target group"
                >
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] group-hover:bg-red-500/10 flex items-center justify-center shrink-0 transition-colors">
                        <LogOut className="w-5 h-5" />
                    </div>
                    <span className={cn(
                        "text-sm font-medium whitespace-nowrap transition-all duration-300",
                        isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none"
                    )}>
                        Выйти
                    </span>
                </button>
            </div>
            </aside>
        </>
    );
});
