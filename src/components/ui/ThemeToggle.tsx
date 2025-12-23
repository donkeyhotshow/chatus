"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ThemeMode,
  ThemeState,
  loadThemeFromStorage,
  syncThemeState,
  createThemeStateFromToggle,
  subscribeToSystemThemeChanges,
} from '@/lib/theme-sync';

interface ThemeToggleProps {
  variant?: 'icon' | 'full';
  className?: string;
}

/**
 * ThemeToggle - Переключатель темы с синхронизацией состояния
 *
 * Исправляет BUG-006: переключатель темы не синхронизирован с фактической темой
 *
 * **Feature: chatus-bug-fixes, Property 9: Theme State Synchronization**
 * **Validates: Requirements 9.1, 9.2, 9.3**
 */
export function ThemeToggle({
  variant = 'icon',
  className
}: ThemeToggleProps) {
  const [themeState, setThemeState] = useState<ThemeState>(() => ({
    isDark: true,
    togglePosition: 'dark',
    source: 'system'
  }));

  // Загрузка состояния при монтировании
  // Requirements: 9.3 - восстановление состояния при перезагрузке
  useEffect(() => {
    const savedState = loadThemeFromStorage();
    const syncedState = syncThemeState(savedState);
    setThemeState(syncedState);
  }, []);

  // Подписка на изменения системной темы
  useEffect(() => {
    if (themeState.togglePosition !== 'system') {
      return;
    }

    const unsubscribe = subscribeToSystemThemeChanges((isDark) => {
      setThemeState(prev => {
        if (prev.togglePosition === 'system') {
          const newState: ThemeState = {
            ...prev,
            isDark,
            source: 'system'
          };
          syncThemeState(newState);
          return newState;
        }
        return prev;
      });
    });

    return unsubscribe;
  }, [themeState.togglePosition]);

  // Обработчик изменения темы
  // Requirements: 9.2 - синхронизация при изменении
  const handleThemeChange = useCallback((theme: ThemeMode) => {
    const newState = createThemeStateFromToggle(theme);
    const syncedState = syncThemeState(newState);
    setThemeState(syncedState);
  }, []);

  const themeIcons = {
    light: Sun,
    dark: Moon,
    system: Monitor
  };

  const ThemeIcon = themeIcons[themeState.togglePosition];

  if (variant === 'icon') {
    return (
      <div className="relative">
        <button
          onClick={() => {
            // Циклическое переключение: dark -> light -> system -> dark
            const nextTheme: ThemeMode =
              themeState.togglePosition === 'dark' ? 'light' :
              themeState.togglePosition === 'light' ? 'system' : 'dark';
            handleThemeChange(nextTheme);
          }}
          className={cn(
            "relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200",
            "bg-slate-800 hover:bg-slate-700 border border-slate-600",
            "text-slate-300 hover:text-white",
            className
          )}
          aria-label={`Текущая тема: ${
            themeState.togglePosition === 'dark' ? 'Тёмная' :
            themeState.togglePosition === 'light' ? 'Светлая' : 'Системная'
          }. Нажмите для переключения.`}
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
              dark: 'Тёмная',
              system: 'Авто'
            };

            // Requirements: 9.1 - визуальное состояние toggle соответствует теме
            const isActive = themeState.togglePosition === theme;

            return (
              <button
                key={theme}
                onClick={() => handleThemeChange(theme)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-cyan-500 text-white"
                    : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                )}
                aria-pressed={isActive}
                aria-label={`Выбрать тему: ${labels[theme]}`}
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
