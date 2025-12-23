"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Bell,
    BellOff,
    Volume2,
    VolumeX,
    Moon,
    Sun,
    Palette,
    Globe,
    LogOut,
    Vibrate,
    Eye,
    EyeOff,
    Download,
    Trash2,
    Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileSettingsPanelProps {
    isVisible: boolean;
    onClose: () => void;
    settings: {
        notifications: boolean;
        sounds: boolean;
        vibration: boolean;
        darkMode: boolean;
        language: string;
        theme: string;
        privacy: {
            showOnlineStatus: boolean;
            showLastSeen: boolean;
        };
    };
    onSettingChange: (key: string, value: any) => void;
    onLogout: () => void;
    onExportData?: () => void;
    onClearData?: () => void;
    className?: string;
}

export function MobileSettingsPanel({
    isVisible,
    onClose,
    settings,
    onSettingChange,
    onLogout,
    onExportData,
    onClearData,
    className
}: MobileSettingsPanelProps) {
    const [activeSection, setActiveSection] = useState<string | null>(null);

    const themes = [
        { id: 'cyberpunk', name: 'Киберпанк', colors: ['#00ffff', '#ff00ff'] },
        { id: 'neon', name: 'Неон', colors: ['#ff6b6b', '#4ecdc4'] },
        { id: 'matrix', name: 'Матрица', colors: ['#00ff00', '#008000'] },
        { id: 'sunset', name: 'Закат', colors: ['#ff7b7b', '#ffa500'] },
        { id: 'ocean', name: 'Океан', colors: ['#0077be', '#00a8cc'] }
    ];

    const languages = [
        { code: 'ru', name: 'Русский', flag: '🇷🇺' },
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'es', name: 'Español', flag: '🇪🇸' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
        { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
    ];

    const SettingItem = ({
        icon: Icon,
        title,
        description,
        children,
        onClick,
        danger = false
    }: {
        icon: React.ElementType;
        title: string;
        description?: string;
        children?: React.ReactNode;
        onClick?: () => void;
        danger?: boolean;
    }) => (
        <motion.div
            className={cn(
                "flex items-center gap-4 p-4 rounded-xl transition-all duration-200",
                onClick && "cursor-pointer hover:bg-white/5 active:bg-white/10",
                danger && "hover:bg-red-500/10"
            )}
            whileTap={onClick ? { scale: 0.98 } : undefined}
            onClick={onClick}
        >
            <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                danger ? "bg-red-500/20 text-red-400" : "bg-neutral-800 text-neutral-300"
            )}>
                <Icon className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
                <div className={cn(
                    "font-medium",
                    danger ? "text-red-400" : "text-white"
                )}>
                    {title}
                </div>
                {description && (
                    <div className="text-sm text-neutral-400 mt-1">
                        {description}
                    </div>
                )}
            </div>

            {children}
        </motion.div>
    );

    const Toggle = ({
        checked,
        onChange,
        disabled = false
    }: {
        checked: boolean;
        onChange: (checked: boolean) => void;
        disabled?: boolean;
    }) => (
        <button
            onClick={() => !disabled && onChange(!checked)}
            disabled={disabled}
            className={cn(
                "relative w-12 h-6 rounded-full transition-all duration-200 touch-target",
                checked ? "bg-cyan-500" : "bg-neutral-600",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            <motion.div
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-lg"
                animate={{ x: checked ? 26 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
        </button>
    );

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-40"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={cn(
                            "fixed right-0 top-0 bottom-0 w-80 max-w-[90vw] bg-neutral-900 border-l border-white/10 z-50 flex flex-col",
                            className
                        )}
                    >
                        {/* Заголовок */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h2 className="text-lg font-bold text-white">Настройки</h2>
                            <button
                                onClick={onClose}
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors touch-target"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Содержимое */}
                        <div className="flex-1 overflow-y-auto mobile-scroll-y settings-panel">
                            {/* Уведомления */}
                            <div className="p-4 border-b border-white/10">
                                <h3 className="text-sm font-medium text-neutral-400 mb-4 uppercase tracking-wide">
                                    Уведомления
                                </h3>

                                <div className="space-y-2">
                                    <SettingItem
                                        icon={settings.notifications ? Bell : BellOff}
                                        title="Push-уведомления"
                                        description="Получать уведомления о новых сообщениях"
                                    >
                                        <Toggle
                                            checked={settings.notifications}
                                            onChange={(checked) => onSettingChange('notifications', checked)}
                                        />
                                    </SettingItem>

                                    <SettingItem
                                        icon={settings.sounds ? Volume2 : VolumeX}
                                        title="Звуки"
                                        description="Звуковые уведомления"
                                    >
                                        <Toggle
                                            checked={settings.sounds}
                                            onChange={(checked) => onSettingChange('sounds', checked)}
                                            disabled={!settings.notifications}
                                        />
                                    </SettingItem>

                                    <SettingItem
                                        icon={Vibrate}
                                        title="Вибрация"
                                        description="Вибрация при уведомлениях"
                                    >
                                        <Toggle
                                            checked={settings.vibration}
                                            onChange={(checked) => onSettingChange('vibration', checked)}
                                            disabled={!settings.notifications}
                                        />
                                    </SettingItem>
                                </div>
                            </div>

                            {/* Внешний вид */}
                            <div className="p-4 border-b border-white/10">
                                <h3 className="text-sm font-medium text-neutral-400 mb-4 uppercase tracking-wide">
                                    Внешний вид
                                </h3>

                                <div className="space-y-2">
                                    <SettingItem
                                        icon={settings.darkMode ? Moon : Sun}
                                        title="Темная тема"
                                        description="Использовать темное оформление"
                                    >
                                        <Toggle
                                            checked={settings.darkMode}
                                            onChange={(checked) => onSettingChange('darkMode', checked)}
                                        />
                                    </SettingItem>

                                    <SettingItem
                                        icon={Palette}
                                        title="Цветовая схема"
                                        description={themes.find(t => t.id === settings.theme)?.name || 'Киберпанк'}
                                        onClick={() => setActiveSection(activeSection === 'theme' ? null : 'theme')}
                                    />

                                    <AnimatePresence>
                                        {activeSection === 'theme' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="ml-14 space-y-2 overflow-hidden"
                                            >
                                                {themes.map((theme) => (
                                                    <button
                                                        key={theme.id}
                                                        onClick={() => {
                                                            onSettingChange('theme', theme.id);
                                                            setActiveSection(null);
                                                        }}
                                                        className={cn(
                                                            "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
                                                            settings.theme === theme.id
                                                                ? "bg-cyan-500/20 border border-cyan-500/30"
                                                                : "hover:bg-white/5"
                                                        )}
                                                    >
                                                        <div className="flex gap-1">
                                                            {theme.colors.map((color, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="w-4 h-4 rounded-full"
                                                                    style={{ backgroundColor: color }}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-white text-sm">{theme.name}</span>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Язык */}
                            <div className="p-4 border-b border-white/10">
                                <h3 className="text-sm font-medium text-neutral-400 mb-4 uppercase tracking-wide">
                                    Язык и регион
                                </h3>

                                <SettingItem
                                    icon={Globe}
                                    title="Язык интерфейса"
                                    description={languages.find(l => l.code === settings.language)?.name || 'Русский'}
                                    onClick={() => setActiveSection(activeSection === 'language' ? null : 'language')}
                                />

                                <AnimatePresence>
                                    {activeSection === 'language' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="ml-14 space-y-2 overflow-hidden"
                                        >
                                            {languages.map((language) => (
                                                <button
                                                    key={language.code}
                                                    onClick={() => {
                                                        onSettingChange('language', language.code);
                                                        setActiveSection(null);
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
                                                        settings.language === language.code
                                                            ? "bg-cyan-500/20 border border-cyan-500/30"
                                                            : "hover:bg-white/5"
                                                    )}
                                                >
                                                    <span className="text-xl">{language.flag}</span>
                                                    <span className="text-white text-sm">{language.name}</span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Приватность */}
                            <div className="p-4 border-b border-white/10">
                                <h3 className="text-sm font-medium text-neutral-400 mb-4 uppercase tracking-wide">
                                    Приватность
                                </h3>

                                <div className="space-y-2">
                                    <SettingItem
                                        icon={settings.privacy.showOnlineStatus ? Eye : EyeOff}
                                        title="Показывать статус онлайн"
                                        description="Другие пользователи видят, когда вы онлайн"
                                    >
                                        <Toggle
                                            checked={settings.privacy.showOnlineStatus}
                                            onChange={(checked) => onSettingChange('privacy.showOnlineStatus', checked)}
                                        />
                                    </SettingItem>

                                    <SettingItem
                                        icon={settings.privacy.showLastSeen ? Eye : EyeOff}
                                        title="Показывать время последнего визита"
                                        description="Другие пользователи видят, когда вы были онлайн"
                                    >
                                        <Toggle
                                            checked={settings.privacy.showLastSeen}
                                            onChange={(checked) => onSettingChange('privacy.showLastSeen', checked)}
                                        />
                                    </SettingItem>
                                </div>
                            </div>

                            {/* Данные */}
                            <div className="p-4 border-b border-white/10">
                                <h3 className="text-sm font-medium text-neutral-400 mb-4 uppercase tracking-wide">
                                    Данные
                                </h3>

                                <div className="space-y-2">
                                    {onExportData && (
                                        <SettingItem
                                            icon={Download}
                                            title="Экспорт данных"
                                            description="Скачать копию ваших данных"
                                            onClick={onExportData}
                                        />
                                    )}

                                    {onClearData && (
                                        <SettingItem
                                            icon={Trash2}
                                            title="Очистить данные"
                                            description="Удалить все локальные данные"
                                            onClick={onClearData}
                                            danger
                                        />
                                    )}
                                </div>
                            </div>

                            {/* О приложении */}
                            <div className="p-4 border-b border-white/10">
                                <h3 className="text-sm font-medium text-neutral-400 mb-4 uppercase tracking-wide">
                                    О приложении
                                </h3>

                                <SettingItem
                                    icon={Info}
                                    title="ЧАТ ДЛЯ НАС"
                                    description="Версия 1.0.0"
                                />
                            </div>

                            {/* Выход */}
                            <div className="p-4">
                                <SettingItem
                                    icon={LogOut}
                                    title="Выйти из аккаунта"
                                    description="Завершить текущую сессию"
                                    onClick={onLogout}
                                    danger
                                />
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
