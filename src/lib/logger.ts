'use client';

// Sentry disabled for performance - uncomment when needed
// import * as Sentry from "@sentry/nextjs";

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

    // eslint-disable-next-line no-console
    console.error(formatted);

    // Production error tracking (Sentry disabled)
    // if (!this.isDevelopment && typeof window !== 'undefined') {
    //   Sentry.captureException(error || new Error(message), { extra: context });
    // }
  }

  warn(message: string, errorOrContext?: Error | LogContext, context?: LogContext): void {
    const error = errorOrContext instanceof Error ? errorOrContext : undefined;
    const ctx = errorOrContext instanceof Error ? context : errorOrContext;
    const formatted = this.formatMessage('warn', message, error, ctx);

    // eslint-disable-next-line no-console
    console.warn(formatted);

    // Production warning tracking (Sentry disabled)
    // if (!this.isDevelopment && typeof window !== 'undefined') {
    //   Sentry.captureMessage(message, { level: 'warning', extra: ctx });
    // }
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const formatted = this.formatMessage('info', message, undefined, context);
      // eslint-disable-next-line no-console
      console.info(formatted);
    }
  }

  debug(message: string, errorOrContext?: Error | LogContext, context?: LogContext): void {
    if (this.isDevelopment) {
      const error = errorOrContext instanceof Error ? errorOrContext : undefined;
      const ctx = errorOrContext instanceof Error ? context : errorOrContext;
      const formatted = this.formatMessage('debug', message, error, ctx);
      // eslint-disable-next-line no-console
      console.debug(formatted);
    }
  }
}

export const logger = new Logger();
