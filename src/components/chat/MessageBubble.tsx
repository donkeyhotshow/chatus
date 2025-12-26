"use client";

import { memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Reply, MoreHorizontal, Check, CheckCheck, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message, UserProfile } from '@/lib/types';

interface MessageBubbleProps {
    message: Message;
    currentUser: UserProfile;
    onReply?: (message: Message) => void;
    onEdit?: (message: Message) => void;
    className?: string;
}

// Message delivery status component
function DeliveryStatus({ status }: { status?: 'sending' | 'sent' | 'delivered' | 'read' }) {
    switch (status) {
        case 'sending':
            return (
                <span className="inline-flex items-center" title="Отправка...">
                    <Clock className="w-3 h-3 text-white/50" />
                </span>
            );
        case 'sent':
            return (
                <span className="inline-flex items-center" title="Отправлено">
                    <Check className="w-3 h-3 text-white/70" />
                </span>
            );
        case 'delivered':
            return (
                <span className="inline-flex items-center" title="Доставлено">
                    <CheckCheck className="w-3 h-3 text-white/70" />
                </span>
            );
        case 'read':
            return (
                <span className="inline-flex items-center" title="Прочитано">
                    <CheckCheck className="w-3 h-3 text-blue-300" />
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center" title="Отправлено">
                    <Check className="w-3 h-3 text-white/70" />
                </span>
            );
    }
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

    // Safe user access
    const user = message.user || { id: 'unknown', name: 'Unknown', avatar: '' };

    // Generate avatar from username
    const getAvatarText = (username: string) => {
        return username.charAt(0).toUpperCase();
    };

    const getAvatarColor = (username: string) => {
        const colors = [
            'bg-violet-600', 'bg-emerald-600', 'bg-purple-600', 'bg-pink-600',
            'bg-indigo-600', 'bg-amber-600', 'bg-rose-600', 'bg-teal-600'
        ];
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className={cn(
            "group flex gap-3 px-4 py-1.5 hover:bg-white/[0.02] transition-colors duration-150",
            isOwn ? "flex-row-reverse" : "flex-row",
            className
        )}>
            {/* Avatar */}
            {!isOwn && (
                <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 mt-1 shadow-lg",
                    getAvatarColor(user.name)
                )}>
                    {getAvatarText(user.name)}
                </div>
            )}

            {/* Message Content */}
            <div className={cn(
                "flex flex-col max-w-[75%] min-w-0",
                isOwn ? "items-end" : "items-start"
            )}>
                {/* Username and timestamp */}
                {!isOwn && (
                    <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-sm font-semibold text-white">
                            {user.name}
                        </span>
                        <span className="text-[11px] text-white/40">
                            {formatDistanceToNow(timestamp, { addSuffix: true, locale: ru })}
                        </span>
                    </div>
                )}

                {/* Message bubble */}
                <div className={cn(
                    "relative px-4 py-2.5 rounded-2xl break-words shadow-sm",
                    isOwn
                        ? "bg-gradient-to-br from-violet-600 to-purple-700 text-white rounded-br-md"
                        : "bg-white/[0.08] text-white border border-white/[0.06] rounded-bl-md"
                )}>
                    {/* Reply indicator */}
                    {message.replyTo && (
                        <div className={cn(
                            "text-xs opacity-70 mb-2 pb-2 border-b",
                            isOwn ? "border-white/20 text-white/80" : "border-white/10 text-white/60"
                        )}>
                            <Reply className="w-3 h-3 inline mr-1" />
                            Ответ: {message.replyTo.text.slice(0, 30)}...
                        </div>
                    )}

                    {/* Message text */}
                    <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
                        {message.text}
                    </div>

                    {/* Own message timestamp with delivery status */}
                    {isOwn && (
                        <div className="flex items-center justify-end gap-1.5 text-[11px] text-white/60 mt-1.5">
                            <span>{formatDistanceToNow(timestamp, { addSuffix: true, locale: ru })}</span>
                            <DeliveryStatus status={(message as Message & { status?: string }).status as 'sending' | 'sent' | 'delivered' | 'read' | undefined} />
                        </div>
                    )}
                </div>

                {/* Message actions */}
                <div className={cn(
                    "flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150",
                    isOwn ? "flex-row-reverse" : "flex-row"
                )}>
                    {onReply && (
                        <button
                            onClick={() => onReply(message)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
                            title="Ответить"
                        >
                            <Reply className="w-4 h-4" />
                        </button>
                    )}

                    {isOwn && onEdit && (
                        <button
                            onClick={() => onEdit(message)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
                            title="Редактировать"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Own avatar */}
            {isOwn && (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white text-sm font-semibold shrink-0 mt-1 shadow-lg">
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
            "flex justify-center py-3 px-4",
            className
        )}>
            <div className="bg-white/5 text-white/50 text-xs px-4 py-1.5 rounded-full border border-white/5">
                {message}
            </div>
        </div>
    );
});
