
"use client";

import { memo, useState, useEffect } from 'react';
import type { Message } from '@/lib/types';
import { EmojiRain } from './EmojiRain';
import { format } from 'date-fns';
import { Heart, Trash2, CornerUpLeft, Check, CheckCheck } from 'lucide-react';
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
  const [showActions, setShowActions] = useState(false);

  // Reset emoji rain when message changes
  useEffect(() => {
    setShowEmojiRain(false);
    setRainEmoji('');
  }, [message.id]);

  const user = message.user || { id: 'unknown', name: 'Неизвестный', avatar: '' };

  if (message.type === 'system') {
    return (
      <div className="w-full flex justify-center my-6">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-full px-4 py-1.5 text-[10px] font-semibold text-white/40 uppercase tracking-widest backdrop-blur-sm">
          {message.text}
        </div>
      </div>
    );
  }

  const handleDoubleClick = () => {
    if (message.id.startsWith('temp_')) return;
    if (!isOwn) return;

    const emoji = '❤️';
    onReaction(message.id, emoji);
    setRainEmoji(emoji);
    setShowEmojiRain(true);
    setTimeout(() => setShowEmojiRain(false), 2000);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const emoji = '❤️';
    onReaction(message.id, emoji);
    setRainEmoji(emoji);
    setShowEmojiRain(true);
    if ('vibrate' in navigator) navigator.vibrate(10);
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
          className={cn(
            "rounded-xl max-w-[280px] max-h-80 object-cover cursor-pointer",
            "hover:opacity-95 transition-opacity",
            message.text ? 'mb-2' : ''
          )}
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
          <p className="leading-relaxed whitespace-pre-wrap text-[15px] break-words">
            {message.text}
          </p>
        </div>
      );
    }

    return contentNode;
  };

  const formattedTime = message.createdAt && 'seconds' in message.createdAt
    ? format(new Date(message.createdAt.seconds * 1000), 'HH:mm')
    : '...';

  const isSticker = message.type === 'sticker';
  const hasLike = reactions.some(r => r.emoji === '❤️');

  return (
    <article
      role="article"
      aria-label={`${user.name} написал: ${message.text || 'изображение'}. ${formattedTime}`}
      className={cn(
        "group flex gap-2.5 max-w-[85%] sm:max-w-[75%] mb-3",
        isOwn ? "ml-auto flex-row-reverse" : "items-start",
        "animate-in fade-in slide-in-from-bottom-2 duration-300"
      )}
      onDoubleClick={handleDoubleClick}
    >
      {/* Avatar */}
      {!isSticker && (
        <div className="flex-shrink-0 mt-1">
          <div
            className={cn(
              "w-9 h-9 rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02]",
              "border border-white/[0.08] bg-center bg-cover",
              "shadow-sm"
            )}
            style={{ backgroundImage: user.avatar ? `url(${user.avatar})` : undefined }}
          >
            {!user.avatar && (
              <div className="w-full h-full flex items-center justify-center text-white/50 font-semibold text-sm">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      )}

      <div className={cn("flex flex-col min-w-0 flex-1", isOwn ? "items-end" : "items-start")}>
        {/* Name & Time */}
        {!isSticker && (
          <div className="mb-1.5 px-1 flex items-center gap-2">
            <span className={cn(
              "text-[11px] font-semibold tracking-wide",
              isOwn ? "text-white/50" : "text-violet-400"
            )}>
              {user.name}
            </span>
            <span className="text-[10px] text-white/30">{formattedTime}</span>
          </div>
        )}

        {hasContent ? (
          <div
            onClick={() => setShowActions(!showActions)}
            className={cn(
              "relative px-4 py-3 rounded-2xl transition-all duration-200 cursor-pointer",
              isOwn
                ? isSticker
                  ? "bg-transparent"
                  : [
                      "bg-gradient-to-br from-violet-600 via-violet-600 to-purple-700",
                      "text-white rounded-tr-md",
                      "shadow-lg shadow-violet-600/20",
                    ]
                : isSticker
                  ? "bg-transparent"
                  : [
                      "bg-white/[0.06] backdrop-blur-sm",
                      "text-white border border-white/[0.08]",
                      "rounded-tl-md",
                    ],
              message.id.startsWith("temp_") && "opacity-50",
              showActions && "ring-2 ring-violet-500/30"
            )}
          >
            {/* Reply quote */}
            {message.replyTo && (
              <div className={cn(
                "mb-2.5 p-2.5 rounded-lg text-[12px] border-l-2",
                isOwn
                  ? "bg-white/10 border-white/30 text-white/80"
                  : "bg-white/[0.04] border-violet-500/50 text-white/60"
              )}>
                <span className="font-semibold block text-[11px]">{message.replyTo.senderName}</span>
                <span className="truncate block opacity-80 mt-0.5">{message.replyTo.text}</span>
              </div>
            )}

            {renderContent()}

            {/* Reactions */}
            {reactions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5 -mb-1">
                {reactions.map((reaction) => (
                  <button
                    key={reaction.emoji}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-full transition-all text-xs",
                      "bg-white/10 hover:bg-white/20 active:scale-95"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onReaction(message.id, reaction.emoji);
                    }}
                  >
                    <span>{reaction.emoji}</span>
                    {reaction.count > 1 && <span className="font-semibold text-[11px]">{reaction.count}</span>}
                  </button>
                ))}
              </div>
            )}

            {/* Action buttons - floating bar */}
            <div className={cn(
              "absolute -top-10 flex items-center gap-0.5 p-1 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl transition-all duration-200 z-10",
              isOwn ? "right-0" : "left-0",
              "opacity-0 scale-90 pointer-events-none",
              "group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto",
              showActions && "opacity-100 scale-100 pointer-events-auto"
            )}>
              <button
                onClick={(e) => { e.stopPropagation(); onReply(message); setShowActions(false); }}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all"
                title="Ответить"
              >
                <CornerUpLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleLike}
                className={cn(
                  "w-9 h-9 flex items-center justify-center rounded-lg transition-all",
                  hasLike
                    ? "text-red-500 hover:bg-red-500/10"
                    : "text-white/50 hover:text-red-400 hover:bg-white/10"
                )}
                title="Нравится"
              >
                <Heart className={cn("w-4 h-4", hasLike && "fill-current")} />
              </button>
              {isOwn && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if ('vibrate' in navigator) navigator.vibrate(15);
                    onDelete(message.id);
                    setShowActions(false);
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-white/50 hover:text-red-400 transition-all"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : null}

        {/* Read status */}
        {isOwn && !isSticker && (
          <div className="mt-1 px-1 flex items-center gap-1">
            {message.seen ? (
              <CheckCheck className="w-3.5 h-3.5 text-violet-400" />
            ) : (
              <Check className="w-3.5 h-3.5 text-white/30" />
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
