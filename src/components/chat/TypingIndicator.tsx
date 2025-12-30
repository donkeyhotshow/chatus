"use client";

import { memo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
    users: string[];
    className?: string;
    hideDelay?: number;
}
export const TypingIndicator = memo(function TypingIndicator({
    users,
    className,
    hideDelay = 3000
}: TypingIndicatorProps) {
    const [visibleUsers, setVisibleUsers] = useState<string[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }

        if (users && users.length > 0) {
            setVisibleUsers(users);
            setIsVisible(true);
        } else if (visibleUsers.length > 0) {
            hideTimeoutRef.current = setTimeout(() => {
                setIsVisible(false);
                setTimeout(() => setVisibleUsers([]), 300);
            }, hideDelay);
        }

        return () => {
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, [users, hideDelay, visibleUsers.length]);

    const getTypingText = () => {
        if (visibleUsers.length === 1) {
            return `${visibleUsers[0]} печатает`;
        } else if (visibleUsers.length === 2) {
            return `${visibleUsers[0]} и ${visibleUsers[1]} печатают`;
        } else {
            return `${visibleUsers[0]} и еще ${visibleUsers.length - 1} печатают`;
        }
    };

    return (
        <AnimatePresence>
            {isVisible && visibleUsers.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2",
                        className
                    )}
                    role="status"
                    aria-live="polite"
                    aria-label={getTypingText()}
                >
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl shadow-black/20">
                        <div className="flex items-center gap-1.5" aria-hidden="true">
                            {[0, 1, 2].map((i) => (
                                <motion.span
                                    key={i}
                                    animate={{ 
                                        scale: [1, 1.3, 1],
                                        opacity: [0.4, 1, 0.4]
                                    }}
                                    transition={{ 
                                        duration: 1, 
                                        repeat: Infinity, 
                                        delay: i * 0.2,
                                        ease: "easeInOut"
                                    }}
                                    className="w-1.5 h-1.5 bg-violet-400 rounded-full"
                                />
                            ))}
                        </div>
                        <span className="text-xs text-white/50 font-bold tracking-tight uppercase">
                            {getTypingText()}
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});

/**
 * CompactTypingIndicator - Компактная версия для мобильных устройств
 * Этап 2: Улучшенная анимация
 */
export const CompactTypingIndicator = memo(function CompactTypingIndicator({
    users,
    className,
    hideDelay = 3000
}: TypingIndicatorProps) {
    const [visibleUsers, setVisibleUsers] = useState<string[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }

        if (users && users.length > 0) {
            setVisibleUsers(users);
            setIsVisible(true);
        } else if (visibleUsers.length > 0) {
            hideTimeoutRef.current = setTimeout(() => {
                setIsVisible(false);
                setTimeout(() => setVisibleUsers([]), 300);
            }, hideDelay);
        }

        return () => {
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, [users, hideDelay, visibleUsers.length]);

    const typingText = visibleUsers.length === 1
        ? `${visibleUsers[0]} печатает`
        : `${visibleUsers.length} печатают`;

    return (
        <AnimatePresence>
            {isVisible && visibleUsers.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={cn(
                        "flex items-center justify-center py-1.5",
                        className
                    )}
                    role="status"
                    aria-live="polite"
                    aria-label={typingText}
                >
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-full shadow-lg">
                        <div className="flex gap-1" aria-hidden="true">
                            {[0, 1, 2].map((i) => (
                                <motion.span
                                    key={i}
                                    animate={{ 
                                        opacity: [0.3, 1, 0.3]
                                    }}
                                    transition={{ 
                                        duration: 1, 
                                        repeat: Infinity, 
                                        delay: i * 0.2 
                                    }}
                                    className="w-1 h-1 bg-violet-400 rounded-full"
                                />
                            ))}
                        </div>
                        <span className="text-[10px] text-white/40 font-black uppercase tracking-tighter">
                            {typingText}
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});
