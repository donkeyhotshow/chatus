"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowUp, ArrowDown, Calendar, User, MessageCircle } from 'lucide-react';
import DOMPurify from 'dompurify';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Message, UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';


// Helper function to escape regex special characters
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, (match) => '\\' + match);
}

// Helper function to sanitize HTML to prevent XSS
function sanitizeHtml(str: string): string {
    if (typeof window === 'undefined') return str;
    return DOMPurify.sanitize(str);
}


// Helper to safely get date from message
function getMessageDate(createdAt: unknown): Date {
    if (createdAt && typeof createdAt === 'object') {
        if ('toDate' in createdAt && typeof (createdAt as { toDate: () => Date }).toDate === 'function') {
            return (createdAt as { toDate: () => Date }).toDate();
        }
        if ('seconds' in createdAt) {
            return new Date((createdAt as { seconds: number }).seconds * 1000);
        }
    }
    return new Date();
}

interface MessageSearchProps {
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
}

export function MessageSearch({
    messages,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    users,
    isOpen,
    onClose,
    onMessageSelect
}: MessageSearchProps) {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [searchType, setSearchType] = useState<'all' | 'content' | 'user' | 'date'>('all');

    // Search results with highlighting
    const searchResults = useMemo(() => {
        if (!query.trim()) return [];

        const results: SearchResult[] = [];
        const searchTerm = query.toLowerCase().trim();

        messages.forEach(message => {
            const user = message.user;
            if (!user) return;

            let matchType: 'content' | 'username' | 'date' = 'content';
            let highlightedText = message.text;

            // Search in message content
            if (searchType === 'all' || searchType === 'content') {
                if (message.text.toLowerCase().includes(searchTerm)) {
                    const escapedSearchTerm = escapeRegex(searchTerm);
                    const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
                    const sanitizedText = sanitizeHtml(message.text);
                    highlightedText = sanitizedText.replace(regex, '<mark>$1</mark>');
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
                try {
                    const dateObj = getMessageDate(message.createdAt);
                    const messageDate = format(dateObj, 'dd.MM.yyyy HH:mm', { locale: ru });
                    if (messageDate.includes(searchTerm)) {
                        matchType = 'date';
                        results.push({ message, user, highlightedText, matchType });
                    }
                } catch {
                    // Skip date search if date parsing fails
                }
            }
        });

        return results.reverse();
    }, [messages, query, searchType]);

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

    useEffect(() => {
        setSelectedIndex(0);
    }, [searchResults]);

    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[200] flex flex-col safe-area-inset-top safe-area-inset-bottom"
            >
                {/* Search Header */}
                <div className="flex-shrink-0 p-6 border-b border-white/10 bg-white/[0.02]">
                    <div className="flex items-center gap-4 mb-6 max-w-4xl mx-auto w-full">
                        <div className="relative flex-1 group">
                            <div className="absolute inset-0 bg-violet-500/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-violet-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Поиск сообщений, пользователей, дат..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className={cn(
                                    "w-full bg-white/[0.03] text-white placeholder-white/20 pl-12 pr-4 py-4 rounded-2xl border border-white/10",
                                    "focus:border-violet-500/50 focus:bg-white/[0.05] focus:outline-none transition-all duration-300",
                                    "shadow-2xl shadow-black/50"
                                )}
                                autoFocus
                                style={{ fontSize: '16px' }}
                            />
                        </div>
                        <button
                            onClick={onClose}
                            className="p-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-2xl transition-all duration-300 group"
                            aria-label="Закрыть поиск"
                        >
                            <X className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                        </button>
                    </div>

                    {/* Search Type Filters */}
                    <div className="flex gap-3 overflow-x-auto pb-2 max-w-4xl mx-auto w-full no-scrollbar">
                        {[
                            { key: 'all', label: 'Все', icon: Search, color: 'violet' },
                            { key: 'content', label: 'Текст', icon: MessageCircle, color: 'emerald' },
                            { key: 'user', label: 'Пользователи', icon: User, color: 'blue' },
                            { key: 'date', label: 'Дата', icon: Calendar, color: 'amber' }
                        ].map(({ key, label, icon: Icon, color }) => (
                            <button
                                key={key}
                                onClick={() => setSearchType(key as 'all' | 'content' | 'user' | 'date')}
                                className={cn(
                                    "flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap border",
                                    searchType === key
                                        ? `bg-violet-500/20 border-violet-500/50 text-violet-300 shadow-[0_0_20px_rgba(139,92,246,0.2)]`
                                        : "bg-white/[0.02] border-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.05]"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Results */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="max-w-4xl mx-auto w-full">
                        {query.trim() === '' ? (
                            <div className="flex flex-col items-center justify-center h-[60vh] text-white/20 p-8">
                                <div className="w-24 h-24 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6">
                                    <Search className="w-12 h-12 opacity-20" />
                                </div>
                                <p className="text-2xl font-bold text-white/40">Поиск по чату</p>
                                <p className="text-base text-center max-w-xs mt-3 leading-relaxed">
                                    Введите текст для поиска сообщений, имен пользователей или дат
                                </p>
                            </div>
                        ) : searchResults.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[60vh] text-white/20 p-8">
                                <div className="w-24 h-24 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6">
                                    <X className="w-12 h-12 opacity-20" />
                                </div>
                                <p className="text-2xl font-bold text-white/40">Ничего не найдено</p>
                                <p className="text-base text-center max-w-xs mt-3 leading-relaxed">
                                    Попробуйте изменить поисковый запрос или фильтры
                                </p>
                            </div>
                        ) : (
                            <div className="p-6 space-y-3">
                                <div className="flex items-center justify-between mb-6 px-2">
                                    <p className="text-sm font-bold text-white/30 uppercase tracking-widest">
                                        Найдено {searchResults.length} результатов
                                    </p>
                                    <div className="flex items-center gap-3 text-xs font-medium text-white/20">
                                        <div className="flex items-center gap-1 bg-white/[0.03] px-2 py-1 rounded-md">
                                            <ArrowUp className="w-3 h-3" />
                                            <ArrowDown className="w-3 h-3" />
                                        </div>
                                        <span>Навигация</span>
                                    </div>
                                </div>

                                {searchResults.map((result, index) => (
                                    <motion.button
                                        key={result.message.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03, duration: 0.4 }}
                                        onClick={() => {
                                            onMessageSelect(result.message.id);
                                            onClose();
                                        }}
                                        className={cn(
                                            "w-full text-left p-5 rounded-2xl transition-all duration-300 group relative overflow-hidden border",
                                            selectedIndex === index
                                                ? "bg-violet-500/10 border-violet-500/40 shadow-[0_10px_30px_-10px_rgba(139,92,246,0.3)]"
                                                : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                                        )}
                                    >
                                        {selectedIndex === index && (
                                            <motion.div 
                                                layoutId="search-active-glow"
                                                className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent pointer-events-none" 
                                            />
                                        )}
                                        
                                        <div className="flex items-start gap-4 relative z-10">
                                            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-violet-500/20">
                                                {result.user.name.charAt(0).toUpperCase() || '?'}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn(
                                                            "font-bold text-base tracking-tight",
                                                            result.matchType === 'username' ? "text-violet-400" : "text-white"
                                                        )}>
                                                            {result.user.name}
                                                        </span>
                                                        <span className={cn(
                                                            "text-xs font-medium px-2 py-0.5 rounded-md",
                                                            result.matchType === 'content' && "bg-emerald-500/10 text-emerald-400",
                                                            result.matchType === 'username' && "bg-blue-500/10 text-blue-400",
                                                            result.matchType === 'date' && "bg-amber-500/10 text-amber-400"
                                                        )}>
                                                            {result.matchType === 'content' && 'Текст'}
                                                            {result.matchType === 'username' && 'Имя'}
                                                            {result.matchType === 'date' && 'Дата'}
                                                        </span>
                                                    </div>
                                                    <span className={cn(
                                                        "text-xs font-bold font-mono",
                                                        result.matchType === 'date' ? "text-violet-400" : "text-white/20"
                                                    )}>
                                                        {format(getMessageDate(result.message.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                                                    </span>
                                                </div>

                                                <div
                                                    className="text-[15px] text-white/60 leading-relaxed line-clamp-3 group-hover:text-white/80 transition-colors"
                                                    dangerouslySetInnerHTML={{
                                                        __html: DOMPurify.sanitize(result.highlightedText.replace(
                                                            /<mark>/g,
                                                            '<mark class="bg-violet-500/30 text-violet-200 px-1 rounded font-bold">'
                                                        ), {
                                                            ALLOWED_TAGS: ['mark'],
                                                            ALLOWED_ATTR: ['class']
                                                        })
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Search Tips */}
                {query.trim() === '' && (
                    <div className="flex-shrink-0 p-6 border-t border-white/10 bg-white/[0.01]">
                        <div className="max-w-4xl mx-auto w-full flex items-center justify-between text-xs font-bold text-white/20 uppercase tracking-[0.2em]">
                            <div className="flex gap-6">
                                <span>• Фильтры для уточнения</span>
                                <span>• Частичное совпадение</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="bg-white/5 px-2 py-1 rounded">↑↓</span>
                                <span>Навигация</span>
                                <span className="bg-white/5 px-2 py-1 rounded ml-2">ENTER</span>
                                <span>Переход</span>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
