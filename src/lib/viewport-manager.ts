/**
 * ViewportManager - Handles Android keyboard vustments
 *
 * Provides utilities for managing viewport state when the virtual keyboard
 * opens/closes on Android devices, ensuring input fields remain visible.
 *
 * **Feature: chatus-bug-fixes, BUG-008**
 * **Validates: Requirements 5.1, 5.2, 5.3**
 */

/**
 * Represents the current state of the viewport
 */
export interface ViewportState {
  /** Original viewport height before keyboard appeared */
  originalHeight: number;
  /** Current viewport height (may be reduced by keyboard) */
  currentHeight: number;
  /** Estimated keyboard height in pixels */
  keyboardHeight: number;
  /** Whether the keyboard is currently visible */
  isKeyboardVisible: boolean;
}

/**
 * Configuration for viewport adjustment behavior
 */
export interface ViewportConfig {
  /** Minimum height difference to consider keyboard visible (default: 150px for portrait, 100px for landscape) */
  keyboardThreshold?: number;
  /** Additional offset to add when scrolling input into view */
  scrollOffset?: number;
  /** Whether to use smooth scrolling animation */
  smoothScroll?: boolean;
}

/** Default keyboard detection threshold for portrait mode */
export const DEFAULT_KEYBOARD_THRESHOLD_PORTRAIT = 150;

/** Default keyboard detection threshold for landscape mode */
export const DEFAULT_KEYBOARD_THRESHOLD_LANDSCAPE = 100;

/** Default scroll offset when bringing input into view */
export const DEFAULT_SCROLL_OFFSET = 20;

/**
 * Detects if the current device is running Android
 */
export function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

/**
 * Gets the current orientation of the device
 */
export function getDeviceOrientation(): 'portrait' | 'landscape' {
  if (typeof window === 'undefined') return 'portrait';

  if (typeof screen !== 'undefined' && screen.orientation) {
    return screen.orientation.type.includes('landscape') ? 'landscape' : 'portrait';
  }

  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
}

/**
 * Gets the current viewport height using visualViewport API with fallback
 */
export function getCurrentViewportHeight(): number {
  if (typeof window === 'undefined') return 0;
  return window.visualViewport?.height ?? window.innerHeight;
}

/**
 * Creates an initial viewport state snapshot
 */
export function createInitialViewportState(): ViewportState {
  const height = getCurrentViewportHeight();
  return {
    originalHeight: height,
    currentHeight: height,
    keyboardHeight: 0,
    isKeyboardVisible: false,
  };
}

/**
 * Calculates the viewport adjustment needed when keyboard is visible.
 *
 * Returns the number of pixels to adjust (translate) the content upward
 * to keep the input field visible above the keyboard.
 *
 * @param state - Current viewport state
 * @returns Number of pixels to adjust (0 if no adjustment needed)
 *
 * **Property 4: Viewport Adjustment Round-Trip**
 * For any keyboard show/hide cycle, the viewport SHALL return to its
 * original state after the keyboard closes.
 */
export function calculateViewportAdjustment(state: ViewportState): number {
  if (!state.isKeyboardVisible) {
    return 0;
  }

  // On Android, we need to account for the keyboard height
  // The adjustment should be the keyboard height minus any safe area
  const adjustment = Math.max(0, state.keyboardHeight);

  return adjustment;
}

/**
 * Scrolls an input element into view, accounting for keyboard height.
 *
 * This function ensures the input field is visible above the keyboard
 * on Android devices.
 *
 * @param element - The HTML element to scroll into view
 * @param keyboardHeight - Current keyboard height in pixels
 * @param config - Optional configuration for scroll behavior
 *
 * **Validates: Requirements 5.1, 5.2**
 */
