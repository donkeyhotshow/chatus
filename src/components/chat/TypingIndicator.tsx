"use client";

import { memo, useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
    users: string[];
    className?: string;
    hideDelay?: number; // Задержка перед скрытием (мс)
}

export const TypingIndicator = memo(function TypingIndicator({
    users,
    className,
    hideDelay = 3000 // 3 секунды по умолчанию
}: TypingIndicatorProps) {
    const [visibleUsers, setVisibleUsers] = useState<string[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Очищаем предыдущий таймаут
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }

        if (users && users.length > 0) {
            // Есть печатающие пользователи - показываем сразу
            setVisibleUsers(users);
            setIsVisible(true);
        } else if (visibleUsers.length > 0) {
            // Пользователи перестали печатать - задержка перед скрытием
            hideTimeoutRef.current = setTimeout(() => {
                setIsVisible(false);
                // Ещё небольшая задержка перед очисткой для анимации
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
            return `${visibleUsers[0]} печатает...`;
        } else if (visibleUsers.length === 2) {
            return `${visibleUsers[0]} и ${visibleUsers[1]} печатают...`;
        } else {
            return `${visibleUsers[0]} и еще ${visibleUsers.length - 1} печатают...`;
        }
    };

    return (
        <div className={cn(
            "flex items-center gap-3 px-4 py-2 text-[var(--text-muted)] transition-opacity duration-300",
            isVisible ? "opacity-100" : "opacity-0",
            className
        )}>
            {/* Avatar placeholder */}
            <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                <div className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-pulse" />
            </div>

            {/* Typing text and animation */}
            <div className="flex items-center gap-2">
                <span className="text-sm">{getTypingText()}</span>
                <div className="flex gap-1">
                    <div className="w-1 h-1 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-1 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-1 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
});

// Compact version for mobile
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

    return (
        <div className={cn(
            "flex items-center justify-center py-2 text-[var(--text-muted)] transition-opacity duration-300",
            isVisible ? "opacity-100" : "opacity-0",
            className
        )}>
            <div className="flex items-center gap-2 px-3 py-1 bg-[var(--bg-tertiary)] rounded-full">
                <span className="text-xs">
                    {visibleUsers.length === 1 ? `${visibleUsers[0]} печатает` : `${visibleUsers.length} печатают`}
                </span>
                <div className="flex gap-0.5">
                    <div className="w-1 h-1 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-1 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-1 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
});
