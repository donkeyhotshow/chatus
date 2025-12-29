"use client";

import { memo, useState } from 'react';
import { MessageCircle, Settings, LogOut, Snowflake } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '../icons/logo';
import { SnowEffect } from '../effects/SnowEffect';
import type { NavTab } from './UnifiedLayout';

interface UnifiedSidebarProps {
    activeTab: NavTab;
    onTabChange: (tab: NavTab) => void;
    onLogout?: () => void;
    expanded: boolean;
    onExpandedChange: (expanded: boolean) => void;
    className?: string;
}

const navItems = [
    { id: 'rooms' as const, label: 'Комнаты', icon: MessageCircle },
];

export const UnifiedSidebar = memo(function UnifiedSidebar({
    activeTab,
    onTabChange,
    onLogout,
    expanded,
    onExpandedChange,
    className
}: UnifiedSidebarProps) {
    const [snowEnabled, setSnowEnabled] = useState(false);

    return (
        <>
            <SnowEffect enabled={snowEnabled} />
            <aside
                onMouseEnter={() => onExpandedChange(true)}
                onMouseLeave={() => onExpandedChange(false)}
                className={cn(
                    "flex flex-col h-full bg-black border-r border-white/10 transition-all duration-200 z-40",
                    expanded ? "w-[var(--sidebar-width-expanded)]" : "w-[var(--sidebar-width)]",
                    className
                )}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <Logo className="w-7 h-7 text-[var(--text-primary)] shrink-0" />
                        {expanded && (
                            <span className="font-semibold text-[var(--text-primary)] whitespace-nowrap animate-fade-in">
                                ChatUs
                            </span>
                        )}
                    </div>
                    {/* Snow Toggle Button */}
                    <button
                        onClick={() => setSnowEnabled(!snowEnabled)}
                        className={cn(
                            "p-2 rounded-lg transition-all duration-200 touch-target",
                            snowEnabled
                                ? "bg-sky-500/20 text-sky-400"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                        )}
                        title={snowEnabled ? "Выключить снег" : "Включить снег"}
                        aria-label={snowEnabled ? "Выключить снег" : "Включить снег"}
                    >
                        <Snowflake className={cn("w-5 h-5 shrink-0", snowEnabled && "animate-spin")} style={{ animationDuration: '3s' }} />
                    </button>
                </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-hidden">
                {navItems.map((item) => {
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
                            {expanded && (
                                <span className="text-sm font-medium whitespace-nowrap animate-fade-in">
                                    {item.label}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="px-2 py-4 space-y-1 border-t border-white/10">
                <button
                    onClick={() => onTabChange('settings')}
                    className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 touch-target",
                        activeTab === 'settings'
                            ? "bg-[var(--accent-light)] text-[var(--accent-primary)]"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                    )}
                >
                    <Settings className="w-5 h-5 shrink-0" />
                    {expanded && (
                        <span className="text-sm font-medium whitespace-nowrap animate-fade-in">
                            Настройки
                        </span>
                    )}
                </button>

                {onLogout && (
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-150 touch-target"
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        {expanded && (
                            <span className="text-sm font-medium whitespace-nowrap animate-fade-in">
                                Выйти
                            </span>
                        )}
                    </button>
                )}
            </div>
            </aside>
        </>
    );
});
