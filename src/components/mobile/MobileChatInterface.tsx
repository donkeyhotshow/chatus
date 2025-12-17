"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
    ArrowLeft,
    Users,
    Settings,
    Plus,
    Paperclip,
    Mic,
    Send,
    MoreHorizontal,
    Reply,
    Copy,
    Trash2,
    Forward
} from 'lucide-react';
import { SwipeGestures } from './SwipeGestures';
import { KeyboardAwareContainer } from './KeyboardAwareInput';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface Message {
    id: string;
    text: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    timestamp: Date;
    isOwn: boolean;
}

interface User {
    id: string;
    name: string;
    avatar?: string;
    isOnline: boolean;
}

interface MobileChatInterfaceProps {
    roomName: string;
    currentUser: User;
    users: User[];
    messages: Message[];
    onBack: () => void;
    onSendMessage: (text: string) => void;
    onDeleteMessage?: (messageId: string) => void;
    onReplyToMessage?: (messageId: string) => void;
    onForwardMessage?: (messageId: string) => void;
}

interface MessageContextMenu {
    messageId: string;
    x: number;
    y: number;
    isOwn: boolean;
}

export function MobileChatInterface({
    roomName,
    currentUser,
    users,
    messages,
    onBack,
    onSendMessage,
    onDeleteMessage,
    onReplyToMessage,
    onForwardMessage
}: MobileChatInterfaceProps) {
    const [inputText, setInputText] = useState('');
    const [showParticipants, setShowParticipants] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [contextMenu, setContextMenu] = useState<MessageContextMenu | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const recordingTimer = useRef<NodeJS.Timeout>();
    const isMobile = useIsMobile();

    // Автопрокрутка к последнему сообщению
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Обработка записи голоса
    useEffect(() => {
        if (isRecording) {
            recordingTimer.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            if (recordingTimer.current) {
                clearInterval(recordingTimer.current);
            }
            setRecordingTime(0);
        }

        return () => {
            if (recordingTimer.current) {
                clearInterval(recordingTimer.current);
            }
        };
    }, [isRecording]);

    const handleSendMessage = useCallback(() => {
        if (inputText.trim()) {
            onSendMessage(inputText.trim());
            setInputText('');

            // Возвращаем фокус на поле ввода
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [inputText, onSendMessage]);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleMessageSwipe = useCallback((messageId: string, direction: 'left' | 'right') => {
        const message = messages.find(m => m.id === messageId);
        if (!message) return;

        if (direction === 'right') {
            // Свайп вправо - ответить
            onReplyToMessage?.(messageId);
        } else {
            // Свайп влево - показать контекстное меню
            // Здесь можно добавить логику для показа дополнительных действий
        }
    }, [messages, onReplyToMessage]);

    const handleMessageLongPress = useCallback((messageId: string, event: React.TouchEvent) => {
        const message = messages.find(m => m.id === messageId);
        if (!message) return;

        const touch = event.touches[0];
        setContextMenu({
            messageId,
            x: touch.clientX,
            y: touch.clientY,
            isOwn: message.isOwn
        });

        // Вибрация для обратной связи
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
    }, [messages]);

    const handleContextMenuAction = (action: string) => {
        if (!contextMenu) return;

        switch (action) {
            case 'reply':
                onReplyToMessage?.(contextMenu.messageId);
                break;
            case 'copy':
                const message = messages.find(m => m.id === contextMenu.messageId);
                if (message) {
                    navigator.clipboard.writeText(message.text);
                }
                break;
            case 'forward':
                onForwardMessage?.(contextMenu.messageId);
                break;
            case 'delete':
                onDeleteMessage?.(contextMenu.messageId);
                break;
        }

        setContextMenu(null);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatRecordingTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const onlineUsersCount = users.filter(u => u.isOnline).length;

    return (
        <div className="flex flex-col h-full bg-black relative">
            {/* Шапка */}
            <motion.header
                className="flex items-center justify-between p-4 bg-black/95 backdrop-blur-sm border-b border-white/10 z-50"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                <button
                    onClick={onBack}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors touch-target"
                    aria-label="Назад"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>

                <div className="flex-1 text-center px-4">
                    <h1 className="text-lg font-bold text-white truncate">
                        {roomName}
                    </h1>
                    <p className="text-xs text-neutral-400">
                        {onlineUsersCount} участник{onlineUsersCount !== 1 ? 'а' : ''} онлайн
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowParticipants(true)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors touch-target"
                        aria-label="Участники"
                    >
                        <Users className="w-6 h-6" />
                    </button>

                    <button
                        onClick={() => setShowSettings(true)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors touch-target"
                        aria-label="Настройки"
                    >
                        <Settings className="w-6 h-6" />
                    </button>
                </div>
            </motion.header>

            {/* Область сообщений */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
                {messages.map((message) => (
                    <SwipeGestures
                        key={message.id}
                        onSwipeLeft={() => handleMessageSwipe(message.id, 'left')}
                        onSwipeRight={() => handleMessageSwipe(message.id, 'right')}
                        onLongPress={() => {
                            // Для long press нужно передать event, но в SwipeGestures это не предусмотрено
                            // Можно добавить отдельный обработчик
                        }}
                        threshold={30}
                        className={cn(
                            "flex",
                            message.isOwn ? "justify-end" : "justify-start"
                        )}
                    >
                        <div
                            className={cn(
                                "max-w-[80%] flex",
                                message.isOwn ? "flex-row-reverse" : "flex-row"
                            )}
                            onTouchStart={(e) => {
                                // Обработка долгого нажатия
                                const timer = setTimeout(() => {
                                    handleMessageLongPress(message.id, e);
                                }, 500);

                                const cleanup = () => {
                                    clearTimeout(timer);
                                    document.removeEventListener('touchend', cleanup);
                                    document.removeEventListener('touchmove', cleanup);
                                };

                                document.addEventListener('touchend', cleanup);
                                document.addEventListener('touchmove', cleanup);
                            }}
                        >
                            {/* Аватар */}
                            {!message.isOwn && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0">
                                    {message.userAvatar ? (
                                        <img
                                            src={message.userAvatar}
                                            alt={message.userName}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        message.userName.charAt(0).toUpperCase()
                                    )}
                                </div>
                            )}

                            {/* Пузырь сообщения */}
                            <div
                                className={cn(
                                    "rounded-2xl px-4 py-2 max-w-full",
                                    message.isOwn
                                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-br-md"
                                        : "bg-neutral-800 text-white rounded-bl-md"
                                )}
                            >
                                {/* Имя отправителя (только для чужих сообщений) */}
                                {!message.isOwn && (
                                    <div className="text-xs text-neutral-400 mb-1 font-medium">
                                        {message.userName}
                                    </div>
                                )}

                                {/* Текст сообщения */}
                                <div className="text-sm leading-relaxed break-words">
                                    {message.text}
                                </div>

                                {/* Время */}
                                <div className={cn(
                                    "text-xs mt-1 text-right",
                                    message.isOwn ? "text-white/70" : "text-neutral-500"
                                )}>
                                    {formatTime(message.timestamp)}
                                </div>
                            </div>

                            {/* Аватар для своих сообщений */}
                            {message.isOwn && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold ml-2 flex-shrink-0">
                                    {currentUser.avatar ? (
                                        <img
                                            src={currentUser.avatar}
                                            alt={currentUser.name}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        currentUser.name.charAt(0).toUpperCase()
                                    )}
                                </div>
                            )}
                        </div>
                    </SwipeGestures>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Панель ввода */}
            <KeyboardAwareContainer className="border-t border-white/10 bg-black/95 backdrop-blur-sm">
                <div className="flex items-end gap-2 p-4">
                    {/* Кнопка дополнительных функций */}
                    <button
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors touch-target"
                        aria-label="Дополнительно"
                    >
                        <Plus className="w-6 h-6" />
                    </button>

                    {/* Кнопка прикрепления файлов */}
                    <button
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors touch-target"
                        aria-label="Прикрепить файл"
                    >
                        <Paperclip className="w-6 h-6" />
                    </button>

                    {/* Поле ввода */}
                    <div className="flex-1 relative">
                        <textarea
                            ref={inputRef}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Введите сообщение..."
                            className="w-full min-h-[44px] max-h-32 px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-2xl text-white placeholder-neutral-400 resize-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200"
                            rows={1}
                            style={{
                                height: 'auto',
                                minHeight: '44px'
                            }}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                            }}
                        />
                    </div>

                    {/* Кнопка отправки или записи голоса */}
                    {inputText.trim() ? (
                        <button
                            onClick={handleSendMessage}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 touch-target"
                            aria-label="Отправить"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onTouchStart={() => setIsRecording(true)}
                            onTouchEnd={() => setIsRecording(false)}
                            onMouseDown={() => setIsRecording(true)}
                            onMouseUp={() => setIsRecording(false)}
                            onMouseLeave={() => setIsRecording(false)}
                            className={cn(
                                "min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-all duration-200 touch-target",
                                isRecording
                                    ? "bg-red-500 text-white scale-110"
                                    : "text-neutral-400 hover:text-white hover:bg-white/10"
                            )}
                            aria-label={isRecording ? "Запись..." : "Записать голосовое сообщение"}
                        >
                            <Mic className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Индикатор записи */}
                <AnimatePresence>
                    {isRecording && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="px-4 pb-4"
                        >
                            <div className="flex items-center justify-center gap-2 text-red-400">
                                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                                <span className="text-sm font-medium">
                                    Запись: {formatRecordingTime(recordingTime)}
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </KeyboardAwareContainer>

            {/* Контекстное меню для сообщений */}
            <AnimatePresence>
                {contextMenu && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-40"
                            onClick={() => setContextMenu(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="fixed z-50 bg-neutral-800 rounded-2xl border border-neutral-600 shadow-2xl min-w-[200px]"
                            style={{
                                left: Math.min(contextMenu.x, window.innerWidth - 220),
                                top: Math.min(contextMenu.y, window.innerHeight - 200),
                            }}
                        >
                            <div className="py-2">
                                <button
                                    onClick={() => handleContextMenuAction('reply')}
                                    className="w-full px-4 py-3 text-left text-white hover:bg-neutral-700 transition-colors flex items-center gap-3"
                                >
                                    <Reply className="w-4 h-4" />
                                    Ответить
                                </button>

                                <button
                                    onClick={() => handleContextMenuAction('copy')}
                                    className="w-full px-4 py-3 text-left text-white hover:bg-neutral-700 transition-colors flex items-center gap-3"
                                >
                                    <Copy className="w-4 h-4" />
                                    Копировать
                                </button>

                                <button
                                    onClick={() => handleContextMenuAction('forward')}
                                    className="w-full px-4 py-3 text-left text-white hover:bg-neutral-700 transition-colors flex items-center gap-3"
                                >
                                    <Forward className="w-4 h-4" />
                                    Переслать
                                </button>

                                {contextMenu.isOwn && (
                                    <button
                                        onClick={() => handleContextMenuAction('delete')}
                                        className="w-full px-4 py-3 text-left text-red-400 hover:bg-neutral-700 transition-colors flex items-center gap-3"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Удалить
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Боковая панель участников */}
            <AnimatePresence>
                {showParticipants && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-40"
                            onClick={() => setShowParticipants(false)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            className="fixed right-0 top-0 bottom-0 w-80 max-w-[90vw] bg-neutral-900 border-l border-white/10 z-50"
                        >
                            <div className="p-4 border-b border-white/10">
                                <h2 className="text-lg font-bold text-white">Участники</h2>
                                <p className="text-sm text-neutral-400">{users.length} участник{users.length !== 1 ? 'а' : ''}</p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {users.map((user) => (
                                    <div key={user.id} className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                                                {user.avatar ? (
                                                    <img
                                                        src={user.avatar}
                                                        alt={user.name}
                                                        className="w-full h-full rounded-full object-cover"
                                                    />
                                                ) : (
                                                    user.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            {user.isOnline && (
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-neutral-900" />
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <div className="text-white font-medium">{user.name}</div>
                                            <div className="text-xs text-neutral-400">
                                                {user.isOnline ? 'Онлайн' : 'Офлайн'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
