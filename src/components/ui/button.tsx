"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    loadingText?: string;
    children?: React.ReactNode;
}

const buttonVariants = {
    primary: "bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]",
    secondary: "bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--border-primary)]",
    ghost: "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]",
    outline: "bg-transparent text-[var(--text-primary)] border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)]",
    destructive: "bg-[var(--error)] text-white hover:bg-red-600"
};

const sizeVariants = {
    sm: "px-3 py-1.5 text-sm min-h-[36px]",
    md: "px-4 py-2 text-sm min-h-[44px]",
    lg: "px-6 py-3 text-base min-h-[48px]",
    icon: "p-2 min-h-[44px] min-w-[44px]"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    loadingText,
    className,
    children,
    disabled,
    ...props
}, ref) => {
    const isDisabled = disabled || isLoading;

    return (
        <button
            ref={ref}
            className={cn(
                "relative inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "touch-target",
                buttonVariants[variant],
                sizeVariants[size],
                className
            )}
            disabled={isDisabled}
            {...props}
        >
            {isLoading && (
                <Loader2 className="w-4 h-4 animate-spin" />
            )}
            <span className={cn(isLoading && !loadingText && "opacity-0")}>
                {isLoading && loadingText ? loadingText : children}
            </span>
        </button>
    );
});

Button.displayName = "Button";
