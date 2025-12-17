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
        <div className={cn("relative w-full z-20", className)}>
            {/* Drag overlay */}
            <AnimatePresence>
                {isDragOver && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-0 -top-20 bg-cyan-500/10 backdrop-blur-md border-2 border-dashed border-cyan-500/50 rounded-2xl flex items-center justify-center z-50 mx-4 mb-4"
                    >
                        <div className="text-center p-6">
                            <Image className="w-12 h-12 mx-auto mb-2 text-cyan-400 animate-bounce" />
                            <p className="text-cyan-300 font-bold text-lg">Drop files here</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Emoji Picker */}
            <AnimatePresence>
                {showEmojiPicker && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="absolute bottom-full left-4 mb-4 bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl w-72 z-50"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Quick Reactions</span>
                            <button
                                onClick={() => setShowEmojiPicker(false)}
                                className="p-1 hover:bg-white/10 rounded-full transition-colors"
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
                                    className="aspect-square flex items-center justify-center text-2xl hover:bg-white/10 rounded-xl transition-all hover:scale-110 active:scale-95"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Input Area */}
            <div className="px-2 pb-2 md:px-4 md:pb-4 w-full max-w-5xl mx-auto">
                <div
                    className={cn(
                        "flex items-end gap-2 p-2 bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-[24px] shadow-2xl transition-all duration-300",
                        isDragOver && "ring-2 ring-cyan-500/50 bg-neutral-900/90"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {/* Left Actions */}
                    <div className="flex items-center gap-1 pb-1 pl-1">
                        <button
                            onClick={() => {
                                setShowEmojiPicker(!showEmojiPicker);
                                triggerHaptic('light');
                            }}
                            disabled={disabled}
                            className={cn(
                                "p-2.5 rounded-full transition-all duration-200 hover:bg-white/10 active:scale-95",
                                showEmojiPicker ? "text-cyan-400 bg-cyan-400/10" : "text-neutral-400 hover:text-white",
                                disabled && "opacity-50 cursor-not-allowed"
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
                            className={cn(
                                "p-2.5 rounded-full transition-all duration-200 hover:bg-white/10 active:scale-95 text-neutral-400 hover:text-white",
                                disabled && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <Paperclip className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Message Input */}
                    <div className="flex-1 relative min-w-0 py-1.5">
                        <input
                            ref={inputRef}
                            type="text"
                            value={message}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            disabled={disabled}
                            className={cn(
                                "w-full bg-transparent text-white placeholder-neutral-500 px-2 py-1 focus:outline-none transition-colors",
                                "text-[16px]", // Prevents iOS zoom
                                disabled && "cursor-not-allowed"
                            )}
                            style={{ fontSize: '16px' }}
                        />
                    </div>

                    {/* Send Button */}
                    <div className="pb-1 pr-1">
                        <motion.button
                            onClick={handleSend}
                            disabled={!message.trim() || disabled}
                            whileHover={{ scale: message.trim() ? 1.05 : 1 }}
                            whileTap={{ scale: message.trim() ? 0.95 : 1 }}
                            className={cn(
                                "p-2.5 rounded-full transition-all duration-300 flex items-center justify-center",
                                message.trim() && !disabled
                                    ? "bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
                                    : "bg-white/5 text-neutral-600 cursor-not-allowed"
                            )}
                        >
                            <Send className="w-5 h-5 ml-0.5" />
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

                {/* Character count */}
                {message.length > 100 && (
                    <div className="absolute -top-6 right-8 text-[10px] font-mono text-neutral-500 bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
                        {message.length}/1000
                    </div>
                )}
            </div>
        </div>
    );
}
