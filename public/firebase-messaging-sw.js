/* eslint-disable no-undef */
const CACHE_NAME = 'chatus-v1';
const STATIC_CACHE = 'chatus-static-v1';
const DYNAMIC_CACHE = 'chatus-dynamic-v1';

// Ресурсы для кэширования
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/badge-72.png',
  '/_next/static/css/app/layout.css',
];

// Firebase imports
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');

// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyBCbE_vyqlFa2v6mk-w3pfQ1qIgYXp0HX4",
  authDomain: "chatus-703ce.firebaseapp.com",
  projectId: "chatus-703ce",
  storageBucket: "chatus-703ce.firebasestorage.app",
  messagingSenderId: "924028329830",
  appId: "1:924028329830:web:abfa4a0661401259cbf2a7",
});

const messaging = firebase.messaging();

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
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
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Enhanced fetch event with better offline support
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Firebase and external APIs
  if (url.origin !== location.origin) return;

  // Skip API routes
  if (url.pathname.startsWith('/api/')) return;

  // Strategy: Cache First for static assets, Network First for dynamic content
  const isStaticAsset = url.pathname.includes('/_next/static/') ||
                       url.pathname.includes('/icons/') ||
                       url.pathname.endsWith('.css') ||
                       url.pathname.endsWith('.js');

  if (isStaticAsset) {
    // Cache First strategy for static assets
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          return cachedResponse || fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                const responseToCache = response.clone();
                caches.open(STATIC_CACHE)
                  .then((cache) => cache.put(request, responseToCache));
              }
              return response;
            });
        })
    );
  } else {
    // Network First strategy for dynamic content
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => cache.put(request, responseToCache));
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache when offline
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Ultimate fallback for navigation requests
              if (request.destination === 'document') {
                return caches.match('/').then((homeResponse) => {
                  return homeResponse || new Response(
                    '<html><body><h1>Offline</h1><p>Нет подключения к интернету</p></body></html>',
                    { headers: { 'Content-Type': 'text/html' } }
                  );
                });
              }
              // Return offline response for other requests
              return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
            });
        })
    );
  }
});

// Background message handling
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message:', payload);

  // Silent push handling (data-only)
  if (payload.data && payload.data.type === 'silent') {
    if (payload.data.unread && 'setAppBadge' in self.registration) {
      try {
        self.registration.setAppBadge(Number(payload.data.unread)).catch(() => {});
      } catch (e) {
        // ignore
      }
    }
    return;
  }

  const notificationTitle = payload.notification?.title || 'Новое сообщение';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: payload.data || {},
    tag: payload.data?.roomId || 'default',
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'open',
        title: 'Открыть чат',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Закрыть',
        icon: '/icon-192.png'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const roomId = event.notification?.data?.roomId;

  if (action === 'close') {
    return;
  }

  const url = roomId ? `/chat/${roomId}` : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Sync event for background sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Здесь можно синхронизировать данные
      Promise.resolve()
    );
  }
});

// Push event (alternative to messaging)
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Новое уведомление',
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      data: data.data || {},
      tag: data.tag || 'default'
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'ЧАТ ДЛЯ НАС', options)
    );
  }
});
