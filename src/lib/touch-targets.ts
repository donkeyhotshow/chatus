/**
TargetEnhancer - Utilities for ensuring mobile touch targets meet accessibility standards
 *
 * Implements WCAG 2.1 Success Criterion 2.5.5 (Target Size)
 * Minimum touch target size: 44x44 pixels
 *
 * @module touch-targets
 */

/**
 * Minimum touch target size in pixels (WCAG 2.1 recommendation)
 */
export const MIN_TOUCH_TARGET_SIZE = 44;

/**
 * Mobile viewport breakpoint in pixels
 */
export const MOBILE_BREAKPOINT = 768;

/**
 * Configuration for touch target sizing
 */
export interface TouchTargetConfig {
  minWidth: number;
  minHeight: number;
  paddingX: number;
  paddingY: number;
}

/**
 * Element dimensions
 */
export interface ElementDimensions {
  width: number;
  height: number;
}

/**
 * Calculates the padding needed to meet minimum touch target size
 *
 * @param currentSize - Current element dimensions
 * @returns TouchTargetConfig with calculated padding values
 */
export function calculateTouchPadding(currentSize: ElementDimensions): TouchTargetConfig {
  const { width, height } = currentSize;

  // Ensure non-negative dimensions
  const safeWidth = Math.max(0, width);
  const safeHeight = Math.max(0, height);

  // Calculate padding needed to reach minimum size
  const widthDeficit = Math.max(0, MIN_TOUCH_TARGET_SIZE - safeWidth);
  const heightDeficit = Math.max(0, MIN_TOUCH_TARGET_SIZE - safeHeight);

  // Distribute padding evenly on both sides
  const paddingX = Math.ceil(widthDeficit / 2);
  const paddingY = Math.ceil(heightDeficit / 2);

  return {
    minWidth: MIN_TOUCH_TARGET_SIZE,
    minHeight: MIN_TOUCH_TARGET_SIZE,
    paddingX,
    paddingY,
  };
}

/**
 * Checks if the current viewport is considered mobile
 *
 * @returns true if viewport width is less than MOBILE_BREAKPOINT
 */
export function isMobileViewport(): boolean {
  // Server-side rendering check
  if (typeof window === 'undefined') {
    return false;
  }

  return window.innerWidth < MOBILE_BREAKPOINT;
}

/**
 * Checks if an element meets the minimum touch target size
 *
 * @param dimensions - Element dimensions to check
 * @returns true if both width and height meet minimum requirements
 */
export function meetsMinimumTouchTarget(dimensions: ElementDimensions): boolean {
  return dimensions.width >= MIN_TOUCH_TARGET_SIZE && dimensions.height >= MIN_TOUCH_TARGET_SIZE;
}

/**
 * Gets the effective touch target size including padding
 *
 * @param dimensions - Base element dimensions
 * @param padding - Additional padding applied
 * @returns Effective touch target dimensions
 */
export function getEffectiveTouchTargetSize(
  dimensions: ElementDimensions,
  padding: { x: number; y: number }
): ElementDimensions {
  return {
    width: dimensions.width + padding.x * 2,
    height: dimensions.height + padding.y * 2,
  };
}

/**
 * Generates CSS styles for touch target enhancement
 *
 * @param config - Touch target configuration
 * @returns CSS style object
 */
export function getTouchTargetStyles(config: TouchTargetConfig): Record<string, string> {
  return {
    minWidth: `${config.minWidth}px`,
    minHeight: `${config.minHeight}px`,
    paddingLeft: `${config.paddingX}px`,
    paddingRight: `${config.paddingX}px`,
    paddingTop: `${config.paddingY}px`,
    paddingBottom: `${config.paddingY}px`,
  };
}
