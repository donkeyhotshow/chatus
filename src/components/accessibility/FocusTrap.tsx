'use client';

import { useEffect, useRef, ReactNode, memo, useCallback } from 'react';

interface FocusTrapProps {
  children: ReactNode;
  active?: boolean;
  returnFocusOnDeactivate?: boolean;
  initialFocus?: string; // CSS selector
}

const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

export const FocusTrap = memo(function FocusTrap({
  children,
  active = true,
  returnFocusOnDeactivate = true,
  initialFocus,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    ).filter((el) => el.offsetParent !== null); // Filter out hidden elements
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!active || e.key !== 'Tab') return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }, [active, getFocusableElements]);

  useEffect(() => {
    if (!active) return;

    // Store current active element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Set initial focus
    const focusableElements = getFocusableElements();
    if (initialFocus && containerRef.current) {
      const initialElement = containerRef.current.querySelector<HTMLElement>(initialFocus);
      initialElement?.focus();
    } else if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Return focus on deactivate
      if (returnFocusOnDeactivate && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [active, initialFocus, returnFocusOnDeactivate, getFocusableElements, handleKeyDown]);

  return (
    <div ref={containerRef} data-focus-trap={active ? 'active' : 'inactive'}>
      {children}
    </div>
  );
});
