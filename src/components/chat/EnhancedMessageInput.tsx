"use client";

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Send, Smile, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/lib/types';
import {
    isIOS,
    createIOSViewportManager,
} from '@/lib/ios-viewport-manager';

import { StickerPicker } from './StickerPicker';

// Common emoji list for quick picker
const QUICK_EMOJIS = ['😀', '😂', '❤️', '👍', '👎', '🎉', '🔥', '😢', '😮', '🤔', '👋', '🙏'];

export interface EnhancedMessageInputRef {
    focus: () => void;
}

interface EnhancedMessageInputProps {
    onSend: (text: string) => void;
    onTyping?: (isTyping: boolean) => void;
    onFileUpload?: (file: File) => void;
    onStickerSend?: (imageUrl: string) => void;
    replyTo?: Message | null;
    onCancelReply?: () => void;
    disabled?: boolean;
    isSending?: boolean;
    placeholder?: string;
    className?: string;
}

export const EnhancedMessageInput = forwardRef<EnhancedMessageInputRef, EnhancedMessageInputProps>(({
    onSend,
    onTyping,
    onFileUpload,
    onStickerSend,
    replyTo,
    onCancelReply,
    disabled = false,
    isSending = false,
    placeholder = "Сообщение...",
    className
}, ref) => {
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const sendButtonRef = useRef<HTMLButtonElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();
    const iosViewportManagerRef = useRef<ReturnType<typeof createIOSViewportManager> | null>(null);

    useImperativeHandle(ref, () => ({
        focus: () => {
            textareaRef.current?.focus();
        }
    }));

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
        // Check for Enter key (both modern and legacy)
        const isEnterKey = e.key === 'Enter' || e.keyCode === 13;

        if (isEnterKey && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
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

    const handleEmojiSelect = useCallback((emoji: string) => {
        setMessage(prev => prev + emoji);
        setShowEmojiPicker(false);
        textareaRef.current?.focus();
    }, []);

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEmojiPicker]);

    useEffect(() => {
        if (replyTo && textareaRef.current) textareaRef.current.focus();
    }, [replyTo]);

    // iOS Viewport Manager setup
    // **Feature: chatus-bug-fixes, P1-MOBILE-001**
    // **Validates: Requirements 18.1, 18.2, 18.3**
    useEffect(() => {
        // Only initialize on iOS devices
        if (!isIOS()) return;

        const manager = createIOSViewportManager({
            scrollOffset: 20,
            smoothScroll: true,
        });

        manager.init({
            container: containerRef.current,
            input: textareaRef.current,
            sendButton: sendButtonRef.current,
        });

        iosViewportManagerRef.current = manager;

        return () => {
            manager.destroy();
            iosViewportManagerRef.current = null;
        };
    }, []);

    // Handle iOS keyboard focus/blur
    const handleFocus = useCallback(() => {
        if (isIOS() && iosViewportManagerRef.current) {
            iosViewportManagerRef.current.handleFocus();
            setIsKeyboardVisible(true);
        }
    }, []);

    const handleBlur = useCallback(() => {
        if (isIOS() && iosViewportManagerRef.current) {
            iosViewportManagerRef.current.handleBlur();
            setIsKeyboardVisible(false);
        }
    }, []);

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, []);

    const canSend = message.trim().length > 0 && !disabled;

    return (
        <div
            ref={containerRef}
            className={cn(
                "p-3 safe-bottom",
                // iOS keyboard visible styles
                isKeyboardVisible && isIOS() && "ios-keyboard-visible",
                className
            )}
            style={{
                // Ensure the container stays above the keyboard on iOS
                ...(isKeyboardVisible && isIOS() ? {
                    position: 'sticky' as const,
                    bottom: 0,
                    zIndex: 100,
                } : {})
            }}
        >
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

            {/* Input row - P1-001 FIX: Added ARIA labels */}
            <div className="flex items-end gap-2" role="group" aria-label="Ввод сообщения">
                {/* Emoji button and picker */}
                <div className="relative" ref={emojiPickerRef}>
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        disabled={disabled}
                        aria-label="Открыть эмодзи"
                        aria-expanded={showEmojiPicker}
                        className={cn(
                            "p-2 rounded-lg transition-colors touch-target disabled:opacity-50 min-w-[44px] min-h-[44px]",
                            showEmojiPicker
                                ? "text-[var(--accent-primary)] bg-[var(--bg-tertiary)]"
                                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                        )}
                    >
                        <Smile className="w-5 h-5" aria-hidden="true" />
                    </button>

                    {/* Emoji picker dropdown */}
                    {showEmojiPicker && (
                        <div className="absolute bottom-full left-0 mb-2 p-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-lg z-50">
                            <div className="grid grid-cols-6 gap-1">
                                {QUICK_EMOJIS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => handleEmojiSelect(emoji)}
                                        className="p-2 text-xl hover:bg-[var(--bg-tertiary)] rounded transition-colors"
                                        aria-label={`Вставить ${emoji}`}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sticker Picker */}
                {onStickerSend && (
                    <StickerPicker onSelect={onStickerSend} />
                )}

                {/* Text input */}
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={handleMessageChange}
                        onKeyDown={handleKeyDown}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        placeholder={placeholder}
                        disabled={disabled}
                        rows={1}
                        enterKeyHint="send"
                        autoComplete="off"
                        autoCorrect="on"
                        aria-label="Введите сообщение"
                        aria-describedby={message.length > 800 ? "char-count" : undefined}
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
                        <span
                            id="char-count"
                            className={cn(
                                "absolute right-3 bottom-2 text-xs",
                                message.length > 1000 ? "text-[var(--error)]" : "text-[var(--text-muted)]"
                            )}
                            aria-live="polite"
                        >
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
                    aria-label="Выбрать изображение"
                />

                {/* Image button */}
                {onFileUpload && (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled}
                        aria-label="Прикрепить изображение"
                        className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors touch-target disabled:opacity-50 min-w-[44px] min-h-[44px]"
                    >
                        <ImageIcon className="w-5 h-5" aria-hidden="true" />
                    </button>
                )}

                {/* Send button - ref added for iOS viewport management */}
                <button
                    ref={sendButtonRef}
                    onClick={handleSend}
                    disabled={!canSend || isSending}
                    aria-label={isSending ? "Отправка..." : (canSend ? "Отправить сообщение" : "Введите сообщение для отправки")}
                    className={cn(
                        "p-2.5 rounded-full transition-all duration-150 touch-target min-w-[44px] min-h-[44px] flex items-center justify-center",
                        canSend && !isSending
                            ? "bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
                            : "bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed"
                    )}
                >
                    {isSending ? (
                        <div className="w-5 h-5 border-2 border-[var(--text-muted)] border-t-[var(--accent-contrast)] rounded-full animate-spin" />
                    ) : (
                        <Send className="w-5 h-5" aria-hidden="true" />
                    )}
                </button>
            </div>
        </div>
    );
});

EnhancedMessageInput.displayName = 'EnhancedMessageInput';
