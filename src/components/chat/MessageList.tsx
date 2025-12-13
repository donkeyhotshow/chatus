
"use client";

import { memo, useEffect, useRef } from 'react';
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
};

const LoadingSpinner = () => (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        <span className="font-mono text-white/70 tracking-widest">LOADING CHAT...</span>
      </div>
    </div>
);

const MessageList = memo(({ 
  messages, 
  isLoading, 
  currentUserId, 
  onDeleteMessage, 
  onReaction, 
  onImageClick, 
  onReply,
  onLoadMore,
  hasMoreMessages = false,
}: MessageListProps) => {
  const virtuosoRef = useRef<VirtuosoHandle>(null);

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
      <div className="flex items-center justify-center h-full text-neutral-500">
        <p>No messages yet. Start the conversation!</p>
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
        itemContent={(index, msg) => (
          <div className="px-6 py-3">
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
        )}
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
});

MessageList.displayName = 'MessageList';

export default MessageList;
