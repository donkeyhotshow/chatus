
"use client";

import { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import type { Message, Room, UserProfile } from '@/lib/types';
import { ChatHeader } from './ChatHeader';
import MessageList from './MessageList';
import { MessageInput } from './MessageInput';
import DoodlePad from './DoodlePad';
import { X } from 'lucide-react';
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

type ChatAreaProps = {
  user: UserProfile;
  roomId: string;
  isCollabSpaceVisible: boolean;
  onToggleCollaborationSpace: () => void;
};

export const ChatArea = memo(function ChatArea({
  user,
  roomId,
  isCollabSpaceVisible,
  onToggleCollaborationSpace,
}: ChatAreaProps) {
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showDoodlePad, setShowDoodlePad] = useState(false);
  const [imageForView, setImageForView] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);

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
  } = useChatService(roomId, user);

  // Use presence hook for online status
  const { isOnline } = usePresence(roomId, user?.id || null);

  // Audio for new messages
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastMessageCountRef = useRef<number>(0);

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
    const combined = [...persistedMessages, ...optimisticMessages];
    combined.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
    // Debug logging in development
    if (process.env.NODE_ENV === 'development' && combined.length > 0) {
      logger.debug('[ChatArea] All messages', {
        persistedCount: persistedMessages.length,
        optimisticCount: optimisticMessages.length,
        totalCount: combined.length,
        messageIds: combined.map(m => m.id)
      });
    }
    return combined;
  }, [persistedMessages, optimisticMessages]);


  const otherUser = useMemo(() => {
    return room?.participantProfiles?.find(p => p.id !== user?.id);
  }, [room, user]);

  const handleReply = useCallback((message: Message) => {
    setReplyTo(message);
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
      toast({ title: 'Failed to send message', variant: 'destructive' });
    }
  }, [service, user, replyTo, roomId, toast]);

  const handleSendDoodle = useCallback(async (imageUrl: string) => {
    if (!service) return;

    try {
      await service.sendMessage({
        text: 'Doodle',
        imageUrl: imageUrl,
        user: user,
        senderId: user.id,
        type: 'doodle'
      });
      setShowDoodlePad(false);
    } catch (error) {
      logger.error('Failed to send doodle', error as Error, { roomId, userId: user.id });
      toast({ title: 'Failed to send doodle', variant: 'destructive' });
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
      toast({ title: 'Failed to send sticker', variant: 'destructive' });
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

  const [isTyping, setIsTyping] = useState(false);
  const [debouncedIsTyping] = useDebounce(isTyping, 500);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!service) return;
    if (debouncedIsTyping) {
      service.sendTyping();
    }
  }, [debouncedIsTyping, service, user.name]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

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

  const handleInputChange = useCallback(() => {
    setIsTyping(true);
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
  }, []);


  return (
    <>
      <section className="flex-1 flex flex-col border-r border-white/10 bg-black/50 backdrop-blur-sm relative">
        <ChatHeader
          roomId={roomId}
          otherUser={otherUser}
          isCollaborationSpaceVisible={isCollabSpaceVisible}
          onToggleCollaborationSpace={onToggleCollaborationSpace}
          isOnline={isOnline}
        />
        <MessageList
          messages={allMessages}
          isLoading={isInitialLoad && allMessages.length === 0}
          currentUserId={user.id}
          onReaction={handleToggleReaction}
          onDeleteMessage={handleDeleteMessage}
          onImageClick={(imageUrl) => setImageForView(imageUrl)}
          onReply={handleReply}
          onLoadMore={service?.loadMoreMessages}
          hasMoreMessages={hasMoreMessages}
        />

        <div className="relative">
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
          <MessageInput
            roomId={roomId}
            onSendMessage={handleSend}
            onImageSend={handleImageUpload}
            onDoodleClick={() => setShowDoodlePad(p => !p)}
            onInputChange={handleInputChange}
            onStickerSend={handleSendSticker}
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
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return prevProps.roomId === nextProps.roomId
    && prevProps.user.id === nextProps.user.id
    && prevProps.isCollabSpaceVisible === nextProps.isCollabSpaceVisible;
});
