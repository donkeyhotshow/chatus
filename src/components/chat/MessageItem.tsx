
"use client";

import { memo, useState, useEffect } from 'react';
import type { Message } from '@/lib/types';
import { EmojiRain } from './EmojiRain';
// VisuallyHidden removed as it's not used
import { format } from 'date-fns';
import { Smile, Trash2, CornerUpLeft, Clock, Check, CheckCheck } from 'lucide-react';

type MessageItemProps = {
  message: Message;
  isOwn: boolean;
  onReaction: (messageId: string, emoji: string) => void;
  onDelete: (messageId: string) => void;
  onImageClick: (imageUrl: string) => void;
  onReply: (message: Message) => void;
};

const MessageItem = memo(({ message, isOwn, onReaction, onDelete, onImageClick, onReply }: MessageItemProps) => {
  const [showEmojiRain, setShowEmojiRain] = useState(false);
  const [rainEmoji, setRainEmoji] = useState('');

  useEffect(() => {
    // Reset state when message changes to prevent animation on new messages
    setShowEmojiRain(false);
    setRainEmoji('');
  }, [message.id]);

  if (message.type === 'system') {
    return (
      <div className="w-full flex justify-center my-4 opacity-80">
        <div className="bg-white/5 border border-white/10 rounded-full px-4 py-1 text-[10px] font-mono text-cyan-400 tracking-widest uppercase shadow-[0_0_10px_rgba(6,182,212,0.2)]">
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
        // eslint-disable-next-line @next/next/no-img-element
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
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={message.imageUrl}
          alt={message.type === 'doodle' ? 'Doodle' : 'Uploaded content'}
          className={`rounded-t-2xl max-w-xs max-h-80 object-cover cursor-pointer ${!message.text ? 'rounded-b-2xl' : ''}`}
          onClick={() => onImageClick(message.imageUrl!)}
        />
      );
    }

    // For doodles, only show the image, not the text "Doodle"
    if (message.type === 'doodle' && message.imageUrl) {
      return contentNode;
    }

    if (message.text) {
      return (
        <>
          {contentNode}
          <div className="p-4">
            <p className="leading-relaxed whitespace-pre-wrap text-sm sm:text-base font-medium tracking-wide break-words">
              {message.text}
            </p>
          </div>
        </>
      )
    }

    return contentNode;
  };

  const formattedTime = message.createdAt && 'seconds' in message.createdAt
    ? format(new Date(message.createdAt.seconds * 1000), 'HH:mm')
    : 'Sending...';

  const isSticker = message.type === 'sticker';

  return (
    <div
      className={`group flex gap-3 max-w-[90%] sm:max-w-[85%] mb-4 ${isOwn ? 'ml-auto flex-row-reverse' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
      onDoubleClick={handleDoubleClick}
    >
      {!isSticker && (
        <div className="flex-shrink-0">
          <div
            className="w-10 h-10 rounded-full border-2 border-white/20 bg-center bg-cover bg-neutral-800 shadow-lg"
            style={{ backgroundImage: `url(${message.user.avatar})` }}
          >
          </div>
        </div>
      )}

      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} ${isSticker ? (isOwn ? 'mr-12' : 'ml-12') : ''} min-w-0 flex-1`}>
        {/* Username label */}
        {!isSticker && (
          <div className={`mb-1 px-1 ${isOwn ? 'text-right' : 'text-left'}`}>
            <span className={`text-xs font-semibold tracking-wide ${isOwn ? 'text-white/80' : 'text-cyan-400'}`}>
              {message.user.name}
            </span>
          </div>
        )}

        {hasContent ? (
          <div className={`relative p-0 rounded-2xl shadow-lg border transition-all duration-200 backdrop-blur-sm
            ${isOwn
              ? `${isSticker ? 'bg-transparent border-none' : 'bg-gradient-to-br from-white to-gray-100 text-black rounded-tr-md border-white/50 shadow-[0_4px_20px_rgba(255,255,255,0.15)]'}`
              : `${isSticker ? 'bg-transparent border-none' : 'bg-gradient-to-br from-neutral-800 to-neutral-900 text-white rounded-tl-md border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.3)]'}`
            }
            ${message.id.startsWith('temp_') ? 'opacity-60' : ''}
          `}>

            {message.replyTo && (
              <div className={`mb-0 p-3 rounded-t-xl border-b cursor-pointer ${isOwn ? 'bg-black/5 border-black/10' : 'bg-black/20 border-white/10'}`}>
                <span className={`font-bold block text-xs ${isOwn ? 'text-black/70' : 'text-white/70'}`}>
                  Replying to {message.replyTo.senderName}
                </span>
                <span className={`truncate block text-xs max-w-[200px] ${isOwn ? 'text-black/50' : 'text-white/50'}`}>
                  {message.replyTo.text}
                </span>
              </div>
            )}

            {renderContent()}

            {/* Action buttons */}
            <div className={`absolute top-1/2 -translate-y-1/2 ${isOwn ? 'left-[-5rem]' : 'right-[-5rem]'}
              opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-1 items-center bg-black/80 rounded-full p-1.5 backdrop-blur-md border border-white/20 shadow-lg
              ${message.id.startsWith('temp_') ? 'hidden' : ''}
              `}>

              <button
                onClick={() => onReply(message)}
                className="p-1.5 rounded-full hover:bg-cyan-500/20 text-neutral-300 hover:text-cyan-400 transition-all duration-200 hover:scale-110"
                title="Ответить"
              >
                <CornerUpLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onReaction(message.id, '❤️')}
                className="p-1.5 rounded-full hover:bg-pink-500/20 text-neutral-300 hover:text-pink-400 transition-all duration-200 hover:scale-110"
                title="Поставить лайк"
              >
                <Smile className="w-3.5 h-3.5" />
              </button>
              {isOwn && (
                <button
                  onClick={() => onDelete(message.id)}
                  className="p-1.5 rounded-full hover:bg-red-500/20 text-neutral-300 hover:text-red-400 transition-all duration-200 hover:scale-110"
                  title="Удалить"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : null}

        {/* Time stamp with status indicators - always visible on mobile, hover on desktop */}
        <div className={`mt-1 px-1 flex items-center gap-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[10px] text-neutral-500 opacity-100 sm:opacity-70 sm:group-hover:opacity-100 transition-opacity font-mono">
            {formattedTime}
          </span>
          {/* Message status indicators (only for own messages) */}
          {isOwn && (
            <div className="flex items-center">
              {message.id.startsWith('temp_') ? (
                <div title="Отправляется...">
                  <Clock className="w-3 h-3 text-neutral-400" />
                </div>
              ) : message.seen ? (
                <div title="Прочитано">
                  <CheckCheck className="w-3 h-3 text-blue-400" />
                </div>
              ) : message.delivered ? (
                <div title="Доставлено">
                  <Check className="w-3 h-3 text-neutral-400" />
                </div>
              ) : (
                <div title="Отправлено">
                  <Check className="w-3 h-3 text-neutral-600" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {showEmojiRain && <EmojiRain emoji={rainEmoji} />}
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem;
