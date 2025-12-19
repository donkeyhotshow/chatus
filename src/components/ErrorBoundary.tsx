'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from "@sentry/nextjs";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo
    });

    // Enhanced error handling
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Check for infinite loop errors and handle them specially
    if (error.message.includes('Maximum update depth exceeded')) {
      // Force component remount after a delay
      setTimeout(() => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
      }, 1000);
    }

    // In production, log to error reporting service
    Sentry.captureException(error, { extra: { errorInfo } });
  }

  private handleReset = (): void => {
    this.setState({ hasError: false });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI - використовуємо CSS variables для консистентності
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4">
          <div className="max-w-sm w-full bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-2xl p-6 text-center">
            <div className="mb-4">
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-xl bg-red-100 dark:bg-red-950/30">
                <svg
                  className="h-7 w-7 text-[var(--error)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            </div>

            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Щось пішло не так
            </h2>

            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Виникла несподівана помилка. Спробуйте оновити сторінку.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-xs text-[var(--text-muted)] mb-2">
                  Деталі помилки (тільки в розробці)
                </summary>
                <pre className="text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] p-2 rounded-lg overflow-auto max-h-32">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={this.handleReset}
                className="w-full py-3 bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-medium rounded-xl hover:bg-[var(--accent-hover)] transition-colors"
              >
                Спробувати знову
              </button>

              <button
                onClick={this.handleReload}
                className="w-full py-3 bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-medium rounded-xl hover:bg-[var(--border-primary)] transition-colors"
              >
                Оновити сторінку
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Error caught by useErrorHandler:', error, errorInfo);
    }

    // In production, log to error reporting service
    Sentry.captureException(error, { extra: { errorInfo } });
  };
}

export default ErrorBoundary;
