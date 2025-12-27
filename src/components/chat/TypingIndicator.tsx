"use client";

import { memo, useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
    users: string[];
    className?: string;
    hideDelay?: number;
}

/**
 * TypingIndicator - Индикатор "печатает..." с плавной анимацией
 * Этап 2: Улучшенная анимация пульсации точек
 */
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

    if (!isVisible || visibleUsers.length === 0) return null;

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
        <div
            className={cn(
                "flex items-center gap-2 px-4 py-2 transition-all duration-300 ease-out",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
                className
            )}
            role="status"
            aria-live="polite"
            aria-label={getTypingText()}
        >
            {/* Typing bubble */}
            <div className="flex items-center gap-2.5 px-3.5 py-2 bg-[var(--bg-tertiary)] border border-white/[0.08] rounded-2xl shadow-sm">
                {/* Animated dots - улучшенная пульсирующая анимация */}
                <div className="flex items-center gap-1" aria-hidden="true">
                    <span
                        className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-typing-dot"
                        style={{ animationDelay: '0ms' }}
                    />
                    <span
                        className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-typing-dot"
                        style={{ animationDelay: '160ms' }}
                    />
                    <span
                        className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-typing-dot"
                        style={{ animationDelay: '320ms' }}
                    />
                </div>
                <span className="text-xs text-[var(--text-tertiary)] font-medium">
                    {getTypingText()}
                </span>
            </div>
        </div>
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

    if (!isVisible || visibleUsers.length === 0) return null;

    const typingText = visibleUsers.length === 1
        ? `${visibleUsers[0]} печатает`
        : `${visibleUsers.length} печатают`;

    return (
        <div
            className={cn(
                "flex items-center justify-center py-1.5 transition-all duration-300 ease-out",
                isVisible ? "opacity-100" : "opacity-0",
                className
            )}
            role="status"
            aria-live="polite"
            aria-label={typingText}
        >
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-tertiary)] border border-white/[0.08] rounded-full">
                <div className="flex gap-0.5" aria-hidden="true">
                    <span
                        className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full animate-typing-dot"
                        style={{ animationDelay: '0ms' }}
                    />
                    <span
                        className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full animate-typing-dot"
                        style={{ animationDelay: '160ms' }}
                    />
                    <span
                        className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full animate-typing-dot"
                        style={{ animationDelay: '320ms' }}
                    />
                </div>
                <span className="text-[11px] text-[var(--text-muted)] font-medium">
                    {typingText}
                </span>
            </div>
        </div>
    );
});
