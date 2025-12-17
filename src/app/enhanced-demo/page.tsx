"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MobileApp } from '@/components/mobile/MobileApp';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { PWAInstallPrompt } from '@/components/ui/PWAInstallPrompt';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTheme } from '@/lib/theme-system';
import { Settings, Smartphone, Monitor, Palette, Download } from 'lucide-react';

export default function EnhancedDemoPage() {
    const isMobile = useIsMobile();
    const { preferences } = useTheme();
    const [showSettings, setShowSettings] = useState(false);
    const [showPWAPrompt, setShowPWAPrompt] = useState(false);

    // Инициализация темы при загрузке
    useEffect(() => {
        // Тема уже инициализируется в ThemeManager
    }, []);

    if (isMobile) {
        return (
            <div className="relative">
                <MobileApp />

                {/* PWA Install Banner для мобильных */}
                <PWAInstallPrompt
                    variant="banner"
                    onDismiss={() => setShowPWAPrompt(false)}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-all duration-300">
            {/* PWA Install Banner для десктопа */}
            <PWAInstallPrompt
                variant="banner"
                onDismiss={() => setShowPWAPrompt(false)}
            />

            {/* Главный контент */}
            <div className="container mx-auto px-4 py-8">
                {/* Заголовок */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-light)] bg-clip-text text-transparent">
                        ЧАТ ДЛЯ НАС
                    </h1>
                    <p className="text-xl text-[var(--text-secondary)] mb-8">
                        Современное чат-приложение с PWA поддержкой и адаптивными темами
                    </p>

                    {/* Статус приложения */}
                    <div className="flex items-center justify-center gap-4 text-sm text-[var(--text-muted)]">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span>Онлайн</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Palette className="w-4 h-4" />
                            <span>Тема: {preferences.theme}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>Плотность: {preferences.density}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Демо секции */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                    {/* Мобильная версия */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-2xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-[var(--accent-primary)] rounded-xl flex items-center justify-center">
                                <Smartphone className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold">Мобильная версия</h3>
                        </div>
                        <p className="text-[var(--text-secondary)] mb-4">
                            Оптимизированный интерфейс для смартфонов с жестами и touch-friendly элементами.
                        </p>
                        <a
                            href="/mobile-demo"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-soft)] transition-colors"
                        >
                            Открыть
                        </a>
                    </motion.div>

                    {/* Десктопная версия */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-2xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-[var(--accent-primary)] rounded-xl flex items-center justify-center">
                                <Monitor className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold">Десктопная версия</h3>
                        </div>
                        <p className="text-[var(--text-secondary)] mb-4">
                            Полнофункциональный интерфейс для больших экранов с расширенными возможностями.
                        </p>
                        <a
                            href="/chat/demo"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-soft)] transition-colors"
                        >
                            Открыть
                        </a>
                    </motion.div>

                    {/* PWA функции */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-2xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-[var(--accent-primary)] rounded-xl flex items-center justify-center">
                                <Download className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold">PWA приложение</h3>
                        </div>
                        <p className="text-[var(--text-secondary)] mb-4">
                            Установите приложение для работы офлайн и получения push-уведомлений.
                        </p>
                        <PWAInstallPrompt variant="inline" />
                    </motion.div>
                </div>

                {/* Настройки тем */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-2xl p-8"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">Настройки внешнего вида</h2>
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>

                    <ThemeToggle variant="full" showSettings />
                </motion.div>

                {/* Функции */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12"
                >
                    <h2 className="text-2xl font-bold text-center mb-8">Возможности приложения</h2>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                title: 'Пиксельные аватары',
                                description: 'Создавайте уникальные аватары в пиксельном стиле',
                                icon: '🎨'
                            },
                            {
                                title: 'Реальное время',
                                description: 'Мгновенная доставка сообщений через WebSocket',
                                icon: '⚡'
                            },
                            {
                                title: 'Адаптивный дизайн',
                                description: 'Идеально работает на всех устройствах',
                                icon: '📱'
                            },
                            {
                                title: 'Офлайн режим',
                                description: 'Работает даже без интернет-соединения',
                                icon: '🔄'
                            },
                            {
                                title: 'Push-уведомления',
                                description: 'Получайте уведомления о новых сообщениях',
                                icon: '🔔'
                            },
                            {
                                title: 'Темы оформления',
                                description: '5 уникальных цветовых схем на выбор',
                                icon: '🌈'
                            },
                            {
                                title: 'Жесты управления',
                                description: 'Интуитивные свайпы и долгие нажатия',
                                icon: '👆'
                            },
                            {
                                title: 'Безопасность',
                                description: 'Шифрование данных и приватность',
                                icon: '🔒'
                            }
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 + index * 0.1 }}
                                className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl p-6 text-center hover:border-[var(--accent-primary)] transition-colors"
                            >
                                <div className="text-3xl mb-3">{feature.icon}</div>
                                <h3 className="font-semibold mb-2">{feature.title}</h3>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Плавающая кнопка настроек */}
            <div className="fixed bottom-6 right-6 z-50">
                <ThemeToggle variant="icon" showSettings />
            </div>
        </div>
    );
}
