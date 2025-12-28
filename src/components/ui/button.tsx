"use client";

import React, { useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    loadingText?: string;
    children?: React.ReactNode;
    enableRipple?: boolean;
}

const buttonVariants = {
    primary: "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] hover:brightness-110",
    secondary: "bg-[var(--bg-tertiary)] text-white border border-white/10 hover:bg-[var(--bg-hover)] hover:border-white/20 hover:scale-[1.02]",
    ghost: "bg-transparent text-white/70 hover:bg-white/5 hover:text-white hover:scale-[1.02]",
    outline: "bg-transparent text-white border border-white/20 hover:bg-white/5 hover:border-white/30 hover:scale-[1.02]",
    destructive: "bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-[1.02]"
};

const sizeVariants = {
    sm: "px-4 py-2 text-sm min-h-[40px]",
    md: "px-5 py-2.5 text-sm min-h-[44px]",
    lg: "px-6 py-3 text-base min-h-[48px]",
    icon: "p-2.5 min-h-[44px] min-w-[44px]"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    loadingText,
    enableRipple = true,
    className,
    children,
    disabled,
    onClick,
    ...props
}, ref) => {
    const isDisabled = disabled || isLoading;
    const buttonRef = useRef<HTMLButtonElement>(null);
    const combinedRef = (ref as React.RefObject<HTMLButtonElement>) || buttonRef;

    // Ripple effect handler
    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        if (isDisabled || !enableRipple) {
            onClick?.(e);
            return;
        }

        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Create ripple element
        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;

        button.appendChild(ripple);

        // Haptic feedback on mobile
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }

        // Remove ripple after animation
        setTimeout(() => {
            ripple.remove();
        }, 600);

        onClick?.(e);
    }, [isDisabled, enableRipple, onClick]);

    return (
        <button
            ref={combinedRef}
            className={cn(
                "relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold overflow-hidden",
                "transition-all duration-200 ease-out",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:transform-none",
                "active:scale-[0.98] active:brightness-95",
                "-webkit-tap-highlight-color-transparent select-none",
                buttonVariants[variant],
                sizeVariants[size],
                className
            )}
            disabled={isDisabled}
            onClick={handleClick}
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
