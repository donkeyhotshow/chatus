/**
 * Этап 8: Performance Curation
 * Централизованная конфигурация для оптимизации производительности
 */

// Bundle size budgets (в KB)
export const BUNDLE_BUDGETS = {
  // Критические чанки
  framework: 150,      // React, Next.js
  main: 100,           // Главный бандл

  // Lazy-loaded чанки
  firebase: 200,       // Firebase SDK
  animations: 80,      // Framer Motion
  radixUi: 100,        // Radix UI компоненты
  games: 150,          // Игровые компоненты
  canvas: 100,         // Canvas компоненты

  // Общий бюджет первой загрузки
  initialLoad: 300,    // Максимум для первой загрузки
} as const;

// Приоритеты загрузки ресурсов
export const RESOURCE_PRIORITIES = {
  critical: ['framework', 'main', 'styles'],
  high: ['firebase-auth', 'chat-core'],
  medium: ['canvas', 'games-lobby'],
  low: ['games-full', 'analytics', 'animations'],
} as const;

// Конфигурация кэширования
export const CACHE_CONFIG = {
  // Service Worker cache
  staticAssets: {
    maxAge: 60 * 60 * 24 * 30, // 30 дней
    strategy: 'cache-first' as const,
  },
  apiResponses: {
    maxAge: 60 * 5, // 5 минут
    strategy: 'network-first' as const,
  },
  images: {
    maxAge: 60 * 60 * 24 * 7, // 7 дней
    strategy: 'cache-first' as const,
  },

  // React Query cache
  queries: {
    staleTime: 1000 * 60 * 5, // 5 минут
    gcTime: 1000 * 60 * 30,   // 30 минут (garbage collection)
  },

  // LocalStorage cache keys
  storageKeys: {
    userPrefs: 'user-preferences',
    roomCache: 'room-cache',
    messageCache: 'message-cache',
  },
} as const;

// Конфигурация prefetch/preload
export const PREFETCH_CONFIG = {
  // Компоненты для предзагрузки при idle
  idlePreload: [
    'firebase/firestore',
    'firebase/database',
  ],

  // Компоненты для предзагрузки при hover
  hoverPreload: {
    canvas: ['@/components/canvas/SharedCanvas'],
    games: ['@/components/games/GameLobby'],
    chat: ['@/components/chat/MessageSearch'],
  },

  // Задержки для предзагрузки (мс)
  delays: {
    idle: 2000,
    hover: 100,
    intersection: 500,
  },
} as const;

// Конфигурация виртуализации
export const VIRTUALIZATION_CONFIG = {
  messages: {
    overscan: 5,           // Количество элементов за пределами viewport
    estimatedSize: 80,     // Примерная высота сообщения
    threshold: 50,         // Минимум сообщений для включения виртуализации
  },
  userList: {
    overscan: 3,
    estimatedSize: 56,
    threshold: 20,
  },
} as const;

// Конфигурация дебаунса/троттлинга
export const TIMING_CONFIG = {
  // Дебаунс
  debounce: {
    search: 300,
    resize: 150,
    scroll: 100,
    input: 200,
  },

  // Троттлинг
  throttle: {
    scroll: 16,      // ~60fps
    mousemove: 50,
    canvasDraw: 16,
    presence: 5000,
  },

  // Таймауты
  timeout: {
    api: 10000,
    connection: 5000,
    animation: 300,
  },
} as const;

// Метрики производительности (пороги)
export const PERFORMANCE_THRESHOLDS = {
  // Core Web Vitals
  lcp: 2500,    // Largest Contentful Paint (мс)
  fid: 100,     // First Input Delay (мс)
  cls: 0.1,     // Cumulative Layout Shift

  // Дополнительные метрики
  ttfb: 800,    // Time to First Byte (мс)
  fcp: 1800,    // First Contentful Paint (мс)
  tti: 3800,    // Time to Interactive (мс)

  // Кастомные метрики
  chatReady: 2000,     // Время до готовности чата
  messageRender: 50,   // Время рендера сообщения
  tabSwitch: 200,      // Время переключения вкладки
} as const;

// Feature flags для оптимизаций
export const OPTIMIZATION_FLAGS = {
  // Включенные оптимизации
  lazyLoadImages: true,
  virtualizeMessages: true,
  prefetchOnHover: true,
  cacheQueries: true,
  compressImages: true,

  // Экспериментальные
  useOffscreenCanvas: false,
  useSharedWorker: false,
  useWebGL: false,
} as const;

// Утилита для проверки медленного соединения
export function isSlowConnection(): boolean {
  if (typeof navigator === 'undefined') return false;

  const connection = (navigator as any).connection;
  if (!connection) return false;

  // Slow 2G, 2G, или saveData включен
  return (
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g' ||
    connection.saveData === true
  );
}

// Утилита для проверки low-end устройства
export function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;

  // Проверяем количество ядер CPU
  const cores = navigator.hardwareConcurrency || 4;

  // Проверяем память (если доступно)
  const memory = (navigator as any).deviceMemory || 4;

  return cores <= 2 || memory <= 2;
}

// Получить оптимальные настройки для устройства
export function getOptimalSettings() {
  const slow = isSlowConnection();
  const lowEnd = isLowEndDevice();

  return {
    // Уменьшаем качество для слабых устройств
    imageQuality: slow || lowEnd ? 60 : 85,

    // Отключаем анимации для слабых устройств
    enableAnimations: !lowEnd,

    // Уменьшаем overscan для виртуализации
    virtualizationOverscan: lowEnd ? 2 : 5,

    // Увеличиваем дебаунс для медленных соединений
    debounceMultiplier: slow ? 2 : 1,

    // Отключаем prefetch для медленных соединений
    enablePrefetch: !slow,

    // Уменьшаем количество сообщений в batch
    messageBatchSize: slow ? 10 : 25,
  };
}
