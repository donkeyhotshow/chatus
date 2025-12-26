"use client";

import { useState, useEffect } from 'react';
import { X, Moon, Sun, Bell, Volume2, Trash2, Settings, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { getNotificationSound } from '@/lib/notification-sound';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onClearChat?: () => void;
}

export function SettingsPanel({ isOpen, onClose, onClearChat }: SettingsPanelProps) {
    const [darkMode, setDarkMode] = useState(true);
    const [notifications, setNotifications] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [soundVolume, setSoundVolume] = useState([50]);

    // P3 Fix: Загрузка настроек звуковых уведомлений
    useEffect(() => {
        const notifier = getNotificationSound();
        setSoundEnabled(notifier.isEnabled());
    }, []);

    // P3 Fix: Обработчик изменения настройки звука
    const handleSoundToggle = (enabled: boolean) => {
        setSoundEnabled(enabled);
        const notifier = getNotificationSound();
        notifier.setEnabled(enabled);
    };

    // P3 Fix: Тестовое воспроизведение звука
    const handleTestSound = async () => {
        const notifier = getNotificationSound();
        await notifier.testSound();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-black/95 rounded-2xl w-full max-w-md border border-white/[0.08] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
                            <Settings className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-lg font-semibold text-white">Настройки</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4 overflow-y-auto overflow-x-hidden mobile-scroll-y max-h-[70vh]">
                    {/* Theme */}
                    <div className={cn(
                        "flex items-center justify-between p-4 rounded-xl",
                        "bg-white/[0.02] border border-white/[0.06]",
                        "hover:bg-white/[0.04] transition-colors"
                    )}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
                                {darkMode ? <Moon className="h-5 w-5 text-violet-400" /> : <Sun className="h-5 w-5 text-amber-400" />}
                            </div>
                            <div>
                                <Label htmlFor="dark-mode" className="text-white font-medium">Тёмная тема</Label>
                                <p className="text-xs text-white/40 mt-0.5">Комфорт для глаз</p>
                            </div>
                        </div>
                        <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
                    </div>

                    {/* Notifications */}
                    <div className={cn(
                        "flex items-center justify-between p-4 rounded-xl",
                        "bg-white/[0.02] border border-white/[0.06]",
                        "hover:bg-white/[0.04] transition-colors"
                    )}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
                                <Bell className={cn("h-5 w-5", notifications ? "text-emerald-400" : "text-white/40")} />
                            </div>
                            <div>
                                <Label htmlFor="notifications" className="text-white font-medium">Уведомления</Label>
                                <p className="text-xs text-white/40 mt-0.5">Push-уведомления</p>
                            </div>
                        </div>
                        <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
                    </div>

                    {/* P3 Fix: Sound Notifications */}
                    <div className={cn(
                        "p-4 rounded-xl space-y-3",
                        "bg-white/[0.02] border border-white/[0.06]"
                    )}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
                                    <Volume2 className={cn("h-5 w-5", soundEnabled ? "text-blue-400" : "text-white/40")} />
                                </div>
                                <div>
                                    <Label htmlFor="sound-notifications" className="text-white font-medium">Звук сообщений</Label>
                                    <p className="text-xs text-white/40 mt-0.5">Звуковые уведомления</p>
                                </div>
                            </div>
                            <Switch
                                id="sound-notifications"
                                checked={soundEnabled}
                                onCheckedChange={handleSoundToggle}
                            />
                        </div>

                        {/* Test sound button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleTestSound}
                            className="w-full h-9 text-xs text-white/60 hover:text-white hover:bg-white/[0.06]"
                        >
                            <Play className="h-3 w-3 mr-2" />
                            Проверить звук
                        </Button>
                    </div>

                    {/* Clear chat */}
                    {onClearChat && (
                        <Button
                            variant="destructive"
                            className="w-full h-12 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                            onClick={onClearChat}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Очистить историю чата
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
