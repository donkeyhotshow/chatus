/**
 * iOSViewportManager - Handles iOS-specific keyboard and viewport adjustments
 *
 * Provides utilities for managing viewport state when the virtual keyboard
 * opens/closes on iOS devices, ensuring input fields and send buttons remain visible.
 *
 * **Feature: chatus-bug-fixes, P1-MOBILE-001**
 * **Validates: Requirements 18.1, 18.2, 18.3**
 */

/**
 * Represents the current state of the iOS viewport
 */
export interface iOSViewportState {
  /** Height of the visual viewport (visible area) */
  visualViewportHeight: number;
  /** Height of the layout viewport (full page) */
  layoutViewportHeight: number;
  /** Estimated keyboard height in pixels */
  keyboardHeight: number;
  /** Whether the keyboard is currently visible */
  isKeyboardVisible: boolean;
  /** Original scroll position before keyboard appeared */
  originalScrollTop: number;
}

/**
 * Configuration for iOS viewport behavior
 */
export interface iOSViewportConfig {
  /** Minimum height difference to consider keyboard visible (default: 100px) */
  keyboardThreshold?: number;
  /** Additional offset to add when scrolling input into view */
  scrollOffset?: number;
  /** Whether to use smooth scrolling animation */
  smoothScroll?: boolean;
  /** Debounce delay for resize events in ms */
  debounceDelay?: number;
}

/** Default keyboard detection threshold */
export const DEFAULT_IOS_KEYBOARD_THRESHOLD = 100;

/** Default scroll offset when bringing input into view */
export const DEFAULT_IOS_SCROLL_OFFSET = 20;

/** Default debounce delay for resize events */
export const DEFAULT_DEBOUNCE_DELAY = 50;

/** Safe area inset for iOS devices */
export const IOS_SAFE_AREA_BOTTOM = 34;

/**
 * Detects if the current device is running iOS
 */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;

  // Check for iOS devices including iPad with iPadOS
  const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  return isIOSDevice;
}

/**
 * Detects if the current browser is Safari on iOS
 */
export function isIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);

  return isIOS && isSafari;
}

/**
 * Gets the current visual viewport height using the Visual Viewport API
 * Falls back to window.innerHeight if API is not available
 */
export function getVisualViewportHeight(): number {
  if (typeof window === 'undefined') return 0;
  return window.visualViewport?.height ?? window.innerHeight;
}

/**
 * Gets the current layout viewport height
 */
export function getLayoutViewportHeight(): number {
  if (typeof window === 'undefined') return 0;
  return window.innerHeight;
}

/**
 * Creates an initial iOS viewport state snapshot
 */
export function createInitialIOSViewportState(): iOSViewportState {
  const visualHeight = getVisualViewportHeight();
  const layoutHeight = getLayoutViewportHeight();

  return {
    visualViewportHeight: visualHeight,
    layoutViewportHeight: layoutHeight,
    keyboardHeight: 0,
    isKeyboardVisible: false,
    originalScrollTop: typeof window !== 'undefined' ? window.scrollY : 0,
  };
}


/**
 * Updates iOS viewport state based on current viewport dimensions.
 *
 * Detects keyboard visibility by comparing visual viewport to layout viewport.
 *
 * @param currentState - Current viewport state
 * @param config - Optional configuration
 * @returns Updated viewport state
 */
export function updateIOSViewportState(
  currentState: iOSViewportState,
  config: iOSViewportConfig = {}
): iOSViewportState {
  const visualHeight = getVisualViewportHeight();
  const layoutHeight = getLayoutViewportHeight();

  const threshold = config.keyboardThreshold ?? DEFAULT_IOS_KEYBOARD_THRESHOLD;

  // On iOS, keyboard visibility is detected by comparing visual viewport to layout viewport
  const heightDifference = layoutHeight - visualHeight;
  const isKeyboardVisible = heightDifference > threshold;

  return {
    visualViewportHeight: visualHeight,
    layoutViewportHeight: layoutHeight,
    keyboardHeight: Math.max(0, heightDifference),
    isKeyboardVisible,
    originalScrollTop: isKeyboardVisible
      ? currentState.originalScrollTop
      : (typeof window !== 'undefined' ? window.scrollY : 0),
  };
}

