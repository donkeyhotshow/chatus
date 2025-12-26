
"use client";

import { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Heart, Trash2, CornerUpLeft, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/lib/types';
import { EmojiRain } from './EmojiRain';

type MessageItemProps = {
    message: Message;
    isOwn: boolean;
    onReaction: (messageId: string, emoji: string) => void;
    onDelete: (messageId: string) => void;
    onImageClick: (imageUrl: string) => void;
    onReply: (message: Message) => void;
    reactions?: { emoji: string; count: number; users: string[] }[];
};

const MessageItem = memo(({ message, isOwn, onReaction, onDelete, onImageClick, onReply, reactions = [] }: MessageItemProps) => {
    const [showEmojiRain, setShowEmojiRain] = useState(false);
    const [rainEmoji, setRainEmoji] = useState('');
    const [showActions, setShowActions] = useState(false);

    // Reset emoji rain when message changes
    useEffect(() => {
        setShowEmojiRain(false);
        setRainEmoji('');
    }, [message.id]);

    const user = message.user || { id: 'unknown', name: 'Неизвестный', avatar: '' };

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
            return (
                <div className="flex flex-col">
                    {contentNode}
                    <p className="leading-relaxed whitespace-pre-wrap text-[15px] break-words">
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
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            role="article"
            aria-label={`${user.name} написал: ${message.text || 'изображение'}. ${formattedTime}`}
            className={cn(
                "group flex gap-2.5 max-w-[85%] sm:max-w-[75%] mb-3 relative",
                isOwn ? "ml-auto flex-row-reverse" : "items-start"
            )}
            onDoubleClick={handleDoubleClick}
        >
            {/* Avatar */}
            {!isSticker && (
                <div className="flex-shrink-0 mt-1">
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        className={cn(
                            "w-9 h-9 rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02]",
                            "border border-white/[0.08] bg-center bg-cover",
                            "shadow-sm overflow-hidden"
                        )}
                        style={{ backgroundImage: user.avatar ? `url(${user.avatar})` : undefined }}
                    >
                        {!user.avatar && (
                            <div className="w-full h-full flex items-center justify-center text-white/50 font-semibold text-sm">
                                {user.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            <div className={cn("flex flex-col min-w-0 flex-1", isOwn ? "items-end" : "items-start")}>
                {/* Name & Time */}
                {!isSticker && (
                    <div className="mb-1.5 px-1 flex items-center gap-2">
                        <span className={cn(
                            "text-[11px] font-semibold tracking-wide",
                            isOwn ? "text-white/70" : "text-violet-400"
                        )}>
                            {user.name}
                        </span>
                        <span className="text-[10px] text-white/50">{formattedTime}</span>
                    </div>
                )}

                {hasContent ? (
                    <div
                        onClick={() => setShowActions(!showActions)}
                        className={cn(
                            "relative px-4 py-3 rounded-2xl transition-all duration-300 cursor-pointer",
                            isOwn
                                ? isSticker
                                    ? "bg-transparent"
                                    : [
                                        "bg-gradient-to-br from-violet-600 via-violet-600 to-purple-700",
                                        "text-white rounded-tr-md",
                                        "shadow-[0_4px_20px_rgba(124,58,237,0.3)]",
                                        "hover:shadow-[0_8px_30px_rgba(124,58,237,0.4)]",
                                    ]
                                : isSticker
                                    ? "bg-transparent"
                                    : [
                                        "bg-white/[0.06] backdrop-blur-xl",
                                        "text-white border border-white/[0.1]",
                                        "rounded-tl-md",
                                        "hover:bg-white/[0.08]",
                                    ],
                            message.id.startsWith("temp_") && "opacity-50",
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

                        {/* Action buttons - floating bar */}
                        <AnimatePresence>
                            {(showActions) && (
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
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onReply(message); setShowActions(false); }}
                                        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all"
                                        title="Ответить"
                                    >
                                        <CornerUpLeft className="w-4 h-4" />
                                    </button>
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
                    </div>
                ) : null}

                {/* Read status */}
                {isOwn && !isSticker && (
                    <div className="mt-1 px-1 flex items-center gap-1">
                        {message.seen ? (
                            <CheckCheck className="w-3.5 h-3.5 text-violet-400" />
                        ) : (
                            <Check className="w-3.5 h-3.5 text-white/30" />
                        )}
                    </div>
                )}
            </div>
            {showEmojiRain && <EmojiRain emoji={rainEmoji} />}
        </motion.article>
    );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem;
