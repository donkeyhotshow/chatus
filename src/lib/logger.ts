'use client';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, error?: Error, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    const errorStr = error ? ` ${error.stack || error.message}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}${errorStr}`;
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const formatted = this.formatMessage('error', message, error, context);
    console.error(formatted);

    // In production, send to error tracking service
    if (!this.isDevelopment && typeof window !== 'undefined') {
      // Example: Send to Sentry, LogRocket, etc.
      // if (window.Sentry) {
      //   window.Sentry.captureException(error || new Error(message), { extra: context });
      // }
    }
  }

  warn(message: string, context?: LogContext): void {
    const formatted = this.formatMessage('warn', message, undefined, context);
    console.warn(formatted);
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const formatted = this.formatMessage('info', message, undefined, context);
      console.info(formatted);
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const formatted = this.formatMessage('debug', message, undefined, context);
      console.debug(formatted);
    }
  }
}

export const logger = new Logger();

