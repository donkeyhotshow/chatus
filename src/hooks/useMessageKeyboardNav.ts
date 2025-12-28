"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Message } from '@/lib/types';

interface UseMessageKeyboardNavOptions {
  messages: Message[];
  enabled?: boolean;
  onReply?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  currentUserId?: string;
}

/**
 * Этап 9: Keyboard Navigation for Messages
 * Навигация по сообщениям с помощью клавиатуры
 *
 * Горячие клавиши:
 * - ↑/↓: Навигация по сообщениям
 * - Enter: Ответить на выбранное сообщение
 * - Delete/Backspace: Удалить своё сообщение
 * - R: Быстрая реакция ❤️
 * - Escape: Снять выделение
 * - Home: Перейти к первому сообщению
 * - End: Перейти к последнему сообщению
 */
export function useMessageKeyboardNav({
  messages,
  enabled = true,
  onReply,
  onDelete,
  onReaction,
  currentUserId,
}: UseMessageKeyboardNavOptions) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get selected message
  const selectedMessage = selectedIndex !== null ? messages[selectedIndex] : null;

  // Check if selected message is own
  const isOwnMessage = selectedMessage && currentUserId &&
    (selectedMessage.senderId === currentUserId || selectedMessage.user?.id === currentUserId);

  // Navigate to message
  const navigateTo = useCallback((index: number) => {
    if (index < 0 || index >= messages.length) return;

    setSelectedIndex(index);
    setIsNavigating(true);

    // Auto-hide navigation indicator after 3 seconds of inactivity
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsNavigating(false);
    }, 3000);

    // Scroll message into view
    const messageElement = document.querySelector(`[data-message-index="${index}"]`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [messages.length]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedIndex(null);
    setIsNavigating(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Keyboard handler
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (selectedIndex === null) {
            // Start from last message
            navigateTo(messages.length - 1);
          } else if (selectedIndex > 0) {
            navigateTo(selectedIndex - 1);
          }
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (selectedIndex === null) {
            // Start from first message
            navigateTo(0);
          } else if (selectedIndex < messages.length - 1) {
            navigateTo(selectedIndex + 1);
          }
          break;

        case 'Home':
          e.preventDefault();
          navigateTo(0);
          break;

        case 'End':
          e.preventDefault();
          navigateTo(messages.length - 1);
          break;

        case 'Enter':
          if (selectedMessage && onReply) {
            e.preventDefault();
            onReply(selectedMessage);
            clearSelection();
          }
          break;

        case 'Delete':
        case 'Backspace':
          if (selectedMessage && isOwnMessage && onDelete) {
            e.preventDefault();
            onDelete(selectedMessage.id);
            clearSelection();
          }
          break;

        case 'r':
        case 'R':
          if (selectedMessage && onReaction && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onReaction(selectedMessage.id, '❤️');
          }
          break;

        case 'Escape':
          clearSelection();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, selectedIndex, selectedMessage, isOwnMessage, messages.length, navigateTo, clearSelection, onReply, onDelete, onReaction]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    selectedIndex,
    selectedMessage,
    isNavigating,
    navigateTo,
    clearSelection,
    isOwnMessage,
  };
}

export default useMessageKeyboardNav;
