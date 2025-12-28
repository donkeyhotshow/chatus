import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
        setShowEmojiPicker(false);
        textareaRef.current?.focus();
    }, []);

    // Close emoji picker on Escape key
    useEffect(() => {
        if (!showEmojiPicker) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
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
                "p-3 safe-bottom bg-black/95 backdrop-blur-2xl border-t border-white/5 message-input-container",
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
                {/* Emoji button and picker - P2 UX-3: Added tooltip */}
                <div className="relative">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowEmojiPicker(prev => !prev);
                        }}
                        onTouchEnd={(e) => {
                            // BUG #14 FIX: Handle touch events for mobile
                            e.preventDefault();
                            e.stopPropagation();
                            setShowEmojiPicker(prev => !prev);
                        }}
                        disabled={disabled}
                        aria-label="Открыть эмодзи"
                        aria-expanded={showEmojiPicker}
                        title="Добавить эмодзи (E)" /* P2 UX-3: Tooltip */
                        className={cn(
                            "p-2.5 rounded-xl transition-all duration-200 touch-target disabled:opacity-50 min-w-[44px] min-h-[44px] relative z-[105]",
                            showEmojiPicker
                                ? "text-violet-400 bg-violet-500/10"
                                : "text-white/40 hover:text-white/70 hover:bg-white/[0.05]"
                        )}
                    >
                        <Smile className="w-5 h-5" aria-hidden="true" />
                    </motion.button>

                    {/* Emoji picker dropdown - Premium glass style with mobile adaptation */}
                    <AnimatePresence>
                        {showEmojiPicker && (
                            <>
                                {/* Backdrop for both mobile and desktop - closes picker on click outside */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 bg-black/50 md:bg-transparent z-[100]"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowEmojiPicker(false);
                                    }}
                                    onTouchEnd={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowEmojiPicker(false);
                                    }}
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                    className={cn(
                                        "bg-black/95 border border-white/10 rounded-2xl shadow-2xl z-[110] backdrop-blur-2xl",
                                        // Desktop: absolute positioning
                                        "md:absolute md:bottom-full md:left-0 md:mb-2",
                                        // Mobile: fixed bottom sheet
                                        "fixed bottom-0 left-0 right-0 md:bottom-auto md:right-auto",
                                        "rounded-b-none md:rounded-2xl",
                                        "p-3 md:p-2"
                                    )}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Mobile drag handle */}
                                    <div className="md:hidden flex justify-center pb-2">
                                        <div className="w-10 h-1 bg-neutral-600 rounded-full" />
                                    </div>
                                    <div className="grid grid-cols-6 gap-1 md:gap-0.5">
                                        {QUICK_EMOJIS.map((emoji) => (
                                            <motion.button
                                                key={emoji}
                                                whileHover={{ scale: 1.2 }}
                                                whileTap={{ scale: 0.8 }}
                                                type="button"
                                                onClick={() => handleEmojiSelect(emoji)}
                                                className="p-3 md:p-2.5 text-2xl md:text-xl hover:bg-white/10 active:bg-white/20 rounded-xl transition-all duration-150 touch-target"
                                                aria-label={`Вставить ${emoji}`}
                                            >
                                                {emoji}
                                            </motion.button>
                                        ))}
                                    </div>
                                    {/* Safe area for mobile */}
                                    <div className="h-[env(safe-area-inset-bottom,0px)] md:hidden" />
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
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
                            "w-full px-4 py-3 bg-[#242426] border border-white/[0.1] rounded-2xl",
                            "text-white placeholder:text-[var(--text-muted)]",
                            "resize-none overflow-y-auto max-h-[120px] scrollbar-hide",
                            "focus:outline-none focus:border-violet-500/50 focus:bg-[#2a2a2c]",
                            "focus:ring-2 focus:ring-violet-500/20",
                            "hover:border-white/15",
                            "transition-all duration-200",
                            "shadow-sm shadow-black/30",
                            "disabled:opacity-50"
                        )}
                        style={{ fontSize: '16px', minHeight: '56px' }}
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
                        "p-3 rounded-2xl transition-all duration-300 min-w-[48px] min-h-[48px] flex items-center justify-center relative z-[105]",
                        canSend && !isSending
                            ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_4px_15px_rgba(124,58,237,0.3)] hover:shadow-[0_6px_20px_rgba(124,58,237,0.4)]"
                            : "bg-white/[0.04] text-white/20 cursor-not-allowed"
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
