
"use client";

import { memo, useState, useEffect } from 'react';
import type { Message } from '@/lib/types';
import { EmojiRain } from './EmojiRain';
import { format } from 'date-fns';
import { Smile, Trash2, CornerUpLeft, Clock, Check, CheckCheck } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';

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

  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTouchDevice = useMediaQuery('(hover: none)');

  useEffect(() => {
    setShowEmojiRain(false);
    setRainEmoji('');
  }, [message.id]);

  if (message.type === 'system') {
    return (
      <div className="w-full flex justify-center my-6 opacity-50">
        <div className="bg-white/5 border border-white/5 rounded-full px-4 py-1 text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
          {message.text}
        </div>
      </div>
    );
  }

  const handleDoubleClick = () => {
    if (message.id.startsWith('temp_')) return;
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
          <p className="leading-relaxed whitespace-pre-wrap text-sm sm:text-[15px] font-medium break-words">
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
    <div
      className={`group flex gap-3 max-w-[90%] sm:max-w-[80%] mb-4 ${isOwn ? 'ml-auto flex-row-reverse' : 'items-start'} animate-in fade-in slide-in-from-bottom-1 duration-300`}
      onDoubleClick={handleDoubleClick}
    >
      {!isSticker && (
        <div className="flex-shrink-0 mt-1">
          <div
            className="w-8 h-8 rounded-xl bg-neutral-900 border border-white/10 bg-center bg-cover"
            style={{ backgroundImage: `url(${message.user.avatar})` }}
          />
        </div>
      )}

      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} min-w-0 flex-1`}>
        {!isSticker && (
          <div className="mb-1 px-1 flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isOwn ? 'text-neutral-500' : 'text-cyan-500'}`}>
              {message.user.name}
            </span>
            <span className="text-[9px] text-neutral-600 font-mono">{formattedTime}</span>
          </div>
        )}

        {hasContent ? (
          <div className={`relative p-3.5 rounded-2xl transition-all duration-300
            ${isOwn
              ? `${isSticker ? 'bg-transparent' : 'bg-white text-black rounded-tr-sm'}`
              : `${isSticker ? 'bg-transparent' : 'bg-white/5 text-white border border-white/5 rounded-tl-sm'}`
            }
            ${message.id.startsWith('temp_') ? 'opacity-50' : ''}
          `}>
            {message.replyTo && (
              <div className={`mb-3 p-2 rounded-lg text-[11px] border-l-2 ${isOwn ? 'bg-black/5 border-black/20 text-black/60' : 'bg-white/5 border-white/20 text-white/60'}`}>
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
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/5 border border-black/5 hover:bg-black/10 transition-all text-[11px]"
                    onClick={() => onReaction(message.id, reaction.emoji)}
                  >
                    <span>{reaction.emoji}</span>
                    {reaction.count > 1 && <span className="font-bold">{reaction.count}</span>}
                  </button>
                ))}
              </div>
            )}

            <div className={`
              ${isMobile || isTouchDevice
                ? 'hidden'
                : `absolute top-0 ${isOwn ? 'right-full mr-2' : 'left-full ml-2'} opacity-0 group-hover:opacity-100`
              }
              transition-all duration-200 flex flex-col gap-1
            `}>
              <button
                onClick={() => onReply(message)}
                className="p-2 rounded-lg bg-white/5 text-neutral-500 hover:text-white hover:bg-white/10 transition-all"
                title="Ответить"
              >
                <CornerUpLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowReactionPicker(!showReactionPicker)}
                className="p-2 rounded-lg bg-white/5 text-neutral-500 hover:text-white hover:bg-white/10 transition-all"
                title="Реакция"
              >
                <Smile className="w-4 h-4" />
              </button>
              {isOwn && (
                <button
                  onClick={() => onDelete(message.id)}
                  className="p-2 rounded-lg bg-white/5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
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
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem;
