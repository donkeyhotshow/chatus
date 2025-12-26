"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationRule {
    test: (value: string) => boolean;
    message: string;
    type?: 'error' | 'warning';
}

interface ValidatedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    label: string;
    value: string;
    onChange: (value: string) => void;
    validationRules?: ValidationRule[];
    showValidation?: boolean;
    suggestions?: string[];
    onSuggestionSelect?: (suggestion: string) => void;
    isLoading?: boolean;
    successMessage?: string;
}

export function ValidatedInput({
    label,
    value,
    onChange,
    validationRules = [],
    showValidation = true,
    suggestions = [],
    onSuggestionSelect,
    isLoading = false,
    successMessage,
    type = 'text',
    className,
    ...props
}: ValidatedInputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [validationResults, setValidationResults] = useState<{
        rule: ValidationRule;
        passed: boolean;
    }[]>([]);

    // Run validation
    useEffect(() => {
        if (validationRules.length > 0) {
            const results = validationRules.map(rule => ({
                rule,
                passed: rule.test(value)
            }));
            setValidationResults(results);
        }
    }, [value, validationRules]);

    const hasErrors = validationResults.some(result => !result.passed && result.rule.type !== 'warning');
    const hasWarnings = validationResults.some(result => !result.passed && result.rule.type === 'warning');
    const isValid = validationResults.length > 0 && validationResults.every(result => result.passed);

    const inputType = type === 'password' && showPassword ? 'text' : type;

    return (
        <div className={cn("relative", className)}>
            {/* Label */}
            <motion.label
                className={cn(
                    "block text-sm font-medium mb-2 transition-colors",
                    isFocused || value
                        ? "text-violet-400"
                        : "text-slate-400"
                )}
                animate={{ color: isFocused || value ? "#a78bfa" : "#94a3b8" }}
            >
                {label}
            </motion.label>

            {/* Input container */}
            <div className="relative">
                <input
                    {...props}
                    type={inputType}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={cn(
                        "w-full px-4 py-3 bg-slate-900/50 border rounded-xl text-white placeholder-slate-500 transition-all duration-300 focus:outline-none backdrop-blur-sm",
                        // Border colors based on validation state
                        hasErrors
                            ? "border-red-500/50 focus:border-red-400 focus:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                            : hasWarnings
                                ? "border-yellow-500/50 focus:border-yellow-400 focus:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                                : isValid
                                    ? "border-green-500/50 focus:border-green-400 focus:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                                    : "border-slate-600/50 focus:border-violet-500 focus:shadow-[0_0_20px_rgba(139,92,246,0.3)]",
                        // Padding for icons
                        type === 'password' ? "pr-12" : isValid || hasErrors || hasWarnings ? "pr-12" : ""
                    )}
                    style={{ fontSize: '16px' }} // Prevent zoom on iOS
                />

                {/* Status icons */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    {/* Loading spinner */}
                    {isLoading && (
                        <motion.div
                            className="w-5 h-5 border-2 border-slate-400 border-t-violet-400 rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                    )}

                    {/* Validation status icon */}
                    {!isLoading && showValidation && (
                        <AnimatePresence mode="wait">
                            {isValid && (
                                <motion.div
                                    key="success"
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0, rotate: 180 }}
                                    className="text-green-400"
                                >
                                    <Check className="w-5 h-5" />
                                </motion.div>
                            )}
                            {hasErrors && (
                                <motion.div
                                    key="error"
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0, rotate: 180 }}
                                    className="text-red-400"
                                >
                                    <X className="w-5 h-5" />
                                </motion.div>
                            )}
                            {hasWarnings && !hasErrors && (
                                <motion.div
                                    key="warning"
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0, rotate: 180 }}
                                    className="text-yellow-400"
                                >
                                    <AlertCircle className="w-5 h-5" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}

                    {/* Password toggle */}
                    {type === 'password' && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    )}
                </div>
            </div>

            {/* Validation messages */}
            <AnimatePresence>
                {showValidation && validationResults.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 space-y-1"
                    >
                        {validationResults.map((result, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={cn(
                                    "flex items-center gap-2 text-xs",
                                    result.passed
                                        ? "text-green-400"
                                        : result.rule.type === 'warning'
                                            ? "text-yellow-400"
                                            : "text-red-400"
                                )}
                            >
                                {result.passed ? (
                                    <Check className="w-3 h-3" />
                                ) : result.rule.type === 'warning' ? (
                                    <AlertCircle className="w-3 h-3" />
                                ) : (
                                    <X className="w-3 h-3" />
                                )}
                                <span>{result.rule.message}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Success message */}
            <AnimatePresence>
                {successMessage && isValid && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-2 flex items-center gap-2 text-xs text-green-400"
                    >
                        <Check className="w-3 h-3" />
                        <span>{successMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Suggestions */}
            <AnimatePresence>
                {suggestions.length > 0 && isFocused && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl z-10"
                    >
                        <div className="p-2">
                            <div className="text-xs text-slate-400 mb-2 px-2">Предложения:</div>
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => onSuggestionSelect?.(suggestion)}
                                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
