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
  primary: "bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] focus:ring-[var(--accent-primary)]",
  secondary: "bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] focus:ring-[var(--accent-primary)]",
  ghost: "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] focus:ring-[var(--accent-primary)]",
  outline: "bg-transparent text-[var(--accent-primary)] border border-[var(--accent-primary)] hover:bg-[var(--accent-light)] focus:ring-[var(--accent-primary)]",
  destructive: "bg-[var(--error)] text-white hover:bg-red-700 focus:ring-[var(--error)]"
};

const sizeVariants = {
  sm: "px-3 py-1.5 text-sm min-h-[36px]",
  md: "px-4 py-2 text-base min-h-[44px]",
  lg: "px-6 py-3 text-lg min-h-[48px]",
  icon: "p-2 min-h-[40px] min-w-[40px]"
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
        // Base styles
        "relative inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium transition-all duration-[var(--transition)] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-target",
        // Variant styles
        buttonVariants[variant],
        // Size styles
        sizeVariants[size],
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      )}

      {/* Content */}
      <span className={cn("flex items-center gap-2", isLoading && "opacity-0")}>
        {isLoading && loadingText ? loadingText : children}
      </span>
    </button>
  );
});

Button.displayName = "Button";
