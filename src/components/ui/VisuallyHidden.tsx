"use client";

import { ReactNode } from 'react';

interface VisuallyHiddenProps {
    children: ReactNode;
    asChild?: boolean;
}

export function VisuallyHidden({ children, asChild = false }: VisuallyHiddenProps) {
    const className = "sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0";

    if (asChild) {
        return <span className={className}>{children}</span>;
    }

    return (
        <span className={className}>
            {children}
        </span>
    );
}
