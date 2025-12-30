
"use client";

import { memo, useEffect, useRef, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import MessageItem from './MessageItem';
import type { Message } from '@/lib/types';
import { EmptyChat } from '@/components/ui/EmptyState';

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
        "px-[var(--space-4)] list-item-optimized",
        // Spacing based on 8px module - Phase 3
        groupPosition === 'first' ? "pt-[var(--space-2)] pb-[var(--space-1)]" :
        groupPosition === 'middle' ? "py-[var(--space-1)]" :
        groupPosition === 'last' ? "pt-[var(--space-1)] pb-[var(--space-2)]" :
        "py-[var(--space-2)]"
      )}>
        {isNewDay && (() => {
          const msgDate = msg.createdAt && 'seconds' in msg.createdAt
            ? new Date(msg.createdAt.seconds * 1000)
            : new Date();
          const today = new Date();
          if (msgDate.toDateString() === today.toDateString()) return null;

          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const dateText = msgDate.toDateString() === yesterday.toDateString()
            ? 'Вчера'
            : msgDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

          return (
            <div className="date-divider flex justify-center my-[var(--space-4)] sticky top-2 z-10">
              <span className="date-divider-text bg-[var(--bg-tertiary)] text-[var(--accent-chat)] text-[var(--font-caption)] font-medium px-[var(--space-4)] py-[var(--space-2)] rounded-full border border-[var(--border-subtle)] shadow-lg uppercase tracking-wider">
                {dateText}
              </span>
            </div>
          );
        })()}
        {showTimeGap && !isNewDay && msg.createdAt && 'seconds' in msg.createdAt && (
          <div className="flex justify-center my-[var(--space-3)]">
            <span className="text-[var(--font-caption)] text-[var(--text-muted)] font-medium px-[var(--space-3)] py-[var(--space-1)] rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
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
      <div className="flex-1 flex flex-col h-full">
         <EmptyChat />
      </div>
    );
  }

  return (
    <div
      className="flex-1 h-full scroll-container contain-layout relative"
      role="log"
      aria-label="Список сообщений чата"
      aria-live="polite"
      aria-relevant="additions"
      data-scroll-container
    >
      {/* Pull-to-refresh visual - Stage 4.2 */}
      <motion.div 
        className="absolute top-0 left-0 right-0 flex justify-center pt-4 pointer-events-none z-20"
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full p-2 shadow-lg">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <MessageCircle className="w-4 h-4 text-violet-400" />
          </motion.div>
        </div>
      </motion.div>
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
