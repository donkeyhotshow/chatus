"use client";

import { useState } from 'react';
import { X, Moon, Sun, Bell, Volume2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            {/* BUG-017 FIX: Prevent horizontal scroll on small screens */}
            <div className="bg-[var(--bg-secondary)] rounded-xl w-full max-w-md border border-[var(--border-primary)] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">Настройки</h2>
                    <Button variant="ghost" size="icon" onClick={onClose} className="min-w-[44px] min-h-[44px]">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* BUG-017 FIX: Added overflow-x-hidden to prevent horizontal scroll */}
                <div className="p-4 space-y-6 overflow-y-auto overflow-x-hidden mobile-scroll-y settings-content max-h-[70vh]">
                    {/* Тема */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {darkMode ? <Moon className="h-5 w-5 text-[var(--text-muted)]" /> : <Sun className="h-5 w-5 text-[var(--text-muted)]" />}
                            <Label htmlFor="dark-mode">Тёмная тема</Label>
                        </div>
                        <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
                    </div>

                    {/* Уведомления */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Bell className="h-5 w-5 text-[var(--text-muted)]" />
                            <Label htmlFor="notifications">Уведомления</Label>
                        </div>
                        <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
                    </div>

                    {/* Громкость */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Volume2 className="h-5 w-5 text-[var(--text-muted)]" />
                            <Label>Громкость звуков</Label>
                        </div>
                        <Slider value={soundVolume} onValueChange={setSoundVolume} max={100} step={1} />
                    </div>

                    {/* Очистить чат */}
                    {onClearChat && (
                        <Button variant="destructive" className="w-full" onClick={onClearChat}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Очистить историю чата
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
