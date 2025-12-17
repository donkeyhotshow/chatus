"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MobileProfileCreation } from './MobileProfileCreation';
import { MobileChatInterface } from './MobileChatInterface';
import { MobilePixelAvatarEditor } from './MobilePixelAvatarEditor';
import { useIsMobile } from '@/hooks/use-mobile';

export function MobileTestPage() {
    const [currentView, setCurrentView] = useState<'menu' | 'profile' | 'chat' | 'editor'>('menu');
    const [userProfile, setUserProfile] = useState<{ avatar: string; name: string } | null>(null);
    const isMobile = useIsMobile();

    // Mock данные для тестирования
    const mockUsers = [
        {
            id: '1',
            name: 'Алексей',
            isOnline: true,
            role: 'admin' as const,
            isTyping: false
        },
        {
            id: '2',
            name: 'Мария',
            isOnline: true,
            role: 'moderator' as const,
            isTyping: true
        },
        {
            id: 'current',
            name: userProfile?.name || 'Вы',
            avatar: userProfile?.avatar,
            isOnline: true,
            role: 'member' as const
        }
    ];

    const mockMessages = [
        {
            id: '1',
            text: 'Добро пожаловать в мобильный чат!',
            userId: '1',
            userName: 'Алексей',
            timestamp: new Date(Date.now() - 1000 * 60 * 5),
            isOwn: false
        },
        {
            id: '2',
            text: 'Отличный интерфейс! 👍',
            userId: '2',
            userName: 'Мария',
            timestamp: new Date(Date.now() - 1000 * 60 * 3),
            isOwn: false
        }
    ];

    if (!isMobile) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="max-w-md mx-auto text-center">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center">
                        <span className="text-3xl">📱</span>
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-4">
                        Мобильная версия
                    </h1>

                    <p className="text-neutral-400 mb-6">
                        Откройте DevTools (F12) → Device Mode (Ctrl+Shift+M) → Выберите мобильное устройство
                    </p>

                    <div className="bg-neutral-800 rounded-xl p-4 text-left">
                        <h3 className="text-white font-medium mb-2">Инструкция:</h3>
                        <ol className="text-sm text-neutral-300 space-y-1">
                            <li>1. Нажмите F12</li>
                            <li>2. Нажмите Ctrl+Shift+M</li>
                            <li>3. Выберите iPhone или Android</li>
                            <li>4. Обновите страницу</li>
                        </ol>
                    </div>
                </div>
            </div>
        );
    }

    const handleProfileComplete = (profile: { avatar: string; name: string }) => {
        setUserProfile(profile);
        setCurrentView('chat');
    };

    const handleSendMessage = (text: string) => {
        console.log('Отправка сообщения:', text);
    };

    const handleAvatarSave = (dataUrl: string) => {
        console.log('Аватар сохранен:', dataUrl);
    };

    if (currentView === 'profile') {
        return (
            <MobileProfileCreation
                onComplete={handleProfileComplete}
                onCancel={() => setCurrentView('menu')}
            />
        );
    }

    if (currentView === 'chat' && userProfile) {
        return (
            <MobileChatInterface
                roomName="Тестовая комната"
                currentUser={{
                    id: 'current',
                    name: userProfile.name,
                    avatar: userProfile.avatar,
                    isOnline: true
                }}
                users={mockUsers}
                messages={mockMessages}
                onBack={() => setCurrentView('menu')}
                onSendMessage={handleSendMessage}
            />
        );
    }

    if (currentView === 'editor') {
        return (
            <div className="min-h-screen bg-black p-4">
                <div className="max-w-md mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => setCurrentView('menu')}
                            className="text-white hover:text-cyan-400 transition-colors"
                        >
                            ← Назад
                        </button>
                        <h1 className="text-xl font-bold text-white">Редактор аватара</h1>
                        <div></div>
                    </div>

                    <MobilePixelAvatarEditor
                        onSave={handleAvatarSave}
                    />
                </div>
            </div>
        );
    }

    // Главное меню
    return (
        <div className="min-h-screen bg-black p-4">
            <div className="max-w-md mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-3xl font-bold text-white mb-2">ЧАТ ДЛЯ НАС</h1>
                    <p className="text-neutral-400">Мобильная версия</p>
                </motion.div>

                <div className="space-y-4">
                    <motion.button
                        onClick={() => setCurrentView('profile')}
                        className="w-full p-6 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl font-semibold text-lg shadow-lg"
                        whileTap={{ scale: 0.95 }}
                    >
                        🎨 Создать профиль
                    </motion.button>

                    <motion.button
                        onClick={() => setCurrentView('editor')}
                        className="w-full p-6 bg-neutral-800 text-white rounded-2xl font-semibold text-lg"
                        whileTap={{ scale: 0.95 }}
                    >
                        🖼️ Редактор аватара
                    </motion.button>

                    {userProfile && (
                        <motion.button
                            onClick={() => setCurrentView('chat')}
                            className="w-full p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold text-lg shadow-lg"
                            whileTap={{ scale: 0.95 }}
                        >
                            💬 Открыть чат
                        </motion.button>
                    )}
                </div>

                {userProfile && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-8 p-4 bg-neutral-800 rounded-2xl"
                    >
                        <h3 className="text-white font-medium mb-3">Ваш профиль:</h3>
                        <div className="flex items-center gap-3">
                            <img
                                src={userProfile.avatar}
                                alt="Avatar"
                                className="w-12 h-12 rounded-xl"
                            />
                            <div>
                                <div className="text-white font-medium">{userProfile.name}</div>
                                <div className="text-neutral-400 text-sm">Готов к чату!</div>
                            </div>
                        </div>
                    </motion.div>
                )}

                <div className="mt-8 text-center">
                    <p className="text-neutral-500 text-sm">
                        Используйте жесты: свайпы, долгие нажатия, тап-и-удержание
                    </p>
                </div>
            </div>
        </div>
    );
}
