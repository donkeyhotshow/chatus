
"use client";

import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Brush, Smile } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StickerPicker } from './StickerPicker';
import { useDebouncedCallback } from 'use-debounce';

type MessageInputProps = {
  onSendMessage: (text: string) => void;
  onImageSend: (file: File) => void;
  onDoodleClick: () => void;
  onInputChange: () => void;
  onStickerSend: (stickerUrl: string) => void;
  roomId: string;
};

export function MessageInput({ onSendMessage, onImageSend, onDoodleClick, onInputChange, onStickerSend, roomId }: MessageInputProps) {
  const [text, setText] = useState('');
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const draftKey = `chat-draft-${roomId}`;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      setText(savedDraft);
    }
  }, [draftKey]);

  useEffect(() => {
    localStorage.setItem(draftKey, text);
  }, [text, draftKey]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSend = () => {
    if (text.trim()) {
      onSendMessage(text.trim());
      setText('');
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Файл слишком большой",
          description: "Пожалуйста, выберите изображение размером менее 5MB.",
          variant: "destructive",
        });
        return;
      }
      onImageSend(file);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Debounce typing indicator to reduce Firestore writes
  const debouncedTyping = useDebouncedCallback(
    () => {
      onInputChange();
    },
    500 // 500ms delay
  );

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    debouncedTyping();
  }

  const handleStickerSelect = (stickerUrl: string) => {
    onStickerSend(stickerUrl);
    setShowStickerPicker(false);
  }

  return (
    <div
      className="w-full bg-gradient-to-t from-black/80 to-neutral-900/90 border-t border-white/20 backdrop-blur-md z-20 shadow-2xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {showStickerPicker && (
        <StickerPicker
          onSelect={handleStickerSelect}
          onClose={() => setShowStickerPicker(false)}
        />
      )}
      <div className="max-w-content mx-auto flex items-end gap-2 sm:gap-3 px-3 py-3 sm:px-4 sm:py-4">
        <button
          onClick={() => setShowStickerPicker(p => !p)}
          className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-all mb-0.5"
          aria-label="Стикеры"
        >
          <Smile className="w-6 h-6" />
        </button>

        <div className="flex-1 relative bg-gradient-to-r from-neutral-800/60 to-neutral-700/60 border border-white/20 rounded-[22px] focus-within:ring-2 focus-within:ring-cyan-400/50 focus-within:border-cyan-400/50 transition-all duration-200 min-h-[44px] flex items-center shadow-lg backdrop-blur-sm">
          <textarea
            ref={textareaRef}
            placeholder="Напишите сообщение..."
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            rows={1}
            className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-neutral-400 px-4 py-3 max-h-[120px] resize-none overflow-y-auto leading-relaxed scrollbar-hide text-sm sm:text-base"
            aria-label="Сообщение"
            style={{ minHeight: '44px' }}
          />
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/gif"
          className="hidden"
        />

        {/* Action buttons */}
        <div className="flex items-center gap-1 sm:gap-2 mb-0.5">
          <button
            onClick={onDoodleClick}
            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full text-neutral-400 hover:text-cyan-400 hover:bg-cyan-400/10 transition-all duration-200 hover:scale-110 hidden sm:flex"
            aria-label="Рисовать"
            title="Рисовать"
          >
            <Brush className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full text-neutral-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all duration-200 hover:scale-110"
            aria-label="Прикрепить файл"
            title="Прикрепить изображение"
          >
            <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className={`w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full transition-all duration-200 ${text.trim()
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:scale-110 active:scale-95 shadow-lg shadow-cyan-500/25'
              : 'bg-white/10 text-neutral-500 cursor-not-allowed'
              }`}
            aria-label="Отправить"
            title="Отправить сообщение"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
