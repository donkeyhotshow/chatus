"use client";

/**
 * Exit Button Component - P2-EXIT-001
 *
 * Providessible exit button with confirmation dialog
 * for games, canvas, and rooms.
 *
 * Requirements: 25.1, 25.2, 25.3, 25.4
 */

import React, { useState, useCallback } from 'react';
import { X, LogOut, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import {
  ExitView,
  shouldShowExitConfirmation,
  getExitConfirmationMessage,
  createExitContext,
} from '@/lib/exit-confirmation';

export interface ExitButtonProps {
  /** View type for appropriate messaging */
  view: ExitView;
  /** Whether there are unsaved changes */
  hasUnsavedChanges?: boolean;
  /** Callback when exit is confirmed */
  onExit: () => void;
  /** Button variant */
  variant?: 'icon' | 'text' | 'full';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
  /** Custom button text (for 'text' and 'full' variants) */
  buttonText?: string;
  /** Whether button is disabled */
  disabled?: boolean;
}

/**
 * Confirmation Dialog Component
 */
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] p-6 max-w-sm w-full mx-4 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <h2
          id="exit-dialog-title"
        className="text-lg font-semibold text-[var(--text-primary)] mb-2"
        >
          {title}
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6
        {message}
        </p>

        <div className="flex gap-3">
          <Button
            var="secondary"
 onClick={onCancel}
            cllex-1"
          >
            {cancelText}
          </Button>
          <Button
t="destructive"
            onClick={onConfirm}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Exit Button with confirmation dialog
 */
export function ExitButton({
  view,
  hasUnsavedChanges = false,
  onExit,
  variant = 'icon',
  size = 'md',
  className,
  buttonText,
  disabled = false,
}: ExitButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  const handleClick = useCallback(() => {
    const context = createExitContext(
      view,
      hasUnsavedChanges,
      () => {
        setShowDialog(false);
        onExit();
      },
      () => setShowDialog(false)
    );

    if (shouldShowExitConfirmation(context)) {
      setShowDialog(true);
    } else {
      onExit();
    }
  }, [view, hasUnsavedChanges, onExit]);

  const handleConfirm = useCallback(() => {
    setShowDialog(false);
    onExit();
  }, [onExit]);

  const handleCancel = useCallback(() => {
    setShowDialog(false);
  }, []);

  const confirmConfig = getExitConfirmationMessage(view);

  // Get icon based on view
  const Icon = view === 'room' ? LogOut : view === 'game' ? ArrowLeft : X;

  // Get default text based on view
  const defaultText = view === 'room' ? 'Покинуть' : 'Выйти';
  const displayText = buttonText || defaultText;

  // Size classes
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  // Render based on variant
  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={handleClick}
          disabled={disabled}
          className={cn(
            "rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            "hover:bg-[var(--bg-tertiary)] transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]",
            "touch-target min-h-[44px] min-w-[44px] flex items-center justify-center",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            sizeClasses[size],
            className
          )}
          aria-label={displayText}
          title={displayText}
        >
          <Icon className={iconSizes[size]} />
        </button>

        <ConfirmDialog
          isOpen={showDialog}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText}
          cancelText={confirmConfig.cancelText}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      </>
    );
  }

  if (variant === 'text') {
    return (
      <>
        <button
          onClick={handleClick}
          disabled={disabled}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-2 rounded-lg",
            "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            "hover:bg-[var(--bg-tertiary)] transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]",
            "touch-target min-h-[44px]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "text-sm font-medium",
            className
          )}
        >
          <Icon className={iconSizes[size]} />
          <span>{displayText}</span>
        </button>

        <ConfirmDialog
          isOpen={showDialog}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText}
          cancelText={confirmConfig.cancelText}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      </>
    );
  }

  // Full variant - uses Button component
  return (
    <>
      <Button
        onClick={handleClick}
        disabled={disabled}
        variant="ghost"
        size={size}
        className={cn("gap-2", className)}
      >
        <Icon className={iconSizes[size]} />
        <span>{displayText}</span>
      </Button>

      <ConfirmDialog
        isOpen={showDialog}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}

export default ExitButton;
