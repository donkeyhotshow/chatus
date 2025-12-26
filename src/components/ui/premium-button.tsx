"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface PremiumButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

/**
 * Premium Button Component with micro-interactions
 * Features: Gradient backgrounds, glow effects, smooth animations
 */
export const PremiumButton = React.forwardRef<
  HTMLButtonElement,
  PremiumButtonProps
>(
      variant = "primary",
      size = "md",
      isLoading = false,
      glow = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base styles
          "relative inline-flex items-center justify-center gap-2",
          "font-semibold rounded-xl",
          "transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
          "active:scale-[0.98]",

          // Hover transform (only when not disabled)
          !isDisabled && "hover:scale-[1.02] hover:-translate-y-0.5",

          // Size variants
          size === "sm" && "min-h-[40px] px-4 py-2 text-sm",
          size === "md" && "min-h-[48px] px-6 py-3 text-base",
          size === "lg" && "min-h-[56px] px-8 py-4 text-lg",

          // Variant styles
          variant === "primary" && [
            "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600",
            "text-white",
            "shadow-lg shadow-indigo-500/25",
            !isDisabled && "hover:shadow-xl hover:shadow-indigo-500/35",
            glow && "hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]",
          ],

          variant === "secondary" && [
            "bg-white/10 backdrop-blur-md",
            "text-white",
            "border border-white/20",
            !isDisabled && "hover:bg-white/20 hover:border-white/30",
            glow && "hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]",
          ],

          variant === "ghost" && [
            "bg-transparent",
            "text-[var(--text-secondary)]",
            !isDisabled &&
              "hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]",
          ],

          variant === "danger" && [
            "bg-gradient-to-r from-red-500 to-rose-600",
            "text-white",
            "shadow-lg shadow-red-500/25",
            !isDisabled && "hover:shadow-xl hover:shadow-red-500/35",
          ],

          className
        )}
        {...props}
      >
        {/* Gradient overlay for depth */}
        <span className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {children}
        </span>
      </button>
    );
  }
);

PremiumButton.displayName = "PremiumButton";
