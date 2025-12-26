/**
 * Rate Limiter - Защита от спама и злоупотреблений
 *
 * Клиентский rate limiter для защиты
 * - Спама сообщений
 * - Быстрых повторных действий
 * - DoS атак на Firebase
 */

interface RateLimitConfig {
    /** Максимальное количество действий */
    maxActions: number;
    /** Временное окно в миллисекундах */
    windowMs: number;
    /** Время блокировки при превышении лимита (мс) */
    blockDurationMs?: number;
}

interface RateLimitState {
    actions: number[];
    blockedUntil: number | null;
}

const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
    message: { maxActions: 10, windowMs: 10000, blockDurationMs: 30000 }, // 10 сообщений за 10 сек
    gameAction: { maxActions: 30, windowMs: 5000, blockDurationMs: 5000 }, // 30 действий за 5 сек
    canvasDraw: { maxActions: 100, windowMs: 1000 }, // 100 точек в секунду
    apiCall: { maxActions: 20, windowMs: 60000, blockDurationMs: 60000 }, // 20 API вызовов в минуту
};

class RateLimiter {
    private states: Map<string, RateLimitState> = new Map();
    private configs: Map<string, RateLimitConfig> = new Map();

    constructor() {
        // Initialize default configs
        Object.entries(DEFAULT_CONFIGS).forEach(([key, config]) => {
            this.configs.set(key, config);
        });
    }

    /**
     * Регистрирует кастомный лимит
     */
    registerLimit(name: string, config: RateLimitConfig): void {
        this.configs.set(name, config);
    }

    /**
     * Проверяет, можно ли выполнить действие
     * @returns true если действие разрешено, false если заблокировано
     */
    canPerform(limitName: string, userId?: string): boolean {
        const key = userId ? `${limitName}:${userId}` : limitName;
        const config = this.configs.get(limitName);

        if (!config) {
            console.warn(`[RateLimiter] Unknown limit: ${limitName}`);
            return true;
        }

        const now = Date.now();
        let state = this.states.get(key);

        if (!state) {
            state = { actions: [], blockedUntil: null };
            this.states.set(key, state);
        }

        // Check if blocked
        if (state.blockedUntil && now < state.blockedUntil) {
            return false;
        }

        // Clear block if expired
        if (state.blockedUntil && now >= state.blockedUntil) {
            state.blockedUntil = null;
            state.actions = [];
        }

        // Clean old actions outside window
        state.actions = state.actions.filter(time => now - time < config.windowMs);

        // Check limit
        if (state.actions.length >= config.maxActions) {
            if (config.blockDurationMs) {
                state.blockedUntil = now + config.blockDurationMs;
            }
            return false;
        }

        return true;
    }

    /**
     * Записывает выполненное действие
     */
    recordAction(limitName: string, userId?: string): void {
        const key = userId ? `${limitName}:${userId}` : limitName;
        let state = this.states.get(key);

        if (!state) {
            state = { actions: [], blockedUntil: null };
            this.states.set(key, state);
        }

        state.actions.push(Date.now());
    }

    /**
     * Проверяет и записывает действие за один вызов
     * @returns true если действие выполнено, false если заблокировано
     */
    tryPerform(limitName: string, userId?: string): boolean {
        if (!this.canPerform(limitName, userId)) {
            return false;
        }
        this.recordAction(limitName, userId);
        return true;
    }

    /**
     * Возвращает время до разблокировки в мс (0 если не заблокирован)
     */
    getBlockTimeRemaining(limitName: string, userId?: string): number {
        const key = userId ? `${limitName}:${userId}` : limitName;
        const state = this.states.get(key);

        if (!state?.blockedUntil) return 0;

        const remaining = state.blockedUntil - Date.now();
        return remaining > 0 ? remaining : 0;
    }

    /**
     * Возвращает количество оставшихся действий
     */
    getRemainingActions(limitName: string, userId?: string): number {
        const key = userId ? `${limitName}:${userId}` : limitName;
        const config = this.configs.get(limitName);
        const state = this.states.get(key);

        if (!config) return Infinity;
        if (!state) return config.maxActions;

        const now = Date.now();
        const recentActions = state.actions.filter(time => now - time < config.windowMs);

        return Math.max(0, config.maxActions - recentActions.length);
    }

    /**
     * Сбрасывает состояние для конкретного лимита
     */
    reset(limitName: string, userId?: string): void {
        const key = userId ? `${limitName}:${userId}` : limitName;
        this.states.delete(key);
    }

    /**
     * Сбрасывает все состояния
     */
    resetAll(): void {
        this.states.clear();
    }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

/**
 * React hook для использования rate limiter
 */
export function useRateLimiter(limitName: string, userId?: string) {
    return {
        canPerform: () => rateLimiter.canPerform(limitName, userId),
        tryPerform: () => rateLimiter.tryPerform(limitName, userId),
        getBlockTimeRemaining: () => rateLimiter.getBlockTimeRemaining(limitName, userId),
        getRemainingActions: () => rateLimiter.getRemainingActions(limitName, userId),
        reset: () => rateLimiter.reset(limitName, userId),
    };
}

/**
 * HOC для защиты функций rate limiter'ом
 */
export function withRateLimit<T extends (...args: unknown[]) => unknown>(
    fn: T,
    limitName: string,
    userId?: string
): T {
    return ((...args: unknown[]) => {
        if (!rateLimiter.tryPerform(limitName, userId)) {
            const remaining = rateLimiter.getBlockTimeRemaining(limitName, userId);
            console.warn(`[RateLimiter] Action blocked. Try again in ${Math.ceil(remaining / 1000)}s`);
            return undefined;
        }
        return fn(...args);
    }) as T;
}

export default rateLimiter;
