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
    navigationState?: NavigationState | null;
    onBreadcrumbNavigate?: (path: string) => void;
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
            "flex items-center justify-between h-14 px-3 sm:px-4",
            "bg-black/95 backdrop-blur-2xl",
            "border-b border-white/[0.06]",
            "safe-top shrink-0 relative z-40",
            className
        )}>
            {/* Left section */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                {onBack && (
                    <button
                        onClick={onBack}
                        className={cn(
                            "p-2.5 -ml-1 rounded-xl",
                            "text-white/60 hover:text-white",
                            "hover:bg-white/[0.06] active:bg-white/[0.08]",
                            "transition-all duration-200 touch-target",
                            "relative z-50"
                        )}
                        aria-label="Назад"
                        style={{ pointerEvents: 'auto' }}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}

                <div className="min-w-0 flex-1">
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
                        <div className="flex items-center gap-3">
                            {/* Avatar placeholder */}
                            {otherUser?.avatar && (
                                <div
                                    className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-white/10 bg-cover bg-center shrink-0"
                                    style={{ backgroundImage: `url(${otherUser.avatar})` }}
                                />
                            )}
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-[15px] font-semibold text-white truncate">
                                        {roomName}
                                    </h1>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {isOnline && (
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50" aria-label="В сети" />
                                    )}
                                    <p className={cn(
                                        "text-xs truncate",
                                        isOnline ? "text-emerald-400/80" : "text-white/40"
                                    )}>
                                        {isOnline ? 'В сети' : 'Не в сети'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-1 shrink-0">
                {onSearchOpen && (
                    <button
                        onClick={onSearchOpen}
                        className={cn(
                            "p-2.5 rounded-xl",
                            "text-white/50 hover:text-white",
                            "hover:bg-white/[0.06] active:bg-white/[0.08]",
                            "transition-all duration-200 touch-target"
                        )}
                        aria-label="Поиск"
                    >
                        <Search className="w-5 h-5" />
                    </button>
                )}

                {onSettings && (
                    <button
                        onClick={onSettings}
                        className={cn(
                            "p-2.5 rounded-xl",
                            "text-white/50 hover:text-white",
                            "hover:bg-white/[0.06] active:bg-white/[0.08]",
                            "transition-all duration-200 touch-target"
                        )}
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
            "flex items-center justify-between h-12 px-3",
            "bg-black/95 backdrop-blur-2xl",
            "border-b border-white/[0.06]",
            "safe-top shrink-0",
            className
        )}>
            <div className="flex items-center gap-2 min-w-0 flex-1">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="p-2 -ml-1 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06] transition-all touch-target"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                )}

                <div className="min-w-0">
                    <h1 className="text-sm font-medium text-white truncate">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-xs text-white/40 truncate">
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
