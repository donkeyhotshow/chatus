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

// BUG-011 FIX: Detect Android device
function isAndroid(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /Android/i.test(navigator.userAgent);
}

// BUG-011 FIX: Detect landscape orientation
function isLandscape(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth > window.innerHeight;
}

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

    // BUG-020 FIX: Prevent double-tap duplicate messages
    const lastSendTimeRef = useRef<number>(0);
    const SEND_DEBOUNCE_MS = 500;

    const handleSend = useCallback(() => {
        const trimmed = message.trim();
        if (!trimmed || disabled) return;

        // BUG-020 FIX: Prevent rapid double-tap from sending duplicate messages
        const now = Date.now();
        if (now - lastSendTimeRef.current < SEND_DEBOUNCE_MS) {
            return;
        }
        lastSendTimeRef.current = now;

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
        setIsKeyboardVisible(true);

        if (isIOS() && iosViewportManagerRef.current) {
            iosViewportManagerRef.current.handleFocus();
        }

        // BUG-011 FIX: Handle Android landscape keyboard
        if (isAndroid() && isLandscape()) {
            // Scroll input into view after keyboard appears
            setTimeout(() => {
                textareaRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 300);
        }
    }, []);

    const handleBlur = useCallback(() => {
        setIsKeyboardVisible(false);

        if (isIOS() && iosViewportManagerRef.current) {
            iosViewportManagerRef.current.handleBlur();
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
                "p-3 safe-bottom bg-black/95 backdrop-blur-2xl",
                isKeyboardVisible && isIOS() && "ios-keyboard-visible",
                isKeyboardVisible && isAndroid() && isLandscape() && "android-landscape-keyboard",
                className
            )}
            style={{
                ...(isKeyboardVisible ? {
                    position: 'sticky' as const,
                    bottom: 0,
                    zIndex: 100,
                    ...(isAndroid() && isLandscape() ? {
                        paddingTop: '4px',
                        paddingBottom: '4px',
                    } : {})
                } : {})
            }}
        >
            {/* Reply preview */}
            {replyTo && (
                <div className="mb-3 p-3 bg-white/[0.03] rounded-xl border-l-2 border-violet-500 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-violet-400">
                            Ответ для {replyTo.user?.name}
                        </p>
                        <p className="text-xs text-white/50 truncate mt-0.5">
                            {replyTo.text || 'Изображение'}
                        </p>
                    </div>
                    {onCancelReply && (
                        <button onClick={onCancelReply} className="p-2 text-white/40 hover:text-white rounded-lg hover:bg-white/[0.05] transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}

            {/* Input row */}
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
                            "p-2.5 rounded-xl transition-all duration-200 touch-target disabled:opacity-50 min-w-[44px] min-h-[44px]",
                            showEmojiPicker
                                ? "text-violet-400 bg-violet-500/10"
                                : "text-white/40 hover:text-white/70 hover:bg-white/[0.05]"
                        )}
                    >
                        <Smile className="w-5 h-5" aria-hidden="true" />
                    </button>

                    {/* Emoji picker dropdown - Premium glass style */}
                    {showEmojiPicker && (
                        <div className="absolute bottom-full left-0 mb-2 p-2 bg-black/95 border border-white/10 rounded-2xl shadow-2xl z-50 backdrop-blur-2xl">
                            <div className="grid grid-cols-6 gap-0.5">
                                {QUICK_EMOJIS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => handleEmojiSelect(emoji)}
                                        className="p-2.5 text-xl hover:bg-white/10 rounded-xl transition-all duration-150 active:scale-90"
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

                {/* Text input - Premium style */}
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
                            "w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-2xl",
                            "text-white placeholder:text-white/30",
                            "resize-none overflow-y-auto max-h-[120px] scrollbar-hide",
                            "focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.06]",
                            "focus:ring-2 focus:ring-violet-500/20",
                            "transition-all duration-200",
                            "disabled:opacity-50"
                        )}
                        style={{ fontSize: '16px', minHeight: '48px' }}
                    />

                    {/* Character count */}
                    {message.length > 800 && (
                        <span
                            id="char-count"
                            className={cn(
                                "absolute right-3 bottom-2 text-xs font-medium",
                                message.length > 1000 ? "text-red-400" : "text-white/40"
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
                        className="p-2.5 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all duration-200 touch-target disabled:opacity-50 min-w-[44px] min-h-[44px]"
                    >
                        <ImageIcon className="w-5 h-5" aria-hidden="true" />
                    </button>
                )}

                {/* Send button - Premium gradient */}
                <button
                    ref={sendButtonRef}
                    onClick={handleSend}
                    disabled={!canSend || isSending}
                    aria-label={isSending ? "Отправка..." : (canSend ? "Отправить сообщение" : "Введите сообщение для отправки")}
                    className={cn(
                        "p-3 rounded-2xl transition-all duration-300 min-w-[48px] min-h-[48px] flex items-center justify-center",
                        canSend && !isSending
                            ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 hover:scale-105 active:scale-95"
                            : "bg-white/[0.04] text-white/20 cursor-not-allowed"
                    )}
                >
                    {isSending ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Send className="w-5 h-5" aria-hidden="true" />
                    )}
                </button>
            </div>
        </div>
    );
});

EnhancedMessageInput.displayName = 'EnhancedMessageInput';
