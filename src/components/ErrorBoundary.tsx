"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, WifiOff, AlertCircle, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCode: string;
}

// P0 FIX: Generate unique error code for tracking
const generateErrorCode = () => {
  return `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
};

// P0 FIX: Categorize errors for better UX
const categorizeError = (error: Error): { icon: typeof AlertTriangle; title: string; description: string } => {
  const message = error.message.toLowerCase();

  if (message.includes('network') || message.includes('fetch') || message.includes('offline')) {
    return {
      icon: WifiOff,
      title: 'Проблема с сетью',
      description: 'Проверьте подключение к интернету и попробуйте снова'
    };
  }

  if (message.includes('permission') || message.includes('denied') || message.includes('unauthorized')) {
    return {
      icon: AlertCircle,
      title: 'Нет доступа',
      description: 'У вас нет прав для выполнения этого действия'
    };
  }

  if (message.includes('timeout') || message.includes('timed out')) {
    return {
      icon: AlertCircle,
      title: 'Превышено время ожидания',
      description: 'Сервер не отвечает. Попробуйте позже'
    };
  }

  return {
    icon: Bug,
    title: 'Что-то пошло не так',
    description: 'Произошла непредвиденная ошибка'
  };
};

/**
 * Error Boundary component for catching React errors
 * Prevents white screen crashes and shows user-friendly error UI
 * P0 FIX: Enhanced with error categorization and tracking codes
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCode: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorCode: generateErrorCode()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error with context
    console.error(
      `[ErrorBoundary${this.props.componentName ? ` - ${this.props.componentName}` : ''}]`,
      '\nError:', error.message,
      '\nCode:', this.state.errorCode,
      '\nStack:', errorInfo.componentStack
    );

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // TODO: Send to Sentry/analytics in production
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, { extra: { errorInfo, errorCode: this.state.errorCode } });
    // }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, errorCode: '' });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorCode } = this.state;
      const { icon: ErrorIcon, title, description } = error
        ? categorizeError(error)
        : { icon: AlertTriangle, title: 'Что-то пошло не так', description: 'Произошла непредвиденная ошибка' };

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <ErrorIcon className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            {title}
          </h3>
          <p className="text-sm text-[var(--text-muted)] mb-4 max-w-sm">
            {this.props.componentName
              ? `${description} в компоненте "${this.props.componentName}"`
              : description}
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors min-h-[44px]"
            >
              Попробовать снова
            </button>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors flex items-center gap-2 min-h-[44px]"
            >
              <RefreshCw className="w-4 h-4" />
              Перезагрузить
            </button>
          </div>
          {/* Error code for support */}
          <p className="mt-4 text-[10px] text-[var(--text-disabled)] font-mono">
            Код ошибки: {errorCode}
          </p>
          {this.state.error && (
            <details className="mt-4 text-left w-full max-w-md">
              <summary className="text-xs text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-secondary)]">
                Детали ошибки (dev)
              </summary>
              <pre className="mt-2 p-3 bg-black/50 rounded text-xs text-red-400 overflow-auto max-h-32">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Game-specific Error Boundary with game-themed UI
 */
export class GameErrorBoundary extends ErrorBoundary {
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 bg-black/90 text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Игра крашнулась</h2>
          <p className="text-white/60 mb-6 max-w-sm">
            Произошла ошибка. Попробуйте перезапустить игру.
          </p>
          <button
            onClick={this.handleReload}
            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-violet-500/25 transition-all min-h-[48px] flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Перезапустить
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
