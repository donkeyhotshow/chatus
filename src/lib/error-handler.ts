/**
 * Enhanced Error Handler for Chat Application
 * Provides comprehensivr handling, logging, and recovery mechanisms
 */

import { toast } from '@/hooks/use-toast';
import { logger } from './logger';

export interface ErrorContext {
    component?: string;
    action?: string;
    userId?: string;
    roomId?: string;
    messageId?: string;
    [key: string]: any;
}

export interface ErrorHandlerOptions {
    showToast?: boolean;
    logError?: boolean;
    retryable?: boolean;
    maxRetries?: number;
    retryDelay?: number;
}

export class EnhancedErrorHandler {
    private static instance: EnhancedErrorHandler;
    private retryAttempts = new Map<string, number>();

    static getInstance(): EnhancedErrorHandler {
        if (!EnhancedErrorHandler.instance) {
            EnhancedErrorHandler.instance = new EnhancedErrorHandler();
        }
        return EnhancedErrorHandler.instance;
    }

    /**
     * Handle errors with context and options
     */
    async handleError(
        error: Error | unknown,
        context: ErrorContext = {},
        options: ErrorHandlerOptions = {}
    ): Promise<void> {
        const {
            showToast = true,
            logError = true,
            retryable = false,
            maxRetries = 3,
            retryDelay = 1000
        } = options;

        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorKey = `${context.component}-${context.action}-${errorMessage}`;

        // Log error if enabled
        if (logError) {
            logger.error(`Error in ${context.component || 'Unknown'}`, error as Error, context);
        }

        // Show user-friendly toast notification
        if (showToast) {
            this.showErrorToast(error, context);
        }

        // Handle retryable errors
        if (retryable && context.retryFunction) {
            await this.handleRetry(errorKey, context.retryFunction, maxRetries, retryDelay);
        }
    }

    /**
     * Handle Firebase-specific errors
     */
    handleFirebaseError(error: any, context: ErrorContext = {}): void {
        const errorCode = error?.code || 'unknown';
        const errorMessage = error?.message || 'Unknown Firebase error';

        let retryable = false;

        switch (errorCode) {
            case 'permission-denied':
                break;
            case 'unavailable':
                retryable = true;
                break;
            case 'failed-precondition':
                retryable = true;
                break;
            case 'deadline-exceeded':
                retryable = true;
                break;
            case 'resource-exhausted':
                break;
            case 'unauthenticated':
                // Trigger re-authentication
                this.handleReauthentication();
                break;
        }

        this.handleError(
            new Error(`Firebase Error (${errorCode}): ${errorMessage}`),
            { ...context, errorCode },
            { retryable, showToast: true }
        );
    }

    /**
     * Handle network errors
     */
    handleNetworkError(error: Error, context: ErrorContext = {}): void {
        const isOffline = !navigator.onLine;

        if (isOffline) {
            toast({
                title: 'Нет подключения к интернету',
                description: 'Проверьте подключение и попробуйте снова',
                variant: 'destructive'
            });
        } else {
            this.handleError(error, context, { retryable: true, maxRetries: 3 });
        }
    }

    /**
     * Handle React component errors
     */
    handleComponentError(error: Error, errorInfo: any, context: ErrorContext = {}): void {
        logger.error('React Component Error', error, { ...context, errorInfo });

        toast({
            title: 'Ошибка интерфейса',
            description: 'Страница будет перезагружена для восстановления работы',
            variant: 'destructive'
        });

        // Auto-reload after 3 seconds for component errors
        setTimeout(() => {
            window.location.reload();
        }, 3000);
    }

    /**
     * Handle memory leaks and performance issues
     */
    handlePerformanceIssue(type: 'memory-leak' | 'infinite-loop' | 'slow-render', context: ErrorContext = {}): void {
        logger.warn(`Performance Issue: ${type}`, context);

        if (type === 'infinite-loop') {
            toast({
                title: 'Обнаружена проблема производительности',
                description: 'Перезагружаем компонент...',
                variant: 'destructive'
            });

            // Force component remount by changing key
            if (context.forceRemount) {
                context.forceRemount();
            }
        }
    }

    private showErrorToast(error: Error | unknown): void {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Map common errors to user-friendly messages
        let title = 'Произошла ошибка';
        let description = 'Попробуйте еще раз или обновите страницу';

        if (errorMessage.includes('Maximum update depth exceeded')) {
            title = 'Проблема с обновлением данных';
            description = 'Перезагружаем компонент...';
        } else if (errorMessage.includes('Firebase')) {
            title = 'Ошибка синхронизации';
            description = 'Проверьте подключение к интернету';
        } else if (errorMessage.includes('Network')) {
            title = 'Проблема с сетью';
            description = 'Проверьте подключение к интернету';
        }

        toast({
            title,
            description,
            variant: 'destructive'
        });
    }

    private async handleRetry(
        errorKey: string,
        retryFunction: () => Promise<void>,
        maxRetries: number,
        retryDelay: number
    ): Promise<void> {
        const currentAttempts = this.retryAttempts.get(errorKey) || 0;

        if (currentAttempts < maxRetries) {
            this.retryAttempts.set(errorKey, currentAttempts + 1);

            // Exponential backoff
            const delay = retryDelay * Math.pow(2, currentAttempts);

            setTimeout(async () => {
                try {
                    await retryFunction();
                    this.retryAttempts.delete(errorKey); // Success, clear retry count
                } catch (retryError) {
                    this.handleError(retryError, { retryFunction }, {
                        retryable: true,
                        maxRetries,
                        retryDelay
                    });
                }
            }, delay);
        } else {
            // Max retries reached
            this.retryAttempts.delete(errorKey);
            toast({
                title: 'Не удалось выполнить операцию',
                description: 'Попробуйте обновить страницу',
                variant: 'destructive'
            });
        }
    }

    private handleReauthentication(): void {
        // Implement re-authentication logic
        toast({
            title: 'Требуется повторная авторизация',
            description: 'Перенаправляем на страницу входа...',
            variant: 'destructive'
        });

        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
    }

    /**
     * Clear retry attempts (useful for cleanup)
     */
    clearRetryAttempts(): void {
        this.retryAttempts.clear();
    }
}

// Export singleton instance
export const errorHandler = EnhancedErrorHandler.getInstance();

// Global error handlers
if (typeof window !== 'undefined') {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        errorHandler.handleError(event.reason, { component: 'Global', action: 'unhandledrejection' });
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
        errorHandler.handleError(event.error, {
            component: 'Global',
            action: 'error',
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        });
    });
}
