"use client";

import { useEffect, useCallback } from 'react';

type ShortcutHandler = () => void;

interface KeyboardShortcuts {
    onSearch?: ShortcutHandler;
    onNewChat?: ShortcutHandler;
    onSend?: ShortcutHandler;
    onEscape?: ShortcutHandler;
    onNavigateChat?: (index: number) => void;
    onNewLine?: ShortcutHandler; // Этап 9: Ctrl+Enter для переноса строки
    onNavigateUp?: ShortcutHandler; // Этап 9: Навигация по сообщениям
    onNavigateDown?: ShortcutHandler;
    onReply?: ShortcutHandler;
    onCopy?: ShortcutHandler;
    enabled?: boolean;
}

/**
 * useKeyboardShortcuts - Хук для keyboard navigation
 * Этап 4 + Этап 9: Desktop keyboard shortcuts
 *
 * Shortcuts:
 * - Ctrl/Cmd+K: Поиск
 * - Ctrl/Cmd+N: Новый чат
 * - Ctrl/Cmd+Enter: Отправить (или перенос строки если onNewLine)
 * - Ctrl/Cmd+1-9: Навигация по чатам
 * - Escape: Закрыть модалки/отменить
 * - Arrow Up/Down: Навигация по сообщениям (Этап 9)
 * - R: Ответить на выбранное сообщение (Этап 9)
 * - C: Копировать выбранное сообщение (Этап 9)
 */
export function useKeyboardShortcuts({
    onSearch,
    onNewChat,
    onSend,
    onEscape,
    onNavigateChat,
    onNewLine,
    onNavigateUp,
    onNavigateDown,
    onReply,
    onCopy,
    enabled = true,
}: KeyboardShortcuts) {
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!enabled) return;

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

        // Ctrl/Cmd+Enter - send or new line
        if (isMod && e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey && onNewLine) {
                // Ctrl+Shift+Enter for new line
                onNewLine();
            } else if (onSend) {
                onSend();
            }
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

        // Этап 9: Arrow navigation for messages
        // Skip if focus is on canvas or game element (let games handle their own input)
        const isGameActive = target.tagName === 'CANVAS' ||
                            target.closest('[data-game]') !== null ||
                            target.closest('.game-container') !== null;

        if (e.key === 'ArrowUp' && onNavigateUp && !isGameActive) {
            e.preventDefault();
            onNavigateUp();
            return;
        }

        if (e.key === 'ArrowDown' && onNavigateDown && !isGameActive) {
            e.preventDefault();
            onNavigateDown();
            return;
        }

        // Этап 9: R for reply
        if ((e.key === 'r' || e.key === 'R') && onReply && !isMod) {
            e.preventDefault();
            onReply();
            return;
        }

        // Этап 9: C for copy (without Ctrl to avoid conflict with system copy)
        if ((e.key === 'c' || e.key === 'C') && onCopy && !isMod) {
            e.preventDefault();
            onCopy();
            return;
        }
    }, [enabled, onSearch, onNewChat, onSend, onEscape, onNavigateChat, onNewLine, onNavigateUp, onNavigateDown, onReply, onCopy]);

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
            <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px]">↑↓</kbd>
                <span>Навигация</span>
            </span>
        </div>
    );
}

/**
 * KeyboardShortcutsHelp - Полная справка по горячим клавишам
 */
export function KeyboardShortcutsHelp() {
    const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
    const modKey = isMac ? '⌘' : 'Ctrl';

    const shortcuts = [
        { keys: `${modKey}+K`, description: 'Открыть поиск' },
        { keys: `${modKey}+N`, description: 'Новый чат' },
        { keys: `${modKey}+Enter`, description: 'Отправить сообщение' },
        { keys: `${modKey}+1-9`, description: 'Перейти к чату' },
        { keys: '↑ / ↓', description: 'Навигация по сообщениям' },
        { keys: 'R', description: 'Ответить на сообщение' },
        { keys: 'C', description: 'Копировать сообщение' },
        { keys: 'Escape', description: 'Закрыть / Отменить' },
    ];

    return (
        <div className="p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                Горячие клавиши
            </h3>
            <div className="space-y-2">
                {shortcuts.map((shortcut) => (
                    <div key={shortcut.keys} className="flex items-center justify-between text-sm">
                        <span className="text-[var(--text-secondary)]">{shortcut.description}</span>
                        <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-[var(--text-muted)]">
                            {shortcut.keys}
                        </kbd>
                    </div>
                ))}
            </div>
        </div>
    );
}
