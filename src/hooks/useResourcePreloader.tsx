/**
 * Этап 8: Resource Preloader Hook
 * Умная предзагрузка ресурсов на основе поведения пользователя
 */

import { useEffect, useCallback, useRef } from 'react';
import { PREFETCH_CONFIG, isSlowConnection } from '@/lib/performance-config';

type PreloadPriority = 'critical' | 'high' | 'medium' | 'low';

interface PreloadOptions {
  priority?: PreloadPriority;
  delay?: number;
}

// Кэш загруженных модулей
const loadedModules = new Set<string>();
const pendingLoads = new Map<string, Promise<unknown>>();

/**
 * Предзагрузка модуля с дедупликацией
 */
async function preloadModule(modulePath: string): Promise<void> {
  if (loadedModules.has(modulePath)) return;

  // Проверяем, не загружается ли уже
  if (pendingLoads.has(modulePath)) {
    await pendingLoads.get(modulePath);
    return;
  }

  const loadPromise = import(/* webpackPrefetch: true */ modulePath)
    .then(() => {
      loadedModules.add(modulePath);
      pendingLoads.delete(modulePath);
    })
    .catch((err) => {
      pendingLoads.delete(modulePath);
      console.warn(`Failed to preload ${modulePath}:`, err);
    });

  pendingLoads.set(modulePath, loadPromise);
  await loadPromise;
}

/**
 * Предзагрузка компонентов при idle
 */
function preloadOnIdle(modules: readonly string[]): void {
  if (typeof window === 'undefined') return;
  if (isSlowConnection()) return; // Не предзагружаем на медленном соединении

  const callback = () => {
    modules.forEach(modulePath => {
      preloadModule(modulePath);
    });
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout: PREFETCH_CONFIG.delays.idle });
  } else {
    setTimeout(callback, PREFETCH_CONFIG.delays.idle);
  }
}

/**
 * Hook для предзагрузки ресурсов
 */
export function useResourcePreloader() {
  const preloadedRef = useRef(new Set<string>());

  // Предзагрузка при монтировании (idle)
  useEffect(() => {
    preloadOnIdle(PREFETCH_CONFIG.idlePreload);
  }, []);

  /**
   * Предзагрузка при hover
   */
  const preloadOnHover = useCallback((category: keyof typeof PREFETCH_CONFIG.hoverPreload) => {
    if (isSlowConnection()) return;

    const modules = PREFETCH_CONFIG.hoverPreload[category];
    if (!modules) return;

    // Задержка для предотвращения случайных загрузок
    const timeoutId = setTimeout(() => {
      modules.forEach(modulePath => {
        if (!preloadedRef.current.has(modulePath)) {
          preloadedRef.current.add(modulePath);

          // Динамический импорт с prefetch hint
          switch (modulePath) {
            case '@/components/canvas/SharedCanvas':
              import('@/components/canvas/SharedCanvas');
              break;
            case '@/components/games/GameLobby':
              import('@/components/games/GameLobby');
              break;
            case '@/components/chat/MessageSearch':
              import('@/components/chat/MessageSearch');
              break;
          }
        }
      });
    }, PREFETCH_CONFIG.delays.hover);

    return () => clearTimeout(timeoutId);
  }, []);

  /**
   * Предзагрузка изображения
   */
  const preloadImage = useCallback((src: string, options?: PreloadOptions): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (isSlowConnection() && options?.priority !== 'critical') {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  /**
   * Предзагрузка шрифта
   */
  const preloadFont = useCallback((fontFamily: string): Promise<void> => {
    if (typeof document === 'undefined') return Promise.resolve();

    return document.fonts.load(`1em ${fontFamily}`).then(() => {});
  }, []);

  /**
   * Предзагрузка данных через link prefetch
   */
  const prefetchData = useCallback((url: string): void => {
    if (typeof document === 'undefined') return;
    if (isSlowConnection()) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'fetch';
    document.head.appendChild(link);
  }, []);

  return {
    preloadOnHover,
    preloadImage,
    preloadFont,
    prefetchData,
    isModuleLoaded: (path: string) => loadedModules.has(path),
  };
}

/**
 * Hook для предзагрузки при intersection (появлении в viewport)
 */
export function useIntersectionPreloader(
  ref: React.RefObject<HTMLElement | null>,
  onIntersect: () => void,
  options?: IntersectionObserverInit
) {
  useEffect(() => {
    if (!ref.current || isSlowConnection()) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setTimeout(onIntersect, PREFETCH_CONFIG.delays.intersection);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px',
        threshold: 0,
        ...options,
      }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref, onIntersect, options]);
}

/**
 * Компонент-обёртка для предзагрузки при hover
 */
export function withHoverPreload<P extends object>(
  Component: React.ComponentType<P>,
  preloadCategory: keyof typeof PREFETCH_CONFIG.hoverPreload
) {
  return function PreloadWrapper(props: P) {
    const { preloadOnHover } = useResourcePreloader();

    return (
      <div onMouseEnter={() => preloadOnHover(preloadCategory)}>
        <Component {...props} />
      </div>
    );
  };
}
