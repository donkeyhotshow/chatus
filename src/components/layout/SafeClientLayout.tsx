'use client';

import { ReactNode, lazy, Suspense } from 'react';
import { FirebaseProvider } from '@/components/firebase/FirebaseProvider';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { usePerformance, useMemoryMonitor } from '@/hooks/use-performance';
import { useViewportHeight } from '@/hooks/useViewportHeight';

// Этап 8: Lazy load performance monitor (dev only)
const PerformanceMonitor = lazy(() =>
    import('@/components/dev/PerformanceMonitor').then(m => ({ default: m.PerformanceMonitor }))
);

export function SafeClientLayout({ children }: { children: ReactNode }) {
    usePerformance();
    useMemoryMonitor();
    // Fix iOS 100vh issue - sets --vh CSS variable
    useViewportHeight();

    return (
        <ErrorBoundary>
            <FirebaseProvider>
                {children}
                <Toaster />
                {/* Этап 8: Performance Monitor (dev only, Ctrl+Shift+P) */}
                {process.env.NODE_ENV === 'development' && (
                    <Suspense fallback={null}>
                        <PerformanceMonitor />
                    </Suspense>
                )}
            </FirebaseProvider>
        </ErrorBoundary>
    );
}
