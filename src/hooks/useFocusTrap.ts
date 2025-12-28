/**
 * Этап 8: Hook для focus trap в модальных окнах
 * Accessibility: Удержание фокуса внутри модальных окон
 */

import { useEffect, useRef, useCallback } from 'react';

const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

interface UseFocusTrapOptions {
  enabled?: boolean;
  returnFocusOnDeactivate?: boolean;
  initialFocus?: HTMLElement | null;
}

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  options: UseFocusTrapOptions = {}
) {
  const {
    enabled = true,
    returnFocusOnDeactivate = true,
    initialFocus
  } = options;

  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    ).filter(el => el.offsetParent !== null); // Only visible elements
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key !== 'Tab' || !containerRef.current) return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, [getFocusableElements]);

  useEffect(() => {
    if (!enabled) return;

    // Store previous active element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Set initial focus
    const focusableElements = getFocusableElements();
    if (initialFocus) {
      initialFocus.focus();
    } else if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Return focus to previous element
      if (returnFocusOnDeactivate && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [enabled, handleKeyDown, getFocusableElements, initialFocus, returnFocusOnDeactivate]);

  return containerRef;
}

/**
 * Hook для управления roving tabindex в группах элементов
 */
export function useRovingTabIndex<T extends HTMLElement = HTMLElement>(
  items: T[],
  options: { orientation?: 'horizontal' | 'vertical' | 'both' } = {}
) {
  const { orientation = 'horizontal' } = options;
  const currentIndex = useRef(0);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    const { key } = event;
    let newIndex = currentIndex.current;

    const isHorizontal = orientation === 'horizontal' || orientation === 'both';
    const isVertical = orientation === 'vertical' || orientation === 'both';

    if ((key === 'ArrowRight' && isHorizontal) || (key === 'ArrowDown' && isVertical)) {
      newIndex = (currentIndex.current + 1) % items.length;
    } else if ((key === 'ArrowLeft' && isHorizontal) || (key === 'ArrowUp' && isVertical)) {
      newIndex = (currentIndex.current - 1 + items.length) % items.length;
    } else if (key === 'Home') {
      newIndex = 0;
    } else if (key === 'End') {
      newIndex = items.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    currentIndex.current = newIndex;
    items[newIndex]?.focus();
  }, [items, orientation]);

  const getTabIndex = useCallback((index: number) => {
    return index === currentIndex.current ? 0 : -1;
  }, []);

  return { handleKeyDown, getTabIndex, setCurrentIndex: (i: number) => { currentIndex.current = i; } };
}
