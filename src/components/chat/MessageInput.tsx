"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Smile, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StickerPicker } from './StickerPicker';
import { useDebouncedCallback } from 'use-debounce';
import { cn } from '@/lib/utils';

interface MessageInputProps {
    onSendMessage: (text: string) => void;
    onImageSend: (file: File) => void;
    onInputChange: () => void;
    onStickerSend: (stickerUrl: string) => void;
    roomId: string;
    disabled?: boolean;
}

const MAX_MESSAGE_LENGTH = 1000;

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

    const draftKey = `chat-draft-${roomId}`;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
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
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
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
        <div className="relative bg-[var(--bg-secondary)] border-t border-[var(--border-primary)] safe-bottom">
            {/* Sticker Picker */}
            {showStickerPicker && (
                <StickerPicker
                    onSelect={(url) => {
                        onStickerSend(url);
                        setShowStickerPicker(false);
                    }}
                    onClose={() => setShowStickerPicker(false)}
                />
            )}

            <div className="flex items-end gap-2 p-3">
                {/* Emoji/Sticker button */}
                <button
                    onClick={() => setShowStickerPicker(p => !p)}
                    disabled={disabled}
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors touch-target disabled:opacity-50"
                >
                    <Smile className="w-5 h-5" />
                </button>

                {/* Input container */}
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={handleTextChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Сообщение..."
                        disabled={disabled}
                        rows={1}
                        maxLength={MAX_MESSAGE_LENGTH + 100}
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
                        <span className={cn(
                            "absolute right-3 bottom-2 text-xs",
                            text.length > MAX_MESSAGE_LENGTH ? "text-[var(--error)]" : "text-[var(--text-muted)]"
                        )}>
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
                >
                    {isUploading ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <ImageIcon className="w-5 h-5" />
                    )}
                </button>

                {/* Send button */}
                <button
                    onClick={handleSend}
                    disabled={!canSend}
                    className={cn(
                        "p-2.5 rounded-full transition-all duration-150 touch-target",
                        canSend
                            ? "bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
                            : "bg-[var(--bg-tertiary)] text-[var(--text-muted)]",
                        "disabled:cursor-not-allowed"
                    )}
                >
                    {isSending ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Send className="w-5 h-5" />
                    )}
                </button>
            </div>
        </div>
    );
}
