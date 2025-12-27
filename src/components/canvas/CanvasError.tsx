"use client";

import { memo } from 'react';
import { RefreshCw, WifiOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ErrorType = 'load' | 'connection' | 'permission' | 'unknown';

interface CanvasErrorProps {
    type?: ErrorType;
    errorCode?: string;
    onRetry?: () => void;
    onReload?: () => void;
    className?: string;
}

const ERROR_MESSAGES: Record<ErrorType, { title: string; description: string; icon: typeof RefreshCw }> = {
    load: {
        title: 'Не удалось загрузить холст',
        description: 'Проверьте подключение к интернету и попробуйте снова',
        icon: RefreshCw,
    },
    connection: {
        title: 'Потеряно соединение',
        description: 'Подключение к серверу прервано. Ваши изменения могут быть не сохранены',
        icon: WifiOff,
    },
    permission: {
        title: 'Нет доступа к холсту',
        description: 'У вас нет прав для редактирования этого холста',
        icon: AlertCircle,
    },
    unknown: {
        title: 'Что-то пошло не так',
        description: 'Произошла неизвестная ошибка. Попробуйте перезагрузить страницу',
        icon: AlertCircle,
    },
};

/**
 * CanvasError - Улучшенный экран ошибки для Canvas
 * Этап 3: Конкретные сообщения, мягкие иконки, Primary/Secondary кнопки
 */
export const CanvasError = memo(function CanvasError({
    type = 'unknown',
    errorCode,
    onRetry,
    onReload,
    className,
}: CanvasErrorProps) {
    const error = ERROR_MESSAGES[type];
    const Icon = error.icon;

    const handleReload = () => {
        if (onReload) {
            onReload();
        } else {
            window.location.reload();
        }
    };

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center p-8 text-center",
                "bg-[var(--bg-primary)] min-h-[300px]",
                className
            )}
            role="alert"
            aria-live="assertive"
        >
            {/* Icon - мягкая вместо warning треугольника */}
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-tertiary)] border border-white/[0.08] flex items-center justify-center mb-6 shadow-lg">
                <Icon className="w-8 h-8 text-[var(--text-muted)]" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                {error.title}
            </h2>

            {/* Description */}
            <p className="text-sm text-[var(--text-tertiary)] max-w-xs mb-6">
                {error.description}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                {/* Primary Button - Перезагрузить */}
                <button
                    onClick={handleReload}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-6 py-3 min-h-[48px]",
                        "bg-[var(--accent-primary)] text-white font-medium rounded-xl",
                        "hover:bg-[var(--accent-hover)] active:scale-[0.98]",
                        "transition-all duration-200",
                        "shadow-lg shadow-[var(--accent-primary)]/20"
                    )}
                >
                    <RefreshCw className="w-4 h-4" />
                    Перезагрузить
                </button>

                {/* Secondary Button - Попробовать снова */}
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 px-6 py-3 min-h-[48px]",
                            "bg-transparent text-[var(--text-secondary)] font-medium rounded-xl",
                            "border border-white/[0.1] hover:border-white/[0.2]",
                            "hover:bg-white/[0.05] active:scale-[0.98]",
                            "transition-all duration-200"
                        )}
                    >
                        Попробовать снова
                    </button>
                )}
            </div>

            {/* Error Code - мелким текстом */}
            {errorCode && (
                <p className="mt-6 text-xs text-[var(--text-disabled)] font-mono">
                    Код ошибки: {errorCode}
                </p>
            )}
        </div>
    );
});
