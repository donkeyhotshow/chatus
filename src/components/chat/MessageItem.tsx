
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

  // Адаптивность
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTouchDevice = useMediaQuery('(hover: none)');

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
          <div className={`relative p-0 rounded-3xl shadow-2xl border transition-all duration-500 backdrop-blur-xl
            ${isOwn
              ? `${isSticker ? 'bg-transparent border-none' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 rounded-tr-lg border-white/60 shadow-[0_8px_40px_rgba(0,188,212,0.25),0_4px_20px_rgba(255,255,255,0.3)] before:absolute before:inset-0 before:bg-gradient-to-br before:from-cyan-400/10 before:to-blue-500/10 before:rounded-3xl before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300'}`
              : `${isSticker ? 'bg-transparent border-none' : 'bg-gradient-to-br from-slate-900/95 via-slate-800/98 to-slate-900/95 text-white rounded-tl-lg border-cyan-500/30 shadow-[0_8px_40px_rgba(0,0,0,0.6),0_4px_20px_rgba(0,188,212,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] before:absolute before:inset-0 before:bg-gradient-to-br before:from-cyan-400/5 before:to-purple-500/5 before:rounded-3xl before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300'}`
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

            {/* Reactions */}
            {reactions.length > 0 && (
              <div className={`flex flex-wrap gap-2 px-4 sm:px-6 pb-3 sm:pb-4 ${isMobile ? 'max-w-full overflow-x-auto scrollbar-none' : ''}`}>
                {reactions.map((reaction) => (
                  <button
                    key={reaction.emoji}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 ${!isTouchDevice ? 'hover:from-cyan-500/20 hover:to-blue-500/20 hover:border-cyan-400/50 hover:shadow-cyan-500/25 hover:scale-105' : 'active:scale-95'} border border-slate-600/50 backdrop-blur-sm transition-all duration-300 text-xs sm:text-sm shadow-lg min-h-[44px] sm:min-h-auto`}
                    onClick={() => onReaction(message.id, reaction.emoji)}
                    title={`${reaction.emoji} от ${reaction.users.join(', ')}`}
                  >
                    <span className="text-base sm:text-lg">{reaction.emoji}</span>
                    {reaction.count > 1 && <span className="text-white/80 font-medium">{reaction.count}</span>}
                  </button>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className={`
              ${isMobile || isTouchDevice
                ? 'static opacity-100 mt-3 justify-center'
                : `absolute top-1/2 -translate-y-1/2 ${isOwn ? 'left-[-6rem]' : 'right-[-6rem]'} opacity-0 group-hover:opacity-100`
              }
              transition-all duration-300 flex gap-2 items-center bg-gradient-to-r from-slate-900/95 to-slate-800/95 rounded-2xl p-2 backdrop-blur-xl border border-cyan-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_4px_16px_rgba(0,188,212,0.2)]
              ${message.id.startsWith('temp_') ? 'hidden' : ''}
            `}>

              <button
                onClick={() => onReply(message)}
                className={`p-2.5 sm:p-2 rounded-xl text-slate-300 transition-all duration-300 border border-transparent min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center ${!isTouchDevice
                    ? 'hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 hover:text-cyan-300 hover:scale-110 hover:shadow-lg hover:shadow-cyan-500/25 hover:border-cyan-400/30'
                    : 'active:scale-95 active:bg-cyan-500/20'
                  }`}
                title="Ответить"
              >
                <CornerUpLeft className="w-4 h-4" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowReactionPicker(!showReactionPicker)}
                  className={`p-2.5 sm:p-2 rounded-xl text-slate-300 transition-all duration-300 border border-transparent min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center ${!isTouchDevice
                      ? 'hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-purple-500/20 hover:text-pink-300 hover:scale-110 hover:shadow-lg hover:shadow-pink-500/25 hover:border-pink-400/30'
                      : 'active:scale-95 active:bg-pink-500/20'
                    }`}
                  title="Добавить реакцию"
                >
                  <Smile className="w-4 h-4" />
                </button>

                {showReactionPicker && (
                  <div className={`absolute ${isMobile ? 'bottom-full mb-3 left-1/2 -translate-x-1/2' : 'bottom-full mb-3 right-0'} bg-gradient-to-br from-slate-900/98 to-slate-800/98 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-3 flex gap-2 z-20 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_4px_16px_rgba(0,188,212,0.3)]`}>
                    {['👍', '❤️', '😂', '😮', '😢', '🔥'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          onReaction(message.id, emoji);
                          setShowReactionPicker(false);
                        }}
                        className={`p-2.5 sm:p-2 rounded-xl text-xl transition-all duration-300 min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center ${!isTouchDevice
                            ? 'hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-purple-500/20 hover:scale-125 hover:shadow-lg'
                            : 'active:scale-95 active:bg-cyan-500/20'
                          }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {isOwn && (
                <button
                  onClick={() => onDelete(message.id)}
                  className={`p-2.5 sm:p-2 rounded-xl text-slate-300 transition-all duration-300 border border-transparent min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center ${!isTouchDevice
                      ? 'hover:bg-gradient-to-r hover:from-red-500/20 hover:to-pink-500/20 hover:text-red-300 hover:scale-110 hover:shadow-lg hover:shadow-red-500/25 hover:border-red-400/30'
                      : 'active:scale-95 active:bg-red-500/20'
                    }`}
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
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
