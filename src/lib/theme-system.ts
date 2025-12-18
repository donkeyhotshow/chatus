"use client";

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeColor = 'cyan' | 'purple' | 'blue' | 'green' | 'orange';
export type Density = 'comfortable' | 'compact';

export interface UIPreferences {
    theme: ThemeMode;
    accentColor: ThemeColor;
    density: Density;
    reducedMotion: boolean;
}

export const defaultPreferences: UIPreferences = {
    theme: 'system',
    accentColor: 'cyan',
    density: 'comfortable',
    reducedMotion: false
};

export const accentColors = {
    cyan: {
        primary: '#06b6d4',
        soft: '#0891b2',
        light: '#67e8f9',
        dark: '#0e7490'
    },
    purple: {
        primary: '#8b5cf6',
        soft: '#7c3aed',
        light: '#c4b5fd',
        dark: '#5b21b6'
    },
    blue: {
        primary: '#3b82f6',
        soft: '#2563eb',
        light: '#93c5fd',
        dark: '#1d4ed8'
    },
    green: {
        primary: '#10b981',
        soft: '#059669',
        light: '#6ee7b7',
        dark: '#047857'
    },
    orange: {
        primary: '#f59e0b',
        soft: '#d97706',
        light: '#fcd34d',
        dark: '#b45309'
    }
};

export class ThemeManager {
    private preferences: UIPreferences;
    private mediaQuery: MediaQueryList;
    private listeners: Set<(preferences: UIPreferences) => void> = new Set();

    constructor() {
        this.preferences = this.loadPreferences();
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.mediaQuery.addEventListener('change', this.handleSystemThemeChange.bind(this));

        // Проверяем prefers-reduced-motion
        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (reducedMotionQuery.matches) {
            this.preferences.reducedMotion = true;
        }

        this.applyTheme();
    }

    private loadPreferences(): UIPreferences {
        try {
            const stored = localStorage.getItem('uiPreferences');
            if (stored) {
                return { ...defaultPreferences, ...JSON.parse(stored) };
            }
        } catch (error) {
            console.warn('Failed to load UI preferences:', error);
        }
        return { ...defaultPreferences };
    }

    private savePreferences(): void {
        try {
            localStorage.setItem('uiPreferences', JSON.stringify(this.preferences));
        } catch (error) {
            console.warn('Failed to save UI preferences:', error);
        }
    }

    private handleSystemThemeChange(): void {
        if (this.preferences.theme === 'system') {
            this.applyTheme();
            this.notifyListeners();
        }
    }

    private getEffectiveTheme(): 'light' | 'dark' {
        if (this.preferences.theme === 'system') {
            return this.mediaQuery.matches ? 'dark' : 'light';
        }
        return this.preferences.theme;
    }

    private applyTheme(): void {
        const effectiveTheme = this.getEffectiveTheme();
        const accent = accentColors[this.preferences.accentColor];

        document.documentElement.setAttribute('data-theme', effectiveTheme);
        document.documentElement.setAttribute('data-density', this.preferences.density);
        document.documentElement.setAttribute('data-accent', this.preferences.accentColor);

        if (this.preferences.reducedMotion) {
            document.documentElement.setAttribute('data-reduced-motion', 'true');
        } else {
            document.documentElement.removeAttribute('data-reduced-motion');
        }

        // Применяем CSS-токены
        const root = document.documentElement.style;

        // Акцентные цвета
        root.setProperty('--accent-primary', accent.primary);
        root.setProperty('--accent-soft', accent.soft);
        root.setProperty('--accent-light', accent.light);
        root.setProperty('--accent-dark', accent.dark);

        // Цвета темы
        if (effectiveTheme === 'dark') {
            root.setProperty('--bg-primary', '#000000');
            root.setProperty('--bg-secondary', '#0a0a0a');
            root.setProperty('--bg-tertiary', '#171717');
            root.setProperty('--bg-elevated', '#262626');
            root.setProperty('--text-primary', '#ffffff');
            root.setProperty('--text-secondary', '#a3a3a3');
            root.setProperty('--text-muted', '#525252');
            root.setProperty('--border-primary', 'rgba(255, 255, 255, 0.1)');
            root.setProperty('--border-secondary', 'rgba(255, 255, 255, 0.05)');
        } else {
            root.setProperty('--bg-primary', '#ffffff');
            root.setProperty('--bg-secondary', '#f9fafb');
            root.setProperty('--bg-tertiary', '#f3f4f6');
            root.setProperty('--bg-elevated', '#ffffff');
            root.setProperty('--text-primary', '#111827');
            root.setProperty('--text-secondary', '#6b7280');
            root.setProperty('--text-muted', '#9ca3af');
            root.setProperty('--border-primary', 'rgba(0, 0, 0, 0.1)');
            root.setProperty('--border-secondary', 'rgba(0, 0, 0, 0.05)');
        }

        // Плотность
        if (this.preferences.density === 'compact') {
            root.setProperty('--spacing-xs', '0.25rem');
            root.setProperty('--spacing-sm', '0.5rem');
            root.setProperty('--spacing-md', '0.75rem');
            root.setProperty('--spacing-lg', '1rem');
            root.setProperty('--spacing-xl', '1.5rem');
            root.setProperty('--control-height', '2.5rem');
            root.setProperty('--message-padding', '0.5rem 0.75rem');
        } else {
            root.setProperty('--spacing-xs', '0.5rem');
            root.setProperty('--spacing-sm', '0.75rem');
            root.setProperty('--spacing-md', '1rem');
            root.setProperty('--spacing-lg', '1.5rem');
            root.setProperty('--spacing-xl', '2rem');
            root.setProperty('--control-height', '3rem');
            root.setProperty('--message-padding', '0.75rem 1rem');
        }
    }

    public setTheme(theme: ThemeMode): void {
        this.preferences.theme = theme;
        this.savePreferences();
        this.applyTheme();
        this.notifyListeners();
    }

    public setAccentColor(color: ThemeColor): void {
        this.preferences.accentColor = color;
        this.savePreferences();
        this.applyTheme();
        this.notifyListeners();
    }

    public setDensity(density: Density): void {
        this.preferences.density = density;
        this.savePreferences();
        this.applyTheme();
        this.notifyListeners();
    }

    public getPreferences(): UIPreferences {
        return { ...this.preferences };
    }

    public subscribe(listener: (preferences: UIPreferences) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.preferences));
    }
}

// Singleton instance
let themeManager: ThemeManager | null = null;

export function getThemeManager(): ThemeManager {
    if (typeof window === 'undefined') {
        throw new Error('ThemeManager can only be used in browser environment');
    }

    if (!themeManager) {
        themeManager = new ThemeManager();
    }

    return themeManager;
}

// React hook
import { useState, useEffect } from 'react';

export function useTheme() {
    const [preferences, setPreferences] = useState<UIPreferences>(defaultPreferences);
    const [manager, setManager] = useState<ThemeManager | null>(null);

    useEffect(() => {
        const themeManager = getThemeManager();
        setManager(themeManager);
        setPreferences(themeManager.getPreferences());

        const unsubscribe = themeManager.subscribe(setPreferences);
        return unsubscribe;
    }, []);

    return {
        preferences,
        setTheme: (theme: ThemeMode) => manager?.setTheme(theme),
        setAccentColor: (color: ThemeColor) => manager?.setAccentColor(color),
        setDensity: (density: Density) => manager?.setDensity(density),
    };
}
