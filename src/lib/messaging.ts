'use client';

import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { app } from './firebase';

let messaging: ReturnType<typeof getMessaging> | null = null;

export async function initMessaging() {
  if (typeof window === 'undefined') return null;
  if (!(await isSupported())) return null;

  if (!messaging) {
    messaging = getMessaging(app);
  }

  return messaging;
}

export async function registerFCM() {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission denied');
  }

  const registration = await navigator.serviceWorker.register(
    '/firebase-messaging-sw.js'
  );

  const messaging = await initMessaging();
  if (!messaging) return null;

  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  return token;
}

export function onForegroundMessage(
  callback: (payload: any) => void
) {
  if (!messaging) return;
  onMessage(messaging, callback);
}
