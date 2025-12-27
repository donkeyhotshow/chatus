"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X, MessageCircle, User, Hash } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface SearchResult {
    type: 'message' | 'user' | 'room';
    id: string;
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
}

interface SearchDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigateChat?: (index: number) => void;
    onNewChat?: () => void;
    recentChats?: { id: string; name: string }[];
}

/**
 * SearchDialog - Глобальный поиск (Ctrl/Cmd+K)
 * Этап 4: Desktop keyboard navigation
 */
export function SearchDialog({
    isOpen,
    onClose,
    onNavigateChat,
    onNewChat,
    recentChats = [],
}: SearchDialogProps) {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when dialog opens
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Generate results based on query
    const results: SearchResult[] = query.trim()
        ? recentChats
            .filter(chat => chat.name.toLowerCase().includes(query.toLowerCase()))
            .map((chat, index) => ({
                type: 'room' as const,
                id: chat.id,
                title: chat.name,
                subtitle: `Ctrl+${index + 1}`,
                icon: <Hash className="w-4 h-4" />,
            }))
        : [
            // Quick actions when no query
            ...(onNewChat ? [{
                type: 'room' as const,
                id: 'new-chat',
                title: 'Новый чат',
                subtitle: 'Ctrl+N',
                icon: <MessageCircle className="w-4 h-4" />,
            }] : []),
            ...recentChats.slice(0, 5).map((chat, index) => ({
                type: 'room' as const,
                id: chat.id,
                title: chat.name,
                subtitle: `Ctrl+${index + 1}`,
                icon: <Hash className="w-4 h-4" />,
            })),
        ];

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            e.preventDefault();
            const result = results[selectedIndex];
            if (result.id === 'new-chat') {
                onNewChat?.();
            } else {
                const chatIndex = recentChats.findIndex(c => c.id === result.id);
                if (chatIndex >= 0) {
                    onNavigateChat?.(chatIndex);
                }
            }
            onClose();
        }
    }, [results, selectedIndex, onNavigateChat, onNewChat, onClose, recentChats]);

    const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
    const modKey = isMac ? '⌘' : 'Ctrl';

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="p-0 gap-0 max-w-lg bg-[var(--bg-secondary)] border-[var(--border-primary)] overflow-hidden">
                <DialogTitle className="sr-only">Поиск</DialogTitle>

                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-primary)]">
                    <Search className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Поиск чатов, пользователей..."
                        className="flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none text-sm"
                    />
                    <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-[var(--text-disabled)]">
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <div className="max-h-[300px] overflow-y-auto py-2">
                    {results.length === 0 ? (
                        <div className="px-4 py-8 text-center text-[var(--text-muted)] text-sm">
                            Ничего не найдено
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {results.map((result, index) => (
                                <button
                                    key={result.id}
                                    onClick={() => {
                                        if (result.id === 'new-chat') {
                                            onNewChat?.();
                                        } else {
                                            const chatIndex = recentChats.findIndex(c => c.id === result.id);
                                            if (chatIndex >= 0) {
                                                onNavigateChat?.(chatIndex);
                                            }
                                        }
                                        onClose();
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                                        index === selectedIndex
                                            ? "bg-[var(--accent-primary)]/10 text-[var(--text-primary)]"
                                            : "text-[var(--text-secondary)] hover:bg-white/5"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                        index === selectedIndex
                                            ? "bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]"
                                            : "bg-white/5 text-[var(--text-muted)]"
                                    )}>
                                        {result.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{result.title}</p>
                                    </div>
                                    {result.subtitle && (
                                        <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-[var(--text-disabled)]">
                                            {result.subtitle}
                                        </kbd>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer hints */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border-primary)] text-[10px] text-[var(--text-disabled)]">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded">↑↓</kbd>
                            навигация
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded">Enter</kbd>
                            выбрать
                        </span>
                    </div>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded">{modKey}+N</kbd>
                        новый чат
                    </span>
                </div>
            </DialogContent>
        </Dialog>
    );
}
