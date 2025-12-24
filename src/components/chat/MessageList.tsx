
"use client";

import { memo, useEffect, useRef, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import MessageItem from './MessageItem';
import type { Message } from '@/lib/types';

type MessageListProps = {
  messages?: Message[] | null;
  isLoading: boolean;
  currentUserId: string;
  onDeleteMessage: (id: string) => void;
  onReaction: (id: string, emoji: string) => void;
  onImageClick: (imageUrl: string) => void;
  onReply: (message: Message) => void;
  onLoadMore?: () => void;
  hasMoreMessages?: boolean;
  onScroll?: (isAtBottom: boolean) => void;
};

/**
 * Ensures messages array is always a valid array, handling null/undefined cases.
 * Generates stable unique keys for messages that lack IDs.
 *
 * **Feature: chatus-bug-fixes, Property 10: Null-Safe Message Handling**
 * **Validates: Requirements 10.1, 10.2, 10.3**
 */
export function ensureSafeMessages(messages: Message[] | null | undefined): Message[] {
  // Handle null/undefined case - return empty array
  if (messages == null) {
    return [];
  }

  // Handle non-array case (defensive)
  if (!Array.isArray(messages)) {
    return [];
  }

  // Filter out any null/undefined items in the array
  return messages.filter((msg): msg is Message => msg != null);
}

/**
 * Generates a stable unique key for a message.
 * Uses message.id if available, otherwise generates a stable key from message content.
 *
 * **Feature: chatus-bug-fixes, Property 11: Unique Key Generation**
 * **Validates: Requirements 11.1, 11.2, 11.3**
 */
export function getMessageKey(message: Message, index: number): string {
  // Prefer message.id if available
  if (message?.id) {
    return message.id;
  }

  // Generate stable key from message content
  const timestamp = message?.createdAt && 'seconds' in message.createdAt
    ? message.createdAt.seconds
    : Date.now();
  const senderId = message?.senderId || message?.user?.id || 'unknown';
  const textHash = message?.text?.slice(0, 10) || '';

  return `msg_${timestamp}_${senderId}_${index}_${textHash}`;
}

const LoadingSpinner = () => (
  <div className="flex-1 flex flex-col items-center justify-center">
    <div className="animate-pulse flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
      <span className="font-medium text-[var(--text-secondary)] tracking-wide">ЗАГРУЗКА ЧАТА...</span>
    </div>
  </div>
);

const MessageList = memo(forwardRef<VirtuosoHandle, MessageListProps>(({
  messages: rawMessages,
  isLoading,
  currentUserId,
  onDeleteMessage,
  onReaction,
  onImageClick,
  onReply,
  onLoadMore,
  hasMoreMessages = false,
  onScroll,
}, ref) => {
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  // Ensure messages is always a valid array (null-safety)
  const messages = useMemo(() => ensureSafeMessages(rawMessages), [rawMessages]);

  useImperativeHandle(ref, () => virtuosoRef.current!, []);

  useEffect(() => {
    if (!isLoading && messages.length > 0 && virtuosoRef.current) {
      // Scroll to bottom when new messages arrive
      setTimeout(() => {
        virtuosoRef.current?.scrollToIndex({
          index: messages.length - 1,
          behavior: 'smooth',
          align: 'end',
        });
      }, 100);
    }
  }, [messages.length, isLoading]);

  // Must be before conditional returns to follow React hooks rules
  const renderItem = useCallback((index: number, msg: Message) => {
    // Null-safety check for message
    if (!msg) {
      return null;
    }

    const prevMsg = messages?.[index - 1];
    const isNewDay = !prevMsg || (() => {
      const currentDate = msg.createdAt && 'seconds' in msg.createdAt
        ? new Date(msg.createdAt.seconds * 1000)
        : new Date();
      const prevDate = prevMsg?.createdAt && 'seconds' in prevMsg.createdAt
        ? new Date(prevMsg.createdAt.seconds * 1000)
        : new Date();
      return currentDate.toDateString() !== prevDate.toDateString();
    })();

    // Generate stable unique key for the message
    const messageKey = getMessageKey(msg, index);

    return (
      <div className="px-3 sm:px-4 py-1">
        {isNewDay && (
          <div className="flex justify-center my-6 sticky top-2 z-10">
            <span className="bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-[11px] font-medium px-4 py-1.5 rounded-full border border-[var(--border-primary)] shadow-sm backdrop-blur-md uppercase tracking-wider">
              {msg.createdAt && 'seconds' in msg.createdAt
                ? new Date(msg.createdAt.seconds * 1000).toLocaleDateString('ru-RU', { weekday: 'short', month: 'long', day: 'numeric' })
                : 'Сегодня'}
            </span>
          </div>
        )}
        <MessageItem
          key={messageKey}
          message={msg}
          isOwn={msg.user?.id === currentUserId || msg.senderId === currentUserId}
          onDelete={onDeleteMessage}
          onReaction={onReaction}
          onImageClick={onImageClick}
          onReply={onReply}
        />
      </div>
    );
  }, [messages, currentUserId, onDeleteMessage, onReaction, onImageClick, onReply]);

  if (isLoading && messages.length === 0) {
    return <LoadingSpinner />;
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full px-6 py-8">
        <div className="flex flex-col items-center gap-6 text-center max-w-sm">
          <div className="text-7xl opacity-50 mb-2 animate-pulse">💬</div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Начните общение</h2>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
              Напишите первое сообщение, чтобы начать диалог
            </p>
          </div>
          <div className="w-16 h-1 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-hover)] rounded-full opacity-60"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full">
      <Virtuoso
        ref={virtuosoRef}
        data={messages}
        initialTopMostItemIndex={messages.length - 1}
        followOutput="auto"
        startReached={() => {
          if (hasMoreMessages && onLoadMore) {
            onLoadMore();
          }
        }}
        atBottomStateChange={(atBottom) => {
          onScroll?.(atBottom);
        }}
        itemContent={renderItem}
        computeItemKey={(index, msg) => getMessageKey(msg, index)}
        style={{ height: '100%' }}
        components={{
          Header: hasMoreMessages ? () => (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : undefined,
        }}
      />
    </div>
  );
}));

MessageList.displayName = 'MessageList';

export default MessageList;
