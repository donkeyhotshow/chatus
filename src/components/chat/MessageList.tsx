
"use client";

import { memo, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import MessageItem from './MessageItem';
import type { Message } from '@/lib/types';

type MessageListProps = {
  messages: Message[];
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

const LoadingSpinner = () => (
  <div className="flex-1 flex flex-col items-center justify-center">
    <div className="animate-pulse flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      <span className="font-mono text-white/70 tracking-widest">LOADING CHAT...</span>
    </div>
  </div>
);

const MessageList = memo(forwardRef<VirtuosoHandle, MessageListProps>(({
  messages,
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

  if (isLoading && messages.length === 0) {
    return <LoadingSpinner />;
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full px-6 py-8">
        <div className="flex flex-col items-center gap-6 text-center max-w-sm">
          <div className="text-7xl opacity-50 mb-2 animate-pulse">💬</div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Начните общение</h2>
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
              Напишите первое сообщение, чтобы начать диалог
            </p>
          </div>
          <div className="w-16 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full opacity-60"></div>
        </div>
      </div>
    );
  }

  const renderItem = useCallback((index: number, msg: Message) => {
    const prevMsg = messages[index - 1];
    const isNewDay = !prevMsg || (() => {
      const currentDate = msg.createdAt && 'seconds' in msg.createdAt
        ? new Date(msg.createdAt.seconds * 1000)
        : new Date();
      const prevDate = prevMsg.createdAt && 'seconds' in prevMsg.createdAt
        ? new Date(prevMsg.createdAt.seconds * 1000)
        : new Date();
      return currentDate.toDateString() !== prevDate.toDateString();
    })();

    return (
      <div className="px-3 sm:px-4 py-1">
        {isNewDay && (
          <div className="flex justify-center my-6">
            <span className="bg-black/40 text-neutral-400 text-[10px] font-medium px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm uppercase tracking-widest">
              {msg.createdAt && 'seconds' in msg.createdAt
                ? new Date(msg.createdAt.seconds * 1000).toLocaleDateString('ru-RU', { weekday: 'short', month: 'short', day: 'numeric' })
                : 'Сегодня'}
            </span>
          </div>
        )}
        <MessageItem
          key={msg.id}
          message={msg}
          isOwn={msg.user.id === currentUserId}
          onDelete={onDeleteMessage}
          onReaction={onReaction}
          onImageClick={onImageClick}
          onReply={onReply}
        />
      </div>
    );
  }, [messages, currentUserId, onDeleteMessage, onReaction, onImageClick, onReply]);

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
        style={{ height: '100%' }}
        components={{
          Header: hasMoreMessages ? () => (
            <div className="flex justify-center py-2">
              <span className="text-xs text-neutral-500">Loading older messages...</span>
            </div>
          ) : undefined,
        }}
      />
    </div>
  );
}));

MessageList.displayName = 'MessageList';

export default MessageList;
