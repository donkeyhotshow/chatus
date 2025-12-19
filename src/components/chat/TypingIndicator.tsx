"use client";

import { memo } from 'react';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
    users: string[];
    className?: string;
}

export const TypingIndicator = memo(function TypingIndicator({
    users,
    className
}: TypingIndicatorProps) {
    if (!users || users.length === 0) return null;

    const getTypingText = () => {
        if (users.length === 1) {
            return `${users[0]} печатает...`;
        } else if (users.length === 2) {
            return `${users[0]} и ${users[1]} печатают...`;
        } else {
            return `${users[0]} и еще ${users.length - 1} печатают...`;
        }
    };

    return (
        <div className={cn(
            "flex items-center gap-3 px-4 py-2 text-[var(--text-muted)]",
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
    className
}: TypingIndicatorProps) {
    if (!users || users.length === 0) return null;

    return (
        <div className={cn(
            "flex items-center justify-center py-2 text-[var(--text-muted)]",
            className
        )}>
            <div className="flex items-center gap-2 px-3 py-1 bg-[var(--bg-tertiary)] rounded-full">
                <span className="text-xs">
                    {users.length === 1 ? `${users[0]} печатает` : `${users.length} печатают`}
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
