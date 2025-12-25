"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Smile, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StickerPicker } from './StickerPicker';
import { useDebouncedCallback } from 'use-debounce';
import { cn } from '@/lib/utils';
import {
    isIOS,
    createIOSViewportManager,
    ensureSendButtonVisible,
} from '@/lib/ios-viewport-manager';

interface MessageInputProps {
    onSendMessage: (text: string) => void;
    onImageSend: (file: File) => void;
    onInputChange: () => void;
    onStickerSend: (stickerUrl: string) => void;
    roomId: string;
    disabled?: boolean;
}

const MAX_MESSAGE_LENGTH = 1000;

/**
 * MessageInput component with iOS keyboard handling
 *
 * **Feature: chatus-bug-fixes, P1-MOBILE-001**
 * **Validates: Requirements 18.1, 18.2, 18.3**
 */
export function MessageInput({
    onSendMessage,
    onImageSend,
    onInputChange,
    onStickerSend,
    roomId,
    disabled = false
}: MessageInputProps) {
    const [text, setText] = useState('');
    const [showStickerPicker, setShowStickerPicker] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    const draftKey = `chat-draft-${roomId}`;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const sendButtonRef = useRef<HTMLButtonElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const iosViewportManagerRef = useRef<ReturnType<typeof createIOSViewportManager> | null>(null);
    const { toast } = useToast();

    // Load draft
    useEffect(() => {
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
            setText(savedDraft);
        }
    }, [draftKey]);

    // Save draft
    useEffect(() => {
        localStorage.setItem(draftKey, text);
    }, [text, draftKey]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [text]);


    // iOS Viewport Manager setup
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

    // Handle virtual keyboard on mobile - scroll input into view
    // Uses Visual Viewport API for iOS (Requirements 18.1)
    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const handleFocus = () => {
            // For iOS, use the iOS viewport manager
            if (isIOS() && iosViewportManagerRef.current) {
                iosViewportManagerRef.current.handleFocus();
                setIsKeyboardVisible(true);
            } else {
                // Small delay to wait for keyboard to appear
                setTimeout(() => {
                    textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            }
        };

        const handleBlur = () => {
            // For iOS, use the iOS viewport manager
            if (isIOS() && iosViewportManagerRef.current) {
                iosViewportManagerRef.current.handleBlur();
                setIsKeyboardVisible(false);
            }
        };

        // Use visualViewport API for better keyboard detection
        const handleResize = () => {
            if (document.activeElement === textarea) {
                if (isIOS()) {
                    // iOS uses Visual Viewport API through the manager
                    ensureSendButtonVisible(textarea, sendButtonRef.current);
                } else {
                    textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        };

        textarea.addEventListener('focus', handleFocus);
        textarea.addEventListener('blur', handleBlur);
        window.visualViewport?.addEventListener('resize', handleResize);

        return () => {
            textarea.removeEventListener('focus', handleFocus);
            textarea.removeEventListener('blur', handleBlur);
            window.visualViewport?.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleSend = useCallback(async () => {
        const trimmedText = text.trim();
        if (!trimmedText || isSending || trimmedText.length > MAX_MESSAGE_LENGTH) return;

        setIsSending(true);
        try {
            await onSendMessage(trimmedText);
            setText('');
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        } catch {
            toast({
                title: "Ошибка отправки",
                description: "Не удалось отправить сообщение",
                variant: "destructive",
            });
        } finally {
            setIsSending(false);
        }
    }, [text, isSending, onSendMessage, toast]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Обработка Enter для отправки (без Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            handleSend();
            return;
        }

        // Для Safari iOS также обрабатываем keyCode 13
        if (e.keyCode === 13 && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            handleSend();
            return;
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "Файл слишком большой",
                description: "Максимальный размер: 5MB",
                variant: "destructive",
            });
            return;
        }

        setIsUploading(true);
        try {
            await onImageSend(file);
        } catch {
            toast({
                title: "Ошибка загрузки",
                description: "Не удалось загрузить изображение",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const debouncedTyping = useDebouncedCallback(() => {
        onInputChange();
    }, 500);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
        debouncedTyping();
    };

    const canSend = text.trim().length > 0 && text.length <= MAX_MESSAGE_LENGTH && !isSending && !disabled;


    return (
        <div
            ref={containerRef}
            className={cn(
                "relative bg-[var(--bg-secondary)] border-t border-[var(--border-primary)] safe-bottom",
 // iOS keyboard visible styles
                isKeyboardVisible && isIOS() && "ios-keyboard-visible"
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
            {/* Sticker Picker */}
            {showStickerPicker && (
                <StickerPicker
                    onSelect={(url) => {
                        onStickerSend(url);
                        setShowStickerPicker(false);
                    }}
                />
            )}

            <div className="flex items-end gap-2 p-3">
                {/* Emoji/Sticker button */}
                <button
                    onClick={() => setShowStickerPicker(p => !p)}
                    disabled={disabled}
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors touch-target disabled:opacity-50"
                    aria-label="Открыть стикеры"
                    aria-expanded={showStickerPicker}
                >
                    <Smile className="w-5 h-5" aria-hidden="true" />
                </button>

                {/* Input container */}
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={handleTextChange}
                        onKeyDown={handleKeyDown}
                        onBeforeInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                            // Для iOS Safari: перехватываем Enter до ввода
                            const inputEvent = e.nativeEvent as InputEvent;
                            if (inputEvent.inputType === 'insertLineBreak') {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Сообщение..."
                        disabled={disabled}
                        rows={1}
                        maxLength={MAX_MESSAGE_LENGTH + 100}
                        enterKeyHint="send"
                        aria-label="Введите сообщение"
                        aria-describedby={text.length > MAX_MESSAGE_LENGTH * 0.8 ? "message-char-count" : undefined}
                        aria-invalid={text.length > MAX_MESSAGE_LENGTH}
                        className={cn(
                            "w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-2xl",
                            "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                            "resize-none overflow-y-auto max-h-[120px] scrollbar-hide",
                            "focus:outline-none focus:border-[var(--accent-primary)]",
                            "transition-colors duration-150",
                            "disabled:opacity-50"
                        )}
                        style={{ fontSize: '16px' }}
                    />

                    {/* Character count */}
                    {text.length > MAX_MESSAGE_LENGTH * 0.8 && (
                        <span
                            id="message-char-count"
                            className={cn(
                                "absolute right-3 bottom-2 text-xs",
                                text.length > MAX_MESSAGE_LENGTH ? "text-[var(--error)]" : "text-[var(--text-muted)]"
                            )}
                            aria-live="polite"
                        >
                            {text.length}/{MAX_MESSAGE_LENGTH}
                        </span>
                    )}
                </div>

                {/* File input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/gif, image/webp"
                    className="hidden"
                />

                {/* Attachment button */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || disabled}
                    className={cn(
                        "p-2 rounded-lg transition-colors touch-target",
                        isUploading
                            ? "text-[var(--info)] bg-blue-50 dark:bg-blue-950/20"
                            : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]",
                        "disabled:opacity-50"
                    )}
                    aria-label={isUploading ? "Загрузка изображения..." : "Прикрепить изображение"}
                    aria-busy={isUploading}
                >
                    {isUploading ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    ) : (
                        <ImageIcon className="w-5 h-5" aria-hidden="true" />
                    )}
                </button>

                {/* Send button - ref added for iOS viewport management */}
                <button
                    ref={sendButtonRef}
                    onClick={handleSend}
                    disabled={!canSend}
                    className={cn(
                        "p-2.5 rounded-full transition-all duration-150 touch-target",
                        canSend
                            ? "bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
                            : "bg-[var(--bg-tertiary)] text-[var(--text-muted)]",
                        "disabled:cursor-not-allowed"
                    )}
                    aria-label={isSending ? "Отправка..." : "Отправить сообщение"}
                    aria-busy={isSending}
                >
                    {isSending ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    ) : (
                        <Send className="w-5 h-5" aria-hidden="true" />
                    )}
                </button>
            </div>
        </div>
    );
}
