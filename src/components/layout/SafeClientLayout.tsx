'use client';

import { ReactNode } from 'react';
import { FirebaseProvider } from '@/components/firebase/FirebaseProvider';
import { Toaster } from '@/components/ui/toaster';

export function SafeClientLayout({ children }: { children: ReactNode }) {
    return (
        <FirebaseProvider>
            {children}
            <Toaster />
        </FirebaseProvider>
    );
}
