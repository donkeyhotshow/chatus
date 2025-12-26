"use client";

import { useState } from 'react';
import { X, Moon, Sun, Bell, Volume2, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onClearChat?: () => void;
}

export function SettingsPanel({ isOpen, onClose, onClearChat }: SettingsPanelProps) {
    const [darkMode, setDarkMode] = useState(true);
    const [notifications, setNotifications] = useState(true);
    const [soundVolume, setSoundVolume] = useState([50]);

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

                    {/* Volume */}
                    <div className={cn(
                        "p-4 rounded-xl space-y-4",
                        "bg-white/[0.02] border border-white/[0.06]"
                    )}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
                                <Volume2 className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                                <Label className="text-white font-medium">Громкость звуков</Label>
                                <p className="text-xs text-white/40 mt-0.5">{soundVolume[0]}%</p>
                            </div>
                        </div>
                        <Slider
                            value={soundVolume}
                            onValueChange={setSoundVolume}
                            max={100}
                            step={1}
                            className="mt-2"
                        />
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
