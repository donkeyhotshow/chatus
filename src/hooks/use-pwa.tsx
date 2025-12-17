"use client";

import {
    useState, useEffect, useCallback
} from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
    isInstallable: boolean;
    isInstalled: boolean;
    isOnline: boolean;
    isSupported: boolean;
    installPrompt: BeforeInstallPromptEvent | null;
}

export function usePWA() {
    const [state, setState] = useState<PWAState>({
        isInstallable: false,
        isInstalled: false,
        isOnline: true,
        isSupported: false,
        installPrompt: null
    });

    // Проверяем поддержку PWA
    useEffect(() => {
        const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
        setState(prev => ({ ...prev, isSupported }));
    }, []);

    // Регистрируем Service Worker
    useEffect(() => {
        if (!state.isSupported) return;

        const registerSW = async () => {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });

                console.log('[PWA] Service Worker registered:', registration);

                // Проверяем обновления
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // Новая версия доступна
                                console.log('[PWA] New version available');
                                // Можно показать уведомление пользователю
                            }
                        });
                    }
                });

            } catch (error) {
                console.error('[PWA] Service Worker registration failed:', error);
            }
        };

        registerSW();
    }, [state.isSupported]);

    // Отслеживаем статус установки
    useEffect(() => {
        const checkInstallStatus = () => {
            const isInstalled =
                window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true ||
                document.referrer.includes('android-app://');

            setState(prev => ({ ...prev, isInstalled }));
        };

        checkInstallStatus();
        window.addEventListener('appinstalled', checkInstallStatus);

        return () => {
            window.removeEventListener('appinstalled', checkInstallStatus);
        };
    }, []);

    // Отслеживаем статус сети
    useEffect(() => {
        const updateOnlineStatus = () => {
            setState(prev => ({ ...prev, isOnline: navigator.onLine }));
        };

        updateOnlineStatus();
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        };
    }, []);

    // Обрабатываем событие установки
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            const installPrompt = e as BeforeInstallPromptEvent;

            setState(prev => ({
                ...prev,
                isInstallable: true,
                installPrompt
            }));
        };

        const handleAppInstalled = () => {
            setState(prev => ({
                ...prev,
                isInstallable: false,
                isInstalled: true,
                installPrompt: null
            }));
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    // Функция установки приложения
    const installApp = useCallback(async () => {
        if (!state.installPrompt) return false;

        try {
            await state.installPrompt.prompt();
            const choiceResult = await state.installPrompt.userChoice;

            if (choiceResult.outcome === 'accepted') {
                console.log('[PWA] User accepted the install prompt');
                setState(prev => ({
                    ...prev,
                    isInstallable: false,
                    installPrompt: null
                }));
                return true;
            } else {
                console.log('[PWA] User dismissed the install prompt');
                return false;
            }
        } catch (error) {
            console.error('[PWA] Install prompt failed:', error);
            return false;
        }
    }, [state.installPrompt]);

    // Функция запроса разрешения на уведомления
    const requestNotificationPermission = useCallback(async () => {
        if (!('Notification' in window)) {
            console.warn('[PWA] Notifications not supported');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission === 'denied') {
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (error) {
            console.error('[PWA] Notification permission request failed:', error);
            return false;
        }
    }, []);

    // Функция подписки на push-уведомления
    const subscribeToPush = useCallback(async () => {
        if (!state.isSupported || !('serviceWorker' in navigator)) {
            return null;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            // Проверяем существующую подписку
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                // Создаем новую подписку
                const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                if (!vapidPublicKey) {
                    console.warn('[PWA] VAPID public key not configured');
                    return null;
                }

                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: vapidPublicKey
                });
            }

            console.log('[PWA] Push subscription:', subscription);
            return subscription;
        } catch (error) {
            console.error('[PWA] Push subscription failed:', error);
            return null;
        }
    }, [state.isSupported]);

    // Функция отписки от push-уведомлений
    const unsubscribeFromPush = useCallback(async () => {
        if (!state.isSupported || !('serviceWorker' in navigator)) {
            return false;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();
                console.log('[PWA] Push unsubscribed');
                return true;
            }

            return false;
        } catch (error) {
            console.error('[PWA] Push unsubscribe failed:', error);
            return false;
        }
    }, [state.isSupported]);

    return {
        ...state,
        installApp,
        requestNotificationPermission,
        subscribeToPush,
        unsubscribeFromPush
    };
}
