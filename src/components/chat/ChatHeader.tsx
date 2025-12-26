"use client";

import { memo } from 'react';
import { ArrowLeft, Search, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Breadcrumb, BreadcrumbCompact } from '@/components/ui/Breadcrumb';
import { NavigationState } from '@/lib/navigation-state';
import { useIsMobile } from '@/hooks/use-mobile';

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
    /** Navigation state for breadcrumb display */
    navigationState?: NavigationState | null;
    /** Callback when breadcrumb item is clicked */
    onBreadcrumbNavigate?: (path: string) => void;
    /** Whether to show breadcrumb */
    showBreadcrumb?: boolean;
}

export const ChatHeader = memo(function ChatHeader({
    roomId,
    otherUser,
    isOnline = false,
    onBack,
    onSearchOpen,
    onSettings,
    className,
    navigationState,
    onBreadcrumbNavigate,
    showBreadcrumb = false
}: ChatHeaderProps) {
    const isMobile = useIsMobile();
    const roomName = otherUser?.name || `Комната ${roomId}`;

    return (
        <header className={cn(
            "flex items-center justify-between h-14 px-4 bg-black/90 backdrop-blur-xl border-b border-white/10 safe-top shrink-0 relative z-40",
            className
        )}>
            {/* Left section */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors touch-target relative z-50"
                        aria-label="Назад"
                        style={{ pointerEvents: 'auto' }}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}

                <div className="min-w-0 flex-1">
                    {/* Show breadcrumb when in nested view (game/canvas) */}
                    {showBreadcrumb && navigationState && (navigationState.currentView === 'game' || navigationState.currentView === 'canvas') ? (
                        isMobile ? (
                            <BreadcrumbCompact
                                navigationState={navigationState}
                                roomName={roomName}
                                onNavigate={onBreadcrumbNavigate}
                            />
                        ) : (
                            <Breadcrumb
                                navigationState={navigationState}
                                roomName={roomName}
                                onNavigate={onBreadcrumbNavigate}
                                showIcons={true}
                                maxItems={4}
                            />
                        )
                    ) : (
                        <>
                            <div className="flex items-center gap-2">
                                <h1 className="text-base font-semibold text-[var(--text-primary)] truncate">
                                    {roomName}
                                </h1>
                                {isOnline && (
                                    <span className="w-2 h-2 bg-[var(--success)] rounded-full shrink-0" aria-label="В сети" />
                                )}
                            </div>
                            <p className="text-xs text-[var(--text-muted)] truncate">
                                {isOnline ? 'В сети' : 'Не в сети'}
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-1 shrink-0">
                {onSearchOpen && (
                    <button
                        onClick={onSearchOpen}
                        className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors touch-target"
                        aria-label="Поиск"
                    >
                        <Search className="w-5 h-5" />
                    </button>
                )}

                {onSettings && (
                    <button
                        onClick={onSettings}
                        className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors touch-target"
                        aria-label="Настройки"
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
            "flex items-center justify-between h-12 px-3 bg-black/90 backdrop-blur-xl border-b border-white/10 safe-top shrink-0",
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
