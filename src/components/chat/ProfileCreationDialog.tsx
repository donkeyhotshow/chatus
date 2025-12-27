"use client";

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PixelAvatarEditor } from '../avatar/PixelAvatarEditor';
import { useToast } from '@/hooks/use-toast';
import { User, ArrowRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    validateLoginInput,
    shouldEnableLoginButton,
    handleLoginValidationError,
    MIN_USERNAME_LENGTH,
    MAX_USERNAME_LENGTH,
} from '@/lib/login-validator';
import {
    validateUsername as validateUsernameLength,
    getRemainingChars,
    MAX_USERNAME_LENGTH as USERNAME_MAX_LENGTH,
    VALIDATION_RULES,
} from '@/lib/username-validator';

interface ProfileCreationDialogProps {
    isOpen: boolean;
    onProfileCreate: (username: string, avatarDataUrl: string) => Promise<void>;
    roomId: string;
    isCreating: boolean;
}

// Legacy validation wrapper for backward compatibility
function validateUsername(name: string): { valid: boolean; error?: string } {
    const result = validateLoginInput(name);
    return {
        valid: result.isValid,
        error: result.errorMessage,
    };
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
    // NEW: Separate state for button enabled - updated immediately on input change
    const [isButtonEnabled, setIsButtonEnabled] = useState(() => {
        if (typeof window !== 'undefined') {
            const savedUsername = localStorage.getItem('chatUsername') || '';
            return shouldEnableLoginButton(savedUsername);
        }
        return false;
    });
    // NEW: State for username length warning (BUG-001)
    const [lengthWarning, setLengthWarning] = useState<string | null>(null);
    const [remainingChars, setRemainingChars] = useState(USERNAME_MAX_LENGTH);

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

    // NEW: Immediate validation on username change with fallback
    const handleUsernameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Ограничиваем длину на уровне ввода
        if (value.length <= MAX_USERNAME_LENGTH + 5) {
            setUsername(value);

            // BUG-001: Update remaining chars counter (Requirements 6.3)
            const remaining = getRemainingChars(value);
            setRemainingChars(remaining);

            // BUG-001: Check username length validation (Requirements 6.1, 6.2)
            const lengthValidation = validateUsernameLength(value);
            if (lengthValidation.showWarning) {
                setLengthWarning(lengthValidation.message || null);
            } else {
                setLengthWarning(null);
            }

            // Immediate button state update (Requirements 14.2)
            // Also block submission if username exceeds length limit (Requirements 6.2)
            try {
                const enabled = shouldEnableLoginButton(value) && lengthValidation.isValid;
                setIsButtonEnabled(enabled);
            } catch (error) {
                // Fallback validation on error (Requirements 14.4)
                const fallbackEnabled = handleLoginValidationError(error, value) && lengthValidation.isValid;
                setIsButtonEnabled(fallbackEnabled);
            }
        }
    }, []);

    const handleBlur = () => {
        setTouched(true);
    };

    const handleSubmit = async () => {
        setTouched(true);

        // BUG-001: Check username length validation first (Requirements 6.2)
        const lengthValidation = validateUsernameLength(username);
        if (!lengthValidation.isValid) {
            setLengthWarning(lengthValidation.message || null);
            toast({ title: lengthValidation.message || 'Имя слишком длинное', variant: 'destructive' });
            return;
        }

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
                className="bg-black/95 backdrop-blur-2xl border border-white/[0.08] p-0 max-w-md mx-4 rounded-3xl shadow-2xl"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogTitle className="sr-only">Создание профиля</DialogTitle>
                <DialogDescription className="sr-only">Введите имя и создайте аватар для входа в чат</DialogDescription>
                <div className="p-6 sm:p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/25">
                            <User className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">
                            Создайте профиль
                        </h2>
                        <p className="text-sm text-white/40">
                            Комната <span className="font-mono font-semibold text-violet-400">{roomId.toUpperCase()}</span>
                        </p>
                    </div>

                    {/* Avatar Editor */}
                    <div className="flex justify-center mb-8">
                        <PixelAvatarEditor onSave={setAvatarDataUrl} initialAvatar={avatarDataUrl} />
                    </div>

                    {/* Username Input */}
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/60 flex items-center gap-2 px-1">
                                <User className="w-4 h-4" />
                                Ваше имя
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={username}
                                    onChange={handleUsernameChange}
                                    onBlur={handleBlur}
                                    onKeyDown={(e) => e.key === 'Enter' && isButtonEnabled && handleSubmit()}
                                    placeholder="Введите имя"
                                    disabled={isCreating}
                                    maxLength={MAX_USERNAME_LENGTH + 5}
                                    id="username-input"
                                    aria-label="Имя пользователя"
                                    aria-describedby={
                                        showError && validationError
                                            ? "username-error"
                                            : lengthWarning
                                                ? "username-length-warning"
                                                : "username-hint"
                                    }
                                    aria-invalid={showError || !!lengthWarning}
                                    aria-required="true"
                                    className={cn(
                                        "w-full px-4 py-4 bg-white/[0.04] border-2 rounded-xl",
                                        "text-white placeholder:text-white/30",
                                        "focus:outline-none focus:bg-white/[0.06]",
                                        "transition-all duration-200 disabled:opacity-50",
                                        showError
                                            ? "border-red-500/50 focus:border-red-500/70"
                                            : isButtonEnabled && touched
                                                ? "border-emerald-500/50 focus:border-emerald-500/70"
                                                : "border-white/[0.08] focus:border-violet-500/50"
                                    )}
                                    style={{ fontSize: '16px' }}
                                />

                                {/* Character counter */}
                                <span
                                    className={cn(
                                        "absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium",
                                        remainingChars < 0
                                            ? "text-red-400"
                                            : remainingChars <= 5
                                                ? "text-amber-400"
                                                : "text-white/30"
                                    )}
                                    aria-live="polite"
                                    aria-atomic="true"
                                >
                                    {remainingChars}
                                </span>
                            </div>

                            {/* Error message */}
                            {showError && validationError && (
                                <p id="username-error" className="text-xs text-red-400 flex items-center gap-1.5 px-1" role="alert">
                                    <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                    {validationError}
                                </p>
                            )}

                            {/* Length warning */}
                            {lengthWarning && (
                                <p id="username-length-warning" className="text-xs text-red-400 flex items-center gap-1.5 px-1" role="alert">
                                    <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                    {lengthWarning}
                                </p>
                            )}

                            {/* Hint - show validation rules */}
                            {!showError && !lengthWarning && username.length === 0 && (
                                <p id="username-hint" className="text-xs text-white/30 px-1">
                                    {VALIDATION_RULES}
                                </p>
                            )}
                        </div>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={!isButtonEnabled || isCreating}
                                        isLoading={isCreating}
                                        loadingText="Вход..."
                                        className="w-full h-14 rounded-xl text-base"
                                        size="lg"
                                    >
                                        Присоединиться
                                        <ArrowRight className="w-5 h-5 ml-1" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Войти в комнату с выбранным именем и аватаром</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
