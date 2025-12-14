/* eslint-disable no-undef */

importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBCbE_vyqlFa2v6mk-w3pfQ1qIgYXp0HX4",
  authDomain: "chatus-703ce.firebaseapp.com",
  projectId: "chatus-703ce",
  storageBucket: "chatus-703ce.appspot.com",
  messagingSenderId: "924028329830",
  appId: "1:924028329830:web:abfa4a0661401259cbf2a7",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message:', payload);

  // Silent push handling (data-only)
  if (payload.data && payload.data.type === 'silent') {
    // Update app badge if supported
    if (payload.data.unread && 'setAppBadge' in self.registration) {
      try {
        // @ts-ignore - setAppBadge may not be typed in all envs
        self.registration.setAppBadge(Number(payload.data.unread)).catch(() => {});
      } catch (e) {
        // ignore
      }
    }
    // Do not show notification for silent messages
    return;
  }

  const notificationTitle =
    payload.notification?.title || 'New message';

  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: payload.data || {},
    tag: payload.data?.roomId || 'default',
  };

  self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const roomId = event.notification?.data?.roomId;

  const url = roomId ? `/chat/${roomId}` : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
