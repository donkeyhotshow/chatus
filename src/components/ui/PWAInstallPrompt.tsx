"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Bell, BellOff, Wifi, WifiOff } from 'lucide-react';
import { usePWA } from '@/hooks/use-pwa';
import { cn } from '@/lib/utils';

interface PWAInstallPromptProps {
    variant?: 'banner' | 'modal' | 'inline';
    onDismiss?: () => void;
    className?: string;
}

export function PWAInstallPrompt({
    variant = 'banner',
    onDismiss,
    className
}: PWAInstallPromptProps) {
    const {
        isInstallable,
        isInstalled,
        isOnline,
        isSupported,
        installApp,
        requestNotificationPermission,
        subscribeToPush
    } = usePWA();

    const [isInstalling, setIsInstalling] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState(
        typeof window !== 'undefined' ? Notification.permission : 'default'
    );

    const handleInstall = async () => {
        setIsInstalling(true);
        try {
            const success = await installApp();
            if (success) {
                onDismiss?.();
            }
        } finally {
            setIsInstalling(false);
        }
    };

    const handleNotificationToggle = async () => {
        if (notificationPermission === 'granted') {
            // Здесь можно отписаться от уведомлений
            console.log('Disabling notifications...');
        } else {
            const granted = await requestNotificationPermission();
            if (granted) {
                setNotificationPermission('granted');
                await subscribeToPush();
            }
        }
    };

    // Не показываем, если уже установлено или не поддерживается
    if (isInstalled || !isSupported) {
        return null;
    }

    const features = [
        {
            icon: Smartphone,
            title: 'Работает как приложение',
            description: 'Запускается с рабочего стола без браузера'
        },
        {
            icon: Wifi,
            title: 'Офлайн доступ',
            description: 'Работает даже без интернета'
        },
        {
            icon: Bell,
            title: 'Push-уведомления',
            description: 'Получайте уведомления о новых сообщениях'
        },
        {
            icon: Download,
            title: 'Быстрая загрузка',
            description: 'Мгновенный запуск после установки'
        }
    ];

    if (variant === 'banner' && isInstallable) {
        return (
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-soft)] text-white shadow-lg",
                    className
                )}
            >
                <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <Download className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-semibold">Установить ЧАТ ДЛЯ НАС</div>
                            <div className="text-sm opacity-90">
                                Получите лучший опыт с нашим приложением
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowDetails(true)}
                            className="px-3 py-1 text-sm bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                        >
                            Подробнее
                        </button>
                        <button
                            onClick={handleInstall}
                            disabled={isInstalling}
                            className="px-4 py-2 bg-white text-[var(--accent-primary)] rounded-lg font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
                        >
                            {isInstalling ? 'Установка...' : 'Установить'}
                        </button>
                        <button
                            onClick={onDismiss}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    if (variant === 'inline') {
        return (
            <div className={cn("space-y-4", className)}>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[var(--accent-primary)] rounded-xl flex items-center justify-center">
                        <Download className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-[var(--text-primary)]">
                            Установить приложение
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Получите лучший опыт использования
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)]"
                        >
                            <feature.icon className="w-5 h-5 text-[var(--accent-primary)] mb-2" />
                            <div className="text-sm font-medium text-[var(--text-primary)] mb-1">
                                {feature.title}
                            </div>
                            <div className="text-xs text-[var(--text-muted)]">
                                {feature.description}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex gap-2">
                    {isInstallable && (
                        <button
                            onClick={handleInstall}
                            disabled={isInstalling}
                            className="flex-1 py-3 bg-[var(--accent-primary)] text-white rounded-lg font-medium hover:bg-[var(--accent-soft)] transition-colors disabled:opacity-50"
                        >
                            {isInstalling ? 'Установка...' : 'Установить приложение'}
                        </button>
                    )}

                    <button
                        onClick={handleNotificationToggle}
                        className={cn(
                            "px-4 py-3 rounded-lg font-medium transition-colors",
                            notificationPermission === 'granted'
                                ? "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                                : "bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-soft)]"
                        )}
                    >
                        {notificationPermission === 'granted' ? (
                            <BellOff className="w-5 h-5" />
                        ) : (
                            <Bell className="w-5 h-5" />
                        )}
                    </button>
                </div>

                {!isOnline && (
                    <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                        <WifiOff className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-orange-600 dark:text-orange-400">
                            Нет подключения к интернету
                        </span>
                    </div>
                )}
            </div>
        );
    }

    // Modal variant
    return (
        <AnimatePresence>
            {showDetails && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50"
                        onClick={() => setShowDetails(false)}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md z-50 bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-primary)] shadow-2xl overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                                    Установить ЧАТ ДЛЯ НАС
                                </h2>
                                <button
                                    onClick={() => setShowDetails(false)}
                                    className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-[var(--text-secondary)]" />
                                </button>
                            </div>

                            <div className="space-y-4 mb-6">
                                {features.map((feature, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-[var(--accent-primary)]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <feature.icon className="w-4 h-4 text-[var(--accent-primary)]" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-[var(--text-primary)] mb-1">
                                                {feature.title}
                                            </div>
                                            <div className="text-sm text-[var(--text-secondary)]">
                                                {feature.description}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDetails(false)}
                                    className="flex-1 py-3 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-lg font-medium hover:bg-[var(--bg-elevated)] transition-colors"
                                >
                                    Позже
                                </button>
                                {isInstallable && (
                                    <button
                                        onClick={handleInstall}
                                        disabled={isInstalling}
                                        className="flex-1 py-3 bg-[var(--accent-primary)] text-white rounded-lg font-medium hover:bg-[var(--accent-soft)] transition-colors disabled:opacity-50"
                                    >
                                        {isInstalling ? 'Установка...' : 'Установить'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
