'use client';

import React from 'react';
import { logger } from '@/lib/logger';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void; eventId?: string }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  eventId?: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.retryCount,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    };

    logger.error('ErrorBoundary caught an error:', error, errorDetails);
    this.props.onError?.(error, errorInfo);

    this.setState({
      errorInfo,
      eventId: this.generateEventId()
    });
  }

  private generateEventId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  resetError = () => {
    this.retryCount++;

    if (this.retryCount > this.maxRetries) {
      logger.warn(`Max retries (${this.maxRetries}) exceeded for ErrorBoundary`);
      return;
    }

    logger.info(`Resetting ErrorBoundary (attempt ${this.retryCount})`);
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      eventId: undefined
    });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;

      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
            eventId={this.state.eventId}
          />
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
          <div className="text-center p-8 max-w-md">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2">Что-то пошло не так</h1>
              <p className="text-gray-400 mb-4">
                Произошла ошибка при загрузке приложения
              </p>
              {this.state.eventId && (
                <p className="text-xs text-gray-500 mb-4">
                  ID ошибки: {this.state.eventId}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={this.resetError}
                disabled={this.retryCount >= this.maxRetries}
                className="w-full px-4 py-2 bg-white text-black rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {this.retryCount >= this.maxRetries ? 'Превышен лимит попыток' : 'Попробовать снова'}
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-800 transition-colors"
              >
                Перезагрузить страницу
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">
                  Детали ошибки (только в разработке)
                </summary>
                <pre className="mt-2 p-3 bg-gray-900 rounded text-xs overflow-auto max-h-40">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
