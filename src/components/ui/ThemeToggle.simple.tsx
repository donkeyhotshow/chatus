"use client";

import React, { useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
    variant?: 'icon' | 'full';
    className?: string;
}

export function ThemeToggle({
    variant = 'icon',
    className
}: ThemeToggleProps) {
    const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>('dark');

    const themeIcons = {
        light: Sun,
        dark: Moon,
        system: Monitor
    };

    const ThemeIcon = themeIcons[currentTheme];

    const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
        setCurrentTheme(theme);
    };

    if (variant === 'icon') {
        return (
            <div className="relative">
                <button
                    className={cn(
                        "relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200",
                        "bg-slate-800 hover:bg-slate-700 border border-slate-600",
                        "text-slate-300 hover:text-white",
                        className
                    )}
                    aria-label="Переключить тему"
                >
                    <ThemeIcon className="w-5 h-5" />
                </button>
            </div>
        );
    }

    return (
        <div className={cn("space-y-4", className)}>
            <div>
                <h3 className="text-sm font-medium text-white mb-3">Тема</h3>
                <div className="flex gap-2">
                    {(['light', 'dark', 'system'] as const).map((theme) => {
                        const Icon = themeIcons[theme];
                        const labels = {
                            light: 'Светлая',
                            dark: 'Темная',
                            system: 'Авто'
                        };

                        return (
                            <button
                                key={theme}
                                onClick={() => handleThemeChange(theme)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
                                    currentTheme === theme
                                        ? "bg-cyan-500 text-white"
                                        : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="text-sm">{labels[theme]}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
