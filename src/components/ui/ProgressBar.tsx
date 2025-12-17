"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
    steps: {
        id: string;
        label: string;
        description?: string;
        completed: boolean;
    }[];
    currentStep: number;
    className?: string;
}

export function ProgressBar({ steps, currentStep, className }: ProgressBarProps) {
    const progress = ((currentStep + 1) / steps.length) * 100;

    return (
        <div className={cn("w-full", className)}>
            {/* Progress bar */}
            <div className="relative mb-8">
                {/* Background track */}
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-lg shadow-cyan-500/25"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                </div>

                {/* Step indicators */}
                <div className="absolute top-0 left-0 w-full flex justify-between transform -translate-y-1/2">
                    {steps.map((step, index) => {
                        const isCompleted = step.completed;
                        const isCurrent = index === currentStep;
                        const isPast = index < currentStep;

                        return (
                            <motion.div
                                key={step.id}
                                className="relative"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                {/* Step circle */}
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                                        isCompleted || isPast
                                            ? "bg-gradient-to-r from-cyan-500 to-blue-500 border-cyan-500 text-black shadow-lg shadow-cyan-500/25"
                                            : isCurrent
                                                ? "bg-slate-900 border-cyan-500 text-cyan-400 shadow-lg shadow-cyan-500/25"
                                                : "bg-slate-800 border-slate-600 text-slate-400"
                                    )}
                                >
                                    {isCompleted ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        <span className="text-xs font-bold">{index + 1}</span>
                                    )}
                                </div>

                                {/* Pulse effect for current step */}
                                {isCurrent && (
                                    <motion.div
                                        className="absolute inset-0 rounded-full border-2 border-cyan-400"
                                        animate={{
                                            scale: [1, 1.5, 1],
                                            opacity: [0.5, 0, 0.5]
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    />
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Step labels */}
            <div className="flex justify-between">
                {steps.map((step, index) => {
                    const isCompleted = step.completed;
                    const isCurrent = index === currentStep;
                    const isPast = index < currentStep;

                    return (
                        <div
                            key={step.id}
                            className="flex flex-col items-center text-center max-w-[120px]"
                        >
                            <motion.h4
                                className={cn(
                                    "text-sm font-medium mb-1 transition-colors",
                                    isCompleted || isPast
                                        ? "text-cyan-400"
                                        : isCurrent
                                            ? "text-white"
                                            : "text-slate-500"
                                )}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.1 + 0.2 }}
                            >
                                {step.label}
                            </motion.h4>

                            {step.description && (
                                <motion.p
                                    className={cn(
                                        "text-xs transition-colors",
                                        isCompleted || isPast
                                            ? "text-cyan-300/70"
                                            : isCurrent
                                                ? "text-slate-300"
                                                : "text-slate-600"
                                    )}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.1 + 0.3 }}
                                >
                                    {step.description}
                                </motion.p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
