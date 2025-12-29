const CACHE_NAME = 'chatus-mobile-v1.1.0';
const STATIC_CACHE = 'chatus-static-v1.1.0';
const DYNAMIC_CACHE = 'chatus-dynamic-v1.1.0';
const MESSAGES_CACHE = 'chatus-messages-v1.0.0';

// Файлы для кэширования при установке
const STATIC_FILES = [
    '/',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// Паттерны для кэширования
const CACHE_PATTERNS = {
    static: /\.(js|css|woff|woff2|ttf|eot)$/,
    images: /\.(png|jpg|jpeg|gif|svg|webp|ico)$/,
    api: /\/api\//,
    nextStatic: /\/_next\/static\//,
};

// Установка Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker v1.1.0');

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static files');
                return cache.addAll(STATIC_FILES).catch(err => {
                    console.warn('[SW] Some static files failed to cache:', err);
                });
            })
    );

    // Принудительно активировать новый SW
    self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Удаляем старые версии кэша
                        if (cacheName.startsWith('chatus-') &&
                            cacheName !== STATIC_CACHE &&
                            cacheName !== DYNAMIC_CACHE &&
                            cacheName !== MESSAGES_CACHE) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Стратегия кэширования: Network First с fallback на кэш
async function networkFirst(request, cacheName = DYNAMIC_CACHE) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        throw error;
    }
}

// Стратегия кэширования: Cache First с обновлением в фоне
async function cacheFirst(request, cacheName = STATIC_CACHE) {
    const cached = await caches.match(request);
    if (cached) {
        // Обновляем кэш в фоне
        fetch(request).then(response => {
            if (response.ok) {
                const responseToCache = response.clone();
                caches.open(cacheName).then(cache => {
                    cache.put(request, responseToCache);
                });
            }
        }).catch(() => {});
        return cached;
    }

    const response = await fetch(request);
    if (response.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, response.clone());
    }
    return response;
}

// Стратегия для статических ресурсов Next.js
async function staleWhileRevalidate(request) {
    const cached = await caches.match(request);

    const fetchPromise = fetch(request).then(response => {
        if (response.ok) {
            const responseToCache = response.clone();
            caches.open(STATIC_CACHE).then(cache => {
                cache.put(request, responseToCache);
            });
        }
        return response;
    }).catch(() => cached);

    return cached || fetchPromise;
}

// Обработка fetch запросов
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Игнорируем не-GET запросы
    if (request.method !== 'GET') {
        return;
    }

    // Игнорируем WebSocket и HMR
    if (url.pathname.startsWith('/_next/webpack-hmr') ||
        url.protocol === 'ws:' ||
        url.protocol === 'wss:') {
        return;
    }

    // API запросы - Network First
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Next.js статические файлы - Stale While Revalidate
    if (CACHE_PATTERNS.nextStatic.test(url.pathname)) {
        event.respondWith(staleWhileRevalidate(request));
        return;
    }

    // Изображения и шрифты - Cache First
    if (CACHE_PATTERNS.images.test(url.pathname) ||
        CACHE_PATTERNS.static.test(url.pathname)) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // Навигационные запросы (HTML страницы) - Network First с offline fallback
    if (request.destination === 'document' || request.mode === 'navigate') {
        event.respondWith(
            networkFirst(request).catch(() => {
                return caches.match('/').then(response => {
                    if (response) return response;
                    return new Response(
                        getOfflineHTML(),
                        { headers: { 'Content-Type': 'text/html' } }
                    );
                });
            })
        );
        return;
    }

    // Остальные запросы - Network First
    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response.ok && shouldCache(request.url)) {
                    const responseToCache = response.clone();
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(request, responseToCache);
                    });
                }
                return response;
            })
            .catch(async () => {
                const cached = await caches.match(request);
                if (cached) return cached;

                // Для изображений возвращаем placeholder
                if (request.destination === 'image') {
                    return new Response(
                        getOfflineSVG(),
                        { headers: { 'Content-Type': 'image/svg+xml' } }
                    );
                }

                throw new Error('Network error and no cache');
            })
    );
});

// Функция для определения, нужно ли кэшировать ресурс
function shouldCache(url) {
    const urlObj = new URL(url);

    // Кэшируем статические ресурсы Next.js
    if (urlObj.pathname.includes('/_next/static/')) {
        return true;
    }

    // Кэшируем изображения
    if (CACHE_PATTERNS.images.test(urlObj.pathname)) {
        return true;
    }

    // Кэшируем шрифты и стили
    if (CACHE_PATTERNS.static.test(urlObj.pathname)) {
        return true;
    }

    return false;
}

