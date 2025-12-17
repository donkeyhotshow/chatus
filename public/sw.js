const CACHE_NAME = 'chatus-mobile-v1.0.0';
const STATIC_CACHE = 'chatus-static-v1.0.0';
const DYNAMIC_CACHE = 'chatus-dynamic-v1.0.0';

// Файлы для кэширования
const STATIC_FILES = [
    '/mobile-demo',
    '/manifest.json',
    '/_next/static/css/',
    '/_next/static/js/',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker');

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .catch((error) => {
                console.error('[SW] Error caching static files:', error);
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
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
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

// Обработка fetch запросов
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Игнорируем запросы к API и WebSocket
    if (url.pathname.startsWith('/api/') ||
        url.pathname.startsWith('/_next/webpack-hmr') ||
        request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    console.log('[SW] Serving from cache:', request.url);
                    return cachedResponse;
                }

                // Если нет в кэше, загружаем из сети
                return fetch(request)
                    .then((response) => {
                        // Проверяем, что ответ валидный
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Клонируем ответ для кэширования
                        const responseToCache = response.clone();

                        // Кэшируем динамические ресурсы
                        if (shouldCache(request.url)) {
                            caches.open(DYNAMIC_CACHE)
                                .then((cache) => {
                                    console.log('[SW] Caching dynamic resource:', request.url);
                                    cache.put(request, responseToCache);
                                });
                        }

                        return response;
                    })
                    .catch((error) => {
                        console.error('[SW] Fetch failed:', error);

                        // Возвращаем офлайн страницу для навигационных запросов
                        if (request.destination === 'document') {
                            return caches.match('/mobile-demo');
                        }

                        // Для изображений возвращаем placeholder
                        if (request.destination === 'image') {
                            return new Response(
                                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#333"/><text x="100" y="100" text-anchor="middle" fill="#666" font-size="14">Офлайн</text></svg>',
                                { headers: { 'Content-Type': 'image/svg+xml' } }
                            );
                        }

                        throw error;
                    });
            })
    );
});

// Функция для определения, нужно ли кэшировать ресурс
function shouldCache(url) {
    const urlObj = new URL(url);

    // Кэшируем статические ресурсы
    if (urlObj.pathname.includes('/_next/static/')) {
        return true;
    }

    // Кэшируем изображения
    if (urlObj.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
        return true;
    }

    // Кэшируем шрифты
    if (urlObj.pathname.match(/\.(woff|woff2|ttf|eot)$/)) {
        return true;
    }

    return false;
}

// Обработка push-уведомлений
self.addEventListener('push', (event) => {
    console.log('[SW] Push received');

    let data = {};

    if (event.data) {
        try {
            data = event.data.json();
        } catch (error) {
            data = { title: 'Новое сообщение', body: event.data.text() };
        }
    }

    const options = {
        title: data.title || 'ЧАТ ДЛЯ НАС',
        body: data.body || 'У вас новое сообщение',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        image: data.image,
        data: data.data || {},
        actions: [
            {
                action: 'reply',
                title: 'Ответить',
                icon: '/icons/action-reply.png'
            },
            {
                action: 'view',
                title: 'Открыть',
                icon: '/icons/action-view.png'
            }
        ],
        tag: data.tag || 'chat-message',
        renotify: true,
        requireInteraction: false,
        silent: false,
        vibrate: [200, 100, 200],
        timestamp: Date.now()
    };

    event.waitUntil(
        self.registration.showNotification(options.title, options)
    );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.action);

    event.notification.close();

    const action = event.action;
    const data = event.notification.data;

    if (action === 'reply') {
        // Открываем приложение для ответа
        event.waitUntil(
            clients.openWindow('/mobile-demo?action=reply&id=' + (data.messageId || ''))
        );
    } else if (action === 'view' || !action) {
        // Открываем приложение
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    // Если приложение уже открыто, фокусируемся на нем
                    for (const client of clientList) {
                        if (client.url.includes('/mobile-demo') && 'focus' in client) {
                            return client.focus();
                        }
                    }

                    // Иначе открываем новое окно
                    if (clients.openWindow) {
                        return clients.openWindow('/mobile-demo');
                    }
                })
        );
    }
});

// Обработка закрытия уведомлений
self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notification closed');

    // Можно отправить аналитику о закрытии уведомления
    const data = event.notification.data;
    if (data && data.trackingId) {
        // Отправляем событие закрытия
        fetch('/api/analytics/notification-closed', {
            method: 'POST',
            body: JSON.stringify({ trackingId: data.trackingId }),
            headers: { 'Content-Type': 'application/json' }
        }).catch(() => {
            // Игнорируем ошибки аналитики
        });
    }
});

// Синхронизация в фоне
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);

    if (event.tag === 'sync-messages') {
        event.waitUntil(syncMessages());
    }
});

// Функция синхронизации сообщений
async function syncMessages() {
    try {
        // Получаем несинхронизированные сообщения из IndexedDB
        const messages = await getUnsyncedMessages();

        for (const message of messages) {
            try {
                const response = await fetch('/api/messages', {
                    method: 'POST',
                    body: JSON.stringify(message),
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    // Помечаем сообщение как синхронизированное
                    await markMessageAsSynced(message.id);
                }
            } catch (error) {
                console.error('[SW] Failed to sync message:', error);
            }
        }
    } catch (error) {
        console.error('[SW] Sync failed:', error);
    }
}

// Заглушки для работы с IndexedDB (нужно реализовать отдельно)
async function getUnsyncedMessages() {
    // Здесь должна быть логика получения несинхронизированных сообщений
    return [];
}

async function markMessageAsSynced(messageId) {
    // Здесь должна быть логика пометки сообщения как синхронизированного
    console.log('Message synced:', messageId);
}

// Обработка ошибок
self.addEventListener('error', (event) => {
    console.error('[SW] Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('[SW] Unhandled promise rejection:', event.reason);
});

console.log('[SW] Service Worker loaded');
