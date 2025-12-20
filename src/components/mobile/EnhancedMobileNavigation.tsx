"use client";

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Gamepad2, PenTool, Users, Settings, Palette, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSoundDesign } from '@/hooks/use-sound-design';
import { motion, AnimatePresence } from 'framer-motion';

type EnhancedMobileNavigationProps = {
    activeTab: 'chat' | 'games' | 'canvas' | 'users';
    onTabChange: (tab: 'chat' | 'games' | 'canvas' | 'users') => void;
    isCollabSpaceVisible: boolean;
    onToggleCollabSpace: () => void;
    unreadCount?: number;
    isTyping?: boolean;
    connectionStatus?: 'connected' | 'connecting' | 'disconnected';
};

export function EnhancedMobileNavigation({
    activeTab,
    onTabChange,
    isCollabSpaceVisible,
    onToggleCollabSpace,
    unreadCount = 0,
    isTyping = false,
    connectionStatus = 'connected'
}: EnhancedMobileNavigationProps) {
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [lastActiveTab, setLastActiveTab] = useState(activeTab);
    const { playSound, vibrate } = useSoundDesign();
    const profileMenuRef = useRef<HTMLDivElement>(null);

    // Close profile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Track tab changes for animations
    useEffect(() => {
        if (activeTab !== lastActiveTab) {
            setLastActiveTab(activeTab);
        }
    }, [activeTab, lastActiveTab]);

    const handleTabChange = (tab: 'chat' | 'games' | 'canvas' | 'users') => {
        // Enhanced feedback based on tab
        if (tab === 'canvas') {
            playSound('playCanvasSaved');
            vibrate([15, 20, 15, 20, 15]);
        } else if (tab === 'games') {
            playSound('playSuccess');
            vibrate([10, 30, 10]);
        } else {
            playSound('playMessageSent');
            vibrate([10]);
        }

        onTabChange(tab);
    };

    const handleProfileToggle = () => {
        setIsProfileMenuOpen(!isProfileMenuOpen);
        playSound('playColorSelect');
        vibrate([5, 10, 5]);
        onToggleCollabSpace();
    };

    const tabs = [
        {
            id: 'chat' as const,
            label: 'Чат',
            icon: MessageCircle,
            hasNotification: unreadCount > 0,
            notificationCount: unreadCount,
            isActive: isTyping && activeTab === 'chat'
        },
        {
            id: 'games' as const,
            label: 'Игры',
            icon: Gamepad2,
            gradient: 'from-purple-400 to-pink-500'
        },
        {
            id: 'canvas' as const,
            label: 'Холст',
            icon: PenTool,
            isCenter: true,
            gradient: 'from-cyan-400 to-blue-500'
        },
        {
            id: 'users' as const,
            label: 'Люди',
            icon: Users,
            gradient: 'from-green-400 to-emerald-500'
        },
    ];

    const getConnectionColor = () => {
        switch (connectionStatus) {
            case 'connected': return 'bg-green-400';
            case 'connecting': return 'bg-yellow-400 animate-pulse';
            case 'disconnected': return 'bg-red-400 animate-ping';
            default: return 'bg-gray-400';
        }
    };

    return (
        <>
            {/* Enhanced Gaming HUD Navigation */}
            <motion.nav
                className="md:hidden fixed bottom-0 left-0 right-0 z-50"
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                {/* Glassmorphism background with enhanced effects */}
                <div className="relative">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 via-purple-500/10 to-transparent blur-xl" />

                    {/* Main navigation container */}
                    <div className="relative bg-black/80 backdrop-blur-xl border-t border-white/10 rounded-t-3xl">
                        {/* Noise texture overlay */}
                        <div className="absolute inset-0 opacity-30 rounded-t-3xl bg-gradient-mesh" />

                        <div className="relative flex items-end justify-around px-3 py-3" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                            {tabs.map((tab) => {
                                const isCenter = 'isCenter' in tab && tab.isCenter;
                                const isActive = activeTab === tab.id;

                                return (
                                    <motion.button
                                        key={tab.id}
                                        onClick={() => handleTabChange(tab.id)}
                                        className={cn(
                                            "relative flex flex-col items-center justify-center gap-1 transition-all duration-300 touch-manipulation",
                                            isCenter
                                                ? "px-4 py-4 -mt-6 rounded-full min-h-[72px] min-w-[72px] shadow-2xl"
                                                : "px-3 py-3 rounded-2xl min-h-[48px] min-w-[48px]"
                                        )}
                                        whileTap={{ scale: isCenter ? 0.9 : 0.95 }}
                                        whileHover={{ scale: isCenter ? 1.05 : 1.02 }}
                                    >
                                        {/* Background for center button */}
                                        {isCenter && (
                                            <motion.div
                                                className={cn(
                                                    "absolute inset-0 rounded-full bg-gradient-to-br",
                                                    tab.gradient || "from-cyan-400 to-purple-500"
                                                )}
                                                animate={{
                                                    scale: isActive ? [1, 1.1, 1] : 1,
                                                    rotate: isActive ? [0, 5, -5, 0] : 0
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: isActive ? Infinity : 0,
                                                    repeatType: "reverse"
                                                }}
                                            />
                                        )}

                                        {/* Background for regular buttons */}
                                        {!isCenter && isActive && (
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-t from-cyan-500/30 to-blue-500/30 rounded-2xl"
                                                layoutId="activeTab"
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        )}

                                        {/* Icon */}
                                        <div className="relative z-10">
                                            <tab.icon
                                                className={cn(
                                                    "transition-all duration-300",
                                                    isCenter ? "w-8 h-8" : "w-6 h-6",
                                                    isCenter ? "text-black" : isActive ? "text-cyan-300" : "text-neutral-400"
                                                )}
                                            />

                                            {/* Notification badge */}
                                            {tab.hasNotification && tab.notificationCount && (
                                                <motion.div
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-bold"
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                >
                                                    {tab.notificationCount > 99 ? '99+' : tab.notificationCount}
                                                </motion.div>
                                            )}

                                            {/* Typing indicator */}
                                            {tab.isActive && (
                                                <motion.div
                                                    className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
                                                    animate={{ scale: [1, 1.2, 1] }}
                                                    transition={{ duration: 1, repeat: Infinity }}
                                                />
                                            )}
                                        </div>

                                        {/* Label */}
                                        <span className={cn(
                                            "relative z-10 font-medium transition-all duration-300",
                                            isCenter ? "text-xs font-bold text-black" : "text-xs",
                                            isCenter ? "" : isActive ? "text-cyan-300" : "text-neutral-400"
                                        )}>
                                            {tab.label}
                                        </span>

                                        {/* Glow effect for active states */}
                                        {isActive && (
                                            <motion.div
                                                className={cn(
                                                    "absolute inset-0 rounded-full blur-lg",
                                                    isCenter ? "bg-cyan-400/30" : "bg-cyan-500/20"
                                                )}
                                                animate={{ opacity: [0.3, 0.6, 0.3] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                        )}
                                    </motion.button>
                                );
                            })}

                            {/* Enhanced Profile Button */}
                            <div className="relative" ref={profileMenuRef}>
                                <motion.button
                                    onClick={handleProfileToggle}
                                    className={cn(
                                        "relative flex flex-col items-center justify-center gap-1 px-3 py-3 rounded-2xl transition-all duration-300 min-w-[48px] min-h-[48px] touch-manipulation",
                                        isCollabSpaceVisible
                                            ? "bg-gradient-to-t from-orange-500/30 to-red-500/30 scale-105"
                                            : "hover:bg-white/10 hover:scale-105"
                                    )}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {/* Avatar with gradient border */}
                                    <div className="relative">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-black text-sm font-bold">
                                            А
                                        </div>

                                        {/* Connection status indicator */}
                                        <div className={cn(
                                            "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-black",
                                            getConnectionColor()
                                        )} />
                                    </div>

                                    <span className={cn(
                                        "text-xs font-medium transition-colors duration-300",
                                        isCollabSpaceVisible ? "text-orange-300" : "text-neutral-400"
                                    )}>
                                        Профиль
                                    </span>
                                </motion.button>

                                {/* Profile Menu */}
                                <AnimatePresence>
                                    {isProfileMenuOpen && (
                                        <motion.div
                                            className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 min-w-[200px]"
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        >
                                            <div className="space-y-2">
                                                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-left">
                                                    <Settings className="w-4 h-4 text-cyan-400" />
                                                    <span className="text-sm text-white">Настройки</span>
                                                </button>
                                                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-left">
                                                    <Palette className="w-4 h-4 text-purple-400" />
                                                    <span className="text-sm text-white">Темы</span>
                                                </button>
                                                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-left">
                                                    <Zap className="w-4 h-4 text-yellow-400" />
                                                    <span className="text-sm text-white">Эффекты</span>
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* Enhanced spacer with dynamic height */}
            <div
                className="md:hidden flex-shrink-0"
                style={{ height: `calc(6rem + env(safe-area-inset-bottom))` }}
            />
        </>
    );
}
