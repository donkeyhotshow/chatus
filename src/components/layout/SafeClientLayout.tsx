'use client';

import { ReactNode } from 'react';
import { FirebaseProvider } from '@/components/firebase/FirebaseProvider';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { usePerformance, useMemoryMonitor } from '@/hooks/use-performance';
import { useViewportHeight } from '@/hooks/useViewportHeight';

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
            </FirebaseProvider>
        </ErrorBoundary>
    );
}
