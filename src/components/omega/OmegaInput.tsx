"use client";

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

inaInputProps {
  onSend: (message: string) => void;
  onAddClick?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const OmegaInput = memo(function OmegaInput({
  onSend,
  onAddClick,
  placeholder = "Сообщение...",
  disabled = false,
  className
}: OmegaInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;

    if ('vibrate' in navigator) navigator.vibrate(5);
    onSend(trimmed);
    setValue('');
  }, [value, disabled, onSend]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-4",
        "border-t border-white/10",
        className
      )}
      style={{ backgroundColor: '#1a1a1a' }}
    >
      {/* Add button */}
      <button
        onClick={onAddClick}
        disabled={disabled}
        className="w-11 h-11 rounded-full flex items-center justify-center bg-[#2a2a2a] hover:bg-white/20 transition-colors disabled:opacity-50"
      >
        <span className="material-icons text-white">add</span>
      </button>

      {/* Input field */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "flex-1 h-11 px-4 rounded-[22px]",
          "text-base text-white placeholder:text-[#a1a1aa]",
          "bg-[#2a2a2a] border-none outline-none",
          "disabled:opacity-50"
        )}
      />

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className={cn(
          "w-11 h-11 rounded-full flex items-center justify-center transition-colors",
          value.trim()
            ? "bg-[#10b981] hover:bg-[#0da474]"
            : "bg-[#2a2a2a] hover:bg-white/20",
          "disabled:opacity-50"
        )}
      >
        <span className="material-icons text-white">send</span>
      </button>
    </div>
  );
});

export default OmegaInput;
