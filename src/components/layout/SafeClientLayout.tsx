'use client';

import { ReactNode } from 'react';

export function SafeClientLayout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
