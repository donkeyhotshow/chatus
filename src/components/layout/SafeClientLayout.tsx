'use client';

import { ReactNode } from 'react';
import { FirebaseProvider } from '@/components/firebase/FirebaseProvider';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { usePerformance, useMemoryMonitor } from '@/hooks/use-performance';

export function SafeClientLayout({ children }: { children: ReactNode }) {
    usePerformance();
    useMemoryMonitor();

    return (

        <ErrorBoundary>
            <FirebaseProvider>
                {children}
                <Toaster />
            </FirebaseProvider>
        </ErrorBoundary>
    );
}

