"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface AdaptiveLayoutProps {
    children: React.ReactNode;
    header?: React.ReactNode;
    footer?: React.ReactNode;
    sidebar?: React.ReactNode;
    className?: string;
    enablePullToRefresh?: boolean;
    onPullToRefresh?: () => Promise<void>;
    keyboardAware?: boolean;
}

export function AdaptiveLayout({
    children,
    header,
    footer,
    sidebar,
    className,
    enablePullToRefresh = false,
    onPullToRefresh,
    keyboardAware = true
}: AdaptiveLayoutProps) {
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const isMobile = useIsMobile();
    const containerRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);
    const currentY = useRef(0);
    const initialViewportHeight = useRef(0);

    // Initialize viewport height
    useEffect(() => {
        if (typeof window !== 'undefined') {
            initialViewportHeight.current = window.visualViewport?.height || window.innerHeight;
        }
    }, []);

    // Keyboard detection
    const handleViewportChange = useCallback(() => {
        if (!keyboardAware || !isMobile) return;

        const currentHeight = window.visualViewport?.height || window.innerHeight;
        const heightDifference = initialViewportHeight.current - currentHeight;

        const keyboardVisible = heightDifference > 150;
        const calculatedKeyboardHeight = keyboardVisible ? heightDifference : 0;

        setKeyboardHeight(calculatedKeyboardHeight);
        setIsKeyboardVisible(keyboardVisible);
    }, [keyboardAware, isMobile]);

    useEffect(() => {
        if (!keyboardAware || !isMobile) return;

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleViewportChange);
            return () => window.visualViewport?.removeEventListener('resize', handleViewportChange);
        } else {
            window.addEventListener('resize', handleViewportChange);
            return () => window.removeEventListener('resize', handleViewportChange);
        }
    }, [keyboardAware, isMobile, handleViewportChange]);

    // Pull to refresh handlers
    const handleTouchStart = useCallback((e: TouchEvent) => {
        if (!enablePullToRefresh || !containerRef.current) return;

        const scrollTop = containerRef.current.scrollTop;
        if (scrollTop > 0) return; // Only allow pull to refresh at top

        startY.current = e.touches[0].clientY;
    }, [enablePullToRefresh]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!enablePullToRefresh || !containerRef.current || startY.current === 0) return;

        currentY.current = e.touches[0].clientY;
        const diff = currentY.current - startY.current;

        if (diff > 0 && containerRef.current.scrollTop === 0) {
            e.preventDefault();
            setPullDistance(Math.min(diff * 0.5, 100)); // Damping effect
        }
    }, [enablePullToRefresh]);

    const handleTouchEnd = useCallback(async () => {
        if (!enablePullToRefresh || pullDistance < 60) {
            setPullDistance(0);
            return;
        }

        setIsRefreshing(true);
        try {
            await onPullToRefresh?.();
        } finally {
            setIsRefreshing(false);
            setPullDistance(0);
        }

        startY.current = 0;
        currentY.current = 0;
    }, [enablePullToRefresh, pullDistance, onPullToRefresh]);

    useEffect(() => {
        if (!enablePullToRefresh || !isMobile) return;

        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [enablePullToRefresh, isMobile, handleTouchStart, handleTouchMove, handleTouchEnd]);

    return (
        <div
            className={cn(
                "relative w-full h-full flex flex-col overflow-hidden",
                className
            )}
            style={{
                height: keyboardAware && isKeyboardVisible
                    ? `calc(100vh - ${keyboardHeight}px)`
                    : '100vh'
            }}
        >
            {/* Pull to refresh indicator */}
            {enablePullToRefresh && isMobile && (
                <motion.div
                    className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    style={{ height: pullDistance }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: pullDistance > 0 ? 1 : 0 }}
                >
                    <motion.div
                        className="flex items-center gap-2 text-cyan-400"
                        animate={{
                            rotate: isRefreshing ? 360 : 0,
                            scale: pullDistance > 60 ? 1.1 : 1
                        }}
                        transition={{
                            rotate: { duration: 1, repeat: isRefreshing ? Infinity : 0, ease: "linear" },
                            scale: { duration: 0.2 }
                        }}
                    >
                        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full" />
                        <span className="text-sm font-medium">
                            {isRefreshing ? 'Обновление...' : pullDistance > 60 ? 'Отпустите для обновления' : 'Потяните для обновления'}
                        </span>
                    </motion.div>
                </motion.div>
            )}

            {/* Header */}
            {header && (
                <motion.header
                    className="flex-shrink-0 z-40"
                    initial={{ y: -100 }}
                    animate={{ y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    {header}
                </motion.header>
            )}

            {/* Main content area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar for desktop */}
                {sidebar && !isMobile && (
                    <motion.aside
                        className="flex-shrink-0 w-80 border-r border-white/10"
                        initial={{ x: -320 }}
                        animate={{ x: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        {sidebar}
                    </motion.aside>
                )}

                {/* Mobile sidebar overlay */}
                <AnimatePresence>
                    {sidebar && isMobile && sidebarOpen && (
                        <>
                            <motion.div
                                className="fixed inset-0 bg-black/50 z-40"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSidebarOpen(false)}
                            />
                            <motion.aside
                                className="fixed left-0 top-0 bottom-0 w-80 bg-black border-r border-white/10 z-50"
                                initial={{ x: -320 }}
                                animate={{ x: 0 }}
                                exit={{ x: -320 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            >
                                {sidebar}
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>

                {/* Main content */}
                <main
                    ref={containerRef}
                    className="flex-1 overflow-auto relative"
                    style={{
                        transform: enablePullToRefresh && pullDistance > 0
                            ? `translateY(${pullDistance}px)`
                            : undefined,
                        transition: pullDistance === 0 ? 'transform 0.3s ease-out' : undefined
                    }}
                >
                    <motion.div
                        className="h-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>

            {/* Footer */}
            {footer && (
                <motion.footer
                    className="flex-shrink-0 z-40"
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{
                        paddingBottom: keyboardAware && isKeyboardVisible ? 0 : undefined
                    }}
                >
                    {footer}
                </motion.footer>
            )}

            {/* Keyboard spacer */}
            {keyboardAware && isKeyboardVisible && (
                <div style={{ height: keyboardHeight }} className="flex-shrink-0" />
            )}
        </div>
    );
}
