"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline' | 'default';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const buttonVariants = {
  default: {
    base: "bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-semibold shadow-lg shadow-cyan-500/25",
    hover: "hover:from-cyan-400 hover:to-blue-400 hover:shadow-cyan-500/40 hover:scale-105",
    active: "active:scale-95",
    disabled: "disabled:from-gray-400 disabled:to-gray-500 disabled:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
  },
  primary: {
    base: "bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-semibold shadow-lg shadow-cyan-500/25",
    hover: "hover:from-cyan-400 hover:to-blue-400 hover:shadow-cyan-500/40 hover:scale-105",
    active: "active:scale-95",
    disabled: "disabled:from-gray-400 disabled:to-gray-500 disabled:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
  },
  secondary: {
    base: "bg-gradient-to-r from-slate-700 to-slate-600 text-white border border-slate-500/50",
    hover: "hover:from-slate-600 hover:to-slate-500 hover:border-slate-400/50 hover:scale-105",
    active: "active:scale-95",
    disabled: "disabled:from-gray-600 disabled:to-gray-700 disabled:border-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
  },
  destructive: {
    base: "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/25",
    hover: "hover:from-red-400 hover:to-pink-400 hover:shadow-red-500/40 hover:scale-105",
    active: "active:scale-95",
    disabled: "disabled:from-gray-400 disabled:to-gray-500 disabled:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
  },
  ghost: {
    base: "bg-transparent text-slate-300 border border-transparent",
    hover: "hover:bg-slate-800/50 hover:text-white hover:border-slate-600/50",
    active: "active:bg-slate-700/50",
    disabled: "disabled:text-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
  },
  outline: {
    base: "bg-transparent text-cyan-400 border border-cyan-500/50",
    hover: "hover:bg-cyan-500/10 hover:border-cyan-400 hover:text-cyan-300",
    active: "active:bg-cyan-500/20",
    disabled: "disabled:border-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
  }
};

const sizeVariants = {
  sm: "px-3 py-1.5 text-sm min-h-[36px]",
  md: "px-4 py-2 text-base min-h-[44px]",
  lg: "px-6 py-3 text-lg min-h-[52px]",
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
  const variantClasses = buttonVariants[variant];
  const sizeClasses = sizeVariants[size];

  const isDisabled = disabled || isLoading;

  return (
    <motion.button
      ref={ref}
      className={cn(
        // Base styles
        "relative inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-900",
        // Variant styles
        variantClasses.base,
        !isDisabled && variantClasses.hover,
        !isDisabled && variantClasses.active,
        isDisabled && variantClasses.disabled,
        // Size styles
        sizeClasses,
        className
      )}
      disabled={isDisabled}
      whileTap={!isDisabled ? { scale: 0.95 } : {}}
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      {...props}
    >
      {/* Loading spinner */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Loader2 className="w-5 h-5 animate-spin" />
        </motion.div>
      )}

      {/* Content */}
      <motion.span
        className={cn(
          "flex items-center gap-2",
          isLoading && "opacity-0"
        )}
        initial={false}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {isLoading && loadingText ? loadingText : children}
      </motion.span>

      {/* Shine effect for primary buttons */}
      {variant === 'primary' && !isDisabled && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-xl"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
        />
      )}
    </motion.button>
  );
});

Button.displayName = "Button";
