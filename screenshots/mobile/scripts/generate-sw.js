const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local if available
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // Ignore if file doesn't exist
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const swContent = `/* eslint-disable no-undef */
console.log('[SW] Firebase Messaging SW starting...');
const CACHE_NAME = 'chatus-v1';
const STATIC_CACHE = 'chatus-static-v1';
const DYNAMIC_CACHE = 'chatus-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/badge-72.png',
  '/_next/static/css/app/layout.css',
];

if (typeof importScripts === 'function') {
  try {
    importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');
  } catch (e) {
    console.error('[SW] Failed to load Firebase scripts:', e);
  }
}

const config = ${JSON.stringify(firebaseConfig)};

if (typeof firebase !== 'undefined' && config.apiKey) {
  try {
    firebase.initializeApp(config);
    const messaging = firebase.messaging();
    
    messaging.onBackgroundMessage((payload) => {
      console.log('[SW] Background message:', payload);
      if (payload.data && payload.data.type === 'silent') {
        if (payload.data.unread && 'setAppBadge' in self.registration) {
          try {
            self.registration.setAppBadge(Number(payload.data.unread)).catch(() => {});
          } catch (e) {}
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
          { action: 'open', title: 'Открыть чат', icon: '/icon-192.png' },
          { action: 'close', title: 'Закрыть', icon: '/icon-192.png' }
        ]
      };
      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } catch (e) {
    console.error('[SW] Firebase initialization failed:', e);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;

  const isStaticAsset = url.pathname.includes('/_next/static/') ||
                       url.pathname.includes('/icons/') ||
                       url.pathname.endsWith('.css') ||
                       url.pathname.endsWith('.js');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
  } else {
    event.respondWith(
      fetch(request).then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.destination === 'document') {
            return caches.match('/').then((home) => home || new Response('Offline', { status: 503 }));
          }
          return new Response('Offline', { status: 503 });
        });
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;
  const roomId = event.notification?.data?.roomId;
  const url = roomId ? '/chat/' + roomId : '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      event.waitUntil(
        self.registration.showNotification(data.title || 'ChatUs', {
          body: data.body || 'Новое уведомление',
          icon: '/icon-192.png',
          badge: '/badge-72.png',
          data: data.data || {},
          tag: data.tag || 'default'
        })
      );
    } catch (e) {}
  }
});
`;

const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
fs.writeFileSync(path.join(publicDir, 'firebase-messaging-sw.js'), swContent);
console.log('Generated public/firebase-messaging-sw.js');
