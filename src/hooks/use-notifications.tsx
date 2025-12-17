"use client";

import { useEffect, useState, useCallback } from 'react';
import { useToast } from './use-toast';

interface NotificationOptions {
    title: string;
    body: string;
    icon?
    tag?: string;
    requireInteraction?: boolean;
    silent?: boolean;
}

export function useNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSupported, setIsSupported] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        // Проверяем поддержку уведомлений
        if ('Notification' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
        if (!isSupported) {
            toast({
                title: "Уведомления не поддерживаются",
                description: "Ваш браузер не поддерживает push-уведомления",
                variant: "destructive"
            });
            return 'denied';
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                toast({
                    title: "Уведомления включены",
                    description: "Теперь вы будете получать уведомления о новых сообщениях",
                    variant: "default"
                });
            } else if (result === 'denied') {
                toast({
                    title: "Уведомления отклонены",
                    description: "Вы можете включить их в настройках браузера",
                    variant: "destructive"
                });
            }

            return result;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return 'denied';
        }
    }, [isSupported, toast]);

    const showNotification = useCallback((options: NotificationOptions) => {
        // Показываем уведомление только если страница не активна
        if (document.hidden && permission === 'granted' && isSupported) {
            try {
                const notification = new Notification(options.title, {
                    body: options.body,
                    icon: options.icon || '/favicon.ico',
                    tag: options.tag || 'chat-message',
                    requireInteraction: options.requireInteraction || false,
                    silent: options.silent || false,
                    badge: '/favicon.ico',
                });

                // Автоматически закрываем уведомление через 5 секунд
                setTimeout(() => {
                    notification.close();
                }, 5000);

                // Обработчик клика по уведомлению
                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };

                return notification;
            } catch (error) {
                console.error('Error showing notification:', error);

                // Fallback: показываем toast уведомление
                toast({
                    title: options.title,
                    description: options.body,
                    variant: "default"
                });
            }
        } else if (document.hidden) {
            // Если нет разрешения, показываем toast
            toast({
                title: options.title,
                description: options.body,
                variant: "default"
            });
        }

        return null;
    }, [permission, isSupported, toast]);

    const showMessageNotification = useCallback((senderName: string, messageText: string, roomId?: string) => {
        const truncatedText = messageText.length > 100
            ? messageText.substring(0, 100) + '...'
            : messageText;

        return showNotification({
            title: `Новое сообщение от ${senderName}`,
            body: truncatedText,
            tag: `message-${roomId || 'unknown'}`,
            requireInteraction: false,
            silent: false
        });
    }, [showNotification]);

    const showSystemNotification = useCallback((title: string, message: string) => {
        return showNotification({
            title,
            body: message,
            tag: 'system-notification',
            requireInteraction: false,
            silent: true
        });
    }, [showNotification]);

    // Автоматически запрашиваем разрешение при первом использовании
    useEffect(() => {
        if (isSupported && permission === 'default') {
            // Показываем подсказку о возможности включить уведомления
            const timer = setTimeout(() => {
                toast({
                    title: "Включить уведомления?",
                    description: "Получайте уведомления о новых сообщениях, даже когда вкладка неактивна",
                    action: {
                        label: "Включить",
                        onClick: requestPermission
                    }
                });
            }, 10000); // Показываем через 10 секунд после загрузки

            return () => clearTimeout(timer);
        }
    }, [isSupported, permission, requestPermission, toast]);

    return {
        isSupported,
        permission,
        requestPermission,
        showNotification,
        showMessageNotification,
        showSystemNotification,
        canShowNotifications: permission === 'granted' && isSupported
    };
}
