# ChatUs Performance Optimization Plan

## 📊 Текущий анализ

### Что уже хорошо реано ✅
1. **Lazy Loading** - компоненты в `LazyComponents.tsx` с preload функциями
2. **Виртуализация** - `react-virtuoso` для списка сообщений
3. **Code Splitting** - webpack конфиг с разделением на chunks
4. **Error Boundaries** - базовая реализация
5. **Service Worker** - PWA с кэшированием
6. **Performance Hooks** - `use-performance.ts` для Web Vitals
7. **Canvas Stabilizer** - throttling для рисования
8. **Image Optimization** - Next.js Image с AVIF/WebP

### Проблемы найденные в коде ⚠️
1. **Bundle Size** - много тяжелых зависимостей (three.js, framer-motion, firebase)
2. **Canvas** - нет OffscreenCanvas, перерисовка всего при каждом кадре
3. **Memory Leaks** - потенциальные утечки в canvas subscriptions
4. **Re-renders** - ChatRoom не оптимизирован с memo
5. **WebSocket** - нет batching для cursor updates
6. **Error Handling** - ошибка "Что-то пошло не так" без детализации

---

## 🎯 Performance Targets

| Метрика | Текущее (оценка) | Цель |
|---------|------------------|------|
| LCP | ~3-4s | < 2.5s |
| FID | ~150ms | < 100ms |
| CLS | ~0.15 | < 0.1 |
| INP | ~250ms | < 200ms |
| Initial JS | ~400KB | < 200KB |
| TTI | ~5s | < 3s |

---

## 📋 Prioritized Action Plan

### P0 - Critical (1-2 дня)

#### 1. Fix Error Boundary Coverage
```tsx
// src/components/ErrorBoundaryWrapper.tsx - обновить
import { ErrorBoundary, GameErrorBoundary } from './ErrorBoundary';

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string,
  isGame = false
) {
  const Boundary = isGame ? GameErrorBoundary : ErrorBoundary;

  return function WrappedComponent(props: P) {
    return (
      <Boundary
        componentName={componentName}
        onError={(error, info) => {
          // Send to Sentry/analytics
          console.error(`[${componentName}]`, error, info);
        }}
      >
        <Component {...props} />
      </Boundary>
    );
  };
}
```

#### 2. Add React.memo to Heavy Components
```tsx
// src/components/chat/MessageItem.tsx
export const MessageItem = memo(function MessageItem({ ... }) {
  // existing code
}, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.text === nextProps.message.text &&
    prevProps.isOwn === nextProps.isOwn
  );
});
```

#### 3. Debounce Canvas Cursor Updates
```tsx
// src/components/canvas/SharedCanvas.tsx
import { useDebouncedCallback } from 'use-debounce';

// Inside component:
const debouncedCursorUpdate = useDebouncedCallback(
  (x: number, y: number, color: string) => {
    realtimeServiceRef.current?.updateCursor(x, y, color);
  },
  16 // ~60fps max
);
```

#### 4. Fix Memory Leak in Canvas
```tsx
// Add cleanup in useEffect
useEffect(() => {
  return () => {
    // Clear all refs
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    if (batcherRef.current) {
      batcherRef.current.flush();
    }
    // Clear large data structures
    setRealtimePaths(new Map());
    setRemoteCursors(new Map());
  };
}, []);
```

---

### P1 - High Priority (3-5 дней)

#### 5. Implement OffscreenCanvas
```tsx
// src/lib/offscreen-canvas.ts
export function createOffscreenRenderer(width: number, height: number) {
  if (typeof OffscreenCanvas !== 'undefined') {
    const offscreen = new OffscreenCanvas(width, height);
    const ctx = offscreen.getContext('2d');
    return { canvas: offscreen, ctx, isOffscreen: true };
  }
  // Fallback for Safari
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return { canvas, ctx: canvas.getContext('2d'), isOffscreen: false };
}
```

#### 6. Optimize Firebase Bundle
```tsx
// src/lib/firebase-lazy.ts
export async function getFirestore() {
  const { getFirestore } = await import('firebase/firestore');
  return getFirestore;
}

export async function getRealtimeDB() {
  const { getDatabase } = await import('firebase/database');
  return getDatabase;
}
```

#### 7. Add Request Deduplication
```tsx
// src/hooks/useDeduplicatedQuery.ts
const queryCache = new Map<string, Promise<any>>();

export function useDeduplicatedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 5000
) {
  const cached = queryCache.get(key);
  if (cached) return cached;

  const promise = fetcher().finally(() => {
    setTimeout(() => queryCache.delete(key), ttl);
  });

  queryCache.set(key, promise);
  return promise;
}
```

#### 8. Batch WebSocket Messages
```tsx
// src/services/RealtimeCanvasService.ts
class MessageBatcher {
  private queue: any[] = [];
  private timeout: NodeJS.Timeout | null = null;

  add(message: any) {
    this.queue.push(message);
    if (!this.timeout) {
      this.timeout = setTimeout(() => this.flush(), 50);
    }
  }

  flush() {
    if (this.queue.length > 0) {
      // Send batched messages
      this.sendBatch(this.queue);
      this.queue = [];
    }
    this.timeout = null;
  }
}
```

---

### P2 - Medium Priority (1 неделя)

