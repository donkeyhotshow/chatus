/**
 * Safari-specific workarounds for button and interaction issues
 * Addresses BUG-009: Inactive button in Safari
 *
 * Safari has known issues with:
 * - Click events not firing properly on certain elements
 * - State updates not triggering re-renders correctly
 * - Touch events handling differently than other browsers
 */

/**
 * Detects if the current browser is Safari
 * @returns true if running in Safari browser
 */
export function isSafari(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent.toLowerCase();

  // Safari detection: contains 'safari' but not 'chrome' or 'chromium'
  // Also check for iOS Safari which may have different UA strings
  const isSafariBrowser = ua.includes('safari') &&
                          !ua.includes('chrome') &&
                          !ua.includes('chromium') &&
                          !ua.includes('edg');

  // iOS Safari detection (includes WebKit-based browsers on iOS)
  const isIOSSafari = /iphone|ipad|ipod/.test(ua) &&
                      ua.includes('webkit') &&
                      !ua.includes('crios'); // Chrome on iOS

  return isSafariBrowser || isIOSSafari;
}

/**
 * Detects if running on iOS (any browser)
 * @returns true if running on iOS device
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
}

/**
 * Safari-safe click handler wrapper
 * Uses setTimeout(0) to ensure state updates are processed before action
 *
 * @param callback - The function to execute
 * @param delay - Optional delay in ms (default: 0 for Safari, immediate for others)
 */
export function safariSafeClick<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number = 0
): (...args: Parameters<T>) => void {
  return (...args: Parameters<T>) => {
    if (isSafari()) {
      // Safari workaround: use setTimeout to ensure state updates are processed
      setTimeout(() => {
        callback(...args);
      }, delay);
    } else {
      callback(...args);
    }
  };
}

/**
 * Forces a button to be enabled in Safari by triggering a re-render
 * Safari sometimes doesn't update disabled state properly
 *
 * @param buttonRef - React ref to the button element
 * @param shouldBeEnabled - Whether the button should be enabled
 */
export function forceSafariButtonState(
  buttonRef: React.RefObject<HTMLButtonElement | null>,
  shouldBeEnabled: boolean
): void {
  if (!isSafari() || !buttonRef.current) return;

  const button = buttonRef.current;

  // Force Safari to recognize the state change
  if (shouldBeEnabled) {
    button.disabled = false;
    button.removeAttribute('disabled');
    // Force repaint
    button.style.opacity = '0.99';
    requestAnimationFrame(() => {
      button.style.opacity = '1';
    });
  } else {
    button.disabled = true;
    button.setAttribute('disabled', 'true');
  }
}

/**
 * Checks if a specific API is available, with Safari fallback
 *
 * @param apiCheck - Function that checks for API availability
 * @param fallback - Fallback value if API is unavailable
 */
export function withSafariFallback<T>(
  apiCheck: () => T,
  fallback: T
): T {
  try {
    const result = apiCheck();
    if (result === undefined || result === null) {
      return fallback;
    }
    return result;
  } catch {
    // API not available, use fallback
    return fallback;
  }
}

/**
 * Safari-safe event listener that handles touch and click events properly
 * Safari sometimes requires both touch and click handlers
 *
 * @param element - The DOM element to attach listeners to
 * @param handler - The event handler
 */
export function addSafariSafeClickListener(
  element: HTMLElement,
  handler: (e: Event) => void
): () => void {
  const wrappedHandler = (e: Event) => {
    if (isSafari()) {
      // Prevent ghost clicks on Safari
      e.preventDefault();
      setTimeout(() => handler(e), 0);
    } else {
      handler(e);
    }
  };

  element.addEventListener('click', wrappedHandler);

  if (isSafari() || isIOS()) {
    // Add touchend for better iOS Safari support
    element.addEventListener('touchend', wrappedHandler, { passive: false });
  }

  // Return cleanup function
  return () => {
    element.removeEventListener('click', wrappedHandler);
    if (isSafari() || isIOS()) {
      element.removeEventListener('touchend', wrappedHandler);
    }
  };
}

/**
 * Hook-friendly Safari detection with SSR safety
 */
export function useSafariDetection(): { isSafari: boolean; isIOS: boolean } {
  // This is safe to call during render as it checks for window
  return {
    isSafari: isSafari(),
    isIOS: isIOS()
  };
}
