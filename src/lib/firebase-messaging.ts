import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { getClientFirebase } from './firebase';
import { doc, setDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { logger } from "./logger";

export class FCMManager {
  private messaging: Messaging | null = null;

  async initialize(userId: string): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      logger.warn('FCMManager: Notifications not supported or not in browser context');
      return;
    }

    const { app, firestore, messaging } = getClientFirebase();

    if (!messaging) {
      logger.error('FCMManager: Firebase Messaging not initialized.');
      return;
    }

    this.messaging = messaging;
    if (!this.messaging) {
      logger.warn('FCMManager: messaging unavailable after init');
      return;
    }

    // Запитуємо дозвіл
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      logger.warn('FCMManager: Notification permission denied');
      return;
    }

    // Отримуємо токен
    try {
      const token = await getToken(this.messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      });

      if (token) {
        // Save token BOTH in user's document (legacy) and in dedicated collection fcmTokens/{token}
        try {
          // users/{userId}.fcmTokens array (legacy/upsert)
          await setDoc(
            doc(firestore, 'users', userId),
            {
              fcmTokens: arrayUnion({
                token,
                createdAt: new Date(),
                userAgent: navigator.userAgent
              })
            },
            { merge: true }
          );
        } catch (e) {
          logger.debug('FCMManager: failed to upsert users/{userId}.fcmTokens', e as Error);
        }

        try {
          // fcmTokens/{token} — easier for server-side cleanup and queries
          await setDoc(doc(firestore, 'fcmTokens', token), {
            userId,
            token,
            updatedAt: serverTimestamp(),
            userAgent: navigator.userAgent
          });
        } catch (e) {
          logger.warn('FCMManager: failed to write fcmTokens/{token}', e as Error);
        }

        logger.info('FCMManager: FCM token saved', { token: token.slice(0, 10) + '...' });
      }
    } catch (error) {
      logger.error('FCMManager: Error getting FCM token', error as Error);
    }

    // Слушаем foreground messages
    onMessage(this.messaging, (payload) => {
      logger.info('FCMManager: Foreground message received', { payload });

      // Показуем notification если пользователь не на странице чата
      if (document.hidden) {
        new Notification(payload.notification?.title || 'New message', {
          body: payload.notification?.body,
          icon: '/firebase-logo.png',
          data: payload.data
        });
      }
    });

    // Re-check token on visibility/focus to handle refreshes or token rotation
    const refreshTokenIfNeeded = async () => {
      try {
        if (!this.messaging) return;
        const newToken = await getToken(this.messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
        if (newToken && newToken !== undefined) {
          // Save token if it's new (simple upsert via arrayUnion)
          await setDoc(
            doc(firestore, 'users', userId),
            {
              fcmTokens: arrayUnion({
                token: newToken,
                createdAt: new Date(),
                userAgent: navigator.userAgent
              })
            },
            { merge: true }
          );
          logger.info('FCMManager: FCM token refreshed/saved', { token: newToken.slice(0, 10) + '...' });
        }
      } catch (err) {
        logger.debug('FCMManager: token refresh check failed', { error: String(err) });
      }
    };

    window.addEventListener('focus', refreshTokenIfNeeded);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') refreshTokenIfNeeded();
    });
  }
}
