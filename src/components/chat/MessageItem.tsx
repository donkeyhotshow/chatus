
"use client";

import { memo, useState, useEffect } from 'react';
import type { Message } from '@/lib/types';
import { EmojiRain } from './EmojiRain';
import { format } from 'date-fns';
import { Smile, Trash2, CornerUpLeft } from 'lucide-react';

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
      
    let contentNode = null;
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
    
    if (message.text) {
        return (
            <>
                {contentNode}
                <p className="leading-relaxed whitespace-pre-wrap p-4">{message.text}</p>
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
      className={`group flex gap-4 max-w-[85%] ${isOwn ? 'ml-auto flex-row-reverse' : 'items-start'}`}
      onDoubleClick={handleDoubleClick}
    >
      {!isSticker && (
        <div className="flex-shrink-0">
          <div 
            className="w-8 h-8 rounded-full border border-white/10 bg-center bg-cover bg-neutral-800"
            style={{ backgroundImage: `url(${message.user.avatar})` }}
          >
          </div>
        </div>
      )}

      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} ${isSticker ? (isOwn ? 'mr-12' : 'ml-12') : ''}`}>
        {hasContent ? (
          <div className={`relative p-0 rounded-2xl shadow-sm border transition-all duration-200
            ${isOwn 
              ? `${isSticker ? 'bg-transparent border-none' : 'bg-white text-black rounded-tr-none border-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'}`
              : `${isSticker ? 'bg-transparent border-none' : 'bg-neutral-900 text-neutral-300 rounded-tl-none border-white/10'}`
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

            <div className={`absolute top-1/2 -translate-y-1/2 ${isOwn ? 'left-[-4.5rem]' : 'right-[-6.5rem]'} 
              opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 items-center bg-black/60 rounded-full p-1 backdrop-blur-md border border-white/10
              ${message.id.startsWith('temp_') ? 'hidden' : ''}
              `}>
              
               <button 
                onClick={() => onReply(message)}
                className="p-1.5 rounded-full hover:bg-white/20 text-neutral-400 hover:text-cyan-400 transition-colors"
                title="Reply"
               >
                 <CornerUpLeft className="w-4 h-4" />
               </button>
               <button 
                onClick={() => onReaction(message.id, '❤️')}
                className="p-1.5 rounded-full hover:bg-white/20 text-neutral-400 hover:text-pink-500 transition-colors"
                title="React with Love"
              >
                <Smile className="w-4 h-4" />
              </button>
              {isOwn && (
                <button 
                  onClick={() => onDelete(message.id)}
                  className="p-1.5 rounded-full hover:bg-red-500/20 text-neutral-400 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : null}

        <span className="text-[10px] text-neutral-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity px-1">
          {formattedTime}
        </span>
      </div>
       {showEmojiRain && <EmojiRain emoji={rainEmoji} />}
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem;
