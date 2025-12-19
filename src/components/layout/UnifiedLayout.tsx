"use client";

import { ReactNode, useState, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { UnifiedSidebar } from './UnifiedSidebar';
import { UnifiedBottomNav } from './UnifiedBottomNav';

export type NavTab = 'chat' | 'canvas' | 'games' | 'users' | 'settings';

interface UnifiedLayoutProps {
    children: ReactNode;
    activeTab: NavTab;
    onTabChange: (tab: NavTab) => void;
    onLogout?: () => void;
    showNav?: boolean;
    className?: string;
}

export function UnifiedLayout({
    children,
    activeTab,
    onTabChange,
    onLogout,
    showNav = true,
    className
}: UnifiedLayoutProps) {
    const isMobile = useIsMobile();
    const [sidebarExpanded, setSidebarExpanded] = useState(false);

    const handleTabChange = useCallback((tab: NavTab) => {
        onTabChange(tab);
        if (isMobile) {
            setSidebarExpanded(false);
        }
    }, [onTabChange, isMobile]);

    return (
        <div className={cn(
            "flex h-screen-safe w-full overflow-hidden bg-[var(--bg-primary)]",
            className
        )}>
            {/* Desktop Sidebar */}
            {showNav && !isMobile && (
                <UnifiedSidebar
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    onLogout={onLogout}
                    expanded={sidebarExpanded}
                    onExpandedChange={setSidebarExpanded}
                />
            )}

            {/* Main Content */}
            <main className={cn(
                "flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden",
                isMobile && showNav && "pb-[var(--nav-height-mobile)]"
            )}>
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
            {showNav && isMobile && (
                <UnifiedBottomNav
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                />
            )}
        </div>
    );
}
