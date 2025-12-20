"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PixelAvatarEditor } from '../avatar/PixelAvatarEditor';
import { useToast } from '@/hooks/use-toast';
import { User, ArrowRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileCreationDialogProps {
    isOpen: boolean;
    onProfileCreate: (username: string, avatarDataUrl: string) => Promise<void>;
    roomId: string;
    isCreating: boolean;
}

const MIN_USERNAME_LENGTH = 2;
const MAX_USERNAME_LENGTH = 20;

// Валидация имени пользователя
function validateUsername(name: string): { valid: boolean; error?: string } {
    const trimmed = name.trim();

    if (!trimmed) {
        return { valid: false, error: 'Введите имя' };
    }

    if (trimmed.length < MIN_USERNAME_LENGTH) {
        return { valid: false, error: `Минимум ${MIN_USERNAME_LENGTH} символа` };
    }

    if (trimmed.length > MAX_USERNAME_LENGTH) {
        return { valid: false, error: `Максимум ${MAX_USERNAME_LENGTH} символов` };
    }

    // Проверка на недопустимые символы
    const invalidChars = /[<>{}[\]\\\/]/;
    if (invalidChars.test(trimmed)) {
        return { valid: false, error: 'Недопустимые символы в имени' };
    }

    // Проверка на только пробелы или спецсимволы
    const hasLettersOrNumbers = /[a-zA-Zа-яА-ЯёЁ0-9]/;
    if (!hasLettersOrNumbers.test(trimmed)) {
        return { valid: false, error: 'Имя должно содержать буквы или цифры' };
    }

    return { valid: true };
}

export function ProfileCreationDialog({ isOpen, onProfileCreate, roomId, isCreating }: ProfileCreationDialogProps) {
    const [username, setUsername] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('chatUsername') || '';
        }
        return '';
    });

    const [avatarDataUrl, setAvatarDataUrl] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('chatAvatar') || '';
        }
        return '';
    });

    const [validationError, setValidationError] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);

    const { toast } = useToast();

    // Валидация при изменении имени
    useEffect(() => {
        if (touched) {
            const result = validateUsername(username);
            setValidationError(result.valid ? null : result.error || null);
        }
    }, [username, touched]);

    useEffect(() => {
        if (typeof window !== 'undefined' && username) {
            localStorage.setItem('chatUsername', username);
        }
    }, [username]);

    useEffect(() => {
        if (typeof window !== 'undefined' && avatarDataUrl) {
            localStorage.setItem('chatAvatar', avatarDataUrl);
        }
    }, [avatarDataUrl]);

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Ограничиваем длину на уровне ввода
        if (value.length <= MAX_USERNAME_LENGTH + 5) {
            setUsername(value);
        }
    };

    const handleBlur = () => {
        setTouched(true);
    };

    const handleSubmit = async () => {
        setTouched(true);

        const validation = validateUsername(username);
        if (!validation.valid) {
            setValidationError(validation.error || 'Некорректное имя');
            toast({ title: validation.error || 'Введите корректное имя', variant: 'destructive' });
            return;
        }

        let finalAvatar = avatarDataUrl;
        if (!finalAvatar) {
            // Create default avatar
            const canvas = document.createElement('canvas');
            canvas.width = 8;
            canvas.height = 8;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = '#171717';
            ctx.fillRect(0, 0, 8, 8);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(2, 2, 4, 4);
            ctx.fillStyle = '#171717';
            ctx.fillRect(2, 3, 1, 1);
            ctx.fillRect(5, 3, 1, 1);
            ctx.fillRect(3, 5, 2, 1);
            finalAvatar = canvas.toDataURL();
        }

        try {
            await onProfileCreate(username.trim(), finalAvatar);
        } catch { }
    };

    if (!isOpen) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[var(--bg-primary)]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[var(--border-primary)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
                    <span className="text-sm text-[var(--text-muted)]">Загрузка...</span>
                </div>
            </div>
        );
    }

    const validation = validateUsername(username);
    const isValid = validation.valid;
    const showError = touched && !isValid && username.length > 0;

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent
                className="bg-[var(--bg-primary)] border border-[var(--border-primary)] p-0 max-w-md mx-4"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogTitle className="sr-only">Создание профиля</DialogTitle>
                <div className="p-6">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                            Создайте профиль
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Комната <span className="font-mono font-medium">{roomId.toUpperCase()}</span>
                        </p>
                    </div>

                    {/* Avatar Editor */}
                    <div className="flex justify-center mb-6">
                        <PixelAvatarEditor onSave={setAvatarDataUrl} initialAvatar={avatarDataUrl} />
                    </div>

                    {/* Username Input */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Ваше имя
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={username}
                                    onChange={handleUsernameChange}
                                    onBlur={handleBlur}
                                    onKeyDown={(e) => e.key === 'Enter' && isValid && handleSubmit()}
                                    placeholder="Введите имя"
                                    disabled={isCreating}
                                    maxLength={MAX_USERNAME_LENGTH + 5}
                                    className={cn(
                                        "w-full px-4 py-3 bg-[var(--bg-secondary)] border rounded-lg",
                                        "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                                        "focus:outline-none focus:border-[var(--accent-primary)]",
                                        "transition-colors disabled:opacity-50",
                                        showError
                                            ? "border-[var(--error)] focus:border-[var(--error)]"
                                            : isValid && touched
                                                ? "border-[var(--success)]"
                                                : "border-[var(--border-primary)]"
                                    )}
                                    style={{ fontSize: '16px' }}
                                />

                                {/* Character counter */}
                                <span className={cn(
                                    "absolute right-3 top-1/2 -translate-y-1/2 text-xs",
                                    username.length > MAX_USERNAME_LENGTH
                                        ? "text-[var(--error)]"
                                        : "text-[var(--text-muted)]"
                                )}>
                                    {username.trim().length}/{MAX_USERNAME_LENGTH}
                                </span>
                            </div>

                            {/* Error message */}
                            {showError && validationError && (
                                <p className="text-xs text-[var(--error)] flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {validationError}
                                </p>
                            )}

                            {/* Hint */}
                            {!showError && username.length === 0 && (
                                <p className="text-xs text-[var(--text-muted)]">
                                    От {MIN_USERNAME_LENGTH} до {MAX_USERNAME_LENGTH} символов
                                </p>
                            )}
                        </div>

                        <Button
                            onClick={handleSubmit}
                            disabled={!isValid || isCreating}
                            isLoading={isCreating}
                            loadingText="Вход..."
                            className="w-full"
                            size="lg"
                        >
                            Войти в чат
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
