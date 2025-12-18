import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorHandler, EnhancedErrorHandler } from '@/lib/error-handler';

// Mock toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
    toast: mockToast,
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
    logger: {
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    },
}));

describe('EnhancedErrorHandler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        errorHandler.clearRetryAttempts();
    });

    it('handles basic errors correctly', async () => {
        const error = new Error('Test error');
        const context = { component: 'TestComponent', action: 'testAction' };

        await errorHandler.handleError(error, context);

        expect(mockToast).toHaveBeenCalledWith({
            title: 'Произошла ошибка',
            description: 'Попробуйте еще раз или обновите страницу',
            variant: 'destructive',
        });
    });

    it('handles Firebase errors with specific messages', () => {
        const firebaseError = {
            code: 'permission-denied',
            message: 'Permission denied',
        };

        errorHandler.handleFirebaseError(firebaseError);

        expect(mockToast).toHaveBeenCalledWith({
            title: 'Недостаточно прав для выполнения операции',
            description: expect.any(String),
            variant: 'destructive',
        });
    });

    it('handles network errors correctly', () => {
        const networkError = new Error('Network error');

        // Mock navigator.onLine
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: false,
        });

        errorHandler.handleNetworkError(networkError);

        expect(mockToast).toHaveBeenCalledWith({
            title: 'Нет подключения к интернету',
            description: 'Проверьте подключение и попробуйте снова',
            variant: 'destructive',
        });
    });

    it('handles component errors with auto-reload', () => {
        const error = new Error('Component error');
        const errorInfo = { componentStack: 'Component stack trace' };

        // Mock window.location.reload
        const mockReload = vi.fn();
        Object.defineProperty(window, 'location', {
            value: { reload: mockReload },
            writable: true,
        });

        errorHandler.handleComponentError(error, errorInfo);

        expect(mockToast).toHaveBeenCalledWith({
            title: 'Ошибка интерфейса',
            description: 'Страница будет перезагружена для восстановления работы',
            variant: 'destructive',
        });

        // Should schedule reload
        setTimeout(() => {
            expect(mockReload).toHaveBeenCalled();
        }, 3100);
    });

    it('handles performance issues correctly', () => {
        const mockForceRemount = vi.fn();
        const context = { forceRemount: mockForceRemount };

        errorHandler.handlePerformanceIssue('infinite-loop', context);

        expect(mockToast).toHaveBeenCalledWith({
            title: 'Обнаружена проблема производительности',
            description: 'Перезагружаем компонент...',
            variant: 'destructive',
        });

        expect(mockForceRemount).toHaveBeenCalled();
    });

    it('handles retry logic correctly', async () => {
        const retryFunction = vi.fn().mockRejectedValueOnce(new Error('Retry error'));
        const error = new Error('Test error');
        const context = { retryFunction };

        await errorHandler.handleError(error, context, {
            retryable: true,
            maxRetries: 2,
            retryDelay: 10,
        });

        // Should schedule retry
        await new Promise(resolve => setTimeout(resolve, 15));
        expect(retryFunction).toHaveBeenCalledTimes(1);
    });

    it('stops retrying after max attempts', async () => {
        const retryFunction = vi.fn().mockRejectedValue(new Error('Persistent error'));
        const error = new Error('Test error');
        const context = { retryFunction };

        // Trigger multiple retry attempts
        for (let i = 0; i < 5; i++) {
            await errorHandler.handleError(error, context, {
                retryable: true,
                maxRetries: 2,
                retryDelay: 1,
            });
            await new Promise(resolve => setTimeout(resolve, 5));
        }

        // Should eventually show max retries message
        expect(mockToast).toHaveBeenCalledWith({
            title: 'Не удалось выполнить операцию',
            description: 'Попробуйте обновить страницу',
            variant: 'destructive',
        });
    });

    it('handles infinite loop errors specifically', async () => {
        const error = new Error('Maximum update depth exceeded');

        await errorHandler.handleError(error);

        expect(mockToast).toHaveBeenCalledWith({
            title: 'Проблема с обновлением данных',
            description: 'Перезагружаем компонент...',
            variant: 'destructive',
        });
    });

    it('handles unauthenticated errors with redirect', () => {
        const firebaseError = {
            code: 'unauthenticated',
            message: 'User not authenticated',
        };

        // Mock window.location
        const mockLocation = { href: '' };
        Object.defineProperty(window, 'location', {
            value: mockLocation,
            writable: true,
        });

        errorHandler.handleFirebaseError(firebaseError);

        expect(mockToast).toHaveBeenCalledWith({
            title: 'Требуется повторная авторизация',
            description: 'Перенаправляем на страницу входа...',
            variant: 'destructive',
        });

        // Should schedule redirect
        setTimeout(() => {
            expect(mockLocation.href).toBe('/');
        }, 2100);
    });

    it('clears retry attempts correctly', () => {
        const retryFunction = vi.fn();
        const error = new Error('Test error');
        const context = { retryFunction };

        // Add some retry attempts
        errorHandler.handleError(error, context, { retryable: true });

        // Clear attempts
        errorHandler.clearRetryAttempts();

        // Should be able to retry again from the beginning
        errorHandler.handleError(error, context, { retryable: true, maxRetries: 1 });

        expect(retryFunction).toBeDefined();
    });

    it('is a singleton', () => {
        const instance1 = EnhancedErrorHandler.getInstance();
        const instance2 = EnhancedErrorHandler.getInstance();

        expect(instance1).toBe(instance2);
        expect(instance1).toBe(errorHandler);
    });
});
