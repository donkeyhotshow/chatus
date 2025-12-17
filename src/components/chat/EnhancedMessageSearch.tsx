"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowUp, ArrowDown, Calendar, User, MessageCircle, Filter } from 'lucide-react';
import { Message, UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface EnhancedMessageSearchProps {
    messages: Message[];
    users: UserProfile[];
    isOpen: boolean;
    onClose: () => void;
    onMessageSelect: (messageId: string) => void;
}

interface SearchResult {
    message: Message;
    user: UserProfile;
    highlightedText: string;
    matchType: 'content' | 'username' | 'date';
    relevanceScore: number;
}

interface SearchFilters {
    type: 'all' | 'content' | 'user' | 'date';
    dateRange: 'all' | 'today' | 'week' | 'month';
    userId?: string;
}

export function EnhancedMessageSearch({
    messages,
    users,
    isOpen,
    onClose,
    onMessageSelect
}: EnhancedMessageSearchProps) {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [filters, setFilters] = useState<SearchFilters>({
        type: 'all',
        dateRange: 'all'
    });
    const [showFilters, setShowFilters] = useState(false);

    // Advanced search with relevance scoring
    const searchResults = useMemo(() => {
        if (!query.trim()) return [];

        const results: SearchResult[] = [];
        const searchTerm = query.toLowerCase().trim();
        const now = new Date();

        // Date filtering
        const getDateFilter = (messageDate: Date) => {
            const daysDiff = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));

            switch (filters.dateRange) {
                case 'today': return daysDiff === 0;
                case 'week': return daysDiff <= 7;
                case 'month': return daysDiff <= 30;
                default: return true;
            }
        };

        messages.forEach(message => {
            const messageDate = message.createdAt.toDate();
            if (!getDateFilter(messageDate)) return;

            const user = message.user;
            if (filters.userId && user.id !== filters.userId) return;

            let matchType: 'content' | 'username' | 'date' = 'content';
            let highlightedText = message.text;
            let relevanceScore = 0;

            // Content search with relevance scoring
            if ((filters.type === 'all' || filters.type === 'content') && message.text) {
                const textLower = message.text.toLowerCase();
                if (textLower.includes(searchTerm)) {
                    // Higher score for exact matches and matches at word boundaries
                    const exactMatch = textLower === searchTerm;
                    const wordBoundaryMatch = new RegExp(`\\b${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(textLower);
                    const startMatch = textLower.startsWith(searchTerm);

                    relevanceScore = exactMatch ? 100 : wordBoundaryMatch ? 80 : startMatch ? 60 : 40;

                    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                    highlightedText = message.text.replace(regex, '<mark>$1</mark>');
                    matchType = 'content';
                    results.push({ message, user, highlightedText, matchType, relevanceScore });
                    return;
                }
            }

            // Username search
            if ((filters.type === 'all' || filters.type === 'user') && user) {
                const nameLower = user.name.toLowerCase();
                if (nameLower.includes(searchTerm)) {
                    const exactMatch = nameLower === searchTerm;
                    const startMatch = nameLower.startsWith(searchTerm);

                    relevanceScore = exactMatch ? 90 : startMatch ? 70 : 50;
                    matchType = 'username';
                    results.push({ message, user, highlightedText, matchType, relevanceScore });
                    return;
                }
            }

            // Date search
            if (filters.type === 'all' || filters.type === 'date') {
                const dateFormats = [
                    format(messageDate, 'dd.MM.yyyy', { locale: ru }),
                    format(messageDate, 'dd.MM.yyyy HH:mm', { locale: ru }),
                    format(messageDate, 'HH:mm', { locale: ru }),
                    format(messageDate, 'dd MMMM', { locale: ru })
                ];

                if (dateFormats.some(dateStr => dateStr.toLowerCase().includes(searchTerm))) {
                    relevanceScore = 30;
                    matchType = 'date';
                    results.push({ message, user, highlightedText, matchType, relevanceScore });
                }
            }
        });

        // Sort by relevance score and recency
        return results.sort((a, b) => {
            if (a.relevanceScore !== b.relevanceScore) {
                return b.relevanceScore - a.relevanceScore;
            }
            return b.message.createdAt.toDate().getTime() - a.message.createdAt.toDate().getTime();
        });
    }, [messages, users, query, filters]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
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
    }, [isOpen, searchResults, selectedIndex, onClose, onMessageSelect]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Reset selection when results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [searchResults]);

    // Reset state when closing
    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setShowFilters(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-gradient-to-br from-black/95 via-slate-900/98 to-black/95 backdrop-blur-xl z-50 flex flex-col"
            >
                {/* Search Header */}
                <div className="flex-shrink-0 p-6 border-b border-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Поиск сообщений, пользователей, дат..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full bg-gradient-to-r from-slate-900/90 to-slate-800/90 text-white placeholder-slate-400 pl-12 pr-6 py-4 rounded-2xl border border-cyan-500/30 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(0,188,212,0.3)] focus:outline-none backdrop-blur-xl transition-all duration-300"
                                autoFocus
                                style={{ fontSize: '16px' }}
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn(
                                "p-3 rounded-lg transition-colors",
                                showFilters ? "bg-cyan-500 text-black" : "hover:bg-white/10 text-white"
                            )}
                        >
                            <Filter className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-3 hover:bg-white/10 rounded-lg transition-colors text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Advanced Filters */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="space-y-3 pb-4">
                                    {/* Search Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                                            Тип поиска
                                        </label>
                                        <div className="flex gap-2 flex-wrap">
                                            {[
                                                { key: 'all', label: 'Все', icon: Search },
                                                { key: 'content', label: 'Текст', icon: MessageCircle },
                                                { key: 'user', label: 'Пользователи', icon: User },
                                                { key: 'date', label: 'Дата', icon: Calendar }
                                            ].map(({ key, label, icon: Icon }) => (
                                                <button
                                                    key={key}
                                                    onClick={() => setFilters(prev => ({ ...prev, type: key as any }))}
                                                    className={cn(
                                                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                                        filters.type === key
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

                                    {/* Date Range */}
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                                            Период
                                        </label>
                                        <div className="flex gap-2 flex-wrap">
                                            {[
                                                { key: 'all', label: 'Все время' },
                                                { key: 'today', label: 'Сегодня' },
                                                { key: 'week', label: 'Неделя' },
                                                { key: 'month', label: 'Месяц' }
                                            ].map(({ key, label }) => (
                                                <button
                                                    key={key}
                                                    onClick={() => setFilters(prev => ({ ...prev, dateRange: key as any }))}
                                                    className={cn(
                                                        "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                                        filters.dateRange === key
                                                            ? "bg-cyan-500 text-black"
                                                            : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                                                    )}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* User Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                                            Пользователь
                                        </label>
                                        <select
                                            value={filters.userId || ''}
                                            onChange={(e) => setFilters(prev => ({
                                                ...prev,
                                                userId: e.target.value || undefined
                                            }))}
                                            className="bg-neutral-800 text-white border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                                        >
                                            <option value="">Все пользователи</option>
                                            {users.map(user => (
                                                <option key={user.id} value={user.id}>
                                                    {user.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Search Results */}
                <div className="flex-1 overflow-y-auto">
                    {query.trim() === '' ? (
                        <div className="flex flex-col items-center justify-center h-full text-neutral-400 p-8">
                            <Search className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-lg font-medium">Расширенный поиск</p>
                            <p className="text-sm text-center max-w-sm mt-2">
                                Используйте фильтры для точного поиска по сообщениям
                            </p>
                        </div>
                    ) : searchResults.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-neutral-400 p-8">
                            <Search className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-lg font-medium">Ничего не найдено</p>
                            <p className="text-sm text-center max-w-sm mt-2">
                                Попробуйте изменить поисковый запрос или настройки фильтров
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
                                        "w-full text-left p-3 rounded-lg transition-colors",
                                        selectedIndex === index
                                            ? "bg-cyan-500/20 border border-cyan-500/50"
                                            : "bg-neutral-800/50 hover:bg-neutral-700/50"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* User Avatar */}
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-black text-sm font-bold">
                                            {result.user.name.charAt(0).toUpperCase() || '?'}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* User and Date */}
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={cn(
                                                    "font-medium text-sm",
                                                    result.matchType === 'username' ? "text-cyan-300" : "text-white"
                                                )}>
                                                    {result.user.name}
                                                </span>
                                                <span className={cn(
                                                    "text-xs",
                                                    result.matchType === 'date' ? "text-cyan-300" : "text-neutral-400"
                                                )}>
                                                    {format(result.message.createdAt.toDate(), 'dd.MM.yyyy HH:mm', { locale: ru })}
                                                </span>
                                                {/* Relevance Score */}
                                                <span className="text-xs bg-neutral-700 px-2 py-1 rounded-full text-neutral-300">
                                                    {result.relevanceScore}%
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
            </motion.div>
        </AnimatePresence>
    );
}
