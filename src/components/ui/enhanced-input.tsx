"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { Eye, EyeOff, X, Check, AlertCircle } from "lucide-react";

export interface EnhancedInputProps extends Omit<HTMLMotionProps<"input">, 'size'> {
    label?: string;
    error?: string;
    success?: string;
    hint?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    showPasswordToggle?: boolean;
    clearable?: boolean;
    loading?: boolean;
    variant?: 'default' | 'cyberpunk' | 'minimal' | 'glass';
    size?: 'sm' | 'md' | 'lg';
    onClear?: () => void;
}

const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
    ({
        className,
        type = "text",
        label,
        error,
        success,
        hint,
        leftIcon,
        rightIcon,
        showPasswordToggle = false,
        clearable = false,
        loading = false,
        variant = 'default',
        size = 'md',
        onClear,
        value,
        ...props
    }, ref) => {
        const [showPassword, setShowPassword] = React.useState(false);
        const [isFocused, setIsFocused] = React.useState(false);
        const inputRef = React.useRef<HTMLInputElement>(null);

        // Combine refs
        React.useImperativeHandle(ref, () => inputRef.current!);

        const inputType = showPasswordToggle && type === "password"
            ? (showPassword ? "text" : "password")
            : type;

        const hasValue = value !== undefined ? String(value).length > 0 : false;
        const showClearButton = clearable && hasValue && !loading;
        const showPasswordButton = showPasswordToggle && type === "password";

        const sizeClasses = {
            sm: "h-9 px-3 text-sm",
            md: "h-11 px-4 text-base",
            lg: "h-13 px-5 text-lg"
        };

        const variantClasses = {
            default: "bg-background border-input hover:border-accent-foreground/50 focus:border-primary",
            cyberpunk: "bg-black/50 border-cyan-500/30 hover:border-cyan-400/50 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(0,255,255,0.3)]",
            minimal: "bg-transparent border-0 border-b-2 border-neutral-300 hover:border-neutral-400 focus:border-primary rounded-none",
            glass: "bg-white/5 backdrop-blur-md border-white/10 hover:border-white/20 focus:border-white/30 focus:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
        };

        const handleClear = () => {
            if (inputRef.current) {
                inputRef.current.value = '';
                inputRef.current.focus();
            }
            onClear?.();
        };

        return (
            <div className="space-y-2">
                {/* Label */}
                {label && (
                    <motion.label
                        className={cn(
                            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                            variant === 'cyberpunk' && "text-cyan-300",
                            error && "text-destructive",
                            success && "text-green-500"
                        )}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {label}
                    </motion.label>
                )}

                {/* Input Container */}
                <div className="relative">
                    {/* Left Icon */}
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {leftIcon}
                        </div>
                    )}

                    {/* Input Field */}
                    <motion.input
                        ref={inputRef}
                        type={inputType}
                        className={cn(
                            "flex w-full rounded-md border transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                            sizeClasses[size],
                            variantClasses[variant],
                            leftIcon && "pl-10",
                            (showClearButton || showPasswordButton || rightIcon) && "pr-12",
                            error && "border-destructive focus:border-destructive",
                            success && "border-green-500 focus:border-green-500",
                            isFocused && variant === 'cyberpunk' && "animate-pulse",
                            className
                        )}
                        onFocus={(e) => {
                            setIsFocused(true);
                            props.onFocus?.(e);
                        }}
                        onBlur={(e) => {
                            setIsFocused(false);
                            props.onBlur?.(e);
                        }}
                        value={value}
                        {...props}
                        whileFocus={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />

                    {/* Right Side Icons */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {/* Loading Spinner */}
                        {loading && (
                            <motion.div
                                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                        )}

                        {/* Clear Button */}
                        {showClearButton && (
                            <motion.button
                                type="button"
                                onClick={handleClear}
                                className="p-1 hover:bg-muted rounded-full transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <X className="w-3 h-3" />
                            </motion.button>
                        )}

                        {/* Password Toggle */}
                        {showPasswordButton && (
                            <motion.button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="p-1 hover:bg-muted rounded-full transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                {showPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </motion.button>
                        )}

                        {/* Custom Right Icon */}
                        {rightIcon && !loading && !showClearButton && !showPasswordButton && (
                            <div className="text-muted-foreground">
                                {rightIcon}
                            </div>
                        )}

                        {/* Status Icons */}
                        {error && (
                            <AlertCircle className="w-4 h-4 text-destructive" />
                        )}
                        {success && (
                            <Check className="w-4 h-4 text-green-500" />
                        )}
                    </div>

                    {/* Focus Ring for Cyberpunk variant */}
                    {variant === 'cyberpunk' && isFocused && (
                        <motion.div
                            className="absolute inset-0 rounded-md border-2 border-cyan-400 pointer-events-none"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                        />
                    )}
                </div>

                {/* Helper Text */}
                <AnimatePresence mode="wait">
                    {(error || success || hint) && (
                        <motion.div
                            className="space-y-1"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {error && (
                                <p className="text-sm text-destructive flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {error}
                                </p>
                            )}
                            {success && (
                                <p className="text-sm text-green-500 flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    {success}
                                </p>
                            )}
                            {hint && !error && !success && (
                                <p className="text-sm text-muted-foreground">
                                    {hint}
                                </p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }
);

EnhancedInput.displayName = "EnhancedInput";

export { EnhancedInput };
