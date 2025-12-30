"use client";

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
    children: ReactNode;
    sidebar?: ReactNode;
    rightPanel?: ReactNode;
    sidebarCollapsed?: boolean;
    showRightPanel?: boolean;
    className?: string;
}

/**
 * MainLayout - 12-column grid layout wrapper
 * P0-06: Responsive layout с боковыми панелями
 * 
 * Breakpoints:
 * - Desktop (1366px+): Full layout with sidebars
 * - Tablet (1024-1365px): Collapsed sidebar, no right panel
 * - Mobile (<1024px): Single column, overlay sidebars
 */
export function MainLayout({
    children,
    sidebar,
    rightPanel,
    sidebarCollapsed = false,
    showRightPanel = false,
    className
}: MainLayoutProps) {
    return (
        <div className={cn(
            "layout-main",
            sidebarCollapsed && "sidebar-collapsed",
            className
        )}>
            {/* Left Sidebar */}
            {sidebar && (
                <aside className="sidebar-left">
                    {sidebar}
                </aside>
            )}

            {/* Main Content Area */}
            <main className="main-content">
                {children}
            </main>

            {/* Right Panel (optional) */}
            {showRightPanel && rightPanel && (
                <aside className="sidebar-right">
                    {rightPanel}
                </aside>
            )}
        </div>
    );
}

interface GridContainerProps {
    children: ReactNode;
    className?: string;
}

/**
 * GridContainer - 12-column grid container
 */
export function GridContainer({ children, className }: GridContainerProps) {
    return (
        <div className={cn("grid-container", className)}>
            {children}
        </div>
    );
}

interface GridColProps {
    children: ReactNode;
    span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    start?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    className?: string;
}

/**
 * GridCol - Grid column with responsive span
 */
export function GridCol({ children, span = 12, start, className }: GridColProps) {
    return (
        <div className={cn(
            `col-${span}`,
            start && `col-start-${start}`,
            className
        )}>
            {children}
        </div>
    );
}
