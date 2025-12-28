/*
Этап 8: Skip Link для kevigation
sibilitляет пропустить навигацию и перейти к основному контенту
 */

'use client';

import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}

export function SkipLink({
  href = '#main-content',
  children = 'Перейти к основному контенту',
  className
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        // Visually hidden by default
        'absolute left-4 top-4 z-[9999]',
        'px-4 py-2 rounded-lg',
        'bg-accent-primary text-white font-medium',
        'transform -translate-y-full opacity-0',
        'transition-all duration-200',
        // Visible on focus
        'focus:translate-y-0 focus:opacity-100',
        'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-bg-primary',
        className
      )}
    >
      {children}
    </a>
  );
}

/**
 * Landmark для основного контента
 */
export function MainContent({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={cn('outline-none', className)}
      role="main"
      aria-label="Основной контент"
    >
      {children}
    </main>
  );
}
