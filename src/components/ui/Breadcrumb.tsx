"use client";

/**
 * Breadcrumb Component - P2-CONTEXT-001
 *
 * Displays navigation breadcrumb showing current path:
 * Комнаты > Комната > Игра / Canvas
 *
 * Updates automatically when context changes.
 *
 * Requirements: 24.1, 24.2, 24.3, 24.4
 */

import React, { useMemo } from 'react';
import { ChevronRight, Home, MessageCircle, Gamepad2, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  buildBreadcrumb,
  BreadcrumbItem,
} from '@/lib/context-indicator';
import { NavigationState } from '@/lib/navigation-state';

/**
 * Icon mapping for view types
 */
const VIEW_ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  '🏠': Home,
  '💬': MessageCircle,
  '🎮': Gamepad2,
  '🎨': Palette,
};

export interface BreadcrumbProps {
  /** Current navigation state */
  navigationState: NavigationState | null;
  /** Optional room name to display instead of ID */
  roomName?: string;
  /** Callback when a breadcrumb item is clicked */
  onNavigate?: (path: string) => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show icons */
  showIcons?: boolean;
  /** Maximum items to show (rest will be collapsed) */
  maxItems?: number;
}

/**
 * Single breadcrumb item component
 */
interface BreadcrumbItemComponentProps {
  item: BreadcrumbItem;
  isLast: boolean;
  showIcon: boolean;
  onClick?: (path: string) => void;
}

function BreadcrumbItemComponent({
  item,
  isLast,
  showIcon,
  onClick,
}: BreadcrumbItemComponentProps) {
  const IconComponent = item.icon ? VIEW_ICON_COMPONENTS[item.icon] : null;

  const handleClick = (e: React.MouseEvent) => {
    if (!isLast && onClick) {
      e.preventDefault();
      onClick(item.path);
    }
  };

  const content = (
    <>
      {showIcon && IconComponent && (
        <IconComponent className="w-4 h-4 flex-shrink-0" />
      )}
      <span className="truncate max-w-[150px]">{item.label}</span>
    </>
  );

  if (isLast) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5",
          "text-[var(--text-primary)] font-medium",
          "cursor-default"
        )}
        aria-current="page"
      >
        {content}
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1.5",
        "text-[var(--text-secondary)]",
        "hover:text-[var(--text-primary)]",
        "transition-colors duration-150",
        "focus:outline-none focus-visible:ring-2",
        "focus-visible:ring-[var(--accent-primary)]",
        "focus-visible:ring-offset-1 rounded",
        "touch-target min-h-[44px] px-1"
      )}
      aria-label={`Перейти к ${item.label}`}
    >
      {content}
    </button>
  );
}

/**
 * Breadcrumb separator component
 */
function BreadcrumbSeparator() {
  return (
    <ChevronRight
      className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0 mx-1"
      aria-hidden="true"
    />
  );
}

/**
 * Main Breadcrumb component
 *
 * Displays the current navigation path and allows navigation
 * to parent contexts.
 */
export function Breadcrumb({
  navigationState,
  roomName,
  onNavigate,
  className,
  showIcons = true,
  maxItems = 4,
}: BreadcrumbProps) {
  // Build breadcrumb items from navigation state
  const items = useMemo(() => {
    return buildBreadcrumb(navigationState, roomName);
  }, [navigationState, roomName]);

  // Handle empty state
  if (items.length === 0) {
    return null;
  }

  // Collapse items if exceeding maxItems
  const displayItems = useMemo(() => {
    if (items.length <= maxItems) {
      return items;
    }

    // Show first item, ellipsis, and last (maxItems - 2) items
    const firstItem = items[0];
    const lastItems = items.slice(-(maxItems - 1));

    return [
      firstItem,
      { label: '...', path: '', icon: undefined } as BreadcrumbItem,
      ...lastItems,
    ];
  }, [items, maxItems]);

  return (
    <nav
      aria-label="Навигация"
      className={cn(
        "flex items-center",
        "text-sm",
        "overflow-hidden",
        className
      )}
    >
      <ol className="flex items-center flex-wrap gap-y-1">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isEllipsis = item.label === '...';

          return (
            <li key={`${item.path}-${index}`} className="flex items-center">
              {index > 0 && <BreadcrumbSeparator />}
              {isEllipsis ? (
                <span
                  className="text-[var(--text-tertiary)] px-1"
                  aria-hidden="true"
                >
                  ...
                </span>
              ) : (
                <BreadcrumbItemComponent
                  item={item}
                  isLast={isLast}
                  showIcon={showIcons}
                  onClick={onNavigate}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Compact breadcrumb variant for mobile
 */
export function BreadcrumbCompact({
  navigationState,
  roomName,
  onNavigate,
  className,
}: Omit<BreadcrumbProps, 'showIcons' | 'maxItems'>) {
  const items = useMemo(() => {
    return buildBreadcrumb(navigationState, roomName);
  }, [navigationState, roomName]);

  // On mobile, only show current and parent
  const displayItems = items.slice(-2);

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Навигация"
      className={cn(
        "flex items-center",
        "text-sm",
        className
      )}
    >
      <ol className="flex items-center">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;

          return (
            <li key={`${item.path}-${index}`} className="flex items-center">
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItemComponent
                item={item}
                isLast={isLast}
                showIcon={false}
                onClick={onNavigate}
              />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
