"use client";

import { memo, useState } from 'react';
import { MessageCircle, PenTool, Gamepad2, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '../icons/logo';

export type ChatTab = 'chat' | 'canvas' | 'games' | 'users' | 'stats';

interface ChatSidebarProps {
    activeTab: ChatTab;
    onTabChange: (tab: ChatTab) => void;
    onLogout: () => void;
    onSettings: () => void;
    className?: string;
}

// Упрощенное меню - фокус на чате
const menuItems = [
    { id: 'chat' as const, label: 'Чат', icon: MessageCircle },
    { id: 'canvas' as const, label: 'Рисование', icon: PenTool },
    { id: 'games' as const, label: 'Игры', icon: Gamepad2 },
];

export const ChatSidebar = memo(function ChatSidebar({
    activeTab,
    onTabChange,
    onLogout,
    onSettings,
    className
}: ChatSidebarProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <aside
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
                "flex flex-col h-full bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] transition-all duration-200 z-40",
                isHovered ? "w-[var(--sidebar-width-expanded)]" : "w-[var(--sidebar-width)]",
                className
            )}
        >
            {/* Logo */}
            <div className="h-16 flex items-center px-4 border-b border-[var(--border-primary)]">
                <div className="flex items-center gap-3">
                    <Logo className="w-7 h-7 text-[var(--text-primary)] shrink-0" />
                    {isHovered && (
                        <span className="font-semibold text-[var(--text-primary)] whitespace-nowrap animate-fade-in">
                            ChatUs
                        </span>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-hidden">
                {menuItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 touch-target",
                                isActive
                                    ? "bg-[var(--accent-light)] text-[var(--accent-primary)]"
                                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                            )}
                        >
                            <item.icon className="w-5 h-5 shrink-0" />
                            {isHovered && (
                                <span className="text-sm font-medium whitespace-nowrap animate-fade-in">
                                    {item.label}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="px-2 py-4 space-y-1 border-t border-[var(--border-primary)]">
                <button
                    onClick={onSettings}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all duration-150 touch-target"
                >
                    <Settings className="w-5 h-5 shrink-0" />
                    {isHovered && (
                        <span className="text-sm font-medium whitespace-nowrap animate-fade-in">
                            Настройки
                        </span>
                    )}
                </button>

                <button
                    onClick={() => {
                        console.log('[ChatSidebar] Logout button clicked');
                        onLogout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-150 touch-target"
                >
                    <LogOut className="w-5 h-5 shrink-0" />
                    {isHovered && (
                        <span className="text-sm font-medium whitespace-nowrap animate-fade-in">
                            Выйти
                        </span>
                    )}
                </button>
            </div>
        </aside>
    );
});
