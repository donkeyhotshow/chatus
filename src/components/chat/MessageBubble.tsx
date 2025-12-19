"use client";

import { memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Reply, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message, UserProfile } from '@/lib/types';

interface MessageBubbleProps {
    message: Message;
    currentUser: UserProfile;
    onReply?: (message: Message) => void;
    onEdit?: (message: Message) => void;
    className?: string;
}

export const MessageBubble = memo(function MessageBubble({
    message,
    currentUser,
    onReply,
    onEdit,
    className
}: MessageBubbleProps) {
    const isOwn = message.senderId === currentUser.id;
    const timestamp = message.createdAt?.toDate?.() || new Date();

    // Generate avatar from username
    const getAvatarText = (username: string) => {
        return username.charAt(0).toUpperCase();
    };

    const getAvatarColor = (username: string) => {
        const colors = [
            'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
            'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500'
        ];
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className={cn(
            "group flex gap-3 px-4 py-2 hover:bg-[var(--bg-tertiary)]/50 transition-colors duration-200",
            isOwn ? "flex-row-reverse" : "flex-row",
            className
        )}>
            {/* Avatar */}
            {!isOwn && (
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0 mt-1",
                    getAvatarColor(message.user.name)
                )}>
                    {getAvatarText(message.user.name)}
                </div>
            )}

            {/* Message Content */}
            <div className={cn(
                "flex flex-col max-w-[70%] min-w-0",
                isOwn ? "items-end" : "items-start"
            )}>
                {/* Username and timestamp */}
                {!isOwn && (
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                            {message.user.name}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                            {formatDistanceToNow(timestamp, { addSuffix: true, locale: ru })}
                        </span>
                    </div>
                )}

                {/* Message bubble */}
                <div className={cn(
                    "relative px-3 py-2 rounded-2xl break-words",
                    isOwn
                        ? "bg-[var(--chat-primary)] text-white rounded-br-md"
                        : "bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-bl-md"
                )}>
                    {/* Reply indicator */}
                    {message.replyTo && (
                        <div className={cn(
                            "text-xs opacity-75 mb-1 pb-1 border-b border-current/20",
                            isOwn ? "text-white/80" : "text-[var(--text-secondary)]"
                        )}>
                            <Reply className="w-3 h-3 inline mr-1" />
                            Ответ на: {message.replyTo.text.slice(0, 30)}...
                        </div>
                    )}

                    {/* Message text */}
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.text}
                    </div>

                    {/* Own message timestamp */}
                    {isOwn && (
                        <div className="text-xs text-white/70 mt-1 text-right">
                            {formatDistanceToNow(timestamp, { addSuffix: true, locale: ru })}
                        </div>
                    )}
                </div>

                {/* Message actions */}
                <div className={cn(
                    "flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                    isOwn ? "flex-row-reverse" : "flex-row"
                )}>
                    {onReply && (
                        <button
                            onClick={() => onReply(message)}
                            className="p-1 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors touch-target"
                            title="Ответить"
                        >
                            <Reply className="w-4 h-4" />
                        </button>
                    )}

                    {isOwn && onEdit && (
                        <button
                            onClick={() => onEdit(message)}
                            className="p-1 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors touch-target"
                            title="Редактировать"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Own avatar */}
            {isOwn && (
                <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white text-sm font-medium shrink-0 mt-1">
                    {getAvatarText(currentUser.name)}
                </div>
            )}
        </div>
    );
});

// System message component
export const SystemMessage = memo(function SystemMessage({
    message,
    className
}: {
    message: string;
    className?: string;
}) {
    return (
        <div className={cn(
            "flex justify-center py-2 px-4",
            className
        )}>
            <div className="bg-[var(--bg-tertiary)] text-[var(--text-muted)] text-xs px-3 py-1 rounded-full">
                {message}
            </div>
        </div>
    );
});
