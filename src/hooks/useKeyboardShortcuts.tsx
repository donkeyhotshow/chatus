"use client";

import { useEffect, useCallback } from 'react';

type ShortcutHandler = () => void;

interface KeyboardShortcuts {
    onSearch?: ShortcutHandler;
    onNewChat?: ShortcutHandler;
    onSend?: ShortcutHandler;
    onEscape?: ShortcutHandler;
    onNavigateChat?: (index: number) => void;
}

/**
 * useKeyboardShortcuts - Хук для keyboard navigation
 * Этап 4: Desktop keyboard shortcuts
 *
 * Shortcuts:
 * - Ctrl/Cmd+K: Поиск
 * - Ctrl/Cmd+N: Новый чат
 * - Ctrl/Cmd+Enter: Отправить
 * - Ctrl/Cmd+1-9: Навигация по чатам
 * - Escape: Закрыть модалки/отменить
 */
export function useKeyboardShortcuts({
    onSearch,
    onNewChat,
    onSend,
    onEscape,
    onNavigateChat,
}: KeyboardShortcuts) {
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const isMod = e.metaKey || e.ctrlKey;
        const target = e.target as HTMLElement;

        // Don't trigger shortcuts when typing in inputs (except for specific ones)
        const isInput = target.tagName === 'INPUT' ||
                       target.tagName === 'TEXTAREA' ||
                       target.isContentEditable;

        // Escape - always works
        if (e.key === 'Escape' && onEscape) {
            e.preventDefault();
            onEscape();
            return;
        }

        // Ctrl/Cmd+Enter - send (works in inputs)
        if (isMod && e.key === 'Enter' && onSend) {
            e.preventDefault();
            onSend();
            return;
        }

        // Skip other shortcuts if in input
        if (isInput) return;

        // Ctrl/Cmd+K - search
        if (isMod && e.key === 'k') {
            e.preventDefault();
            onSearch?.();
            return;
        }

        // Ctrl/Cmd+N - new chat
        if (isMod && e.key === 'n') {
            e.preventDefault();
            onNewChat?.();
            return;
        }

        // Ctrl/Cmd+1-9 - navigate to chat
        if (isMod && e.key >= '1' && e.key <= '9' && onNavigateChat) {
            e.preventDefault();
            const index = parseInt(e.key, 10) - 1;
            onNavigateChat(index);
            return;
        }
    }, [onSearch, onNewChat, onSend, onEscape, onNavigateChat]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}

/**
 * KeyboardShortcutsHint - Компонент подсказки для shortcuts
 */
export function KeyboardShortcutsHint() {
    const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
    const modKey = isMac ? '⌘' : 'Ctrl';

    return (
        <div className="hidden md:flex items-center gap-4 text-xs text-[var(--text-disabled)]">
            <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px]">{modKey}+K</kbd>
                <span>Поиск</span>
            </span>
            <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px]">{modKey}+N</kbd>
                <span>Новый чат</span>
            </span>
        </div>
    );
}
