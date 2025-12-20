import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules without using variables
vi.mock('@/hooks/use-toast', () => ({
    toast: vi.fn(),
}));

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
    });

    it('exports errorHandler singleton', async () => {
        const { errorHandler } = await import('@/lib/error-handler');
        expect(errorHandler).toBeDefined();
    });

    it('exports EnhancedErrorHandler class', async () => {
        const { EnhancedErrorHandler } = await import('@/lib/error-handler');
        expect(EnhancedErrorHandler).toBeDefined();
    });

    it('getInstance returns singleton', async () => {
        const { EnhancedErrorHandler } = await import('@/lib/error-handler');
        const instance1 = EnhancedErrorHandler.getInstance();
        const instance2 = EnhancedErrorHandler.getInstance();
        expect(instance1).toBe(instance2);
    });

    it('has clearRetryAttempts method', async () => {
        const { errorHandler } = await import('@/lib/error-handler');
        expect(typeof errorHandler.clearRetryAttempts).toBe('function');
        // Should not throw
        errorHandler.clearRetryAttempts();
    });
});
