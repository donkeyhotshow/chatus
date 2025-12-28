"use client";

import { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { doc } from 'firebase/firestore';
import { useDebounce } from 'use-debounce';
import Image from 'next/image';
import type { Message, Room, UserProfile } from '@/lib/types';
import { DoodlePad, MessageSearch } from '@/components/lazy/LazyComponents';
import { useFirebase } from '@/components/firebase/FirebaseProvider';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useChatService } from '@/hooks/useChatService';
import { usePresence } from '@/hooks/usePresence';
import { useToast } from '@/hooks/use-toast';
import { useDoc } from '@/hooks/useDoc';
import { useChatPersistence, useUserPreferences } from '@/hooks/use-chat-persistence';
import { logger } from '@/lib/logger';
import { NetworkConnectionStatus } from '@/components/ui/connection-status';
import { getNotificationSound } from '@/lib/notification-sound';
import { MobileErrorHandler } from '../mobile/MobileErrorHandler';
import { ChatHeader } from './ChatHeader';
import MessageList from './MessageList';
import { NewMessageNotification } from './NewMessageNotification';
import { TypingIndicator } from './TypingIndicator';
import { EnhancedMessageInput } from './EnhancedMessageInput';
import { NavigationState } from '@/lib/navigation-state';
import { FileUploadProgress } from '@/components/ui/FileUploadProgress';
import { useFileUpload } from '@/hooks/useFileUpload';

interface ChatAreaProps {
    user: UserProfile;
    roomId: string;
    onMobileBack?: () => void;
    hideSearch?: boolean;
    navigationState?: NavigationState | null;
    onSettings?: () => void;
    onLogout?: () => void;
}

