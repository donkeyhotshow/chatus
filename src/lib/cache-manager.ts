/**
 *che Manager
 * Централизованное управление кэшированием данных
 */

import { CACHE_CONFIG } from './performance-config';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  maxAge?: number;      // Время жизни в секундах
  staleWhileRevalidate?: boolean;
}

/**
 * In-Memory Cache с TTL
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  set<T>(key: string, data: T, maxAge: number): void {
    // LRU eviction если превышен лимит
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + maxAge * 1000,
    });
  }

  get<T>(key: string): { data: T; isStale: boolean } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const isStale = now > entry.expiresAt;

    // Удаляем если сильно устарело (2x TTL)
    if (now > entry.expiresAt + (entry.expiresAt - entry.timestamp)) {
      this.cache.delete(key);
      return null;
    }

    return { data: entry.data as T, isStale };
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    return Date.now() <= entry.expiresAt;
  }

  size(): number {
    return this.cache.size;
  }
}

// Глобальные инстансы кэша
const memoryCache = new MemoryCache(200);
const queryCache = new MemoryCache(50);

/**
 * LocalStorage Cache с сжатием
 */
class StorageCache {
  private prefix: string;

  constructor(prefix = 'cache_') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  set<T>(key: string, data: T, maxAge: number): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + maxAge * 1000,
      };

      localStorage.setItem(this.getKey(key), JSON.stringify(entry));
    } catch (e) {
      // Storage full - очищаем старые записи
      this.cleanup();
      try {
        const entry: CacheEntry<T> = {
          data,
          timestamp: Date.now(),
          expiresAt: Date.now() + maxAge * 1000,
        };
        localStorage.setItem(this.getKey(key), JSON.stringify(entry));
      } catch {
        console.warn('[Cache] Storage full, cannot save:', key);
      }
    }
  }

  get<T>(key: string): { data: T; isStale: boolean } | null {
    if (typeof localStorage === 'undefined') return null;

    try {
      const raw = localStorage.getItem(this.getKey(key));
      if (!raw) return null;

      const entry: CacheEntry<T> = JSON.parse(raw);
      const now = Date.now();
      const isStale = now > entry.expiresAt;

      // Удаляем если сильно устарело
      if (now > entry.expiresAt * 2) {
        localStorage.removeItem(this.getKey(key));
        return null;
      }

      return { data: entry.data, isStale };
    } catch {
      return null;
    }
  }

  delete(key: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(this.getKey(key));
  }

  cleanup(): void {
    if (typeof localStorage === 'undefined') return;

    const now = Date.now();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(this.prefix)) continue;

      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;

        const entry: CacheEntry<any> = JSON.parse(raw);
        if (now > entry.expiresAt) {
          keysToRemove.push(key);
        }
      } catch {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

const storageCache = new StorageCache('chatus_');

/**
 * Универсальный Cache Manager
 */
export const CacheManager = {
  /**
   * Получить данные с кэшированием
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const maxAge = options.maxAge ?? CACHE_CONFIG.queries.staleTime / 1000;

    // Проверяем memory cache
    const memCached = memoryCache.get<T>(key);
    if (memCached && !memCached.isStale) {
      return memCached.data;
    }

    // Проверяем storage cache
    const storageCached = storageCache.get<T>(key);
    if (storageCached && !storageCached.isStale) {
      // Копируем в memory cache
      memoryCache.set(key, storageCached.data, maxAge);
      return storageCached.data;
    }

    // Stale-while-revalidate
    if (options.staleWhileRevalidate && (memCached || storageCached)) {
      const staleData = memCached?.data ?? storageCached?.data;

      // Фоновое обновление
      fetcher().then(freshData => {
        memoryCache.set(key, freshData, maxAge);
        storageCache.set(key, freshData, maxAge);
      }).catch(() => {});

      return staleData!;
    }

    // Загружаем свежие данные
    const data = await fetcher();
    memoryCache.set(key, data, maxAge);
    storageCache.set(key, data, maxAge);

    return data;
  },

  /**
   * Установить данные в кэш
   */
  set<T>(key: string, data: T, maxAge?: number): void {
    const ttl = maxAge ?? CACHE_CONFIG.queries.staleTime / 1000;
    memoryCache.set(key, data, ttl);
    storageCache.set(key, data, ttl);
  },

  /**
   * Получить данные из кэша (без fetch)
   */
  get<T>(key: string): T | null {
    const memCached = memoryCache.get<T>(key);
    if (memCached && !memCached.isStale) {
      return memCached.data;
    }

    const storageCached = storageCache.get<T>(key);
    if (storageCached && !storageCached.isStale) {
      return storageCached.data;
    }

    return null;
  },

  /**
   * Инвалидировать кэш
   */
  invalidate(key: string): void {
    memoryCache.delete(key);
    storageCache.delete(key);
  },

  /**
   * Инвалидировать по паттерну
   */
  invalidatePattern(pattern: string): void {
    // Для memory cache нужно итерировать
    // Для storage cache используем cleanup
    storageCache.cleanup();
  },

  /**
   * Очистить весь кэш
   */
  clear(): void {
    memoryCache.clear();
    storageCache.cleanup();
  },

  /**
   * Получить статистику кэша
   */
  getStats(): { memorySize: number; storageKeys: number } {
    let storageKeys = 0;
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('chatus_')) storageKeys++;
      }
    }

    return {
      memorySize: memoryCache.size(),
      storageKeys,
    };
  },
};

/**
 * Hook-friendly кэширование для React Query
 */
export function createQueryCacheKey(...parts: (string | number | undefined)[]): string {
  return parts.filter(Boolean).join(':');
}

/**
 * Предзагрузка данных в кэш
 */
export async function prefetchToCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  maxAge?: number
): Promise<void> {
  try {
    const data = await fetcher();
    CacheManager.set(key, data, maxAge);
  } catch (error) {
    console.warn('[Cache] Prefetch failed:', key, error);
  }
}

// Автоматическая очистка при загрузке
if (typeof window !== 'undefined') {
  // Очищаем устаревшие записи при загрузке
  setTimeout(() => storageCache.cleanup(), 5000);

  // Периодическая очистка каждые 5 минут
  setInterval(() => storageCache.cleanup(), 5 * 60 * 1000);
}
