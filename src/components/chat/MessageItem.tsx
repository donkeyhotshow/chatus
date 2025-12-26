
"use client";

import { memo, useState, useEffect } from 'react';
import type { Message } from '@/lib/types';
import { EmojiRain } from './EmojiRain';
import { format } from 'date-fns';
import { Smile, Trash2, CornerUpLeft, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

type MessageItemProps = {
  message: Message;
  isOwn: boolean;
  onReaction: (messageId: string, emoji: string) => void;
  onDelete: (messageId: string) => void;
  onImageClick: (imageUrl: string) => void;
  onReply: (message: Message) => void;
  reactions?: { emoji: string; count: number; users: string[] }[];
};

const MessageItem = memo(({ message, isOwn, onReaction, onDelete, onImageClick, onReply, reactions = [] }: MessageItemProps) => {
  const [showEmojiRain, setShowEmojiRain] = useState(false);
  const [rainEmoji, setRainEmoji] = useState('');
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    setShowEmojiRain(false);
    setRainEmoji('');
  }, [message.id]);

  // Safe user access - fallback for malformed messages
  const user = message.user || { id: 'unknown', name: 'Неизвестный', avatar: '' };

  if (message.type === 'system') {
    return (
      <div className="w-full flex justify-center my-6 opacity-50">
        <div className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-full px-4 py-1 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
          {message.text}
        </div>
      </div>
    );
  }

  const handleDoubleClick = () => {
    if (message.id.startsWith('temp_')) return;

    // Double-click reactions are only allowed on own messages (Requirements 3.1, 3.2)
    if (!isOwn) {
      // Ignore double-click on other users' messages
      return;
    }

    const emoji = '🤍';
    onReaction(message.id, emoji);
    setRainEmoji(emoji);
    setShowEmojiRain(true);
    setTimeout(() => setShowEmojiRain(false), 2000);
  };

  const hasContent = message.text || message.imageUrl;

  const renderContent = () => {
    if (message.type === 'sticker') {
      return (
        <img
          src={message.imageUrl}
          alt="Sticker"
          className="w-32 h-32 object-contain"
        />
      );
    }

    let contentNode: React.ReactNode = null;
    if (message.imageUrl) {
      contentNode = (
        <img
          src={message.imageUrl}
          alt={message.type === 'doodle' ? 'Doodle' : 'Uploaded content'}
          className={`rounded-2xl max-w-xs max-h-80 object-cover cursor-pointer ${message.text ? 'mb-2' : ''}`}
          onClick={() => onImageClick(message.imageUrl!)}
        />
      );
    }

    if (message.type === 'doodle' && message.imageUrl) {
      return contentNode;
    }

    if (message.text) {
      return (
        <div className="flex flex-col">
          {contentNode}
          <p className="leading-relaxed whitespace-pre-wrap text-sm sm:text-[15px] font-medium break-words break-anywhere">
            {message.text}
          </p>
        </div>
      )
    }

    return contentNode;
  };

  const formattedTime = message.createdAt && 'seconds' in message.createdAt
    ? format(new Date(message.createdAt.seconds * 1000), 'HH:mm')
    : '...';

  const isSticker = message.type === 'sticker';

  return (
    <article
      role="article"
      aria-label={`${user.name} написал: ${message.text || 'изображение'}. ${formattedTime}`}
      className={`group flex gap-3 max-w-[90%] sm:max-w-[80%] mb-4 ${isOwn ? 'ml-auto flex-row-reverse' : 'items-start'} animate-in fade-in slide-in-from-bottom-1 duration-300`}
      onDoubleClick={handleDoubleClick}
    >
      {!isSticker && (
        <div className="flex-shrink-0 mt-1">
          <div
            className="w-8 h-8 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] bg-center bg-cover"
            style={{ backgroundImage: `url(${user.avatar})` }}
          />
        </div>
      )}

      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} min-w-0 flex-1`}>
        {!isSticker && (
          <div className="mb-1 px-1 flex items-center gap-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isOwn ? 'text-[var(--text-secondary)]' : 'text-[var(--accent-primary)]'}`}>
              {user.name}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">{formattedTime}</span>
          </div>
        )}

        {hasContent ? (
          <div
            onClick={() => setShowActions(!showActions)}
            className={cn(
              "relative p-3.5 rounded-2xl transition-all duration-300 cursor-pointer",
              // Premium message bubble styles
              isOwn
                ? isSticker
                  ? "bg-transparent"
                  : [
                      "bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600",
                      "text-white rounded-tr-sm",
                      "shadow-lg shadow-indigo-500/20",
                    ]
                : isSticker
                  ? "bg-transparent"
                  : [
                      "bg-[var(--bg-tertiary)]/80 backdrop-blur-sm",
                      "text-white border border-[var(--glass-border)]",
                      "rounded-tl-sm",
                    ],
              message.id.startsWith("temp_") && "opacity-50",
              showActions && "ring-2 ring-[var(--accent-primary)]/30"
            )}
          >
            {message.replyTo && (
              <div className={cn(
                "mb-3 p-2 rounded-lg text-[11px] border-l-2",
                isOwn
                  ? "bg-white/10 border-white/30 text-white/80"
                  : "bg-[var(--bg-secondary)] border-[var(--accent-primary)]/50 text-[var(--text-secondary)]"
              )}>
                <span className="font-bold block">{message.replyTo.senderName}</span>
                <span className="truncate block opacity-80">{message.replyTo.text}</span>
              </div>
            )}

            {renderContent()}

            {reactions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {reactions.map((reaction) => (
                  <button
                    key={reaction.emoji}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-lg transition-all text-[11px]",
                      isOwn
                        ? "bg-white/20 border border-white/10 hover:bg-white/30"
                        : "bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)]"
                    )}
                    onClick={() => onReaction(message.id, reaction.emoji)}
                  >
                    <span>{reaction.emoji}</span>
                    {reaction.count > 1 && <span className="font-bold">{reaction.count}</span>}
                  </button>
                ))}
              </div>
            )}

            {/* Action buttons - subtle floating bar */}
            <div className={cn(
              "absolute -top-8 flex gap-1 p-1 bg-[var(--bg-secondary)]/80 backdrop-blur-md border border-[var(--border-primary)] rounded-full shadow-xl transition-all duration-200 z-10",
              isOwn ? "right-0" : "left-0",
              "opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto",
              showActions && "opacity-100 scale-100 pointer-events-auto"
            )}>
              <button
                onClick={(e) => { e.stopPropagation(); onReply(message); setShowActions(false); }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                title="Ответить"
              >
                <CornerUpLeft className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReactionPicker(!showReactionPicker);
                  if ('vibrate' in navigator) navigator.vibrate(10);
                }}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
                  showReactionPicker ? "bg-[var(--accent-primary)] text-white" : "hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
                title="Реакция"
              >
                <Smile className="w-4 h-4" />
              </button>
              {isOwn && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if ('vibrate' in navigator) navigator.vibrate(15);
                    onDelete(message.id);
                    setShowActions(false);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Emoji picker - premium glass style */}
            {showReactionPicker && (
              <div className={cn(
                "flex flex-wrap gap-1 mt-2 p-2 rounded-xl",
                "bg-[var(--glass-bg)] backdrop-blur-xl",
                "border border-[var(--glass-border)]",
                "shadow-lg",
                isOwn ? "justify-end" : "justify-start"
              )}>
                {['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReaction(message.id, emoji);
                      setShowReactionPicker(false);
                      setRainEmoji(emoji);
                      setShowEmojiRain(true);
                      setTimeout(() => setShowEmojiRain(false), 2000);
                      if ('vibrate' in navigator) navigator.vibrate(10);
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {isOwn && !isSticker && (
          <div className="mt-1 px-1 flex items-center gap-1">
            {message.seen ? (
              <CheckCheck className="w-3 h-3 text-blue-500" />
            ) : (
              <Check className="w-3 h-3 text-neutral-600" />
            )}
          </div>
        )}
      </div>
      {showEmojiRain && <EmojiRain emoji={rainEmoji} />}
    </article>
  );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem;
