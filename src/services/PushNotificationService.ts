export interface PushNotificationData {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    image?: string;
    data?: any;
    tag?: string;
    actions?: any[];
    vibrate?: number[];
    silent?: boolean;
    requireInteraction?: boolean;
}

export interface NotificationPermissionResult {
    granted: boolean;
    denied: boolean;
    default: boolean;
}

class PushNotificationService {
    private static instance: PushNotificationService;
    private registration: ServiceWorkerRegistration | null = null;
    private subscription: PushSubscription | null = null;

    // VAPID ключи (в реальном приложении должны быть вх окружения)
    private readonly vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI80NqIUHI80NqIUHI80NqIUHI80NqIUHI80NqIUHI80NqI';

    private constructor() { }

    static getInstance(): PushNotificationService {
        if (!PushNotificationService.instance) {
            PushNotificationService.instance = new PushNotificationService();
        }
        return PushNotificationService.instance;
    }

    // Проверка поддержки Push-уведомлений
    isSupported(): boolean {
        return (
            'serviceWorker' in navigator &&
            'PushManager' in window &&
            'Notification' in window
        );
    }

    // Получение текущего статуса разрешений
    getPermissionStatus(): NotificationPermissionResult {
        const permission = Notification.permission;
        return {
            granted: permission === 'granted',
            denied: permission === 'denied',
            default: permission === 'default'
        };
    }

    // Запрос разрешения на уведомления
    async requestPermission(): Promise<boolean> {
        if (!this.isSupported()) {
            console.warn('Push notifications are not supported');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                console.log('Push notification permission granted');
                return true;
            } else {
                console.log('Push notification permission denied');
                return false;
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    // Регистрация Service Worker
    async registerServiceWorker(): Promise<boolean> {
        if (!this.isSupported()) {
            return false;
        }

        try {
            this.registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });

            console.log('Service Worker registered successfully');

            // Ждем активации Service Worker
            await navigator.serviceWorker.ready;

            return true;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            return false;
        }
    }

    // Подписка на Push-уведомления
    async subscribe(): Promise<PushSubscription | null> {
        if (!this.registration) {
            console.error('Service Worker not registered');
            return null;
        }

        try {
            // Проверяем существующую подписку
            this.subscription = await this.registration.pushManager.getSubscription();

            if (this.subscription) {
                console.log('Already subscribed to push notifications');
                return this.subscription;
            }

            // Создаем новую подписку
            this.subscription = await this.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as any
            });

            console.log('Subscribed to push notifications');

            // Отправляем подписку на сервер
            await this.sendSubscriptionToServer(this.subscription);

            return this.subscription;
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
            return null;
        }
    }

    // Отписка от Push-уведомлений
    async unsubscribe(): Promise<boolean> {
        if (!this.subscription) {
            return true;
        }

        try {
            await this.subscription.unsubscribe();
            this.subscription = null;

            // Уведомляем сервер об отписке
            await this.removeSubscriptionFromServer();

            console.log('Unsubscribed from push notifications');
            return true;
        } catch (error) {
            console.error('Failed to unsubscribe from push notifications:', error);
            return false;
        }
    }

    // Показ локального уведомления
    async showNotification(data: PushNotificationData): Promise<void> {
        if (!this.registration) {
            console.error('Service Worker not registered');
            return;
        }

        const options: any = {
            body: data.body,
            icon: data.icon || '/icons/icon-192x192.png',
            badge: data.badge || '/icons/badge-72x72.png',
            image: data.image,
            data: data.data || {},
            tag: data.tag || 'default',
            actions: data.actions || [],
            vibrate: data.vibrate || [200, 100, 200],
            silent: data.silent || false,
            requireInteraction: data.requireInteraction || false,
            timestamp: Date.now()
        };

        try {
            await this.registration.showNotification(data.title, options);
        } catch (error) {
            console.error('Failed to show notification:', error);
        }
    }

    // Получение активных уведомлений
    async getNotifications(): Promise<Notification[]> {
        if (!this.registration) {
            return [];
        }

        try {
            return await this.registration.getNotifications();
        } catch (error) {
            console.error('Failed to get notifications:', error);
            return [];
        }
    }

    // Закрытие всех уведомлений
    async closeAllNotifications(): Promise<void> {
        const notifications = await this.getNotifications();
        notifications.forEach(notification => notification.close());
    }

    // Инициализация сервиса
    async initialize(): Promise<boolean> {
        if (!this.isSupported()) {
            console.warn('Push notifications are not supported');
            return false;
        }

        try {
            // Регистрируем Service Worker
            const swRegistered = await this.registerServiceWorker();
            if (!swRegistered) {
                return false;
            }

            // Проверяем разрешения
            const { granted } = this.getPermissionStatus();
            if (!granted) {
                console.log('Push notification permission not granted');
                return false;
            }

            // Подписываемся на уведомления
            const subscription = await this.subscribe();
            return subscription !== null;
        } catch (error) {
            console.error('Failed to initialize push notifications:', error);
            return false;
        }
    }

    // Отправка подписки на сервер
    private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
        try {
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscription: subscription.toJSON(),
                    userAgent: navigator.userAgent,
                    timestamp: Date.now()
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send subscription to server');
            }

            console.log('Subscription sent to server successfully');
        } catch (error) {
            console.error('Failed to send subscription to server:', error);
        }
    }

    // Удаление подписки с сервера
    private async removeSubscriptionFromServer(): Promise<void> {
        try {
            const response = await fetch('/api/push/unsubscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    endpoint: this.subscription?.endpoint
                })
            });

            if (!response.ok) {
                throw new Error('Failed to remove subscription from server');
            }

            console.log('Subscription removed from server successfully');
        } catch (error) {
            console.error('Failed to remove subscription from server:', error);
        }
    }

    // Конвертация VAPID ключа
    private urlBase64ToUint8Array(base64String: string): Uint8Array {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Получение текущей подписки
    getCurrentSubscription(): PushSubscription | null {
        return this.subscription;
    }

    // Проверка активности подписки
    async isSubscriptionActive(): Promise<boolean> {
        if (!this.registration) {
            return false;
        }

        try {
            const subscription = await this.registration.pushManager.getSubscription();
            return subscription !== null;
        } catch (error) {
            console.error('Failed to check subscription status:', error);
            return false;
        }
    }
}

export default PushNotificationService;
