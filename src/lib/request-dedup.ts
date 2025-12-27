/**
 * P1 FIX: Request deduplication utility
 * Prevents duplicate API calls for the same data
 */

interface CacheEntry<T> {
  promise: Promise<T>;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

// Default TTL: 5 seconds
const DEFAULT_TTL = 5000;

/**
 * Deduplicate requests by key
 * If a request with the same key is in-flight or cached, return the existing promise
 */
export function deduplicateRequest<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  const now = Date.now();
  const cached = cache.get(key) as CacheEntry<T> | undefined;

  // Return cached promise if still valid
  if (cached && now - cached.timestamp < ttl) {
    return cached.promise;
  }

  // Create new request
  const promise = fetcher().finally(() => {
    // Clean up after TTL
    setTimeout(() => {
      const entry = cache.get(key);
      if (entry && entry.promise === promise) {
        cache.delete(key);
      }
    }, ttl);
  });

  cache.set(key, { promise, timestamp: now });
  return promise;
}

/**
 * Clear specific cache entry
 */
export function invalidateCache(key: string): void {
  cache.delete(key);
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Clear cache entries matching a pattern
 */
export function invalidateCachePattern(pattern: string | RegExp): void {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
    }
  }
}

/**
 * Hook for React components
 */
export function createCacheKey(...parts: (string | number | undefined)[]): string {
  return parts.filter(Boolean).join(':');
}

// Example usage:
// const messages = await deduplicateRequest(
//   `messages:${roomId}`,
//   () => fetchMessages(roomId),
//   10000 // 10 second TTL
// );
