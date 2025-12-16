"use client";

import { useState } from 'react';
import { MobileNavigation } from '../mobile/MobileNavigation';
import { MobileErrorHandler } from '../mobile/MobileErrorHandler';
import { AnimatedTabTransition } from '../layout/AnimatedTabTransition';
import { KeyboardAwareInput, KeyboardAwareContainer } from '../mobile/KeyboardAwareInput';
import { ToastContainer, useToastNotifications } from '../ui/toast-notification';
import { useDeviceInfo, useHapticFeedback } from '../../hooks/use-mobile';
import { AnimatedButton } from '../layout/AnimatedTabTransition';
import { MessageCircle, Gamepad2, PenTool, Users, Send, Wifi, WifiOff } from 'lucide-react';

export function MobileUIShowcase() {
    const [activeTab, setActiveTab] = useState<'chat' | 'games' | 'canvas' | 'users'>('chat');
    const [isCollabSpaceVisible, setIsCollabSpaceVisible] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [isConnected, setIsConnected] = useState(true);
    const [message, setMessage] = useState('');

    const deviceInfo = useDeviceInfo();
    const haptic = useHapticFeedback();
    const { toasts, addToast, dismissToast } = useToastNotifications();

    const handleSendMessage = () => {
        if (!message.trim()) return;

        haptic.lightTap();
        addToast({
            type: 'success',
            title: 'Сообщение отправлено',
            description: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
            duration: 3000,
        });
        setMessage('');
    };

    const handleError = () => {
        haptic.errorFeedback();
        addToast({
            type: 'error',
            title: 'Ошибка отправки',
            description: 'Не удалось отправить сообщение',
            action: {
                label: 'Повторить',
                onClick: () => {
                    haptic.lightTap();
                    addToast({
                        type: 'info',
                        title: 'Повторная отправка...',
                    });
                }
            }
        });
    };

    const handleWarning = () => {
        haptic.mediumTap();
        addToast({
            type: 'warning',
            title: 'Слабое соединение',
            description: 'Проверьте подключение к интернету',
        });
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'chat':
                return (
                    <div className="flex flex-col h-full p-4">
                        <div className="flex-1 flex flex-col justify-center items-center space-y-4">
                            <MessageCircle className="w-16 h-16 text-cyan-400" />
                            <h2 className="text-xl font-bold text-white">Чат</h2>
                            <p className="text-neutral-400 text-center">
                                Улучшенный UI с glassmorphism эффектами и haptic feedback
                            </p>

                            <div className="space-y-2 w-full max-w-sm">
                                <AnimatedButton
                                    onClick={() => addToast({
                                        type: 'success',
                                        title: 'Успех!',
                                        description: 'Это успешное уведомление'
                                    })}
                                    className="w-full p-3 bg-green-600/20 text-green-300 rounded-xl border border-green-500/30 glass"
                                >
                                    Показать успех
                                </AnimatedButton>

                                <AnimatedButton
                                    onClick={handleError}
                                    className="w-full p-3 bg-red-600/20 text-red-300 rounded-xl border border-red-500/30 glass"
                                >
                                    Показать ошибку
                                </AnimatedButton>

                                <AnimatedButton
                                    onClick={handleWarning}
                                    className="w-full p-3 bg-yellow-600/20 text-yellow-300 rounded-xl border border-yellow-500/30 glass"
                                >
                                    Показать предупреждение
                                </AnimatedButton>
                            </div>
                        </div>

                        <KeyboardAwareContainer className="mt-4">
                            <div className="flex gap-2">
                                <KeyboardAwareInput
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Введите сообщение..."
                                    className="flex-1 p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-400 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSendMessage();
                                        }
                                    }}
                                />
                                <AnimatedButton
                                    onClick={handleSendMessage}
                                    className="p-3 bg-cyan-600 text-white rounded-xl hover:bg-cyan-500 disabled:opacity-50"
                                    disabled={!message.trim()}
                                >
                                    <Send className="w-5 h-5" />
                                </AnimatedButton>
                            </div>
                        </KeyboardAwareContainer>
                    </div>
                );

            case 'games':
                return (
                    <div className="flex flex-col h-full justify-center items-center p-4 space-y-4">
                        <Gamepad2 className="w-16 h-16 text-purple-400" />
                        <h2 className="text-xl font-bold text-white">Игры</h2>
                        <p className="text-neutral-400 text-center">
                            Интерактивные игры с улучшенными анимациями
                        </p>
                        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                            <div className="p-4 glass rounded-xl text-center">
                                <div className="w-8 h-8 bg-purple-500 rounded-full mx-auto mb-2"></div>
                                <span className="text-sm text-white">Лабиринт</span>
                            </div>
                            <div className="p-4 glass rounded-xl text-center">
                                <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-2"></div>
                                <span className="text-sm text-white">Викторина</span>
                            </div>
                        </div>
                    </div>
                );

            case 'canvas':
                return (
                    <div className="flex flex-col h-full justify-center items-center p-4 space-y-4">
                        <PenTool className="w-16 h-16 text-orange-400" />
                        <h2 className="text-xl font-bold text-white">Холст</h2>
                        <p className="text-neutral-400 text-center">
                            Совместное рисование с улучшенными жестами и плавающими инструментами
                        </p>
                        <div className="w-full max-w-sm h-32 bg-gradient-to-br from-neutral-900 to-black rounded-xl border border-white/10 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20">
                                {/* Grid pattern */}
                                <div className="w-full h-full" style={{
                                    backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                  `,
                                    backgroundSize: '20px 20px'
                                }}></div>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-neutral-500 text-sm">Область для рисования</span>
                            </div>
                        </div>
                    </div>
                );

            case 'users':
                return (
                    <div className="flex flex-col h-full justify-center items-center p-4 space-y-4">
                        <Users className="w-16 h-16 text-green-400" />
                        <h2 className="text-xl font-bold text-white">Люди</h2>
                        <p className="text-neutral-400 text-center">
                            Список пользователей онлайн с анимированными аватарами
                        </p>
                        <div className="space-y-2 w-full max-w-sm">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-3 p-3 glass rounded-xl">
                                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-black font-bold">
                                        {i}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-white font-medium">Пользователь {i}</div>
                                        <div className="text-neutral-400 text-sm">Онлайн</div>
                                    </div>
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="h-screen-dynamic bg-black text-white relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-mesh opacity-30"></div>

            {/* Device info overlay */}
            <div className="absolute top-4 left-4 z-10 p-2 glass-dark rounded-lg text-xs">
                <div>📱 {deviceInfo.isMobile ? 'Mobile' : 'Desktop'}</div>
                <div>🔄 {deviceInfo.orientation}</div>
                <div>📳 {deviceInfo.supportsVibration ? 'Haptic ✓' : 'No Haptic'}</div>
            </div>

            {/* Connection controls */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <AnimatedButton
                    onClick={() => setIsOnline(!isOnline)}
                    className={`p-2 rounded-lg glass ${isOnline ? 'text-green-400' : 'text-red-400'}`}
                >
                    {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                </AnimatedButton>
            </div>

            {/* Main content */}
            <div className="relative z-10 h-full flex flex-col">
                <div className="flex-1 overflow-hidden">
                    <AnimatedTabTransition activeTab={activeTab}>
                        {renderTabContent()}
                    </AnimatedTabTransition>
                </div>

                {/* Mobile Navigation */}
                <MobileNavigation
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    isCollabSpaceVisible={isCollabSpaceVisible}
                    onToggleCollabSpace={() => setIsCollabSpaceVisible(!isCollabSpaceVisible)}
                />
            </div>

            {/* Error Handler */}
            <MobileErrorHandler
                isOnline={isOnline}
                isConnected={isConnected}
                lastError={null}
                onRetry={() => {
                    haptic.lightTap();
                    setIsConnected(true);
                }}
            />

            {/* Toast Notifications */}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </div>
    );
}