#### 9. Implement React Query for Caching
```tsx
// src/hooks/useMessages.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useMessages(roomId: string) {
  return useQuery({
    queryKey: ['messages', roomId],
    queryFn: () => fetchMessages(roomId),
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });
}
```

#### 10. Add Skeleton Screens Everywhere
```tsx
// src/components/ui/skeletons/index.ts
export { ChatSkeleton } from './ChatSkeleton';
export { GamesSkeleton } from './GamesSkeleton';
export { CanvasSkeleton } from './CanvasSkeleton';
export { ProfileSkeleton } from './ProfileSkeleton';
```

#### 11. Optimize Images with Blur Placeholders
```tsx
// src/components/ui/optimized-image.tsx
import Image from 'next/image';

export function OptimizedImage({ src, alt, ...props }) {
  return (
    <Image
      src={src}
      alt={alt}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
      loading="lazy"
      {...props}
    />
  );
}
```

#### 12. Add Performance Budget to CI
```json
// .github/workflows/performance.yml
{
  "budgets": [
    {
      "resourceType": "script",
      "budget": 200
    },
    {
      "resourceType": "total",
      "budget": 500
    }
  ]
}
```

---

### P3 - Long Term (2-4 недели)

#### 13. Migrate to Partial Prerendering
```tsx
// next.config.js
experimental: {
  ppr: true,
}
```

#### 14. Implement Delta Canvas Updates
```tsx
// Only send changed regions
function getCanvasDelta(oldPaths: Map, newPaths: Map) {
  const delta = [];
  for (const [id, path] of newPaths) {
    if (!oldPaths.has(id)) {
      delta.push({ type: 'add', path });
    }
  }
  return delta;
}
```

#### 15. Add Web Workers for Heavy Computation
```tsx
// src/workers/canvas.worker.ts
self.onmessage = (e) => {
  const { type, data } = e.data;
  if (type === 'PROCESS_PATHS') {
    const result = processPathsHeavy(data);
    self.postMessage({ type: 'PATHS_PROCESSED', result });
  }
};
```

---

## 🔧 Quick Wins Implementation

### 1. Add Compression Headers (Vercel)
```json
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Content-Encoding", "value": "br" }
      ]
    }
  ]
}
```

### 2. Preconnect to Firebase
```tsx
// src/app/layout.tsx
<head>
  <link rel="preconnect" href="https://firestore.googleapis.com" />
  <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
  <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
</head>
```

### 3. Add Loading Priority
```tsx
// High priority for critical resources
<link rel="preload" href="/fonts/inter.woff2" as="font" crossOrigin="" />
```

---

## 📈 Monitoring Setup

### Core Web Vitals Dashboard
```tsx
// src/lib/analytics.ts
export function reportWebVitals(metric: any) {
  const { name, value, id } = metric;

  // Send to analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, {
      event_category: 'Web Vitals',
      event_label: id,
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      non_interaction: true,
    });
  }
}
```

### Custom Metrics
```tsx
// Track time to first message
performance.mark('chat-loaded');
// ... after first message renders
performance.mark('first-message');
performance.measure('time-to-first-message', 'chat-loaded', 'first-message');
```

---

## 🚫 Regression Prevention

### 1. Lighthouse CI
```yaml
# .github/workflows/lighthouse.yml
- name: Lighthouse CI
  uses: treosh/lighthouse-ci-action@v10
  with:
    budgetPath: ./budget.json
    uploadArtifacts: true
```

### 2. Bundle Size Check
```json
// package.json
"scripts": {
  "size": "size-limit",
  "size:check": "size-limit --ci"
}
```

### 3. Performance Tests
```tsx
// src/__tests__/performance.test.ts
describe('Performance', () => {
  it('MessageList renders 100 messages in < 100ms', async () => {
    const start = performance.now();
    render(<MessageList messages={generateMessages(100)} />);
    const end = performance.now();
    expect(end - start).toBeLessThan(100);
  });
});
```

---

## 📝 Implementation Checklist

### Week 1 (P0 + Quick Wins) ✅ DONE
- [x] Add React.memo to MessageItem, MessageBubble (with custom comparators)
- [x] Throttle canvas cursor updates (already implemented)
- [x] Fix memory leaks in canvas (cleanup in useEffect)
- [x] Add preconnect headers (Firebase, fonts)
- [x] Enhanced ErrorBoundary with error categorization
- [x] Shimmer animation for skeletons
- [x] Performance check script

### Week 2 (P1) ✅ DONE
- [x] Implement OffscreenCanvas utility (src/lib/offscreen-canvas.ts)
- [x] Lazy load Firebase modules (src/lib/firebase-lazy.ts)
- [x] Add request deduplication (src/lib/request-dedup.ts)
- [x] Batch WebSocket messages (already in RealtimeCanvasService)

### Week 3 (P2) - NEXT
- [ ] Migrate to React Query для кэширования
- [ ] Add skeleton screens everywhere
- [ ] Optimize images with blur placeholders
- [ ] Setup Lighthouse CI

### Week 3 (P2)
- [ ] Migrate to React Query
- [ ] Add skeleton screens
- [ ] Optimize images
- [ ] Setup Lighthouse CI

### Week 4 (P3)
- [ ] Delta canvas updates
- [ ] Web Workers
- [ ] Performance budgets
- [ ] Full monitoring dashboard
