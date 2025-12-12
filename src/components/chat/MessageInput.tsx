
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
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

  const handleSend = () => {
    if (text.trim()) {
      onSendMessage(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
          title: "File is too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      onImageSend(file);
    }
    // Reset file input
    if(fileInputRef.current) {
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

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setText(e.target.value);
      debouncedTyping();
  }

  const handleStickerSelect = (stickerUrl: string) => {
    onStickerSend(stickerUrl);
    setShowStickerPicker(false);
  }

  return (
    <div className="p-6 relative">
      {showStickerPicker && (
        <StickerPicker 
          onSelect={handleStickerSelect}
          onClose={() => setShowStickerPicker(false)}
        />
      )}
      <div className="relative flex items-center gap-2 bg-neutral-900/80 border border-white/10 rounded-full px-2 py-2 shadow-2xl ring-1 ring-white/5 focus-within:ring-white/20 transition-all">
        <input 
          type="text" 
          placeholder="Type a message..." 
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-neutral-500 px-4 h-10"
        />
         <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/gif"
          className="hidden"
        />
        <button 
          onClick={() => setShowStickerPicker(p => !p)}
          className="p-2.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <Smile className="w-5 h-5" />
        </button>
        <button 
          onClick={onDoodleClick}
          className="p-2.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <Brush className="w-5 h-5" />
        </button>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <button className="p-2.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-all">
          <Mic className="w-5 h-5" />
        </button>
        <button onClick={handleSend} className="p-2.5 rounded-full bg-white text-black hover:scale-105 transition-transform active:scale-95">
          <Send className="w-5 h-5 ml-0.5" />
        </button>
      </div>
    </div>
  );
}
