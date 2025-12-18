
"use client";

import { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import type { Message, Room, UserProfile } from '@/lib/types';
import { ChatHeader } from './ChatHeader';
import MessageList from './MessageList';
import { MessageInput } from './MessageInput';
import { NewMessageNotification } from './NewMessageNotification';
import { ConnectionStatus } from './ConnectionStatus';
import { MobileErrorHandler } from '../mobile/MobileErrorHandler';
import { DoodlePad } from '@/components/lazy/LazyComponents';
import { X, MessageCircle } from 'lucide-react';
import { useChatService } from '@/hooks/useChatService';
import { usePresence } from '@/hooks/usePresence';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '../ui/dialog';
import { useDoc } from '@/hooks/useDoc';
import { doc } from 'firebase/firestore';
import { useFirebase } from '../firebase/FirebaseProvider';
import { Timestamp } from 'firebase/firestore';
import { logger } from '@/lib/logger';
import { useDebounce } from 'use-debounce';
import { VerticalResizer } from '../ui/VerticalResizer';
import { useIsMobile } from '@/hooks/use-mobile';
import { MessageSearch } from '@/components/lazy/LazyComponents';
import { TypingIndicator } from './TypingIndicator';
import { EnhancedMessageInput } from './EnhancedMessageInput';
import { useChatPersistence, useUserPreferences } from '@/hooks/use-chat-persistence';

type ChatAreaProps = {
  user: UserProfile;
  roomId: string;
  isCollabSpaceVisible: boolean;
  onToggleCollaborationSpace: () => void;
  onMobileBack?: () => void; // Mobile back navigation
};

export const ChatArea = memo(function ChatArea({
  user,
  roomId,
  isCollabSpaceVisible,
  onToggleCollaborationSpace,
  onMobileBack,
}: ChatAreaProps) {
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showDoodlePad, setShowDoodlePad] = useState(false);
  const [imageForView, setImageForView] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [inputAreaHeight, setInputAreaHeight] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chatarea-input-height');
      return saved ? parseInt(saved, 10) : 120;
    }
    return 120;
  });
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isMobile = useIsMobile();

  // Chat persistence hooks
  const { saveMessages, loadMessages, hasHistory } = useChatPersistence(roomId);
  const { updateLastRoomId } = useUserPreferences();

  // Mobile keyboard detection
  useEffect(() => {
    if (!isMobile) return;

    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      const keyboardHeight = windowHeight - viewportHeight;

      setKeyboardVisible(keyboardHeight > 150); // Keyboard is visible if viewport shrunk by more than 150px
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport?.removeEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isMobile]);

  // Save input area height to localStorage
  const handleInputAreaResize = (height: number) => {
    setInputAreaHeight(height);
    localStorage.setItem('chatarea-input-height', height.toString());
  };

  const { db } = useFirebase()!;
  const { toast } = useToast();

  // Normalize roomId (decode URI components if present) and guard Firestore reads
  const normalizedRoomId = useMemo(() => {
    try {
      return decodeURIComponent(roomId);
    } catch (err) {
      // If decode fails for any reason, fall back to raw value
      logger.debug('[ChatArea] Failed to decode roomId, using raw', { roomId, error: err });
      return roomId;
    }
  }, [roomId]);

  // Only create a roomRef when db and the current user are available to avoid permission errors
  const roomRef = useMemo(() => {
    if (!db) return null;
    if (!normalizedRoomId) return null;
    // Note: `user` may be a fallback from localStorage; ensure caller has authenticated before relying on server reads
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

  // Use presence hook for online status
  const { isOnline } = usePresence(roomId, user?.id || null);

  // Audio for new messages
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastMessageCountRef = useRef<number>(0);
  const messageListRef = useRef<any>(null);

  // Save messages to localStorage when they change (debounced to prevent excessive saves)
  const [debouncedMessages] = useDebounce(persistedMessages, 500);

  useEffect(() => {
    if (debouncedMessages && debouncedMessages.length > 0) {
      saveMessages(debouncedMessages);
    }
  }, [debouncedMessages, saveMessages]);

  // Update last room ID for user preferences
  useEffect(() => {
    updateLastRoomId(roomId);
  }, [roomId, updateLastRoomId]);

  // Load cached messages on initial load
  const cachedMessages = useMemo(() => {
    if (isInitialLoad && hasHistory) {
      return loadMessages();
    }
    return [];
  }, [isInitialLoad, hasHistory, loadMessages]);

  useEffect(() => {
    setTypingUsers(serviceTypingUsers);
  }, [serviceTypingUsers]);

  // Play sound on new messages from other users
  useEffect(() => {
    if (isInitialLoad || persistedMessages.length === 0) {
      lastMessageCountRef.current = persistedMessages.length;
      return;
    }

    // Check if there are new messages
    if (persistedMessages.length > lastMessageCountRef.current) {
      const newMessages = persistedMessages.slice(lastMessageCountRef.current);
      const hasNewMessageFromOthers = newMessages.some(
        msg => msg.user.id !== user.id && msg.type !== 'system'
      );

      if (hasNewMessageFromOthers) {
        try {
          if (!audioRef.current) {
            audioRef.current = new Audio('/sounds/message.mp3');
            audioRef.current.volume = 0.5; // Set volume to 50%
          }
          audioRef.current.play().catch(err => {
            // Ignore errors (e.g., user hasn't interacted with page)
            logger.debug('Failed to play message sound', { error: err });
          });
        } catch (error) {
          logger.debug('Failed to create audio', { error });
        }
      }
    }

    lastMessageCountRef.current = persistedMessages.length;
  }, [persistedMessages, isInitialLoad, user.id]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const allMessages = useMemo(() => {
    // Combine cached messages (if initial load), persisted messages, and optimistic messages
    const combined = [
      ...(isInitialLoad && cachedMessages.length > 0 ? cachedMessages : []),
      ...persistedMessages,
      ...optimisticMessages
    ];

    // Remove duplicates based on message ID using Map for better performance
    const uniqueMessagesMap = new Map<string, Message>();
    combined.forEach(message => {
      if (!uniqueMessagesMap.has(message.id)) {
        uniqueMessagesMap.set(message.id, message);
      }
    });

    const uniqueMessages = Array.from(uniqueMessagesMap.values());

    // Safe sort with null checks
    uniqueMessages.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return aTime - bTime;
    });

    return uniqueMessages;
  }, [persistedMessages, optimisticMessages, cachedMessages, isInitialLoad]);


  const otherUser = useMemo(() => {
    return room?.participantProfiles?.find(p => p.id !== user?.id);
  }, [room, user]);

  const handleReply = useCallback((message: Message) => {
    setReplyTo(message);
  }, []);

  const handleImageClick = useCallback((imageUrl: string) => {
    setImageForView(imageUrl);
  }, []);

  const handleSend = useCallback(async (text: string) => {
    if (!service) {
      logger.warn('[ChatArea] Cannot send message: service is not available', { roomId, userId: user.id });
      return;
    }

    logger.info('[ChatArea] Sending message', {
      roomId,
      userId: user.id,
      textLength: text.trim().length,
      hasService: !!service
    });

    try {
      await service.sendMessage({
        text: text.trim(),
        user: user,
        senderId: user.id,
        type: 'text',
        replyTo: replyTo ? { id: replyTo.id, text: replyTo.text || 'Image', senderName: replyTo.user.name } : null
      });
      setReplyTo(null);
      logger.debug('[ChatArea] Message sent successfully', { roomId, userId: user.id });
    } catch (error) {
      logger.error('Failed to send message', error as Error, { roomId, userId: user.id });
      toast({
        title: 'Не удалось отправить сообщение',
        description: 'Проверьте подключение к интернету и попробуйте снова',
        variant: 'destructive'
      });
    }
  }, [service, user, replyTo, roomId, toast]);

  // Search handlers
  const handleSearchOpen = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  const handleSearchClose = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
  }, []);

  const handleMessageSelect = useCallback((messageId: string) => {
    // Scroll to selected message
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the message briefly
      messageElement.classList.add('bg-cyan-500/20');
      setTimeout(() => {
        messageElement.classList.remove('bg-cyan-500/20');
      }, 2000);
    }
  }, []);

  // Typing indicator handlers
  const handleTypingStart = useCallback(() => {
    if (service) {
      service.sendTyping();
    }
  }, [service]);

  const handleTypingStop = useCallback(() => {
    if (service) {
      service.stopTyping();
    }
  }, [service]);

  const handleSendDoodle = useCallback(async (imageUrl: string) => {
    if (!service) return;

    try {
      await service.sendMessage({
        text: '', // Empty text for doodles - we only want to show the image
        imageUrl: imageUrl,
        user: user,
        senderId: user.id,
        type: 'doodle'
      });
      setShowDoodlePad(false);
    } catch (error) {
      logger.error('Failed to send doodle', error as Error, { roomId, userId: user.id });
      toast({
        title: 'Не удалось отправить рисунок',
        description: 'Проверьте подключение к интернету и попробуйте снова',
        variant: 'destructive'
      });
    }
  }, [service, user, roomId, toast]);

  const handleSendSticker = useCallback(async (imageUrl: string) => {
    if (!service) return;

    try {
      await service.sendMessage({
        text: 'Sticker',
        imageUrl: imageUrl,
        user: user,
        senderId: user.id,
        type: 'sticker'
      });
    } catch (error) {
      logger.error('Failed to send sticker', error as Error, { roomId, userId: user.id });
      toast({
        title: 'Не удалось отправить стикер',
        description: 'Проверьте подключение к интернету и попробуйте снова',
        variant: 'destructive'
      });
    }
  }, [service, user, roomId, toast]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!service) return;

    const tempId = `temp_${Date.now()}`;
    const tempUrl = URL.createObjectURL(file);

    const optimisticMessage: Message = {
      id: tempId,
      text: '',
      imageUrl: tempUrl,
      user: user,
      senderId: user.id,
      createdAt: new Timestamp(Math.floor(Date.now() / 1000), 0),
      reactions: [],
      delivered: true,
      seen: true,
      type: 'image',
    };

    setOptimisticMessages(prev => [...prev, optimisticMessage]);

    try {
      const downloadURL = await service.uploadImage(file);
      await service.sendMessage({
        text: '',
        imageUrl: downloadURL,
        user,
        senderId: user.id,
        type: 'image',
      });
    } catch (error) {
      logger.error('Failed to upload image', error as Error, { roomId, userId: user.id });
      await service.deleteMessage(tempId).catch(() => { });
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your image.",
        variant: "destructive"
      });
    } finally {
      URL.revokeObjectURL(tempUrl);
      setOptimisticMessages(prev => prev.filter(m => m.id !== tempId));
    }
  }, [service, user, roomId, toast]);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    if (!service) return;

    try {
      await service.deleteMessage(messageId);
    } catch (error) {
      logger.error('Failed to delete message', error as Error, { messageId, roomId });
      toast({ title: 'Failed to delete message', variant: 'destructive' });
    }
  }, [service, roomId, toast]);

  const handleToggleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!service) return;

    try {
      await service.toggleReaction(messageId, emoji, user);
    } catch (error) {
      logger.error('Failed to toggle reaction', error as Error, { messageId, emoji, roomId });
      toast({ title: 'Failed to add reaction', variant: 'destructive' });
    }
  }, [service, user, roomId, toast]);





  const [isTabActive, setIsTabActive] = useState(true);

  // Handle window focus/blur for typing and seen status
  useEffect(() => {
    const handleFocus = () => setIsTabActive(true);
    const handleBlur = () => setIsTabActive(false);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Initial check
    setIsTabActive(!document.hidden);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Mark messages as seen when chat is open and tab is active
  useEffect(() => {
    if (service && isTabActive) {
      service.markMessagesAsSeen();
    }
  }, [service, isTabActive, allMessages.length]);

  // Mark messages as delivered when online in the room
  useEffect(() => {
    if (service) {
      service.markMessagesAsDelivered();
    }
  }, [service, allMessages.length]);



  const scrollToBottom = useCallback(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollToIndex({
        index: allMessages.length - 1,
        behavior: 'smooth',
        align: 'end',
      });
      setIsUserScrolledUp(false);
      setNewMessageCount(0);
    }
  }, [allMessages.length]);

  // Track if user scrolled up to show new message notification
  const handleScroll = useCallback((isAtBottom: boolean) => {
    setIsUserScrolledUp(!isAtBottom);
    if (isAtBottom) {
      setNewMessageCount(0);
    }
  }, []);

  // Count new messages when user is scrolled up
  useEffect(() => {
    if (isUserScrolledUp && persistedMessages.length > lastMessageCountRef.current) {
      const newMessages = persistedMessages.slice(lastMessageCountRef.current);
      const newMessagesFromOthers = newMessages.filter(
        msg => msg.user.id !== user.id && msg.type !== 'system'
      );
      setNewMessageCount(prev => prev + newMessagesFromOthers.length);
    }
  }, [persistedMessages, isUserScrolledUp, user.id]);


  return (
    <>
      <ConnectionStatus />
      <MobileErrorHandler
        isOnline={connectionState?.isOnline}
        isConnected={connectionState?.isConnected}
        isReconnecting={connectionState?.isReconnecting}
        onRetry={() => window.location.reload()}
      />
      {/* Mobile-first responsive container */}
      <section className={`
        flex-1 flex flex-col relative h-full min-h-0
        ${isMobile
          ? 'w-full bg-black' // Mobile: full width, solid background
          : 'md:border-r border-white/10 bg-black/50 backdrop-blur-sm' // Desktop: with border and transparency
        }
      `}>
        <ChatHeader
          roomId={roomId}
          otherUser={otherUser}
          isCollaborationSpaceVisible={isCollabSpaceVisible}
          onToggleCollaborationSpace={onToggleCollaborationSpace}
          isOnline={isOnline}
          onBack={onMobileBack}
          onSearchOpen={handleSearchOpen}
        />

        {/* Messages area with mobile-optimized spacing */}
        <div className={`
          flex-1 min-h-0 overflow-hidden relative
        `}>
          {allMessages.length === 0 && !isInitialLoad ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-6 z-10">
              <div className="w-20 h-20 bg-cyan-500/10 rounded-[32px] flex items-center justify-center animate-bounce">
                <MessageCircle className="w-10 h-10 text-cyan-400" />
              </div>
              <div className="space-y-2 max-w-xs">
                <h3 className="text-xl font-bold text-white tracking-tight">ЗДЕСЬ ПОКА ПУСТО</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Отправьте первое сообщение, чтобы начать общение. Или перейдите во вкладку <span className="text-cyan-400 font-bold">Игры</span>, чтобы развлечься!
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {['Привет! 👋', 'Как дела?', 'Давай порисуем? 🎨', 'Сыграем? 🎮'].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => service?.sendMessage({ text: suggestion, user, senderId: user.id })}
                    className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
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

        {/* Vertical resizer for input area (desktop only) */}
        {!isMobile && (
          <VerticalResizer
            onResize={handleInputAreaResize}
            minHeight={80}
            maxHeight={300}
            className="bg-white/5 hover:bg-cyan-400/30"
          />
        )}

        {/* Input area - Flex item, no longer fixed */}
        <div
          className={`
            flex-shrink-0 relative border-t border-white/10 z-20
            ${isMobile
              ? 'bg-black/95 backdrop-blur-xl pb-safe-area-inset-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.5)]'
              : 'bg-black/30 backdrop-blur-sm'
            }
          `}
          style={{
            height: isMobile ? 'auto' : `${inputAreaHeight}px`,
            minHeight: isMobile ? 'auto' : '80px',
          }}
        >
          {typingUsers.length > 0 && (
            <div className="absolute -top-6 left-8 flex items-center gap-2 animate-pulse">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-0"></span>
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-150"></span>
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-300"></span>
              </div>
              <span className="text-xs text-cyan-400 font-mono">
                {typingUsers.join(", ")} печатает...
              </span>
            </div>
          )}
          {replyTo && (
            <div className="flex items-center justify-between mb-2 mx-6 px-4 py-2 bg-neutral-900 border-l-2 border-white rounded-r-lg animate-in slide-in-from-bottom-2">
              <div className="flex flex-col text-sm overflow-hidden">
                <span className="text-white font-bold text-xs">Replying to {replyTo.user.name}</span>
                <span className="text-neutral-400 truncate text-xs mt-0.5 max-w-[300px]">
                  {replyTo.imageUrl && !replyTo.text ? 'Image' : replyTo.text}
                </span>
              </div>
              <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-white/10 rounded-full text-neutral-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {showDoodlePad && <DoodlePad onClose={() => setShowDoodlePad(false)} onSend={handleSendDoodle} />}

          {/* Typing Indicator */}
          <TypingIndicator
            typingUsers={room?.participantProfiles?.filter(p =>
              p.id !== user.id && typingUsers.includes(p.id)
            ) || []}
          />

          <EnhancedMessageInput
            onSend={handleSend}
            onTyping={(isTyping) => {
              if (isTyping) {
                handleTypingStart();
              } else {
                handleTypingStop();
              }
            }}
            onFileUpload={handleImageUpload}
            placeholder="Напишите сообщение..."
          />
        </div>
      </section>

      {imageForView && (
        <Dialog open={!!imageForView} onOpenChange={() => setImageForView(null)}>
          <DialogContent className="p-0 border-0 max-w-4xl bg-transparent">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageForView} alt="Full view" className="w-full h-auto max-h-[90vh] object-contain rounded-lg" />
          </DialogContent>
        </Dialog>
      )}

      {/* Message Search */}
      <MessageSearch
        messages={allMessages}
        users={room?.participantProfiles || []}
        isOpen={isSearchOpen}
        onClose={handleSearchClose}
        onMessageSelect={handleMessageSelect}
      />
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return prevProps.roomId === nextProps.roomId
    && prevProps.user.id === nextProps.user.id
    && prevProps.isCollabSpaceVisible === nextProps.isCollabSpaceVisible;
});
