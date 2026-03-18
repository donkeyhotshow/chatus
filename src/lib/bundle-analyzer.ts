/**
 * Этап 8: Bundle Analyzer Utilities
 * Утилиты для анализа и мониторинга размера бандла в runtime
 */

import { BUNDLE_BUDGETS, PERFORMANCE_THRESHOLDS } from './performance-config';

interface ChunkInfo {
  name: string;
  size: number;
  loadTime: number;
}

interface PerformanceReport {
  chunks: ChunkInfo[];
  totalSize: number;
  loadTime: number;
  budgetViolations: string[];
  recommendations: string[];
}

// Хранилище метрик
const chunkMetrics: Map<string, ChunkInfo> = new Map();

/**
 * Регистрация загруженного чанка
 */
export function registerChunk(name: string, size: number, loadTime: number): void {
  chunkMetrics.set(name, { name, size, loadTime });

  // Проверяем бюджет
  const budget = (BUNDLE_BUDGETS as Record<string, number>)[name];
  if (budget && size > budget * 1024) {
    console.warn(
      `[Bundle] Chunk "${name}" exceeds budget: ${(size / 1024).toFixed(1)}KB > ${budget}KB`
    );
  }
}

/**
 * Получение отчёта о производительности бандла
 */
export function getBundleReport(): PerformanceReport {
  const chunks = Array.from(chunkMetrics.values());
  const totalSize = chunks.reduce((sum, c) => sum + c.size, 0);
  const loadTime = Math.max(...chunks.map(c => c.loadTime), 0);

  const budgetViolations: string[] = [];
  const recommendations: string[] = [];

  // Проверяем нарушения бюджета
  chunks.forEach(chunk => {
    const budget = (BUNDLE_BUDGETS as Record<string, number>)[chunk.name];
    if (budget && chunk.size > budget * 1024) {
      budgetViolations.push(
        `${chunk.name}: ${(chunk.size / 1024).toFixed(1)}KB (budget: ${budget}KB)`
      );
    }
  });

  // Генерируем рекомендации
  if (totalSize > BUNDLE_BUDGETS.initialLoad * 1024) {
    recommendations.push('Consider code splitting for initial load');
  }

  if (loadTime > PERFORMANCE_THRESHOLDS.tti) {
    recommendations.push('Optimize critical rendering path');
  }

  return {
    chunks,
    totalSize,
    loadTime,
    budgetViolations,
    recommendations,
  };
}

/**
 * Измерение времени загрузки динамического импорта
 */
export async function measureDynamicImport<T>(
  importFn: () => Promise<T>,
  chunkName: string
): Promise<T> {
  const start = performance.now();

  try {
    const loadedModule = await importFn();
    const loadTime = performance.now() - start;

    // Оцениваем размер (приблизительно)
    const estimatedSize = JSON.stringify(loadedModule).length;
    registerChunk(chunkName, estimatedSize, loadTime);

    return loadedModule;
  } catch (error) {
    console.error(`[Bundle] Failed to load chunk "${chunkName}":`, error);
    throw error;
  }
}

/**
 * HOC для измерения загрузки lazy компонентов
 */
export function withLoadMetrics<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  chunkName: string
): () => Promise<{ default: T }> {
  return async () => {
    const start = performance.now();
    const loadedModule = await importFn();
    const loadTime = performance.now() - start;

    // Логируем метрики в dev режиме
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Bundle] Loaded "${chunkName}" in ${loadTime.toFixed(1)}ms`);
    }

    return loadedModule;
  };
}

/**
 * Анализ использования памяти
 */
export function getMemoryUsage(): { used: number; total: number; percent: number } | null {
  if (typeof performance === 'undefined') return null;

  const memory = (performance as any).memory;
  if (!memory) return null;

  return {
    used: memory.usedJSHeapSize,
    total: memory.totalJSHeapSize,
    percent: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
  };
}

/**
 * Мониторинг Long Tasks
 */
export function observeLongTasks(callback: (duration: number) => void): () => void {
  if (typeof PerformanceObserver === 'undefined') return () => {};

  try {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 50) { // Long task threshold
          callback(entry.duration);
        }
      });
    });

    observer.observe({ entryTypes: ['longtask'] });

    return () => observer.disconnect();
  } catch (e) {
    if (process.env.NODE_ENV === 'development') console.warn('[bundle-analyzer] observeLongTasks unavailable:', e);
    return () => {};
  }
}

/**
 * Получение Core Web Vitals
 */
export async function getCoreWebVitals(): Promise<{
  lcp: number | null;
  fid: number | null;
  cls: number | null;
}> {
  const vitals = {
    lcp: null as number | null,
    fid: null as number | null,
    cls: null as number | null,
  };

  if (typeof PerformanceObserver === 'undefined') return vitals;

  // LCP
  try {
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      vitals.lcp = lcpEntries[lcpEntries.length - 1].startTime;
    }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') console.warn('[bundle-analyzer] LCP unavailable:', e);
  }

  // CLS
  try {
    const clsEntries = performance.getEntriesByType('layout-shift') as unknown as { hadRecentInput: boolean; value: number }[];
    vitals.cls = clsEntries
      .filter(entry => !entry.hadRecentInput)
      .reduce((sum, entry) => sum + entry.value, 0);
  } catch (e) {
    if (process.env.NODE_ENV === 'development') console.warn('[bundle-analyzer] CLS unavailable:', e);
  }

  return vitals;
}

/**
 * Логирование производительности в консоль (dev only)
 */
export function logPerformanceReport(): void {
  if (process.env.NODE_ENV !== 'development') return;

  const report = getBundleReport();
  const memory = getMemoryUsage();

  console.group('📊 Performance Report');

  console.log('Chunks loaded:', report.chunks.length);
  console.log('Total size:', (report.totalSize / 1024).toFixed(1), 'KB');
  console.log('Load time:', report.loadTime.toFixed(1), 'ms');

  if (memory) {
    console.log('Memory:', (memory.used / 1024 / 1024).toFixed(1), 'MB /',
                (memory.total / 1024 / 1024).toFixed(1), 'MB',
                `(${memory.percent.toFixed(1)}%)`);
  }

  if (report.budgetViolations.length > 0) {
    console.warn('Budget violations:', report.budgetViolations);
  }

  if (report.recommendations.length > 0) {
    console.info('Recommendations:', report.recommendations);
  }

  console.groupEnd();
}