/**
 * Sets up a listener for Visual Viewport changes on iOS.
 *
 * Uses the Visual Viewport API to detect keyboard show/hide events
 * and calls the provided callback with the updated state.
 *
 * @param onStateChange - Callback function called when viewport state changes
 * @param config - Optional configuration
 * @returns Cleanup function to remove the listener
 *
 * **Validates: Requirements 18.1**
 */
export function setupVisualViewportListener(
  onStateChange: (state: iOSViewportState) => void,
  config: iOSViewportConfig = {}
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let currentState = createInitialIOSViewportState();
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const debounceDelay = config.debounceDelay ?? DEFAULT_DEBOUNCE_DELAY;

  const handleViewportChange = () => {
    // Debounce rapid resize events
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      const newState = updateIOSViewportState(currentState, config);

      // Only trigger callback if keyboard visibility changed
      if (newState.isKeyboardVisible !== currentState.isKeyboardVisible ||
          Math.abs(newState.keyboardHeight - currentState.keyboardHeight) > 10) {
        currentState = newState;
        onStateChange(newState);
      }
    }, debounceDelay);
  };

  // Use Visual Viewport API if available (preferred for iOS)
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);
  }

  // Fallback to window resize
  window.addEventListener('resize', handleViewportChange);

  // Cleanup function
  return () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', handleViewportChange);
      window.visualViewport.removeEventListener('scroll', handleViewportChange);
    }

    window.removeEventListener('resize', handleViewportChange);
  };
}

/**
 * Adjusts the layout when the keyboard opens on iOS.
 *
 * This function modifies the page layout to ensure content remains
 * visible above the keyboard.
 *
 * @param state - Current iOS viewport state
 * @param containerElement - Optional container element to adjust
 *
 * **Validates: Requirements 18.1, 18.2**
 */
export function adjustLayoutForKeyboard(
  state: iOSViewportState,
  containerElement?: HTMLElement | null
): void {
  if (typeof document === 'undefined') return;

  if (!state.isKeyboardVisible) {
    // Reset any adjustments when keyboard is hidden
    if (containerElement) {
      containerElement.style.paddingBottom = '';
      containerElement.style.maxHeight = '';
    }
    return;
  }

  // Add padding to account for keyboard
  const safeAreaBottom = IOS_SAFE_AREA_BOTTOM;
  const totalOffset = state.keyboardHeight + safeAreaBottom;

  if (containerElement) {
    containerElement.style.paddingBottom = `${totalOffset}px`;
    containerElement.style.maxHeight = `${state.visualViewportHeight}px`;
  }
}

/**
 * Ensures the send button remains visible above the keyboard on iOS.
 *
 * This function scrolls the input element and its parent container
 * to ensure the send button is visible when the keyboard is open.
 *
 * @param inputElement - The input element to keep visible
 * @param sendButtonElement - Optional send button element
 * @param config - Optional configuration
 *
 * **Validates: Requirements 18.2**
 */
export function ensureSendButtonVisible(
  inputElement: HTMLElement | null,
  sendButtonElement?: HTMLElement | null,
  config: iOSViewportConfig = {}
): void {
  if (!inputElement || typeof window === 'undefined') return;

  const { scrollOffset = DEFAULT_IOS_SCROLL_OFFSET, smoothScroll = true } = config;

  // Get the element to focus on (prefer send button if provided)
  const targetElement = sendButtonElement || inputElement;

  // Use requestAnimationFrame to ensure DOM is updated
  requestAnimationFrame(() => {
    // For iOS Safari, we need a small delay for the keyboard animation
    setTimeout(() => {
      const rect = targetElement.getBoundingClientRect();
      const visualViewportHeight = getVisualViewportHeight();

      // Check if element is below the visible area
      if (rect.bottom > visualViewportHeight - scrollOffset) {
        // Scroll the element into view
        targetElement.scrollIntoView({
          behavior: smoothScroll ? 'smooth' : 'auto',
          block: 'end',
          inline: 'nearest',
        });

        // Additional scroll adjustment for iOS
        if (isIOSSafari()) {
          const additionalScroll = rect.bottom - visualViewportHeight + scrollOffset;
          window.scrollBy({
            top: additionalScroll,
            behavior: smoothScroll ? 'smooth' : 'auto',
          });
        }
      }
    }, 100);
  });
}

