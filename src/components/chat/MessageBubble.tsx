"use client";

import { memo, useMemo } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Reply, MoreHorizontal, Check, CheckCheck, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';
import type { Message, UserProfile } from '@/lib/types';

// Helper function for consistent timestamp formatting
function formatMessageTime(date: Date): string {
    const time = format(date, 'HH:mm');
    if (isToday(date)) {
        return time;
    } else if (isYesterday(date)) {
        return `Вчера, ${time}`;
    } else {
        return format(date, 'd MMM, HH:mm', { locale: ru });
    }
}

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

    // P0 FIX: XSS protection - sanitize message text
    const sanitizedText = useMemo(() => {
        if (!message.text) return '';
        if (typeof window === 'undefined') return message.text;
        return DOMPurify.sanitize(message.text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    }, [message.text]);

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
            "group flex gap-3 px-4 py-1.5 transition-all duration-150",
            "hover:bg-white/[0.03]", /* P1-1 FIX: Enhanced hover background */
            "hover:shadow-[0_4px_12px_rgba(255,255,255,0.08)]", /* P1-1 FIX: Subtle shadow on hover */
            "animate-message-appear", /* Quick Win #3: Smooth message animation */
            isOwn ? "flex-row-reverse" : "flex-row",
            className
        )}>
            {/* Avatar - P2 FIX: увеличен до 36-40px (было 32px) */}
            {!isOwn && (
                <div className={cn(
                    "w-[36px] h-[36px] md:w-10 md:h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 mt-1 shadow-lg",
                    getAvatarColor(user.name)
                )}>
                    {getAvatarText(user.name)}
                </div>
            )}

            {/* Message Content - Layout Guide: 75% mobile, 60% desktop, 50% on 1440px+ */}
            <div className={cn(
                "flex flex-col max-w-[75%] md:max-w-[60%] 2xl:max-w-[50%] min-w-0",
                isOwn ? "items-end" : "items-start"
            )}>
                {/* Username and timestamp - Mobile Audit: improved colors */}
                {!isOwn && (
                    <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-sm font-medium text-[#A78BFA]">
                            {user.name}
                        </span>
                        <span className="text-xs text-[#A1A1A6]">
                            {formatMessageTime(timestamp)}
                        </span>
                    </div>
                )}

                {/* Message bubble - Mobile Audit: Enhanced styling */}
                <div className={cn(
                    "relative px-4 py-3 rounded-2xl break-words",
                    "text-[15px] md:text-base leading-relaxed",
                    "transition-all duration-200",
                    // Mobile Audit V2 FIX: Better border-radius for long messages
                    sanitizedText.length > 200 && "message-bubble-long",
                    isOwn
                        ? "bg-[rgba(124,58,237,0.2)] border border-[rgba(124,58,237,0.4)] text-white rounded-br-md shadow-[0_2px_8px_rgba(124,58,237,0.1)] backdrop-blur-sm"
                        : "bg-[#2D2D35] text-white border border-white/[0.06] rounded-bl-md shadow-[0_2px_8px_rgba(255,255,255,0.02)]"
                )}>
                    {/* Reply indicator */}
                    {message.replyTo && (
                        <div className={cn(
                            "text-xs mb-2 pb-2 border-b",
                            isOwn ? "border-white/20 text-white/80" : "border-white/10 text-[var(--text-tertiary)]"
                        )}>
                            <Reply className="w-3 h-3 inline mr-1" />
                            Ответ: {message.replyTo.text.slice(0, 30)}...
                        </div>
                    )}

                    {/* Message text - XSS protected */}
                    <p className="whitespace-pre-wrap">
                        {sanitizedText}
                    </p>

                    {/* Own message timestamp with delivery status - Mobile Audit: solid color */}
                    {isOwn && (
                        <div className="flex items-center justify-end gap-1.5 text-xs text-white/80 mt-1.5">
                            <span>{formatMessageTime(timestamp)}</span>
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
                            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                            title="Ответить"
                        >
                            <Reply className="w-4 h-4" />
                        </button>
                    )}

                    {isOwn && onEdit && (
                        <button
                            onClick={() => onEdit(message)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                            title="Редактировать"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Own avatar - P2 FIX: увеличен до 36-40px */}
            {isOwn && (
                <div className="w-[36px] h-[36px] md:w-10 md:h-10 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white text-sm font-semibold shrink-0 mt-1 shadow-lg">
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
            <div className="bg-[var(--bg-tertiary)] text-[var(--text-muted)] text-xs px-4 py-1.5 rounded-full border border-white/5">
                {message}
            </div>
        </div>
    );
});

// Custom comparison for MessageBubble - P0 optimization
function areMessageBubblePropsEqual(
    prevProps: MessageBubbleProps,
    nextProps: MessageBubbleProps
): boolean {
    const prevMsg = prevProps.message;
    const nextMsg = nextProps.message;

    return (
        prevMsg.id === nextMsg.id &&
        prevMsg.text === nextMsg.text &&
        prevMsg.senderId === nextMsg.senderId &&
        prevProps.currentUser.id === nextProps.currentUser.id &&
        prevProps.className === nextProps.className
    );
}

export const OptimizedMessageBubble = memo(MessageBubble, areMessageBubblePropsEqual);