// Offline HTML страница
function getOfflineHTML() {
    return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ChatUs - Оффлайн</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #fafafa;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            text-align: center;
            max-width: 400px;
        }
        .icon {
            font-size: 64px;
            margin-bottom: 24px;
        }
        h1 {
            font-size: 24px;
            margin-bottom: 12px;
        }
        p {
            color: #a3a3a3;
            margin-bottom: 24px;
            line-height: 1.5;
        }
        button {
            background: #06b6d4;
            color: #0a0a0a;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
        }
        button:hover {
            background: #22d3ee;
        }
        .status {
            margin-top: 16px;
            font-size: 14px;
            color: #737373;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">📡</div>
        <h1>Вы оффлайн</h1>
        <p>Нет подключения к интернету. Ваши сообщения будут отправлены, когда связь восстановится.</p>
        <button onclick="location.reload()">Попробовать снова</button>
        <p class="status">Сообщения сохранены локально</p>
    </div>
    <script>
        // Автоматически перезагружаем при восстановлении связи
        window.addEventListener('online', () => {
            location.reload();
        });
    </script>
</body>
</html>`;
}

// Offline SVG placeholder
function getOfflineSVG() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="#1a1a1a"/>
        <text x="100" y="100" text-anchor="middle" fill="#525252" font-size="14" font-family="sans-serif">Оффлайн</text>
    </svg>`;
}

// Обработка push-уведомлений
self.addEventListener('push', (event) => {
    let data = {};

    if (event.data) {
        try {
            data = event.data.json();
        } catch (error) {
            data = { title: 'Новое сообщение', body: event.data.text() };
        }
    }

    const options = {
        body: data.body || 'У вас новое сообщение',
        icon: data.icon || '/icons/icon-192x192.png',
        badge: data.badge || '/icons/badge-72x72.png',
        image: data.image,
        data: data.data || {},
        tag: data.tag || 'chat-message',
        renotify: true,
        requireInteraction: false,
        silent: false,
        vibrate: [200, 100, 200],
        timestamp: Date.now(),
        actions: [
            { action: 'reply', title: 'Ответить' },
            { action: 'view', title: 'Открыть' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'ЧАТ ДЛЯ НАС', options)
    );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const action = event.action;
    const data = event.notification.data;
    const roomId = data.roomId || '';

    let targetUrl = '/';
    if (roomId) {
        targetUrl = `/chat/${roomId}`;
    }
    if (action === 'reply' && data.messageId) {
        targetUrl += `?reply=${data.messageId}`;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Ищем уже открытое окно
                for (const client of clientList) {
                    if (client.url.includes('/chat/') && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Открываем новое окно
                if (clients.openWindow) {
                    return clients.openWindow(targetUrl);
                }
            })
    );
});

// Обработка закрытия уведомлений
self.addEventListener('notificationclose', (event) => {
    // Можно отправить аналитику
    console.log('[SW] Notification closed');
});

// Периодическая синхронизация (если поддерживается)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'sync-messages') {
        event.waitUntil(syncMessages());
    }
});

// Background sync для сообщений
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-offline-messages') {
        event.waitUntil(syncOfflineMessages());
    }
});

async function syncMessages() {
    // Синхронизация сообщений в фоне
    console.log('[SW] Syncing messages...');
}

async function syncOfflineMessages() {
    // Отправка оффлайн сообщений
    console.log('[SW] Syncing offline messages...');

    try {
        // Получаем оффлайн очередь из IndexedDB или localStorage
        const clients = await self.clients.matchAll();
        for (const client of clients) {
            client.postMessage({ type: 'SYNC_OFFLINE_MESSAGES' });
        }
    } catch (error) {
        console.error('[SW] Failed to sync offline messages:', error);
    }
}

// Обработка сообщений от клиента
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CACHE_URLS') {
        const urls = event.data.urls;
        caches.open(DYNAMIC_CACHE).then(cache => {
            cache.addAll(urls).catch(err => {
                console.warn('[SW] Failed to cache URLs:', err);
            });
        });
    }
});

// Обработка ошибок
self.addEventListener('error', (event) => {
    console.error('[SW] Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('[SW] Unhandled promise rejection:', event.reason);
});

console.log('[SW] Service Worker v1.1.0 loaded');
