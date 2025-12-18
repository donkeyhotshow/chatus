"use client";

import { MessageCircle, PenTool, Gamepad2, Users, BarChart3, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '../icons/logo';
import { useState } from 'react';

export type ChatTab = 'chat' | 'canvas' | 'games' | 'users' | 'stats';

interface ChatSidebarProps {
    activeTab: ChatTab;
    onTabChange: (tab: ChatTab) => void;
    onLogout: () => void;
    onSettings: () => void;
    className?: string;
}

export function ChatSidebar({
    activeTab,
    onTabChange,
    onLogout,
    onSettings,
    className
}: ChatSidebarProps) {
    const [isHovered, setIsHovered] = useState(false);

    const menuItems = [
        { id: 'chat' as const, label: 'Чат', icon: MessageCircle },
        { id: 'canvas' as const, label: 'Рисование', icon: PenTool },
        { id: 'games' as const, label: 'Игры', icon: Gamepad2 },
        { id: 'users' as const, label: 'Люди', icon: Users },
        { id: 'stats' as const, label: 'Инфо', icon: BarChart3 },
    ];

    return (
        <aside
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
                "flex flex-col bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] h-full transition-all duration-300 z-50",
                isHovered ? "w-64" : "w-20",
                className
            )}
        >
            {/* Logo Section */}
            <div className="h-20 flex items-center px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="shrink-0">
                        <Logo className="w-8 h-8 text-[var(--accent-primary)]" />
                    </div>
                    {isHovered && (
                        <span className="font-semibold text-[var(--text-primary)] whitespace-nowrap animate-fade-in">
                            ChatUs
                        </span>
                    )}
                </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 px-3 py-4 space-y-2 overflow-hidden">
                {menuItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={cn(
                                "w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group relative touch-target",
                                isActive
                                    ? "bg-[var(--accent-light)] text-[var(--accent-primary)] shadow-[var(--shadow-sm)]"
                                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                            )}
                        >
                            <div className="shrink-0">
                                <item.icon className="w-5 h-5" />
                            </div>

                            {isHovered && (
                                <span className="font-medium text-sm whitespace-nowrap animate-fade-in">
                                    {item.label}
                                </span>
                            )}

                            {/* Active Indicator */}
                            {isActive && (
                                <div className="absolute left-0 w-1 h-6 bg-[var(--accent-primary)] rounded-r-full" />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="px-3 py-6 space-y-2 border-t border-[var(--border-primary)]">
                <button
                    onClick={onSettings}
                    className="w-full flex items-center gap-4 p-3 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all duration-200 group touch-target"
                >
                    <div className="shrink-0">
                        <Settings className="w-5 h-5" />
                    </div>
                    {isHovered && (
                        <span className="font-medium text-sm whitespace-nowrap animate-fade-in">
                            Настройки
                        </span>
                    )}
                </button>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-4 p-3 rounded-xl text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-red-50 transition-all duration-200 group touch-target"
                >
                    <div className="shrink-0">
                        <LogOut className="w-5 h-5" />
                    </div>
                    {isHovered && (
                        <span className="font-medium text-sm whitespace-nowrap animate-fade-in">
                            Выйти
                        </span>
                    )}
                </button>
            </div>
        </aside>
    );
}
