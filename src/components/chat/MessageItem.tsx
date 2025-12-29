
"use client";

import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { format } from 'date-fns';
import { Heart, Trash2, CornerUpLeft, Copy, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/lib/types';
import { EmojiRain } from './EmojiRain';
import MessageStatus, { getMessageStatus } from './MessageStatus';

// Quick reaction emojis for long-press menu - Этап 2
const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '👍', '🔥'];

type MessageItemProps = {
    message: Message;
    isOwn: boolean;
    onReaction: (messageId: string, emoji: string) => void;
    onDelete: (messageId: string) => void;
    onImageClick: (imageUrl: string) => void;
    onReply: (message: Message) => void;
    onCopy?: (text: string) => void;
    reactions?: { emoji: string; count: number; users: string[] }[];
    groupPosition?: 'first' | 'middle' | 'last' | 'single';
};

const MessageItem = memo(function MessageItem({ message, isOwn, onReaction, onDelete, onImageClick, onReply, onCopy, reactions = [], groupPosition = 'single' }: MessageItemProps) {
    const [showEmojiRain, setShowEmojiRain] = useState(false);
    const [rainEmoji, setRainEmoji] = useState('');
    const [showActions, setShowActions] = useState(false);
    const [showQuickReactions, setShowQuickReactions] = useState(false);

    // Swipe-to-reply state - Этап 2
    const x = useMotionValue(0);
    const swipeThreshold = 60;
    const replyIconOpacity = useTransform(x, [0, swipeThreshold], [0, 1]);
    const replyIconScale = useTransform(x, [0, swipeThreshold], [0.5, 1]);

    // Long-press state - Этап 2
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isLongPressRef = useRef(false);

    // Reset emoji rain when message changes
    useEffect(() => {
        setShowEmojiRain(false);
        setRainEmoji('');
    }, [message.id]);

    const user = message.user || { id: 'unknown', name: 'Неизвестный', avatar: '' };

    // Long-press handlers for quick reactions - Этап 2
    const handleTouchStart = useCallback(() => {
        isLongPressRef.current = false;
        longPressTimerRef.current = setTimeout(() => {
            isLongPressRef.current = true;
            setShowQuickReactions(true);
            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate(20);
            }
        }, 500);
    }, []);

    const handleTouchEnd = useCallback(() => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    }, []);

    const handleTouchMove = useCallback(() => {
        // Cancel long-press if user moves finger
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
            }
        };
    }, []);

    // Handle quick reaction select - Этап 2
    const handleQuickReaction = useCallback((emoji: string) => {
        onReaction(message.id, emoji);
        setRainEmoji(emoji);
        setShowEmojiRain(true);
        setShowQuickReactions(false);
        if ('vibrate' in navigator) navigator.vibrate(10);
        setTimeout(() => setShowEmojiRain(false), 2000);
    }, [message.id, onReaction]);

    // Swipe-to-reply handler - Этап 2
    const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.x > swipeThreshold && !isOwn) {
            // Trigger reply
            onReply(message);
            if ('vibrate' in navigator) navigator.vibrate(15);
        }
        // Reset position
        x.set(0);
    }, [isOwn, message, onReply, x, swipeThreshold]);

    if (message.type === 'system') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full flex justify-center my-6"
            >
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-full px-4 py-1.5 text-[10px] font-semibold text-white/60 uppercase tracking-widest backdrop-blur-sm">
                    {message.text}
                </div>
            </motion.div>
        );
    }

    const handleDoubleClick = () => {
        if (message.id.startsWith('temp_')) return;
        if (!isOwn) return;

        const emoji = '❤️';
        onReaction(message.id, emoji);
        setRainEmoji(emoji);
        setShowEmojiRain(true);
        setTimeout(() => setShowEmojiRain(false), 2000);
    };

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        const emoji = '❤️';
        onReaction(message.id, emoji);
        setRainEmoji(emoji);
        setShowEmojiRain(true);
        if ('vibrate' in navigator) navigator.vibrate(10);
        setTimeout(() => setShowEmojiRain(false), 2000);
    };

    const hasContent = message.text || message.imageUrl;

    const renderContent = () => {
        if (message.type === 'sticker') {
            return (
                <motion.img
                    whileHover={{ scale: 1.1, rotate: 2 }}
                    src={message.imageUrl}
                    alt="Sticker"
                    className="w-32 h-32 object-contain"
                />
            );
        }

        let contentNode: React.ReactNode = null;
        if (message.imageUrl) {
            contentNode = (
                <motion.img
                    layoutId={`img-${message.id}`}
                    src={message.imageUrl}
                    alt={message.type === 'doodle' ? 'Doodle' : 'Uploaded content'}
                    className={cn(
                        "rounded-xl max-w-[280px] max-h-80 object-cover cursor-pointer",
                        "hover:opacity-95 transition-opacity",
                        message.text ? 'mb-2' : ''
                    )}
                    onClick={() => message.imageUrl && onImageClick(message.imageUrl)}
                />
            );
        }

        if (message.type === 'doodle' && message.imageUrl) {
            return contentNode;
        }

        if (message.text) {
            // Dynamic line-height: short messages (1-2 lines ~80 chars) get 1.5, longer get 1.65
            const isLongMessage = message.text.length > 80 || message.text.split('\n').length > 2;
            return (
                <div className="flex flex-col">
                    {contentNode}
                    <p className={cn(
                        "whitespace-pre-wrap text-[15px] break-words text-white tracking-[0.01em]",
                        isLongMessage ? "leading-[1.65]" : "leading-[1.5]"
                    )}>
                        {message.text}
                    </p>
                </div>
            );
        }

        return contentNode;
    };

    const formattedTime = message.createdAt && 'seconds' in message.createdAt
        ? format(new Date(message.createdAt.seconds * 1000), 'HH:mm')
        : '...';

    const isSticker = message.type === 'sticker';
    const hasLike = reactions.some(r => r.emoji === '❤️');

    return (
        <motion.article
            layout="position"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            role="article"
            aria-label={`${user.name} написал: ${message.text || 'изображение'}. ${formattedTime}`}
            className={cn(
                "group flex gap-2.5 max-w-[85%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[55%] mb-3 relative gpu-accelerated",
                isOwn ? "ml-auto flex-row-reverse" : "items-start"
            )}
            onDoubleClick={handleDoubleClick}
        >
            {/* Swipe-to-reply indicator (only for received messages) - Этап 2 */}
            {!isOwn && !isSticker && (
                <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-10 flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent-primary)]"
                    style={{ opacity: replyIconOpacity, scale: replyIconScale }}
                >
                    <CornerUpLeft className="w-4 h-4 text-white" />
                </motion.div>
            )}

            {/* Avatar - visible on all devices, hidden for grouped middle/last messages */}
            {!isSticker && (groupPosition === 'first' || groupPosition === 'single') && (
                <div className="flex-shrink-0 mt-1 message-avatar">
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        className={cn(
                            "w-9 h-9 rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02]",
                            "border border-white/[0.08] bg-center bg-cover",
                            "shadow-sm overflow-hidden"
                        )}
                        style={{ backgroundImage: user.avatar && user.avatar.trim() ? `url(${user.avatar})` : undefined }}
                    >
                        {(!user.avatar || !user.avatar.trim()) && (
                            <div className="w-full h-full flex items-center justify-center text-white/50 font-semibold text-sm bg-gradient-to-br from-violet-500/30 to-purple-500/30">
                                {user.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
            {/* Spacer for grouped messages without avatar */}
            {!isSticker && (groupPosition === 'middle' || groupPosition === 'last') && (
                <div className="w-9 flex-shrink-0" />
            )}

            <div className={cn("flex flex-col min-w-0 flex-1", isOwn ? "items-end" : "items-start")}>
                {/* Name & Time - only show for first message in group or single */}
                {!isSticker && (groupPosition === 'first' || groupPosition === 'single') && (
                    <div className="mb-1.5 px-1 flex items-center gap-2">
                        <span className={cn(
                            "text-sm font-semibold tracking-wide message-username",
                            isOwn ? "text-white/90" : "text-[#C4B5FD]"
                        )}>
                            {user.name}
                        </span>
                        <span className="text-xs text-white/60 message-time font-medium">{formattedTime}</span>
                    </div>
                )}

                {hasContent ? (
                    <motion.div
                        drag={!isOwn && !isSticker ? "x" : false}
                        dragConstraints={{ left: 0, right: swipeThreshold + 20 }}
                        dragElastic={0.1}
                        onDragEnd={handleDragEnd}
                        style={{ x }}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchMove}
                        onMouseEnter={() => setShowActions(true)}
                        onMouseLeave={() => setShowActions(false)}
                        onClick={() => {
                            if (!isLongPressRef.current) {
                                setShowActions(!showActions);
                            }
                        }}
                        className={cn(
                            "relative px-4 py-3 rounded-2xl transition-all duration-150 cursor-pointer select-none contain-paint",
                            // Desktop hover states - Этап 4
                            "md:hover:shadow-lg md:hover:shadow-black/20",
                            isOwn
                                ? isSticker
                                    ? "bg-transparent"
                                    : [
                                        "bg-gradient-to-br from-violet-600 via-violet-600 to-purple-700",
                                        "text-white rounded-tr-md",
                                        "shadow-[0_4px_20px_rgba(124,58,237,0.3)]",
                                        "md:hover:shadow-[0_8px_30px_rgba(124,58,237,0.4)]",
                                        "md:hover:translate-y-[-1px]",
                                    ]
                                : isSticker
                                    ? "bg-transparent"
                                    : [
                                        "bg-white/[0.06] backdrop-blur-xl",
                                        "text-white border border-white/[0.1]",
                                        "rounded-tl-md",
                                        "md:hover:bg-white/[0.08]",
                                        "md:hover:border-white/[0.15]",
                                    ],
                            message.id.startsWith("temp_") && "opacity-60",
                            showActions && "ring-2 ring-violet-500/30"
                        )}
                    >
                        {/* Reply quote */}
                        {message.replyTo && (
                            <div className={cn(
                                "mb-2.5 p-2.5 rounded-lg text-[12px] border-l-2",
                                isOwn
                                    ? "bg-white/10 border-white/30 text-white/80"
                                    : "bg-white/[0.04] border-violet-500/50 text-white/70"
                            )}>
                                <span className="font-semibold block text-[11px]">{message.replyTo.senderName}</span>
                                <span className="truncate block opacity-80 mt-0.5">{message.replyTo.text}</span>
                            </div>
                        )}

                        {renderContent()}

                        {/* Reactions */}
                        <AnimatePresence>
                            {reactions.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-wrap gap-1.5 mt-2.5 -mb-1"
                                >
                                    {reactions.map((reaction) => (
                                        <motion.button
                                            key={reaction.emoji}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            className={cn(
                                                "flex items-center gap-1 px-2 py-1 rounded-full transition-all text-xs",
                                                "bg-white/10 hover:bg-white/20 active:scale-95 border border-white/5"
                                            )}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onReaction(message.id, reaction.emoji);
                                            }}
                                        >
                                            <span>{reaction.emoji}</span>
                                            {reaction.count > 1 && <span className="font-semibold text-[11px]">{reaction.count}</span>}
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Quick reactions menu (long-press) - Этап 2 */}
                        <AnimatePresence>
                            {showQuickReactions && (
                                <>
                                    {/* Backdrop */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-30"
                                        onClick={() => setShowQuickReactions(false)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                        className={cn(
                                            "absolute -top-14 flex items-center gap-1 p-1.5 bg-black/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-40",
                                            isOwn ? "right-0" : "left-0"
                                        )}
                                    >
                                        {QUICK_REACTIONS.map((emoji) => (
                                            <motion.button
                                                key={emoji}
                                                whileHover={{ scale: 1.2 }}
                                                whileTap={{ scale: 0.8 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleQuickReaction(emoji);
                                                }}
                                                className="w-10 h-10 flex items-center justify-center text-xl hover:bg-white/10 rounded-xl transition-colors"
                                            >
                                                {emoji}
                                            </motion.button>
                                        ))}
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>

                        {/* Action buttons - floating bar */}
                        <AnimatePresence>
                            {(showActions) && !showQuickReactions && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                    className={cn(
                                        "absolute -top-12 flex items-center gap-0.5 p-1 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl z-20",
                                        isOwn ? "right-0" : "left-0"
                                    )}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Reactions button - opens quick reactions */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowQuickReactions(true); setShowActions(false); }}
                                        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all"
                                        title="Добавить реакцию"
                                    >
                                        <Smile className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onReply(message); setShowActions(false); }}
                                        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all"
                                        title="Ответить"
                                    >
                                        <CornerUpLeft className="w-4 h-4" />
                                    </button>
                                    {/* Copy button */}
                                    {message.text && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onCopy) {
                                                    onCopy(message.text || '');
                                                } else {
                                                    navigator.clipboard.writeText(message.text || '');
                                                }
                                                if ('vibrate' in navigator) navigator.vibrate(10);
                                                setShowActions(false);
                                            }}
                                            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all"
                                            title="Копировать"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={handleLike}
                                        className={cn(
                                            "w-9 h-9 flex items-center justify-center rounded-lg transition-all",
                                            hasLike
                                                ? "text-red-500 hover:bg-red-500/10"
                                                : "text-white/50 hover:text-red-400 hover:bg-white/10"
                                        )}
                                        title="Нравится"
                                    >
                                        <Heart className={cn("w-4 h-4", hasLike && "fill-current")} />
                                    </button>
                                    {isOwn && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if ('vibrate' in navigator) navigator.vibrate(15);
                                                onDelete(message.id);
                                                setShowActions(false);
                                            }}
                                            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-white/50 hover:text-red-400 transition-all"
                                            title="Удалить"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ) : null}

                {/* Message status indicator - Этап 9 */}
                {isOwn && !isSticker && (
                    <div className="mt-1 px-1 flex items-center gap-1.5">
                        <MessageStatus status={getMessageStatus(message)} />
                        {/* Time for grouped messages without header */}
                        {(groupPosition === 'middle' || groupPosition === 'last') && (
                            <span className="text-[10px] text-white/40">{formattedTime}</span>
                        )}
                    </div>
                )}
            </div>
            {showEmojiRain && <EmojiRain emoji={rainEmoji} />}
        </motion.article>
    );
});

MessageItem.displayName = 'MessageItem';

// Custom comparison for better performance - P0 optimization
function arePropsEqual(prevProps: MessageItemProps, nextProps: MessageItemProps): boolean {
    // Fast path: same message reference
    if (prevProps.message === nextProps.message &&
        prevProps.isOwn === nextProps.isOwn &&
        prevProps.reactions === nextProps.reactions) {
        return true;
    }

    // Deep comparison for message
    const prevMsg = prevProps.message;
    const nextMsg = nextProps.message;

    return (
        prevMsg.id === nextMsg.id &&
        prevMsg.text === nextMsg.text &&
        prevMsg.imageUrl === nextMsg.imageUrl &&
        prevMsg.seen === nextMsg.seen &&
        prevProps.isOwn === nextProps.isOwn &&
        prevProps.reactions?.length === nextProps.reactions?.length
    );
}

export default memo(MessageItem, arePropsEqual);
