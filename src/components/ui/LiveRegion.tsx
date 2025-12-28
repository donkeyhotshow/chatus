/**
 * Этап 8: Live Region для динамических обновлений
 * Accessibility: Объявляет изменения для screen readers
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  clearAfter?: number;
  className?: string;
}

export function LiveRegion({
  message,
  politeness = 'polite',
  atomic = true,
  relevant = 'additions',
  clearAfter = 5000,
  className
}: LiveRegionProps) {
  const [currentMessage, setCurrentMessage] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (message) {
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new message
      setCurrentMessage(message);

      // Clear after delay
      if (clearAfter > 0) {
        timeoutRef.current = setTimeout(() => {
          setCurrentMessage('');
        }, clearAfter);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [message, clearAfter]);

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={cn(
        // Visually hidden but accessible to screen readers
        'sr-only',
        className
      )}
    >
      {currentMessage}
    </div>
  );
}

/**
 * Hook для управления live region
 */
export function useLiveRegion(options: Omit<LiveRegionProps, 'message'> = {}) {
  const [message, setMessage] = useState('');

  const announce = (newMessage: string) => {
    // Force re-announcement by clearing first
    setMessage('');
    requestAnimationFrame(() => {
      setMessage(newMessage);
    });
  };

  const LiveRegionComponent = () => (
    <LiveRegion message={message} {...options} />
  );

  return { announce, LiveRegion: LiveRegionComponent };
}
