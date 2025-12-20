"use client";

import { memo } from 'react';
import { ArrowLeft, Search, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
    roomId: string;
    otherUser?: { name: string; avatar?: string } | null;
    isOnline?: boolean;
    isCollaborationSpaceVisible?: boolean;
    onToggleCollaborationSpace?: () => void;
    onBack?: () => void;
    onSearchOpen?: () => void;
    onSettings?: () => void;
    className?: string;
}

export const ChatHeader = memo(function ChatHeader({
    roomId,
    otherUser,
    isOnline = false,
    onBack,
    onSearchOpen,
    onSettings,
    className
}: ChatHeaderProps) {
    return (
        <header className={cn(
            "flex items-center justify-between h-14 px-4 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] safe-top shrink-0",
            className
        )}>
            {/* Left section */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors touch-target"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-base font-semibold text-[var(--text-primary)] truncate">
                            {otherUser?.name || `Комната ${roomId}`}
                        </h1>
                        {isOnline && (
                            <span className="w-2 h-2 bg-[var(--success)] rounded-full shrink-0" />
                        )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                        {isOnline ? 'В сети' : 'Не в сети'}
                    </p>
                </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-1 shrink-0">
                {onSearchOpen && (
                    <button
                        onClick={onSearchOpen}
                        className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors touch-target"
                    >
                        <Search className="w-5 h-5" />
                    </button>
                )}

                {onSettings && (
                    <button
                        onClick={onSettings}
                        className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors touch-target"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>
                )}
            </div>
        </header>
    );
});

// Compact header for specific use cases
export const CompactChatHeader = memo(function CompactChatHeader({
    title,
    subtitle,
    onBack,
    rightAction,
    className
}: {
    title: string;
    subtitle?: string;
    onBack?: () => void;
    rightAction?: React.ReactNode;
    className?: string;
}) {
    return (
        <header className={cn(
            "flex items-center justify-between h-12 px-3 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] safe-top shrink-0",
            className
        )}>
            <div className="flex items-center gap-2 min-w-0 flex-1">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="p-1.5 -ml-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors touch-target"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                )}

                <div className="min-w-0">
                    <h1 className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-xs text-[var(--text-muted)] truncate">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>

            {rightAction && (
                <div className="shrink-0">
                    {rightAction}
                </div>
            )}
        </header>
    );
});