/**
 * Restores the layout when the keyboard closes on iOS.
 *
 * This function resets any layout adjustments made when the keyboard
 * was visible, returning the page to its original state without reload.
 *
 * @param state - The viewport state to restore from
 * @param containerElement - Optional container element to reset
 *
 * **Validates: Requirements 18.3**
 */
export function restoreLayoutOnKeyboardClose(
  state: iOSViewportState,
  containerElement?: HTMLElement | null
): void {
  if (typeof window === 'undefined') return;

  // Reset container styles
  if (containerElement) {
    containerElement.style.paddingBottom = '';
    containerElement.style.maxHeight = '';
    containerElement.style.transform = '';
  }

  // Restore scroll position if needed
  if (state.originalScrollTop !== undefined && state.originalScrollTop >= 0) {
    // Use requestAnimationFrame to ensure smooth restoration
    requestAnimationFrame(() => {
      window.scrollTo({
        top: state.originalScrollTop,
        behavior: 'auto',
      });
    });
  }
}

/**
 * Creates a complete iOS viewport manager with all necessary handlers.
 *
 * This is a convenience function that sets up all the necessary listeners
 * and provides methods for managing the viewport state.
 *
 * @param config - Optional configuration
 * @returns Object with state and control methods
 */
export function createIOSViewportManager(config: iOSViewportConfig = {}) {
  let state = createInitialIOSViewportState();
  let containerElement: HTMLElement | null = null;
  let inputElement: HTMLElement | null = null;
  let sendButtonElement: HTMLElement | null = null;
  let cleanup: (() => void) | null = null;

  const handleStateChange = (newState: iOSViewportState) => {
    const wasKeyboardVisible = state.isKeyboardVisible;
    state = newState;

    if (newState.isKeyboardVisible && !wasKeyboardVisible) {
      // Keyboard just opened
      adjustLayoutForKeyboard(newState, containerElement);
      ensureSendButtonVisible(inputElement, sendButtonElement, config);
    } else if (!newState.isKeyboardVisible && wasKeyboardVisible) {
      // Keyboard just closed
      restoreLayoutOnKeyboardClose(state, containerElement);
    }
  };

  return {
    /**
     * Initializes the viewport manager with element references
     */
    init(elements: {
      container?: HTMLElement | null;
      input?: HTMLElement | null;
      sendButton?: HTMLElement | null;
    }) {
      containerElement = elements.container ?? null;
      inputElement = elements.input ?? null;
      sendButtonElement = elements.sendButton ?? null;

      // Only set up listeners on iOS devices
      if (isIOS()) {
        cleanup = setupVisualViewportListener(handleStateChange, config);
      }
    },

    /**
     * Gets the current viewport state
     */
    getState(): iOSViewportState {
      return state;
    },

    /**
     * Manually triggers a viewport update
     */
    update() {
      state = updateIOSViewportState(state, config);
      handleStateChange(state);
    },

    /**
     * Handles input focus event
     */
    handleFocus() {
      if (isIOS() && inputElement) {
        // Small delay to wait for keyboard to appear
        setTimeout(() => {
          ensureSendButtonVisible(inputElement, sendButtonElement, config);
        }, 300);
      }
    },

    /**
     * Handles input blur event
     */
    handleBlur() {
      if (isIOS()) {
        // Small delay to wait for keyboard to close
        setTimeout(() => {
          if (!state.isKeyboardVisible) {
            restoreLayoutOnKeyboardClose(state, containerElement);
          }
        }, 100);
      }
    },

    /**
     * Cleans up all listeners and resets state
     */
    destroy() {
      if (cleanup) {
        cleanup();
        cleanup = null;
      }

      if (containerElement) {
        containerElement.style.paddingBottom = '';
        containerElement.style.maxHeight = '';
        containerElement.style.transform = '';
      }

      containerElement = null;
      inputElement = null;
      sendButtonElement = null;
      state = createInitialIOSViewportState();
    },
  };
}

/**
 * React hook for iOS viewport management
 *
 * @param config - Optional configuration
 * @returns Object with state and refs for iOS viewport management
 */
export function useIOSViewportManager(config: iOSViewportConfig = {}) {
  // This is a placeholder for the hook implementation
  // The actual React hook will be implemented in the component
  return {
    isIOS: isIOS(),
    isIOSSafari: isIOSSafari(),
    config,
  };
}
