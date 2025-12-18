"use client";

import { MessageCircle, PenTool, Gamepad2, Users, BarChart3, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
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
                "flex flex-col bg-black/40 backdrop-blur-2xl border-r border-white/5 h-full transition-all duration-500 ease-in-out z-50",
                isHovered ? "w-64" : "w-20",
                className
            )}
        >
            {/* Logo Section */}
            <div className="h-20 flex items-center px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="shrink-0">
                        <Logo className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
                    </div>
                    <AnimatePresence>
                        {isHovered && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="font-bold text-white tracking-tight whitespace-nowrap"
                            >
                                ChatUs
                            </motion.span>
                        )}
                    </AnimatePresence>
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
                                "w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                                isActive
                                    ? "bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                                    : "text-neutral-500 hover:text-neutral-200 hover:bg-white/5"
                            )}
                        >
                            <div className="shrink-0 relative z-10">
                                <item.icon className={cn(
                                    "w-5 h-5 transition-all duration-500",
                                    isActive ? "text-cyan-400 scale-110" : "group-hover:scale-110"
                                )} />
                            </div>

                            <AnimatePresence>
                                {isHovered && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="font-medium text-sm whitespace-nowrap relative z-10"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>

                            {/* Active Indicator Glow */}
                            {isActive && (
                                <motion.div
                                    layoutId="active-pill"
                                    className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                />
                            )}

                            {isActive && (
                                <motion.div
                                    layoutId="active-line"
                                    className="absolute left-0 w-1 h-5 bg-cyan-400 rounded-r-full"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="px-3 py-6 space-y-2 border-t border-white/5">
                <button
                    onClick={onSettings}
                    className="w-full flex items-center gap-4 p-3.5 rounded-2xl text-neutral-500 hover:text-neutral-200 hover:bg-white/5 transition-all duration-300 group"
                >
                    <div className="shrink-0">
                        <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-700" />
                    </div>
                    <AnimatePresence>
                        {isHovered && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="font-medium text-sm whitespace-nowrap"
                            >
                                Настройки
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-4 p-3.5 rounded-2xl text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 group"
                >
                    <div className="shrink-0">
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                    </div>
                    <AnimatePresence>
                        {isHovered && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="font-medium text-sm whitespace-nowrap"
                            >
                                Выйти
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </aside>
    );
}

