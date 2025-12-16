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

    // Haptic feedback
    const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
        if ('vibrate' in navigator) {
            const patterns = { light: 10, medium: 20, heavy: 30 };
            navigator.vibrate(patterns[type]);
        }
    }, []);

    // Handle input change with typing indicator
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setMessage(value);

        // Typing indicator logic
        if (!isTyping && value.trim() && onTyping) {
            setIsTyping(true);
            onTyping(true);
        }

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing indicator
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

    // Handle send message
    const handleSend = useCallback(() => {
        const trimmedMessage = message.trim();
        if (trimmedMessage && !disabled) {
            onSend(trimmedMessage);
            setMessage('');
            setIsTyping(false);
            if (onTyping) onTyping(false);
            triggerHaptic('medium');

            // Clear typing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        }
    }, [message, disabled, onSend, onTyping, triggerHaptic]);

    // Handle keyboard shortcuts
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        } else if (e.key === 'Escape') {
            setShowEmojiPicker(false);
        }
    };

    // Handle file selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onFileUpload) {
            onFileUpload(file);
            triggerHaptic('light');
        }
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle drag and drop
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

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    // Quick emoji reactions
    const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🔥'];

    return (
        <div className={cn("relative", className)}>
            {/* Drag overlay */}
            <AnimatePresence>
                {isDragOver && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-cyan-500/20 border-2 border-dashed border-cyan-500 rounded-lg flex items-center justify-center z-10"
                    >
                        <div className="text-center">
                            <Image className="w-12 h-12 mx-auto mb-2 text-cyan-400" />
                            <p className="text-cyan-300 font-medium">Отпустите для загрузки файла</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Emoji Picker */}
            <AnimatePresence>
                {showEmojiPicker && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-0 right-0 mb-2 bg-neutral-800 border border-neutral-700 rounded-lg p-3 shadow-xl"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-white">Быстрые реакции</span>
                            <button
                                onClick={() => setShowEmojiPicker(false)}
                                className="p-1 hover:bg-white/10 rounded touch-target"
                            >
                                <X className="w-4 h-4 text-neutral-400" />
                            </button>
                        </div>
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
                                    className="p-3 text-2xl hover:bg-white/10 rounded-lg transition-colors touch-target"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Input Area */}
            <div
                className={cn(
                    "flex items-end gap-3 p-4 bg-black/95 backdrop-blur border-t border-white/10 safe-area-inset-bottom transition-colors",
                    isDragOver && "bg-cyan-500/10"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Message Input */}
                <div className="flex-1 relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={message}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled}
                        className={cn(
                            "w-full bg-neutral-800 text-white placeholder-neutral-400 px-4 py-3 rounded-lg border border-neutral-700 focus:border-cyan-500 focus:outline-none transition-colors focus-visible-enhanced",
                            "md:h-12 h-14", // Больше на мобильных
                            "md:text-sm text-base", // 16px на мобильных (предотвращает zoom на iOS)
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                        style={{ fontSize: '16px' }} // Дополнительная защита от zoom на iOS
                    />

                    {/* Character count for long messages */}
                    {message.length > 100 && (
                        <div className="absolute -top-6 right-0 text-xs text-neutral-500">
                            {message.length}/1000
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    {/* Emoji Picker Button */}
                    <button
                        onClick={() => {
                            setShowEmojiPicker(!showEmojiPicker);
                            triggerHaptic('light');
                        }}
                        disabled={disabled}
                        className={cn(
                            "p-3 rounded-lg transition-colors touch-target focus-visible-enhanced",
                            showEmojiPicker
                                ? "bg-cyan-500/20 text-cyan-400"
                                : "hover:bg-white/10 text-neutral-400",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <Smile className="w-6 h-6" />
                    </button>

                    {/* File Upload Button */}
                    <button
                        onClick={() => {
                            fileInputRef.current?.click();
                            triggerHaptic('light');
                        }}
                        disabled={disabled}
                        className={cn(
                            "p-3 hover:bg-white/10 rounded-lg transition-colors touch-target focus-visible-enhanced",
                            "text-neutral-400",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <Paperclip className="w-6 h-6" />
                    </button>

                    {/* Voice Message Button (placeholder) */}
                    <button
                        disabled={disabled}
                        className={cn(
                            "p-3 hover:bg-white/10 rounded-lg transition-colors touch-target focus-visible-enhanced",
                            "text-neutral-400",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <Mic className="w-6 h-6" />
                    </button>

                    {/* Send Button */}
                    <motion.button
                        onClick={handleSend}
                        disabled={!message.trim() || disabled}
                        whileHover={{ scale: message.trim() ? 1.05 : 1 }}
                        whileTap={{ scale: message.trim() ? 0.95 : 1 }}
                        className={cn(
                            "p-3 rounded-lg transition-all touch-target focus-visible-enhanced",
                            message.trim() && !disabled
                                ? "bg-cyan-500 text-black hover:bg-cyan-400 shadow-lg shadow-cyan-500/25"
                                : "bg-neutral-700 text-neutral-500 cursor-not-allowed"
                        )}
                    >
                        <Send className="w-6 h-6" />
                    </motion.button>
                </div>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                    className="hidden"
                />
            </div>
        </div>
    );
}
