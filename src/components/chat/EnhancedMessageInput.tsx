import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/lib/types';
import {
    isIOS,
    createIOSViewportManager,
} from '@/lib/ios-viewport-manager';
import { UnifiedPicker } from './UnifiedPicker';

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
    const [showPicker, setShowPicker] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const sendButtonRef = useRef<HTMLButtonElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
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

        // Этап 2: Haptic feedback при отправке сообщения
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }

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
        textareaRef.current?.focus();
    }, []);

    const handleStickerSelect = useCallback((url: string) => {
        if (onStickerSend) {
            onStickerSend(url);
            setShowPicker(false);
        }
    }, [onStickerSend]);

    // Close picker on Escape key
    useEffect(() => {
        if (!showPicker) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowPicker(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [showPicker]);

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
                "p-[var(--space-3)] safe-bottom bg-[var(--bg-secondary)]/95 backdrop-blur-2xl border-t border-[var(--border-subtle)] message-input-container",
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
            <AnimatePresence>
                {replyTo && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mb-3 p-3 bg-white/[0.03] rounded-xl border-l-2 border-violet-500 flex items-center justify-between"
                    >
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
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input row */}
            <div className="flex items-end gap-2" role="group" aria-label="Ввод сообщения">
                {/* Unified Picker button */}
                <div className="relative">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowPicker(prev => !prev);
                        }}
                        disabled={disabled}
                        aria-label="Открыть эмодзи и стикеры"
                        aria-expanded={showPicker}
                        title="Эмодзи и стикеры"
                        className={cn(
                            "p-2.5 rounded-xl transition-all duration-200 touch-target disabled:opacity-50 min-w-[44px] min-h-[44px] relative z-[105]",
                            showPicker
                                ? "text-violet-400 bg-violet-500/10"
                                : "text-white/40 hover:text-white/70 hover:bg-white/[0.05]"
                        )}
                    >
                        <Smile className="w-5 h-5" aria-hidden="true" />
                    </motion.button>

                    <UnifiedPicker
                        isOpen={showPicker}
                        onClose={() => setShowPicker(false)}
                        onEmojiSelect={handleEmojiSelect}
                        onStickerSelect={handleStickerSelect}
                    />
                </div>

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
                            "w-full px-[var(--space-4)] py-[var(--space-3)] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-2xl",
                            "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                            "resize-none overflow-y-auto max-h-[120px] scrollbar-hide",
                            "focus:outline-none focus:border-[var(--accent-chat)]/50 focus:bg-[var(--bg-tertiary)]",
                            "focus:ring-2 focus:ring-[var(--accent-chat)]/20",
                            "hover:border-[var(--border-subtle)]",
                            "transition-all duration-200",
                            "shadow-sm shadow-black/30",
                            "disabled:opacity-50"
                        )}
                        style={{ fontSize: 'var(--font-body)', minHeight: '56px' }}
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

                {/* Image button - P2 UX-3: Added tooltip */}
                {onFileUpload && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onPointerDown={(e) => {
                            e.preventDefault();
                            fileInputRef.current?.click();
                        }}
                        disabled={disabled}
                        aria-label="Прикрепить изображение"
                        title="Прикрепить изображение (I)" /* P2 UX-3: Tooltip */
                        className="p-2.5 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all duration-200 touch-target disabled:opacity-50 min-w-[44px] min-h-[44px] relative z-[105]"
                    >
                        <ImageIcon className="w-5 h-5" aria-hidden="true" />
                    </motion.button>
                )}

                {/* Send button - Premium gradient */}
                <motion.button
                    layout
                    whileHover={canSend && !isSending ? { scale: 1.05 } : {}}
                    whileTap={canSend && !isSending ? { scale: 0.95 } : {}}
                    ref={sendButtonRef}
                    onPointerDown={(e) => {
                        if (canSend && !isSending) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    disabled={!canSend || isSending}
                    aria-label={isSending ? "Отправка..." : (canSend ? "Отправить сообщение" : "Введите сообщение для отправки")}
                    className={cn(
                        "p-3 rounded-2xl transition-all duration-300 min-w-[48px] min-h-[48px] flex items-center justify-center relative z-[105] touch-target",
                        canSend && !isSending
                            ? "bg-gradient-to-r from-[var(--accent-chat)] to-[var(--accent-games)] text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/40"
                            : "bg-[var(--bg-tertiary)] text-[var(--text-disabled)] cursor-not-allowed border border-[var(--border-subtle)]"
                    )}
                >
                    {isSending ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Send className="w-5 h-5" aria-hidden="true" />
                    )}
                </motion.button>
            </div>
        </div>
    );
});

EnhancedMessageInput.displayName = 'EnhancedMessageInput';
