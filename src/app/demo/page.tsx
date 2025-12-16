"use client";

import { useState } from 'react';
import { MessageCircle, PenTool, Users, Send, Gamepad2 } from 'lucide-react';

export default function DemoPage() {
    const [activeTab, setActiveTab] = useState<'chat' | 'games' | 'canvas' | 'users'>('chat');
    const [message, setMessage] = useState('');

    const handleSendMessage = () => {
        if (!message.trim()) return;

        // Haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }

        alert('Сообщение отправлено! ✨');
        setMessage('');
    };

    const tabs = [
        { id: 'chat' as const, label: 'Чат', icon: MessageCircle },
        { id: 'games' as const, label: 'Игры', icon: Gamepad2 },
        { id: 'canvas' as const, label: 'Холст', icon: PenTool, isCenter: true },
        { id: 'users' as const, label: 'Люди', icon: Users },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'chat':
                return (
                    <div className="flex flex-col h-full p-4 relative">
                        <div className="absolute inset-0 bg-gradient-mesh opacity-20 pointer-events-none" />

                        <div className="flex-1 flex flex-col justify-center items-center space-y-6 relative z-10">
                            <div className="relative">
                                <MessageCircle className="w-20 h-20 text-cyan-400 neon-glow-cyan" />
                                <div className="absolute -inset-4 bg-cyan-400/10 rounded-full animate-ping" />
                            </div>

                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold text-white">Киберчат</h2>
                                <p className="text-neutral-400 text-center max-w-sm">
                                    Общение будущего с haptic feedback и дружелюбными уведомлениями
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 relative z-10">
                            <div className="flex gap-3 hud-panel p-3">
                                <input
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
                                <button
                                    onClick={handleSendMessage}
                                    className="p-3 bg-gradient-to-br from-cyan-500 to-purple-600 text-white rounded-xl hover:neon-glow disabled:opacity-50 min-w-[48px] flex items-center justify-center transition-all duration-300 active:scale-95"
                                    disabled={!message.trim()}
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
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
                            </div>
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
                                Пользователи онлайн с анимированными аватарами
                            </p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="h-screen bg-black text-white relative overflow-hidden">
            {/* Cyberpunk background with noise */}
            <div className="absolute inset-0 bg-gradient-mesh" />

            {/* Device info HUD */}
            <div className="absolute top-4 left-4 z-10 p-3 hud-panel text-xs space-y-1">
                <div className="text-cyan-400">📱 Mobile UI Demo</div>
                <div className="text-purple-400">🎮 Cyberpunk Style</div>
                <div className="text-green-400">📳 Haptic Feedback</div>
            </div>

            {/* Main content */}
            <div className="relative z-10 h-full flex flex-col">
                <div className="flex-1 overflow-hidden">
                    {renderTabContent()}
                </div>

                {/* Cyberpunk Navigation */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 hud-panel border-t-0 rounded-t-3xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                    <div className="flex items-end justify-around px-2 py-2 relative">
                        {tabs.map((tab) => {
                            const isCenter = 'isCenter' in tab && tab.isCenter;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        if ('vibrate' in navigator) {
                                            navigator.vibrate(isCenter ? [15, 10, 15] : 10);
                                        }
                                        setActiveTab(tab.id);
                                    }}
                                    className={`
                    flex flex-col items-center justify-center gap-1 transition-all duration-300 min-w-[44px] touch-manipulation relative
                    ${isCenter
                                            ? "px-4 py-4 -mt-4 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 text-black shadow-2xl min-h-[64px] min-w-[64px] transform active:scale-90"
                                            : "px-3 py-3 rounded-2xl min-h-[44px] transform active:scale-95"
                                        }
                    ${activeTab === tab.id && !isCenter
                                            ? "bg-gradient-to-t from-cyan-500/30 to-blue-500/30 text-cyan-300 scale-105 neon-glow-cyan"
                                            : activeTab === tab.id && isCenter
                                                ? "neon-glow scale-110"
                                                : !isCenter && "text-neutral-400 hover:text-white hover:bg-white/10 hover:scale-105"
                                        }
                  `}
                                >
                                    <tab.icon className={isCenter ? "w-7 h-7" : "w-5 h-5"} />
                                    <span className={`font-medium ${isCenter ? "text-xs font-bold" : "text-xs"}`}>
                                        {tab.label}
                                    </span>

                                    {isCenter && activeTab === tab.id && (
                                        <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-500/20 animate-ping" />
                                    )}
                                </button>
                            );
                        })}

                        {/* Profile Avatar */}
                        <button
                            onClick={() => {
                                if ('vibrate' in navigator) {
                                    navigator.vibrate(10);
                                }
                                alert('Профиль открыт! 👤');
                            }}
                            className="flex flex-col items-center justify-center gap-1 px-3 py-3 rounded-2xl transition-all duration-300 min-w-[44px] min-h-[44px] transform active:scale-95 touch-manipulation relative text-neutral-400 hover:text-white hover:bg-white/10 hover:scale-105"
                        >
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-black text-xs font-bold">
                                А
                            </div>
                            <span className="text-xs font-medium">Профиль</span>

                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black animate-pulse" />
                        </button>
                    </div>
                </nav>
            </div>
        </div>
    );
}
