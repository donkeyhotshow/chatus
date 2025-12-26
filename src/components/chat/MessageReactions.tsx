"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Reaction {
    emoji: string;
    count: number;
    users: string[];
    hasReacted: boolean;
}

interface MessageReactionsProps {
    messageId: string;
    reactions: Reaction[];
    onAddReaction: (messageId: string, emoji: string) => void;
    onRemoveReaction: (messageId: string, emoji: string) => void;
    className?: string;
}

const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🔥', '👏', '🎉'];

const EMOJI_CATEGORIES = {
    'Эмоции': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
    'Жесты': ['👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
    'Символы': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭'],
    'Активность': ['🎉', '🎊', '🎈', '🎁', '🎀', '🎂', '🍰', '🧁', '🥳', '🎭', '🎨', '🎪', '🎫', '🎟️', '🎠', '🎡', '🎢', '🎳', '🎯', '🎲', '🎮', '🕹️', '🎰', '🎸', '🥁', '🎺', '🎷', '🎻', '🪕', '🎤']
};

export function MessageReactions({
    messageId,
    reactions,
    onAddReaction,
    onRemoveReaction,
    className
}: MessageReactionsProps) {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('Эмоции');
    const pickerRef = useRef<HTMLDivElement>(null);

    // Закрываем пикер при клике вне его
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };

        if (showEmojiPicker) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showEmojiPicker]);

    const handleReactionClick = (emoji: string, hasReacted: boolean) => {
        if (hasReacted) {
            onRemoveReaction(messageId, emoji);
        } else {
            onAddReaction(messageId, emoji);
        }

        // Вибрация для обратной связи
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    };

    const handleEmojiSelect = (emoji: string) => {
        onAddReaction(messageId, emoji);
        setShowEmojiPicker(false);

        // Вибрация для обратной связи
        if ('vibrate' in navigator) {
            navigator.vibrate(15);
        }
    };

    const hasReactions = reactions.length > 0;

    return (
        <div className={cn("relative", className)}>
            {/* Существующие реакции */}
            <AnimatePresence>
                {hasReactions && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex flex-wrap gap-1 mb-2"
                    >
                        {reactions.map((reaction) => (
                            <motion.button
                                key={reaction.emoji}
                                onClick={() => handleReactionClick(reaction.emoji, reaction.hasReacted)}
                                className={cn(
                                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all duration-200 min-h-[28px] touch-target",
                                    reaction.hasReacted
                                        ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-300"
                                        : "bg-neutral-800/50 border border-neutral-600/30 text-neutral-300 hover:bg-neutral-700/50"
                                )}
                                whileTap={{ scale: 0.95 }}
                                whileHover={{ scale: 1.05 }}
                            >
                                <motion.span
                                    className="text-sm"
                                    animate={reaction.hasReacted ? { scale: [1, 1.2, 1] } : {}}
                                    transition={{ duration: 0.3 }}
                                >
                                    {reaction.emoji}
                                </motion.span>
                                <span className="font-medium">{reaction.count}</span>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Кнопка добавления реакции */}
            <div className="relative">
                <motion.button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all duration-200 min-h-[28px] touch-target",
                        showEmojiPicker
                            ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-300"
                            : "bg-neutral-800/30 border border-neutral-600/20 text-neutral-400 hover:bg-neutral-700/30 hover:text-neutral-300"
                    )}
                    whileTap={{ scale: 0.95 }}
                >
                    <Smile className="w-3 h-3" />
                    <Plus className="w-3 h-3" />
                </motion.button>

                {/* Пикер эмодзи - улучшен для мобильных */}
                <AnimatePresence>
                    {showEmojiPicker && (
                        <>
                            {/* Backdrop для мобильных */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                                onClick={() => setShowEmojiPicker(false)}
                            />
                            <motion.div
                                ref={pickerRef}
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className={cn(
                                    "bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl z-50",
                                    // Desktop: absolute positioning
                                    "md:absolute md:bottom-full md:left-0 md:mb-2 md:min-w-[280px] md:max-w-[320px]",
                                    // Mobile: fixed bottom sheet style
                                    "fixed bottom-0 left-0 right-0 md:bottom-auto md:right-auto",
                                    "rounded-b-none md:rounded-2xl",
                                    "max-h-[70vh] md:max-h-none"
                                )}
                            >
                                {/* Mobile drag handle */}
                                <div className="md:hidden flex justify-center py-2">
                                    <div className="w-10 h-1 bg-neutral-600 rounded-full" />
                                </div>

                                {/* Быстрые реакции */}
                                <div className="p-3 border-b border-neutral-700">
                                    <div className="text-xs text-neutral-400 mb-2 font-medium">Быстрые реакции</div>
                                    <div className="flex flex-wrap gap-2">
                                        {QUICK_REACTIONS.map((emoji) => (
                                            <motion.button
                                                key={emoji}
                                                onClick={() => handleEmojiSelect(emoji)}
                                                className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-lg hover:bg-neutral-800 active:bg-neutral-700 transition-colors text-xl md:text-lg touch-target"
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                {emoji}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Категории - горизонтальный скролл на мобильных */}
                                <div className="flex border-b border-neutral-700 overflow-x-auto scrollbar-hide">
                                    {Object.keys(EMOJI_CATEGORIES).map((category) => (
                                        <button
                                            key={category}
                                            onClick={() => setSelectedCategory(category)}
                                            className={cn(
                                                "flex-shrink-0 px-4 py-3 md:px-3 md:py-2 text-sm md:text-xs font-medium transition-colors touch-target min-w-[80px] md:min-w-0 md:flex-1",
                                                selectedCategory === category
                                                    ? "text-cyan-400 border-b-2 border-cyan-400"
                                                    : "text-neutral-400 hover:text-neutral-300 active:text-neutral-200"
                                            )}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>

                                {/* Эмодзи - увеличенные для мобильных */}
                                <div className="p-3 max-h-[40vh] md:max-h-48 overflow-y-auto overscroll-contain">
                                    <div className="grid grid-cols-6 md:grid-cols-8 gap-2 md:gap-1">
                                        {EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES].map((emoji) => (
                                            <motion.button
                                                key={emoji}
                                                onClick={() => handleEmojiSelect(emoji)}
                                                className="w-12 h-12 md:w-8 md:h-8 flex items-center justify-center rounded-xl md:rounded-lg hover:bg-neutral-800 active:bg-neutral-700 transition-colors text-2xl md:text-lg touch-target"
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                {emoji}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Safe area padding for mobile */}
                                <div className="h-[env(safe-area-inset-bottom,0px)] md:hidden" />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Хук для управления реакциями
export function useMessageReactions() {
    const [reactions, setReactions] = useState<{ [messageId: string]: Reaction[] }>({});

    const addReaction = (messageId: string, emoji: string, userId: string = 'current') => {
        setReactions(prev => {
            const messageReactions = prev[messageId] || [];
            const existingReaction = messageReactions.find(r => r.emoji === emoji);

            if (existingReaction) {
                if (!existingReaction.users.includes(userId)) {
                    return {
                        ...prev,
                        [messageId]: messageReactions.map(r =>
                            r.emoji === emoji
                                ? {
                                    ...r,
                                    count: r.count + 1,
                                    users: [...r.users, userId],
                                    hasReacted: r.hasReacted || userId === 'current'
                                }
                                : r
                        )
                    };
                }
            } else {
                return {
                    ...prev,
                    [messageId]: [
                        ...messageReactions,
                        {
                            emoji,
                            count: 1,
                            users: [userId],
                            hasReacted: userId === 'current'
                        }
                    ]
                };
            }

            return prev;
        });
    };

    const removeReaction = (messageId: string, emoji: string, userId: string = 'current') => {
        setReactions(prev => {
            const messageReactions = prev[messageId] || [];

            return {
                ...prev,
                [messageId]: messageReactions
                    .map(r => {
                        if (r.emoji === emoji && r.users.includes(userId)) {
                            const newUsers = r.users.filter(u => u !== userId);
                            return {
                                ...r,
                                count: r.count - 1,
                                users: newUsers,
                                hasReacted: r.hasReacted && userId !== 'current'
                            };
                        }
                        return r;
                    })
                    .filter(r => r.count > 0)
            };
        });
    };

    return {
        reactions,
        addReaction,
        removeReaction
    };
}
