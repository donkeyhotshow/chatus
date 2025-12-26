"use client";

importact from "react";
import { cn } from "@/lib/utils";

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "glass";
  hover?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

/**
 * Premium Card Component with glassmorphism and micro-interactions
 * Features: Backdrop blur, gradient overlays, hover animations
 */
export const PremiumCard = React.forwardRef<HTMLDivElement, PremiumCardProps>(
  (
    {
      variant = "default",
      hover = true,
      glow = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          "relative rounded-2xl overflow-hidden",
          "transition-all duration-300 ease-out",

          // Variant styles
          variant === "default" && [
            "bg-[var(--bg-card)]",
            "border border-[var(--glass-border)]",
            "shadow-lg",
          ],

          variant === "elevated" && [
            "bg-[var(--bg-card)]",
            "border border-[var(--glass-border)]",
            "shadow-xl shadow-black/20",
          ],

          variant === "glass" && [
            "bg-[var(--glass-bg)]",
            "backdrop-blur-xl",
            "border border-[var(--glass-border)]",
            "shadow-lg",
          ],

          // Hover effects
          hover && [
            "hover:-translate-y-1",
            "hover:shadow-xl",
            "hover:border-[var(--primary)]/30",
          ],

          // Glow effect
          glow && hover && "hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]",

          className
        )}
        {...props}
      >
        {/* Gradient overlay for premium feel */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.07] to-transparent pointer-events-none" />

        {/* Subtle border glow on hover */}
        <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 pointer-events-none" />

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);

PremiumCard.displayName = "PremiumCard";

/**
 * Premium Card Header
 */
export const PremiumCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-6 pb-4 space-y-1.5", className)}
    {...props}
  />
));
PremiumCardHeader.displayName = "PremiumCardHeader";

/**
 * Premium Card Title
 */
export const PremiumCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-bold text-[var(--text-primary)] tracking-tight",
      className
    )}
    {...props}
  />
));
PremiumCardTitle.displayName = "PremiumCardTitle";

/**
 * Premium Card Description
 */
export const PremiumCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[var(--text-secondary)]", className)}
    {...props}
  />
));
PremiumCardDescription.displayName = "PremiumCardDescription";

/**
 * Premium Card Content
 */
export const PremiumCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
PremiumCardContent.displayName = "PremiumCardContent";

/**
 * Premium Card Footer
 */
export const PremiumCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "p-6 pt-4 border-t border-[var(--border-primary)]",
      className
    )}
    {...props}
  />
));
PremiumCardFooter.displayName = "PremiumCardFooter";
