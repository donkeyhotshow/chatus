
"use client";

import { memo, useEffect, useRef, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { cn } from '@/lib/utils';
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
    const nextMsg = messages?.[index + 1];

    // Date divider logic
    const isNewDay = !prevMsg || (() => {
      const currentDate = msg.createdAt && 'seconds' in msg.createdAt
        ? new Date(msg.createdAt.seconds * 1000)
        : new Date();
      const prevDate = prevMsg?.createdAt && 'seconds' in prevMsg.createdAt
        ? new Date(prevMsg.createdAt.seconds * 1000)
        : new Date();
      return currentDate.toDateString() !== prevDate.toDateString();
    })();

    // Message grouping logic - group consecutive messages from same user within 2 minutes
    const isSameSenderAsPrev = prevMsg &&
      (prevMsg.senderId === msg.senderId || prevMsg.user?.id === msg.user?.id) &&
      !isNewDay;

    const isSameSenderAsNext = nextMsg &&
      (nextMsg.senderId === msg.senderId || nextMsg.user?.id === msg.user?.id);

    // Check time gap (2 minutes = 120 seconds)
    const timeSincePrev = prevMsg?.createdAt && msg.createdAt &&
      'seconds' in prevMsg.createdAt && 'seconds' in msg.createdAt
        ? msg.createdAt.seconds - prevMsg.createdAt.seconds
        : Infinity;

    const timeToNext = nextMsg?.createdAt && msg.createdAt &&
      'seconds' in nextMsg.createdAt && 'seconds' in msg.createdAt
        ? nextMsg.createdAt.seconds - msg.createdAt.seconds
        : Infinity;

    // Show sticky timestamp if gap > 5 minutes (300 seconds) between messages
    const showTimeGap = timeSincePrev > 300 && !isNewDay;

    const isGroupedWithPrev = isSameSenderAsPrev && timeSincePrev < 120;
    const isGroupedWithNext = isSameSenderAsNext && timeToNext < 120;

    // Determine group position
    const groupPosition: 'first' | 'middle' | 'last' | 'single' =
      isGroupedWithPrev && isGroupedWithNext ? 'middle' :
      isGroupedWithPrev && !isGroupedWithNext ? 'last' :
      !isGroupedWithPrev && isGroupedWithNext ? 'first' : 'single';

    // Generate stable unique key for the message
    const messageKey = getMessageKey(msg, index);

    return (
      <div className={cn(
        "px-4 list-item-optimized",
        // Reduced padding for grouped messages
        groupPosition === 'first' ? "pt-1.5 pb-0.5" :
        groupPosition === 'middle' ? "py-0.5" :
        groupPosition === 'last' ? "pt-0.5 pb-1.5" :
        "py-1.5"
      )}>
        {isNewDay && (
          <div className="date-divider flex justify-center my-4 sticky top-2 z-10">
            <span className="date-divider-text bg-[rgba(124,58,237,0.15)] text-[#A78BFA] text-[11px] font-medium px-4 py-1.5 rounded-full border border-[rgba(124,58,237,0.25)] shadow-[0_2px_8px_rgba(124,58,237,0.1)] uppercase tracking-wider">
              {msg.createdAt && 'seconds' in msg.createdAt
                ? (() => {
                    const msgDate = new Date(msg.createdAt.seconds * 1000);
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);

                    if (msgDate.toDateString() === today.toDateString()) {
                      return 'Сегодня';
                    } else if (msgDate.toDateString() === yesterday.toDateString()) {
                      return 'Вчера';
                    } else {
                      return msgDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
                    }
                  })()
                : 'Сегодня'}
            </span>
          </div>
        )}
        {/* Sticky timestamp for gaps > 5 minutes */}
        {showTimeGap && !isNewDay && msg.createdAt && 'seconds' in msg.createdAt && (
          <div className="flex justify-center my-3">
            <span className="text-[10px] text-white/40 font-medium px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
              {new Date(msg.createdAt.seconds * 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
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
          onCopy={(text) => {
            navigator.clipboard.writeText(text);
          }}
          groupPosition={groupPosition}
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
    <div
      className="flex-1 h-full scroll-container contain-layout"
      role="log"
      aria-label="Список сообщений чата"
      aria-live="polite"
      aria-relevant="additions"
      data-scroll-container
    >
      <Virtuoso
        ref={virtuosoRef}
        data={messages}
        initialTopMostItemIndex={messages.length - 1}
        followOutput="auto"
        overscan={300}
        increaseViewportBy={{ top: 300, bottom: 300 }}
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
            <div className="flex justify-center py-4" role="status" aria-label="Загрузка предыдущих сообщений">
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
