"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowUp, ArrowDown, Calendar, User } from 'lucide-react';
import { Message, UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ChatSearchProps {
    messages: Message[];
    users: UserProfile[];
    isOpen: boolean;
    onClose: () => void;
    onMessageSelect: (messageId: string) => void;
}

interface SearchResult {
    message: Message;
    user: UserProfile | null;
    highlightedText: string;
    matchType: 'content' | 'username' | 'date';
}

export function ChatSearch({
    messages,
    users,
    isOpen,
    onClose,
    onMessageSelect
}: ChatSearchProps) {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [searchType, setSearchType] = useState<'all' | 'content' | 'user' | 'date'>('all');

    // Search results with highlighting
    const searchResults = useMemo(() => {
        if (!query.trim()) return [];

        const results: SearchResult[] = [];
        const searchTerm = query.toLowerCase().trim();

        messages.forEach(message => {
            const user = users.find(u => u.id === message.user?.id) || null;
            let matchType: 'content' | 'username' | 'date' = 'content';
            let highlightedText = message.text;

            // Search in message content
            if (searchType === 'all' || searchType === 'content') {
                if (message.text.toLowerCase().includes(searchTerm)) {
                    const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
                    highlightedText = message.text.replace(regex, '<mark>$1</mark>');
                    matchType = 'content';
                    results.push({ message, user, highlightedText, matchType });
                    return;
                }
            }

            // Search in username
            if ((searchType === 'all' || searchType === 'user') && user) {
                if (user.name.toLowerCase().includes(searchTerm)) {
                    matchType = 'username';
                    results.push({ message, user, highlightedText, matchType });
                    return;
                }
            }

            // Search in date
            if (searchType === 'all' || searchType === 'date') {
                const messageDate = format(message.createdAt.toDate(), 'dd.MM.yyyy HH:mm', { locale: ru });
                if (messageDate.includes(searchTerm)) {
                    matchType = 'date';
                    results.push({ message, user, highlightedText, matchType });
                }
            }
        });

        return results.reverse(); // Show newest first
    }, [messages, users, query, searchType]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'Escape':
                    onClose();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev =>
                        prev < searchResults.length - 1 ? prev + 1 : 0
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev =>
                        prev > 0 ? prev - 1 : searchResults.length - 1
                    );
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (searchResults[selectedIndex]) {
                        onMessageSelect(searchResults[selectedIndex].message.id);
                        onClose();
                    }
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, searchResults, selectedIndex, onClose, onMessageSelect]);

    // Reset selection when results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [searchResults]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col"
            >
                {/* Search Header */}
                <div className="flex-shrink-0 p-4 border-b border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Поиск сообщений, пользователей, дат..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full bg-neutral-800 text-white placeholder-neutral-400 pl-10 pr-4 py-3 rounded-lg border border-neutral-700 focus:border-cyan-500 focus:outline-none mobile-input"
                                autoFocus
                            />
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 hover:bg-white/10 rounded-lg transition-colors touch-target"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    {/* Search Type Filters */}
                    <div className="flex gap-2 overflow-x-auto">
                        {[
                            { key: 'all', label: 'Все', icon: Search },
                            { key: 'content', label: 'Текст', icon: Search },
                            { key: 'user', label: 'Пользователи', icon: User },
                            { key: 'date', label: 'Дата', icon: Calendar }
                        ].map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setSearchType(key as any)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap touch-target",
                                    searchType === key
                                        ? "bg-cyan-500 text-black"
                                        : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Results */}
                <div className="flex-1 overflow-y-auto">
                    {query.trim() === '' ? (
                        <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                            <Search className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-lg font-medium">Поиск по чату</p>
                            <p className="text-sm text-center max-w-sm mt-2">
                                Введите текст для поиска сообщений, имен пользователей или дат
                            </p>
                        </div>
                    ) : searchResults.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                            <Search className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-lg font-medium">Ничего не найдено</p>
                            <p className="text-sm text-center max-w-sm mt-2">
                                Попробуйте изменить поисковый запрос или фильтры
                            </p>
                        </div>
                    ) : (
                        <div className="p-4 space-y-2">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm text-neutral-400">
                                    Найдено {searchResults.length} результатов
                                </p>
                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                    <ArrowUp className="w-3 h-3" />
                                    <ArrowDown className="w-3 h-3" />
                                    <span>для навигации</span>
                                </div>
                            </div>

                            {searchResults.map((result, index) => (
                                <motion.button
                                    key={result.message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => {
                                        onMessageSelect(result.message.id);
                                        onClose();
                                    }}
                                    className={cn(
                                        "w-full text-left p-3 rounded-lg transition-colors touch-target",
                                        selectedIndex === index
                                            ? "bg-cyan-500/20 border border-cyan-500/50"
                                            : "bg-neutral-800/50 hover:bg-neutral-700/50"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* User Avatar */}
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-black text-sm font-bold">
                                            {result.user?.name.charAt(0).toUpperCase() || '?'}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* User and Date */}
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={cn(
                                                    "font-medium text-sm",
                                                    result.matchType === 'username' ? "text-cyan-300" : "text-white"
                                                )}>
                                                    {result.user?.name || 'Unknown'}
                                                </span>
                                                <span className={cn(
                                                    "text-xs",
                                                    result.matchType === 'date' ? "text-cyan-300" : "text-neutral-400"
                                                )}>
                                                    {format(result.message.createdAt.toDate(), 'dd.MM.yyyy HH:mm', { locale: ru })}
                                                </span>
                                            </div>

                                            {/* Message Content */}
                                            <div
                                                className="text-sm text-neutral-300 line-clamp-2"
                                                dangerouslySetInnerHTML={{
                                                    __html: result.highlightedText.replace(
                                                        /<mark>/g,
                                                        '<mark class="bg-cyan-500/30 text-cyan-300 px-1 rounded">'
                                                    )
                                                }}
                                            />

                                            {/* Match Type Badge */}
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={cn(
                                                    "text-xs px-2 py-1 rounded-full",
                                                    result.matchType === 'content' && "bg-green-500/20 text-green-300",
                                                    result.matchType === 'username' && "bg-blue-500/20 text-blue-300",
                                                    result.matchType === 'date' && "bg-purple-500/20 text-purple-300"
                                                )}>
                                                    {result.matchType === 'content' && 'В тексте'}
                                                    {result.matchType === 'username' && 'В имени'}
                                                    {result.matchType === 'date' && 'По дате'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Search Tips */}
                {query.trim() === '' && (
                    <div className="flex-shrink-0 p-4 border-t border-white/10">
                        <div className="text-xs text-neutral-500 space-y-1">
                            <p><strong>Советы по поиску:</strong></p>
                            <p>• Используйте фильтры для уточнения поиска</p>
                            <p>• Поиск работает по частичному совпадению</p>
                            <p>• Навигация: ↑↓ для выбора, Enter для перехода</p>
                        </div>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
