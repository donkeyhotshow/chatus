"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StickerPicker } from './StickerPicker';
import { useDebouncedCallback } from 'use-debounce';
import { cn } from '@/lib/utils';
import {
    isIOS,
    createIOSViewportManager,
    ensureSendButtonVisible,
} from '@/lib/ios-viewport-manager';
import { isAndroid } from '@/lib/viewport-manager';

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
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

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

        // Visual Viewport API handler for keyboard detection
        const handleViewportResize = () => {
            if (!window.visualViewport) return;

            const viewportHeight = window.visualViewport.height;
            const windowHeight = window.innerHeight;
            const heightDiff = windowHeight - viewportHeight;

            // Keyboard is visible if viewport shrunk by more than 150px
            const keyboardVisible = heightDiff > 150;
            setIsKeyboardVisible(keyboardVisible);
            setKeyboardHeight(keyboardVisible ? heightDiff : 0);

            // Adjust container position when keyboard is visible
            if (keyboardVisible && containerRef.current) {
                containerRef.current.style.transform = `translateY(-${Math.max(0, heightDiff - window.visualViewport.offsetTop)}px)`;
            } else if (containerRef.current) {
                containerRef.current.style.transform = '';
            }
        };

        const handleFocus = () => {
            // For iOS, use the iOS viewport manager
            if (isIOS() && iosViewportManagerRef.current) {
                iosViewportManagerRef.current.handleFocus();
                setIsKeyboardVisible(true);
            } else if (isAndroid()) {
                // Android: wait for keyboard and scroll into view
                setTimeout(() => {
                    textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
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
                setKeyboardHeight(0);
            } else {
                setIsKeyboardVisible(false);
                setKeyboardHeight(0);
                if (containerRef.current) {
                    containerRef.current.style.transform = '';
                }
            }
        };

        textarea.addEventListener('focus', handleFocus);
        textarea.addEventListener('blur', handleBlur);

        // Use visualViewport API for better keyboard detection
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleViewportResize);
            window.visualViewport.addEventListener('scroll', handleViewportResize);
        }

        return () => {
            textarea.removeEventListener('focus', handleFocus);
            textarea.removeEventListener('blur', handleBlur);
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleViewportResize);
                window.visualViewport.removeEventListener('scroll', handleViewportResize);
            }
        };
    }, []);

    const handleSend = useCallback(async () => {
        const trimmedText = text.trim();
        // BUG-005 FIX: Prevent double-tap by checking isSending state
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
            // BUG-005 FIX: Add debounce delay to prevent rapid double-tap
            setTimeout(() => {
                setIsSending(false);
            }, 300);
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
                "chat-input-bar",
                "relative bg-[var(--bg-secondary)] border-t border-[var(--border-primary)]",
                // iOS keyboard visible styles
                isKeyboardVisible && "keyboard-visible"
            )}
            style={{
                // Ensure the container stays above the keyboard
                paddingBottom: isKeyboardVisible
                    ? `max(${keyboardHeight}px, env(safe-area-inset-bottom, 0px))`
                    : 'env(safe-area-inset-bottom, 0px)',
            }}
        >
            <div className="flex items-end gap-2 p-3">
                {/* Sticker Picker - now self-contained with its own button */}
                <StickerPicker
                    onSelect={(url) => {
                        onStickerSend(url);
                    }}
                />

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
                            "w-full px-4 py-3 bg-[#1A1A1C] border border-white/[0.08] rounded-2xl",
                            "text-white placeholder:text-[#727278]",
                            "resize-none overflow-y-auto max-h-[120px] scrollbar-hide",
                            "focus:outline-none focus:border-[var(--accent-primary)]",
                            "focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1),0_0_0_1px_rgba(124,58,237,0.3)]",
                            "hover:border-[rgba(124,58,237,0.3)] hover:bg-[#212127]",
                            "transition-all duration-200",
                            "disabled:opacity-50"
                        )}
                        style={{ fontSize: '16px', minHeight: '48px' }}
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

                {/* Send button - Mobile Audit: Enhanced styling with shadow */}
                <button
                    ref={sendButtonRef}
                    onClick={handleSend}
                    disabled={!canSend}
                    className={cn(
                        "rounded-xl transition-all duration-200 touch-target flex-shrink-0",
                        "w-[44px] h-[44px] flex items-center justify-center",
                        canSend
                            ? "bg-[var(--accent-primary)] text-white shadow-[0_2px_8px_rgba(124,58,237,0.2)] hover:bg-[#A78BFA] hover:shadow-[0_4px_12px_rgba(124,58,237,0.3)] hover:scale-105 active:scale-95 active:bg-[#6D28D9]"
                            : "bg-[#727278] text-white/50 opacity-50",
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
