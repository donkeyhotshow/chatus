"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, Paperclip, Mic, Image, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedMessageInputProps {
    onSend: (message: string) => void;
    onTyping?: (isTyping: boolean) => void;
    onFileUpload?: (file: File) => void;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
}

export function EnhancedMessageInput({
    onSend,
    onTyping,
    onFileUpload,
    disabled = false,
    placeholder = "Напишите сообщение...",
    className
}: EnhancedMessageInputProps) {
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();

    const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
        if ('vibrate' in navigator) {
            const patterns = { light: 10, medium: 20, heavy: 30 };
            navigator.vibrate(patterns[type]);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setMessage(value);

        if (!isTyping && value.trim() && onTyping) {
            setIsTyping(true);
            onTyping(true);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        if (value.trim() && onTyping) {
            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
                onTyping(false);
            }, 1000);
        } else if (onTyping) {
            setIsTyping(false);
            onTyping(false);
        }
    };

    const handleSend = useCallback(() => {
        const trimmedMessage = message.trim();
        if (trimmedMessage && !disabled) {
            onSend(trimmedMessage);
            setMessage('');
            setIsTyping(false);
            if (onTyping) onTyping(false);
            triggerHaptic('medium');

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        }
    }, [message, disabled, onSend, onTyping, triggerHaptic]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        } else if (e.key === 'Escape') {
            setShowEmojiPicker(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onFileUpload) {
            onFileUpload(file);
            triggerHaptic('light');
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && onFileUpload) {
            onFileUpload(file);
            triggerHaptic('medium');
        }
    };

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🔥'];

    return (
        <div className={cn("relative w-full", className)}>
            <AnimatePresence>
                {isDragOver && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 -top-20 bg-cyan-500/5 backdrop-blur-sm border-2 border-dashed border-cyan-500/20 rounded-2xl flex items-center justify-center z-50 mx-4 mb-4"
                    >
                        <p className="text-cyan-400 font-bold">Перетащите файлы сюда</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showEmojiPicker && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-4 mb-4 bg-neutral-900/95 backdrop-blur-2xl border border-white/5 rounded-2xl p-4 shadow-2xl w-72 z-50"
                    >
                        <div className="grid grid-cols-4 gap-2">
                            {quickEmojis.map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={() => {
                                        setMessage(prev => prev + emoji);
                                        setShowEmojiPicker(false);
                                        inputRef.current?.focus();
                                        triggerHaptic('light');
                                    }}
                                    className="aspect-square flex items-center justify-center text-2xl hover:bg-white/5 rounded-xl transition-all active:scale-90"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-4 pb-4 w-full max-w-5xl mx-auto">
                <div
                    className={cn(
                        "flex items-center gap-2 p-1.5 bg-white/5 border border-white/5 rounded-2xl transition-all duration-300",
                        isDragOver && "border-cyan-500/50 bg-white/10"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="flex items-center gap-0.5">
                        <button
                            onClick={() => {
                                setShowEmojiPicker(!showEmojiPicker);
                                triggerHaptic('light');
                            }}
                            disabled={disabled}
                            className={cn(
                                "p-2.5 rounded-xl transition-all",
                                showEmojiPicker ? "text-cyan-400 bg-cyan-400/10" : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5",
                                disabled && "opacity-50"
                            )}
                        >
                            <Smile className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => {
                                fileInputRef.current?.click();
                                triggerHaptic('light');
                            }}
                            disabled={disabled}
                            className="p-2.5 rounded-xl text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-all disabled:opacity-50"
                        >
                            <Paperclip className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 relative min-w-0">
                        <input
                            ref={inputRef}
                            type="text"
                            value={message}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            disabled={disabled}
                            className="w-full bg-transparent text-white placeholder-neutral-600 px-2 py-2 focus:outline-none text-sm disabled:cursor-not-allowed"
                        />
                    </div>

                    <motion.button
                        onClick={handleSend}
                        disabled={!message.trim() || disabled}
                        className={cn(
                            "p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center",
                            message.trim() && !disabled
                                ? "bg-white text-black hover:bg-neutral-200"
                                : "text-neutral-600"
                        )}
                    >
                        <Send className="w-5 h-5" />
                    </motion.button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                        className="hidden"
                    />
                </div>
            </div>
        </div>
    );
}

