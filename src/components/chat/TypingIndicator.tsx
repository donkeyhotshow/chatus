"use client";

import { memo, useState, useEffect, useRef } from 'react';
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
        <div className={cn(
            "flex items-center gap-2 px-4 py-2 transition-all duration-300",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
            className
        )}>
            {/* Typing bubble */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-full">
                {/* Animated dots */}
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
                    <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.6s' }} />
                    <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.6s' }} />
                </div>
                <span className="text-xs text-white/50 font-medium">{getTypingText()}</span>
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
            "flex items-center justify-center py-1.5 transition-all duration-300",
            isVisible ? "opacity-100" : "opacity-0",
            className
        )}>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.04] border border-white/[0.06] rounded-full">
                <div className="flex gap-0.5">
                    <div className="w-1 h-1 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
                    <div className="w-1 h-1 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.6s' }} />
                    <div className="w-1 h-1 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.6s' }} />
                </div>
                <span className="text-[11px] text-white/40 font-medium">
                    {visibleUsers.length === 1 ? `${visibleUsers[0]} печатает` : `${visibleUsers.length} печатают`}
                </span>
            </div>
        </div>
    );
});;