export function scrollInputIntoView(
  element: HTMLElement | null,
  keyboardHeight: number,
  config: ViewportConfig = {}
): void {
  if (!element || typeof window === 'undefined') return;

  const { scrollOffset = DEFAULT_SCROLL_OFFSET, smoothScroll = true } = config;

  // Get element's position relative to viewport
  const rect = element.getBoundingClientRect();
  const viewportHeight = getCurrentViewportHeight();

  // Calculate the visible area above the keyboard
  const visibleAreaBottom = viewportHeight - keyboardHeight;

  // Check if element is below the visible area
  const elementBottom = rect.bottom + scrollOffset;

  if (elementBottom > visibleAreaBottom) {
    // Calculate how much we need to scroll
    const scrollAmount = elementBottom - visibleAreaBottom;

    // Use scrollIntoView with block: 'center' for better UX on Android
    if (isAndroid()) {
      // Android-specific: use setTimeout to wait for keyboard animation
      setTimeout(() => {
        element.scrollIntoView({
          behavior: smoothScroll ? 'smooth' : 'auto',
          block: 'center',
          inline: 'nearest',
        });
      }, 100);
    } else {
      // For other platforms, scroll immediately
      element.scrollIntoView({
        behavior: smoothScroll ? 'smooth' : 'auto',
        block: 'center',
        inline: 'nearest',
      });
    }
  }
}

/**
 * Restores the viewport to its original state after keyboard closes.
 *
 * This function resets any viewport adjustments made when the keyboard
 * was visible, returning the layout to its original state.
 *
 * @param state - The viewport state to restore to
 * @returns A new ViewportState with keyboard hidden and original dimensions
 *
 * **Validates: Requirements 5.3**
 * **Property 4: Viewport Adjustment Round-Trip**
 */
export function restoreViewport(state: ViewportState): ViewportState {
  return {
    originalHeight: state.originalHeight,
    currentHeight: state.originalHeight,
    keyboardHeight: 0,
    isKeyboardVisible: false,
  };
}

/**
 * Updates viewport state based on current viewport dimensions.
 *
 * Detects keyboard visibility by comparing current height to original height.
 *
 * @param currentState - Current viewport state
 * @param config - Optional configuration
 * @returns Updated viewport state
 */
export function updateViewportState(
  currentState: ViewportState,
  config: ViewportConfig = {}
): ViewportState {
  const currentHeight = getCurrentViewportHeight();
  const orientation = getDeviceOrientation();

  // Use orientation-specific threshold
  const defaultThreshold =
    orientation === 'landscape'
      ? DEFAULT_KEYBOARD_THRESHOLD_LANDSCAPE
      : DEFAULT_KEYBOARD_THRESHOLD_PORTRAIT;

  const threshold = config.keyboardThreshold ?? defaultThreshold;

  const heightDifference = currentState.originalHeight - currentHeight;
  const isKeyboardVisible = heightDifference > threshold;

  return {
    originalHeight: currentState.originalHeight,
    currentHeight,
    keyboardHeight: Math.max(0, heightDifference),
    isKeyboardVisible,
  };
}

/**
 * Checks if the viewport state represents a round-trip (keyboard shown then hidden).
 *
 * This is used to verify Property 4: after a keyboard show/hide cycle,
 * the viewport should return to its original state.
 *
 * @param before - Viewport state before keyboard appeared
 * @param after - Viewport state after keyboard closed
 * @returns true if the viewport has been properly restored
 */
export function isViewportRestored(before: ViewportState, after: ViewportState): boolean {
  // After keyboard closes, the state should match the original
  return (
    !after.isKeyboardVisible &&
    after.keyboardHeight === 0 &&
    // Allow small tolerance for floating point differences
    Math.abs(after.currentHeight - before.originalHeight) < 1
  );
}

/**
 * Simulates a keyboard show event for testing purposes.
 *
 * @param state - Current viewport state
 * @param keyboardHeight - Height of the keyboard to simulate
 * @returns New viewport state with keyboard visible
 */
export function simulateKeyboardShow(
  state: ViewportState,
  keyboardHeight: number
): ViewportState {
  const newCurrentHeight = state.originalHeight - keyboardHeight;
  return {
    originalHeight: state.originalHeight,
    currentHeight: Math.max(0, newCurrentHeight),
    keyboardHeight: Math.max(0, keyboardHeight),
    isKeyboardVisible: keyboardHeight > 0,
  };
}

/**
 * Simulates a keyboard hide event for testing purposes.
 *
 * @param state - Current viewport state with keyboard visible
 * @returns New viewport state with keyboard hidden (restored)
 */
export function simulateKeyboardHide(state: ViewportState): ViewportState {
  return restoreViewport(state);
}
