"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Smile, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/lib/types';

interface EnhancedMessageInputProps {
    onSend: (text: string) => void;
    onTyping?: (isTyping: boolean) => void;
    onFileUpload?: (file: File) => void;
    onStickerSend?: (imageUrl: string) => void;
    replyTo?: Message | null;
    onCancelReply?: () => void;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
}

export function EnhancedMessageInput({
    onSend,
    onTyping,
    onFileUpload,
    onStickerSend,
    replyTo,
    onCancelReply,
    disabled = false,
    placeholder = "Сообщение...",
    className
}: EnhancedMessageInputProps) {
    // onStickerSend is available for future sticker picker implementation
    void onStickerSend;
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();

    const adjustTextareaHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
        }
    }, []);

    const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setMessage(value);

        if (onTyping) {
            if (value.trim() && !isTyping) {
                setIsTyping(true);
                onTyping(true);
            } else if (!value.trim() && isTyping) {
                setIsTyping(false);
                onTyping(false);
            }

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

            if (value.trim()) {
                typingTimeoutRef.current = setTimeout(() => {
                    setIsTyping(false);
                    onTyping(false);
                }, 2000);
            }
        }

        setTimeout(adjustTextareaHeight, 0);
    }, [isTyping, onTyping, adjustTextareaHeight]);

    const handleSend = useCallback(() => {
        const trimmed = message.trim();
        if (!trimmed || disabled) return;

        onSend(trimmed);
        setMessage('');
        setIsTyping(false);
        onTyping?.(false);

        setTimeout(() => {
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
        }, 0);
    }, [message, disabled, onSend, onTyping]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onFileUpload) {
            onFileUpload(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [onFileUpload]);

    useEffect(() => {
        if (replyTo && textareaRef.current) textareaRef.current.focus();
    }, [replyTo]);

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, []);

    const canSend = message.trim().length > 0 && !disabled;

    return (
        <div className={cn("p-3 safe-bottom", className)}>
            {/* Reply preview */}
            {replyTo && (
                <div className="mb-2 p-2 bg-[var(--bg-tertiary)] rounded-lg border-l-2 border-[var(--accent-primary)] flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-[var(--text-primary)]">
                            Ответ для {replyTo.user?.name}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] truncate">
                            {replyTo.text || 'Изображение'}
                        </p>
                    </div>
                    {onCancelReply && (
                        <button onClick={onCancelReply} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}

            {/* Input row */}
            <div className="flex items-end gap-2">
                {/* Emoji button */}
                <button
                    type="button"
                    disabled={disabled}
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors touch-target disabled:opacity-50"
                >
                    <Smile className="w-5 h-5" />
                </button>

                {/* Text input */}
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={handleMessageChange}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled}
                        rows={1}
                        className={cn(
                            "w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-2xl",
                            "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                            "resize-none overflow-y-auto max-h-[120px] scrollbar-hide",
                            "focus:outline-none focus:border-[var(--accent-primary)]",
                            "transition-colors duration-150",
                            "disabled:opacity-50"
                        )}
                        style={{ fontSize: '16px', minHeight: '44px' }}
                    />

                    {/* Character count */}
                    {message.length > 800 && (
                        <span className={cn(
                            "absolute right-3 bottom-2 text-xs",
                            message.length > 1000 ? "text-[var(--error)]" : "text-[var(--text-muted)]"
                        )}>
                            {message.length}/1000
                        </span>
                    )}
                </div>

                {/* File input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />

                {/* Image button */}
                {onFileUpload && (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled}
                        className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors touch-target disabled:opacity-50"
                    >
                        <ImageIcon className="w-5 h-5" />
                    </button>
                )}

                {/* Send button */}
                <button
                    onClick={handleSend}
                    disabled={!canSend}
                    className={cn(
                        "p-2.5 rounded-full transition-all duration-150 touch-target",
                        canSend
                            ? "bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
                            : "bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed"
                    )}
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
