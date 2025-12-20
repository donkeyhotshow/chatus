import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number) {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

type RetryOptions = {
    attempts?: number;
    timeoutMs?: number;
    backoffMs?: number;
    backoffFactor?: number;
    onRetry?: (error: unknown, attempt: number) => void;
};

/**
 * Executes async work with a soft timeout and retries.
 * Note: Firestore calls cannot be truly aborted; timeout only rejects locally.
 */
export async function withRetryAndTimeout<T>(
    fn: () => Promise<T>,
    {
        attempts = 3,
        timeoutMs = 30_000,
        backoffMs = 300,
        backoffFactor = 2,
        onRetry,
    }: RetryOptions = {}
): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        let timeoutId: NodeJS.Timeout | undefined;
        let cancelFn: (() => void) | undefined;

        const timer = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
            cancelFn = () => {
                if (timeoutId) clearTimeout(timeoutId);
            };
        });

        try {
            const result = await Promise.race([fn(), timer]);
            cancelFn?.();
            return result as T;
        } catch (error) {
            cancelFn?.();
            lastError = error;
            if (attempt < attempts) {
                onRetry?.(error, attempt);
                const waitMs = backoffMs * Math.pow(backoffFactor, attempt - 1);
                await new Promise((resolve) => setTimeout(resolve, waitMs));
                continue;
            }
            break;
        }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
