"use client";

import { useState } from 'react';
import { MobileNavigation } from '../mobile/MobileNavigation';
import { MobileErrorHandler } from '../mobile/MobileErrorHandler';
import { AnimatedTabTransition } from '../layout/AnimatedTabTransition';
import { KeyboardAwareInput, KeyboardAwareContainer } from '../mobile/KeyboardAwareInput';
import { ToastContainer, useToastNotifications } from '../ui/toast-notification';
import { useDeviceInfo } from '../../hooks/use-mobile';
import { useSoundDesign } from '../../hooks/use-sound-design';
import { ConfettiEffect, useConfetti } from '../effects/ConfettiEffect';
import { getRandomMessage, getRandomEmoji } from '../../utils/friendly-messages';
import { AnimatedButton } from '../layout/AnimatedTabTransition';
import { MessageCircle, Gamepad2, PenTool, Users, Send, Wifi, WifiOff, Palette, Sparkles } from 'lucide-react';

export function CyberpunkUIShowcase() {
    const [activeTab, setActiveTab] = useState<'chat' | 'games' | 'canvas' | 'users'>('chat');
    const [isCollabSpaceVisible, setIsCollabSpaceVisible] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [isConnected, setIsConnected] = useState(true);
    const [message, setMessage] = useState('');
    const [confettiTrigger, setConfettiTrigger] = useState(false);
    const [confettiType] = useState<'success' | 'avatar' | 'canvas' | 'achievement'>('success');

    const deviceInfo = useDeviceInfo();
    const soundDesign = useSoundDesign();
    const confetti = useConfetti();
    const { toasts, addToast, dismissToast } = useToastNotifications();

    const handleSendMessage = async () => {
        if (!message.trim()) return;

        await soundDesign.playMessageSent();
        addToast({
            type: 'success',
            title: getRandomMessage('success'),
            description: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
            duration: 3000,
        });
        setMessage('');
    };

    const handleError = async () => {
        await soundDesign.playError();
        addToast({
            type: 'error',
            title: getRandomMessage('messageFailed'),
            description: 'Попробуйте ещё раз через секундочку',
            action: {
                label: 'Повторить',
                onClick: async () => {
                    await soundDesign.playButtonPress();
                    addToast({
                        type: 'info',
                        title: getRandomMessage('reconnecting'),
                    });
                }
            }
        });
    };

    const handleWarning = async () => {
        await soundDesign.playButtonPress();
        addToast({
            type: 'warning',
            title: getRandomMessage('networkError'),
            description: 'Проверьте подключение к интернету',
        });
    };

    const handleAvatarSave = async () => {
        await soundDesign.playSuccess();
        confetti.triggerAvatar();
        addToast({
            type: 'success',
            title: 'Аватар сохранён! 🎨',
            description: 'Теперь все увидят ваш новый стиль',
        });
    };

    const handleCanvasSave = async () => {
        await soundDesign.playCanvasSaved();
        confetti.triggerCanvas();
        addToast({
            type: 'success',
            title: 'Шедевр готов! 🖼️',
            description: 'Рисунок сохранён в галерею',
        });
    };

    const handleColorSelect = async () => {
        await soundDesign.playColorSelect();
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'chat':
                return (
                    <div className="flex flex-col h-full p-4 relative">
                        {/* Cyberpunk background effects */}
                        <div className="absolute inset-0 bg-gradient-mesh opacity-20 pointer-events-none" />

                        <div className="flex-1 flex flex-col justify-center items-center space-y-6 relative z-10">
                            <div className="relative">
                                <MessageCircle className="w-20 h-20 text-cyan-400 neon-glow-cyan" />
                                <div className="absolute -inset-4 bg-cyan-400/10 rounded-full animate-ping" />
                            </div>

                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold text-white">Киберчат</h2>
                                <p className="text-neutral-400 text-center max-w-sm">
                                    Общение будущего с haptic feedback, звуковым дизайном и дружелюбными уведомлениями
                                </p>
                            </div>

                            <div className="space-y-3 w-full max-w-sm">
                                <AnimatedButton
                                    onClick={() => addToast({
                                        type: 'success',
                                        title: getRandomMessage('success') + ' ' + getRandomEmoji('success'),
                                        description: 'Это успешное уведомление в киберпанк стиле'
                                    })}
                                    className="w-full p-4 hud-panel text-cyan-300 hover:neon-glow-cyan transition-all duration-300"
                                >
                                    <Sparkles className="w-5 h-5 mr-2" />
                                    Показать успех
                                </AnimatedButton>

                                <AnimatedButton
                                    onClick={handleError}
                                    className="w-full p-4 glass text-red-300 border-red-500/30 hover:neon-glow-pink transition-all duration-300"
                                >
                                    ⚠️ Показать ошибку
                                </AnimatedButton>

                                <AnimatedButton
                                    onClick={handleWarning}
                                    className="w-full p-4 glass text-yellow-300 border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300"
                                >
                                    📡 Проблемы с сетью
                                </AnimatedButton>
                            </div>
                        </div>

                        <KeyboardAwareContainer className="mt-4 relative z-10">
                            <div className="flex gap-3 hud-panel p-3">
                                <KeyboardAwareInput
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Введите сообщение в будущее..."
                                    className="flex-1 p-3 bg-black/50 border border-cyan-500/30 rounded-xl text-white placeholder-neutral-500 focus:border-cyan-400 focus:neon-glow-cyan transition-all duration-300"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSendMessage();
                                        }
                                    }}
                                />
                                <AnimatedButton
                                    onClick={handleSendMessage}
                                    className="p-3 bg-gradient-to-br from-cyan-500 to-purple-600 text-white rounded-xl hover:neon-glow disabled:opacity-50 min-w-[48px] flex items-center justify-center transition-all duration-300"
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
                    <div className="flex flex-col h-full justify-center items-center p-4 space-y-6 relative">
                        <div className="absolute inset-0 bg-gradient-mesh opacity-15 pointer-events-none" />

                        <div className="relative">
                            <Gamepad2 className="w-20 h-20 text-purple-400 neon-glow" style={{ color: '#8000ff' }} />
                            <div className="absolute -inset-4 bg-purple-400/10 rounded-full animate-pulse" />
                        </div>

                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold text-white">Игровая зона</h2>
                            <p className="text-neutral-400 text-center max-w-sm">
                                Интерактивные игры с конфетти и достижениями
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                            <AnimatedButton
                                onClick={async () => {
                                    await soundDesign.playSuccess();
                                    confetti.triggerAchievement();
                                    addToast({
                                        type: 'success',
                                        title: 'Достижение разблокировано! 🏆',
                                        description: 'Первый клик по лабиринту'
                                    });
                                }}
                                className="p-6 hud-panel text-center hover:neon-glow-cyan transition-all duration-300"
                            >
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl mx-auto mb-3 flex items-center justify-center">
                                    🧩
                                </div>
                                <span className="text-sm text-white font-medium">Лабиринт</span>
                            </AnimatedButton>

                            <AnimatedButton
                                onClick={async () => {
                                    await soundDesign.playButtonPress();
                                    addToast({
                                        type: 'info',
                                        title: 'Скоро! 🚀',
                                        description: 'Викторина в разработке'
                                    });
                                }}
                                className="p-6 glass text-center hover:border-blue-400/50 transition-all duration-300"
                            >
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl mx-auto mb-3 flex items-center justify-center">
                                    🧠
                                </div>
                                <span className="text-sm text-white font-medium">Викторина</span>
                            </AnimatedButton>
                        </div>
                    </div>
                );

            case 'canvas':
                return (
                    <div className="flex flex-col h-full justify-center items-center p-4 space-y-6 relative">
                        <div className="absolute inset-0 bg-gradient-mesh opacity-10 pointer-events-none" />

                        <div className="relative">
                            <PenTool className="w-20 h-20 text-orange-400 neon-glow" style={{ color: '#ff8000' }} />
                            <div className="absolute -inset-4 bg-orange-400/10 rounded-full float" />
                        </div>

                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold text-white">Цифровой холст</h2>
                            <p className="text-neutral-400 text-center max-w-sm">
                                Совместное творчество с шахматным фоном и плавающими инструментами
                            </p>
                        </div>

                        <div className="w-full max-w-sm space-y-4">
                            {/* Демо холста с шахматным фоном */}
                            <div className="h-40 rounded-2xl border border-cyan-500/30 relative overflow-hidden hud-panel">
                                <div className="absolute inset-0" style={{
                                    backgroundImage: `
                    repeating-conic-gradient(#0a0a0a 0% 25%, #1a1a1a 0% 50%) 50% / 16px 16px,
                    linear-gradient(rgba(0,255,255,0.05) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,255,255,0.05) 1px, transparent 1px)
                  `,
                                    backgroundSize: '16px 16px, 40px 40px, 40px 40px'
                                }}></div>

                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-neutral-400 text-sm">Область для творчества</span>
                                </div>

                                {/* Плавающая панель инструментов */}
                                <div className="absolute right-2 top-2 flex flex-col gap-2">
                                    <AnimatedButton
                                        onClick={handleColorSelect}
                                        className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-full border-2 border-white/20 hover:scale-110 transition-all duration-200"
                                    >
                                        <span className="sr-only">Red</span>
                                    </AnimatedButton>
                                    <AnimatedButton
                                        onClick={handleColorSelect}
                                        className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full border-2 border-white/20 hover:scale-110 transition-all duration-200"
                                    >
                                        <span className="sr-only">Blue</span>
                                    </AnimatedButton>
                                    <AnimatedButton
                                        onClick={handleColorSelect}
                                        className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full border-2 border-white/20 hover:scale-110 transition-all duration-200"
                                    >
                                        <span className="sr-only">Green</span>
                                    </AnimatedButton>
                                </div>
                            </div>

                            <AnimatedButton
                                onClick={handleCanvasSave}
                                className="w-full p-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:neon-glow font-medium transition-all duration-300"
                            >
                                <Palette className="w-5 h-5 mr-2" />
                                Сохранить шедевр
                            </AnimatedButton>
                        </div>
                    </div>
                );

            case 'users':
                return (
                    <div className="flex flex-col h-full justify-center items-center p-4 space-y-6 relative">
                        <div className="absolute inset-0 bg-gradient-mesh opacity-12 pointer-events-none" />

                        <div className="relative">
                            <Users className="w-20 h-20 text-green-400 neon-glow" style={{ color: '#00ff80' }} />
                            <div className="absolute -inset-4 bg-green-400/10 rounded-full pulse-glow" />
                        </div>

                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold text-white">Киберсообщество</h2>
                            <p className="text-neutral-400 text-center max-w-sm">
                                Пользователи онлайн с анимированными аватарами и статусами
                            </p>
                        </div>

                        <div className="space-y-3 w-full max-w-sm">
                            {[
                                { name: 'Алекс', status: 'Рисует', color: 'from-cyan-400 to-blue-500', online: true },
                                { name: 'Мария', status: 'В игре', color: 'from-purple-400 to-pink-500', online: true },
                                { name: 'Дмитрий', status: 'Читает', color: 'from-green-400 to-emerald-500', online: false },
                            ].map((user, i) => (
                                <AnimatedButton
                                    key={i}
                                    onClick={i === 0 ? handleAvatarSave : () => soundDesign.playButtonPress()}
                                    className="flex items-center gap-4 p-4 hud-panel w-full hover:neon-glow-cyan transition-all duration-300"
                                >
                                    <div className="relative">
                                        <div className={`w-12 h-12 bg-gradient-to-br ${user.color} rounded-full flex items-center justify-center text-black font-bold text-lg`}>
                                            {user.name[0]}
                                        </div>
                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${user.online ? 'bg-green-400' : 'bg-gray-500'} rounded-full border-2 border-black ${user.online ? 'animate-pulse' : ''}`} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="text-white font-medium">{user.name}</div>
                                        <div className="text-neutral-400 text-sm">{user.status}</div>
                                    </div>
                                    {i === 0 && (
                                        <div className="text-xs text-cyan-400 bg-cyan-400/20 px-2 py-1 rounded-full">
                                            Нажми меня!
                                        </div>
                                    )}
                                </AnimatedButton>
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
            {/* Cyberpunk background with noise */}
            <div className="absolute inset-0 bg-gradient-mesh" />

            {/* Device info HUD */}
            <div className="absolute top-4 left-4 z-10 p-3 hud-panel text-xs space-y-1">
                <div className="text-cyan-400">📱 {deviceInfo.isMobile ? 'Mobile' : 'Desktop'}</div>
                <div className="text-purple-400">🔄 {deviceInfo.orientation}</div>
                <div className="text-green-400">📳 {deviceInfo.supportsVibration ? 'Haptic ✓' : 'No Haptic'}</div>
            </div>

            {/* Connection controls */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <AnimatedButton
                    onClick={() => {
                        soundDesign.playButtonPress();
                        setIsOnline(!isOnline);
                    }}
                    className={`p-3 rounded-xl glass ${isOnline ? 'text-green-400 border-green-500/30' : 'text-red-400 border-red-500/30'} hover:neon-glow transition-all duration-300`}
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

                {/* Cyberpunk Navigation */}
                <MobileNavigation
                    activeTab={activeTab}
                    onTabChange={(tab) => {
                        soundDesign.playButtonPress();
                        setActiveTab(tab);
                    }}
                    isCollabSpaceVisible={isCollabSpaceVisible}
                    onToggleCollabSpace={() => {
                        soundDesign.playButtonPress();
                        setIsCollabSpaceVisible(!isCollabSpaceVisible);
                    }}
                />
            </div>

            {/* Error Handler */}
            <MobileErrorHandler
                isOnline={isOnline}
                isConnected={isConnected}
                lastError={null}
                onRetry={() => {
                    soundDesign.playButtonPress();
                    setIsConnected(true);
                }}
            />

            {/* Toast Notifications */}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />

            {/* Confetti Effects */}
            <ConfettiEffect
                trigger={confettiTrigger}
                type={confettiType}
                onComplete={() => setConfettiTrigger(false)}
            />
        </div>
    );
}
