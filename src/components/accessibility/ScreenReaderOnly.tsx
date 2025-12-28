'use client';

import { ReactNode, memo } from 'react';

interface ScreenReaderOnlyProps {
  children: ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Visually hides content but keeps it accessible to screen readers
 */
export const ScreenReaderOnly = memo(function ScreenReaderOnly({
  children,
  as: Component = 'span',
}: ScreenReaderOnlyProps) {
  return (
    <Component
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {children}
    </Component>
  );
});

/**
 * Announces content to screen readers
 */
interface LiveRegionProps {
  children: ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
}

export const LiveRegion = memo(function LiveRegion({
  children,
  politeness = 'polite',
  atomic = true,
  relevant = 'additions',
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {children}
    </div>
  );
});
