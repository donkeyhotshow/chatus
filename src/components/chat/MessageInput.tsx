
"use client";

import { useState, useEffect, useRef } from 'react';
import { Send, Mic, Paperclip, Brush, Smile } from 'lucide-react';
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
      className="w-full bg-neutral-900/90 border-t border-white/10 backdrop-blur-md z-20"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {showStickerPicker && (
        <StickerPicker
          onSelect={handleStickerSelect}
          onClose={() => setShowStickerPicker(false)}
        />
      )}
      <div className="max-w-content mx-auto flex items-end gap-2 px-2 py-2 md:px-4 md:py-3">
        <button
          onClick={() => setShowStickerPicker(p => !p)}
          className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-all mb-0.5"
          aria-label="Стикеры"
        >
          <Smile className="w-6 h-6" />
        </button>

        <div className="flex-1 relative bg-neutral-800/50 border border-white/10 rounded-[20px] focus-within:ring-1 focus-within:ring-white/20 transition-all min-h-[44px] flex items-center">
          <textarea
            ref={textareaRef}
            placeholder="Сообщение..."
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            rows={1}
            className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-neutral-500 px-4 py-2.5 max-h-[120px] resize-none overflow-y-auto leading-relaxed scrollbar-hide"
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

        {/* Mobile-optimized actions menu or direct buttons */}
        <div className="flex items-center gap-1 mb-0.5">
          <button
            onClick={onDoodleClick}
            className="w-10 h-10 flex items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-all hidden sm:flex"
            aria-label="Рисовать"
          >
            <Brush className="w-5 h-5" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 flex items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Прикрепить файл"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${text.trim()
                ? 'bg-white text-black hover:scale-105 active:scale-95'
                : 'bg-white/10 text-neutral-500 cursor-not-allowed'
              }`}
            aria-label="Отправить"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