export const ChatArea = memo(function ChatArea({
    user,
    roomId,
    onMobileBack,
    hideSearch = false,
    navigationState,
    onSettings,
    onLogout,
}: ChatAreaProps) {
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const [showDoodlePad, setShowDoodlePad] = useState(false);
    const [imageForView, setImageForView] = useState<string | null>(null);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
    const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
    const [newMessageCount, setNewMessageCount] = useState(0);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // File upload with progress - Этап 4
    const {
        uploads,
        uploadFile,
        cancelUpload,
        retryUpload,
        dismissUpload,
    } = useFileUpload({
        roomId,
        userId: user.id,
        onUploadComplete: async (url) => {
            if (service) {
                await service.sendMessage({
                    text: '',
                    imageUrl: url,
                    user,
                    senderId: user.id,
                    type: 'image',
                });
            }
        },
    });

    const { saveMessages, loadMessages, hasHistory } = useChatPersistence(roomId);
    const { updateLastRoomId } = useUserPreferences();

    const { db } = useFirebase() ?? {};
    const { toast } = useToast();

    const normalizedRoomId = useMemo(() => {
        try {
            return decodeURIComponent(roomId);
        } catch {
            return roomId;
        }
    }, [roomId]);

    const roomRef = useMemo(() => {
        if (!db || !normalizedRoomId) return null;
        return doc(db, 'rooms', normalizedRoomId);
    }, [db, normalizedRoomId]);

    const { data: room } = useDoc<Room>(roomRef);

    const {
        messages: persistedMessages,
        isInitialLoad,
        typingUsers: serviceTypingUsers,
        service,
        hasMoreMessages,
        connectionState,
    } = useChatService(roomId, user);

    const { isOnline } = usePresence(roomId, user?.id || null);

    const lastMessageCountRef = useRef<number>(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messageListRef = useRef<any>(null);
    const inputRef = useRef<{ focus: () => void }>(null);

    const [debouncedMessages] = useDebounce(persistedMessages, 500);

    useEffect(() => {
        if (debouncedMessages?.length > 0) {
            saveMessages(debouncedMessages);
        }
    }, [debouncedMessages, saveMessages]);

    useEffect(() => {
        updateLastRoomId(roomId);
    }, [roomId, updateLastRoomId]);

    // Кэшируем сообщения только один раз при первой загрузке
    const [cachedMessages, setCachedMessages] = useState<Message[]>([]);

    useEffect(() => {
        if (isInitialLoad && hasHistory && cachedMessages.length === 0) {
            const loaded = loadMessages();
            if (loaded.length > 0) {
                setCachedMessages(loaded);
            }
        }
        // Очищаем кэш когда загрузка завершена и есть реальные сообщения
        if (!isInitialLoad && persistedMessages.length > 0 && cachedMessages.length > 0) {
            setCachedMessages([]);
        }
    }, [isInitialLoad, hasHistory, loadMessages, cachedMessages.length, persistedMessages.length]);

    useEffect(() => {
        setTypingUsers(serviceTypingUsers);
    }, [serviceTypingUsers]);

    // P3 Fix: Sound notification using Web Audio API
    useEffect(() => {
        if (isInitialLoad || persistedMessages.length === 0) {
            lastMessageCountRef.current = persistedMessages.length;
            return;
        }

        if (persistedMessages.length > lastMessageCountRef.current) {
            const newMessages = persistedMessages.slice(lastMessageCountRef.current);
            const hasNewFromOthers = newMessages.some(msg => msg.user?.id !== user.id && msg.type !== 'system');

            if (hasNewFromOthers) {
                // Use Web Audio API notification sound
                const notifier = getNotificationSound();
                notifier.play().catch(() => { });
            }
        }
        lastMessageCountRef.current = persistedMessages.length;
    }, [persistedMessages, isInitialLoad, user.id]);

    const allMessages = useMemo(() => {
        const combined = [
            ...cachedMessages,
            ...persistedMessages,
            ...optimisticMessages
        ];

        const uniqueMap = new Map<string, Message>();
        combined.forEach(msg => {
            // Используем более новую версию сообщения если есть дубликат
            const existing = uniqueMap.get(msg.id);
            if (!existing) {
                uniqueMap.set(msg.id, msg);
            } else {
                // Сравниваем timestamps и берём более новую версию
                const existingTime = existing.createdAt?.toMillis?.() || 0;
                const newTime = msg.createdAt?.toMillis?.() || 0;
                if (newTime > existingTime) {
                    uniqueMap.set(msg.id, msg);
                }
            }
        });

        return Array.from(uniqueMap.values()).sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return aTime - bTime;
        });
    }, [persistedMessages, optimisticMessages, cachedMessages]);

    const otherUser = useMemo(() => {
        return room?.participantProfiles?.find(p => p.id !== user?.id);
    }, [room, user]);

    const handleReply = useCallback((message: Message) => setReplyTo(message), []);
    const handleImageClick = useCallback((url: string) => setImageForView(url), []);

    // Sticker Import Logic
    const handleStickerImport = useCallback(async (url: string) => {
        try {
            toast({ title: 'Импорт стикеров', description: 'Загружаем стикерпак...' });
            const response = await fetch('/api/stickers/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            const data = await response.json();

            if (data.success) {
                toast({
                    title: 'Успех!',
                    description: `Стикерпак "${data.pack.title}" добавлен. (${data.pack.stickerCount} стикеров)`
                });
                // Here you would typically update the sticker picker state
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (error) {
            logger.error('Sticker import failed', error as Error);
            toast({
                title: 'Ошибка',
                description: 'Не удалось импортировать стикеры. Проверьте ссылку.',
                variant: 'destructive'
            });
        }
    }, [toast]);

    const handleSend = useCallback(async (text: string) => {
        if (!service || !text.trim()) return;

        // Check for Telegram sticker pack links
        const stickerRegex = /https?:\/\/(?:t\.me|telegram\.me)\/addstickers\/([a-zA-Z0-9_]+)/;
        if (stickerRegex.test(text)) {
            handleStickerImport(text.trim());
            return; // Don't send the link as a message if it's an import command
        }

        try {
            await service.sendMessage({
                text: text.trim(),
                user,
                senderId: user.id,
                type: 'text',
                replyTo: replyTo ? { id: replyTo.id, text: replyTo.text || 'Image', senderName: replyTo.user.name } : null
            });
            setReplyTo(null);
        } catch (error) {
            logger.error('Failed to send message', error as Error, { roomId });
            toast({ title: 'Ошибка отправки', variant: 'destructive' });
        }
    }, [service, user, replyTo, roomId, toast, handleStickerImport]);

    const handleSearchOpen = useCallback(() => setIsSearchOpen(true), []);
    const handleSearchClose = useCallback(() => setIsSearchOpen(false), []);

    const handleMessageSelect = useCallback((messageId: string) => {
        const el = document.getElementById(`message-${messageId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('bg-[var(--accent-light)]');
            setTimeout(() => el.classList.remove('bg-[var(--accent-light)]'), 2000);
        }
    }, []);

    const handleTypingStart = useCallback(() => service?.sendTyping(), [service]);
    const handleTypingStop = useCallback(() => service?.stopTyping(), [service]);

    const handleSendDoodle = useCallback(async (imageUrl: string) => {
        if (!service) return;
        try {
            await service.sendMessage({ text: '', imageUrl, user, senderId: user.id, type: 'doodle' });
            setShowDoodlePad(false);
        } catch {
            toast({ title: 'Ошибка', variant: 'destructive' });
        }
    }, [service, user, toast]);

    const handleSendSticker = useCallback(async (imageUrl: string) => {
        if (!service) return;
        try {
            await service.sendMessage({ text: 'Sticker', imageUrl, user, senderId: user.id, type: 'sticker' });
        } catch { }
    }, [service, user]);

    // Используем useFileUpload с progress bar
    const handleImageUpload = useCallback(async (file: File) => {
        await uploadFile(file);
    }, [uploadFile]);

    const handleDeleteMessage = useCallback(async (messageId: string) => {
        if (!service) return;

        // Confirmation dialog
        const confirmed = window.confirm('Удалить это сообщение?');
        if (!confirmed) return;

        try {
            await service.deleteMessage(messageId);
            toast({ title: 'Сообщение удалено' });
        } catch (error) {
            logger.error('Failed to delete message', error as Error, { messageId });
            toast({ title: 'Ошибка удаления', variant: 'destructive' });
        }
    }, [service, toast]);

    const handleToggleReaction = useCallback(async (messageId: string, emoji: string) => {
        if (!service) return;
        try {
            await service.toggleReaction(messageId, emoji, user);
        } catch { }
    }, [service, user]);

    const [isTabActive, setIsTabActive] = useState(true);

    useEffect(() => {
        const handleFocus = () => setIsTabActive(true);
        const handleBlur = () => setIsTabActive(false);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);
        setIsTabActive(!document.hidden);
        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);

    useEffect(() => {
        if (service && isTabActive) service.markMessagesAsSeen();
    }, [service, isTabActive, allMessages.length]);

    useEffect(() => {
        if (service) service.markMessagesAsDelivered();
    }, [service, allMessages.length]);

    const scrollToBottom = useCallback(() => {
        if (messageListRef.current) {
            messageListRef.current.scrollToIndex({ index: allMessages.length - 1, behavior: 'smooth', align: 'end' });
            setIsUserScrolledUp(false);
            setNewMessageCount(0);
        }
    }, [allMessages.length]);

    const handleScroll = useCallback((isAtBottom: boolean) => {
        setIsUserScrolledUp(!isAtBottom);
        if (isAtBottom) setNewMessageCount(0);
    }, []);

    useEffect(() => {
        if (isUserScrolledUp && persistedMessages.length > lastMessageCountRef.current) {
            const newMsgs = persistedMessages.slice(lastMessageCountRef.current).filter(m => m.user.id !== user.id && m.type !== 'system');
            setNewMessageCount(prev => prev + newMsgs.length);
        }
    }, [persistedMessages, isUserScrolledUp, user.id]);

    const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
        // Only focus if clicking the background, not interactive elements
        if (e.target === e.currentTarget) {
            inputRef.current?.focus();
        }
    }, []);

    return (
        <section className="flex-1 flex flex-col min-h-0 h-full bg-[var(--bg-primary)] relative">
            <NetworkConnectionStatus />
            <MobileErrorHandler
                isOnline={connectionState?.isOnline}
                isConnected={connectionState?.isConnected}
                isReconnecting={connectionState?.isReconnecting}
                onRetry={() => window.location.reload()}
            />
                <ChatHeader
                    roomId={roomId}
                    otherUser={otherUser}
                    isOnline={isOnline}
                    onBack={onMobileBack}
                    onSearchOpen={hideSearch ? undefined : handleSearchOpen}
                    onSettings={onSettings}
                    onLogout={onLogout}
                    navigationState={navigationState}
                    showBreadcrumb={true}
                    currentUserName={user.name}
                    currentUserAvatar={user.avatar}
                />

                {/* Messages */}
                <div
                    className="flex-1 min-h-0 overflow-hidden relative w-full max-w-[var(--max-chat-width)] mx-auto"
                    onClick={handleBackgroundClick}
                >
                    {allMessages.length === 0 && !isInitialLoad ? (
                        <EmptyState onSend={(text) => {
                            try {
                                service?.sendMessage({ text, user, senderId: user.id, type: 'text' }).catch((error) => {
                                    logger.warn('Failed to send quick message', error as Error);
                                    toast({ title: 'Ошибка отправки', variant: 'destructive' });
                                });
                            } catch (error) {
                                logger.warn('Sync error sending quick message', error as Error);
                                toast({ title: 'Ошибка отправки', variant: 'destructive' });
                            }
                        }} />
                    ) : (
                        <MessageList
                            ref={messageListRef}
                            messages={allMessages}
                            isLoading={isInitialLoad && allMessages.length === 0}
                            currentUserId={user.id}
                            onReaction={handleToggleReaction}
                            onDeleteMessage={handleDeleteMessage}
                            onImageClick={handleImageClick}
                            onReply={handleReply}
                            onLoadMore={service?.loadMoreMessages}
                            hasMoreMessages={hasMoreMessages}
                            onScroll={handleScroll}
                        />
                    )}

                    <NewMessageNotification
                        hasNewMessages={isUserScrolledUp && newMessageCount > 0}
                        newMessageCount={newMessageCount}
                        onScrollToBottom={scrollToBottom}
                    />
                </div>

                {/* Input Area */}
                <div className="shrink-0 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                    {/* Reply preview */}
                    {replyTo && (
                        <div className="flex items-center justify-between mx-3 mt-2 px-3 py-2 bg-[var(--bg-tertiary)] border-l-2 border-[var(--accent-primary)] rounded-r-lg">
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-[var(--text-primary)]">
                                    Ответ для {replyTo.user.name}
                                </p>
                                <p className="text-xs text-white/60 truncate">
                                    {replyTo.imageUrl && !replyTo.text ? 'Изображение' : replyTo.text}
                                </p>
                            </div>
                            <button
                                onClick={() => setReplyTo(null)}
                                className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {showDoodlePad && (
                        <DoodlePad onClose={() => setShowDoodlePad(false)} onSend={handleSendDoodle} />
                    )}

                    <TypingIndicator
                        users={room?.participantProfiles?.filter(p => p.id !== user.id && typingUsers.includes(p.id)).map(p => p.name) || []}
                    />

                    {/* File Upload Progress - Этап 4 */}
                    <FileUploadProgress
                        uploads={uploads}
                        onCancel={cancelUpload}
                        onRetry={retryUpload}
                        onDismiss={dismissUpload}
                    />

                    <EnhancedMessageInput
                        ref={inputRef}
                        onSend={handleSend}
                        onTyping={(isTyping) => isTyping ? handleTypingStart() : handleTypingStop()}
                        onFileUpload={handleImageUpload}
                        onStickerSend={handleSendSticker}
                        placeholder="Сообщение..."
                    />
                </div>

            {/* Image viewer */}
            {imageForView && (
                <Dialog open={!!imageForView} onOpenChange={() => setImageForView(null)}>
                    <DialogContent className="p-0 border-0 max-w-4xl bg-transparent">
                        <DialogTitle className="sr-only">Просмотр изображения</DialogTitle>
                        <DialogDescription className="sr-only">Полноразмерное изображение</DialogDescription>
                        <Image src={imageForView} alt="Full view" width={800} height={600} className="w-full h-auto max-h-[90vh] object-contain rounded-lg" unoptimized />
                    </DialogContent>
                </Dialog>
            )}

            {/* Search */}
            <MessageSearch
                messages={allMessages}
                users={room?.participantProfiles || []}
                isOpen={isSearchOpen}
                onClose={handleSearchClose}
                onMessageSelect={handleMessageSelect}
            />
        </section>
    );
}, (prev, next) => prev.roomId === next.roomId && prev.user.id === next.user.id);

// Empty state component - Premium Dark Theme
function EmptyState({ onSend }: { onSend: (text: string) => void }) {
    const suggestions = ['Привет! 👋', 'Как дела?', 'Давай порисуем? 🎨', 'Сыграем? 🎮'];

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center mb-8 shadow-2xl shadow-violet-600/30 animate-float">
                <MessageCircle className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
                Начните общение
            </h3>
            <p className="text-sm text-white/60 mb-10 max-w-xs leading-relaxed">
                Отправьте первое сообщение или выберите быстрый ответ ниже
            </p>
            <div className="flex flex-wrap justify-center gap-3 max-w-sm">
                {suggestions.map((text, index) => (
                    <button
                        key={text}
                        onClick={() => onSend(text)}
                        className="px-5 py-3 min-h-[48px] rounded-2xl bg-white/[0.04] border border-white/[0.08] text-sm text-white/60 hover:text-white hover:bg-white/[0.08] hover:border-violet-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/10 active:scale-95"
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        {text}
                    </button>
                ))}
            </div>
        </div>
    );
}
