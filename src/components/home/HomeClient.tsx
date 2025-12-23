"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Plus, Menu, X, MessageCircle, PenTool, Gamepad2, User, Key, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { isTestMode } from '@/lib/mock-services';
import { isSafari, safariSafeClick, forceSafariButtonState } from '@/lib/safari-workarounds';
import { logger } from '@/lib/logger';

export function HomeClient() {
    const [roomCode, setRoomCode] = useState('');
    const [username, setUsername] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Refs for Safari button state management
    const createRoomButtonRef = useRef<HTMLButtonElement>(null);
    const submitButtonRef = useRef<HTMLButtonElement>(null);

    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const savedUsername = localStorage.getItem('chatUsername');
        if (savedUsername?.trim()) {
            setUsername(savedUsername.trim());
        }
    }, []);

    // Form validation - using useMemo for better reactivity
    const isUsernameValid = username.trim().length >= 2 && username.trim().length <= 20;
    const isRoomCodeValid = roomCode.trim().length >= 3 &&
                           roomCode.trim().length <= 6 &&
                           /^[A-Z0-9]+$/.test(roomCode.trim());
    const isFormValid = isUsernameValid && isRoomCodeValid;

    const handleJoinRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isConnecting || !isFormValid) return;

        const trimmedUsername = username.trim();
        const trimmedRoomCode = roomCode.trim();

        setIsConnecting(true);
        localStorage.setItem('chatUsername', trimmedUsername);

        // Safari workaround: use setTimeout to ensure state is updated
        const navigateToRoom = () => {
            try {
                router.push(`/chat/${trimmedRoomCode}`);
            } catch (error) {
                setIsConnecting(false);
                logger.error('Failed to navigate to room', error as Error, { roomCode: trimmedRoomCode });
                toast({
                    title: "Ошибка",
                    description: "Не удалось подключиться",
                    variant: "destructive"
                });
            }
        };

        if (isSafari()) {
            setTimeout(navigateToRoom, 10);
        } else {
            navigateToRoom();
        }
    };

    // Safari-safe create room handler with fallback
    const handleCreateRoom = useCallback(() => {
        const createRoom = () => {
            try {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                let result = '';
                for (let i = 0; i < 6; i++) {
                    result += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                setRoomCode(result);

                if (isTestMode()) {
                    toast({
                        title: "Демо комната создана",
                        description: `Код: ${result} (работает локально)`
                    });
                } else {
                    toast({
                        title: "Комната создана",
                        description: `Код: ${result}`
                    });
                }
            } catch (error) {
                // Fallback: generate simpler room code if crypto fails
                logger.warn('Room code generation failed, using fallback', { error });
                const fallbackCode = Date.now().toString(36).toUpperCase().slice(-6);
                setRoomCode(fallbackCode);
                toast({
                    title: "Комната создана",
                    description: `Код: ${fallbackCode}`
                });
            }
        };

        // Use Safari-safe click wrapper
        safariSafeClick(createRoom)();
    }, [toast]);

    // Safari button state fix effect
    useEffect(() => {
        if (isSafari() && submitButtonRef.current) {
            forceSafariButtonState(submitButtonRef, isFormValid && !isConnecting);
        }
    }, [isFormValid, isConnecting]);

    return (
        <div className="min-h-screen w-full bg-[var(--bg-primary)]">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-sm border-b border-[var(--border-primary)]">
                <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Logo className="w-7 h-7 text-[var(--text-primary)]" />
                        <span className="font-semibold text-[var(--text-primary)]">ChatUs</span>
                    </div>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-6">
                        <a href="#features" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                            Возможности
                        </a>
                        <a href="#login" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                            Войти
                        </a>
                    </nav>

                    {/* Mobile menu button */}
                    <button
                        className="md:hidden p-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors touch-manipulation"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </header>

            {/* Mobile menu */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-[var(--bg-primary)] pt-14 md:hidden animate-in fade-in duration-200"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Мобильное меню"
                >
                    <nav className="flex flex-col items-center gap-8 pt-16 px-4">
                        <a
                            href="#features"
                            onClick={() => setIsMenuOpen(false)}
                            className="text-xl text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors py-2"
                        >
                            Возможности
                        </a>
                        <a
                            href="#login"
                            onClick={() => setIsMenuOpen(false)}
                            className="text-xl text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors py-2"
                        >
                            Войти
                        </a>
                    </nav>
                </div>
            )}

            <main className="pt-14">
                {/* Hero */}
                <section className="py-12 md:py-24 px-4">
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-[var(--accent-primary)] rounded-2xl flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
                            <Logo className="w-8 h-8 md:w-10 md:h-10 text-[var(--accent-contrast)]" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4 leading-tight">
                            Приватный чат
                        </h1>
                        <p className="text-base sm:text-lg text-[var(--text-secondary)] mb-8 px-4">
                            Общайтесь, рисуйте и играйте вместе. Без регистрации.
                        </p>
                    </div>
                </section>

                {/* Login Form */}
                <section id="login" className="py-8 md:py-12 px-4 bg-[var(--bg-secondary)]">
                    <div className="max-w-md mx-auto">
                        <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)] p-4 md:p-6 shadow-lg">
                            <h2 className="text-xl md:text-2xl font-semibold text-[var(--text-primary)] text-center mb-6">
                                Войти в чат
                            </h2>

                            <form onSubmit={handleJoinRoom} className="space-y-4 md:space-y-5">
                                {/* Username */}
                                <div className="space-y-3">
                                    <label
                                        htmlFor="username"
                                        className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2"
                                    >
                                        <User className="w-4 h-4" />
                                        Ваш ник
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="username"
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="Введите ник"
                                            maxLength={20}
                                            autoComplete="username"
                                            className={cn(
                                                "w-full px-4 py-4 bg-[var(--bg-secondary)] border rounded-lg text-base",
                                                "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                                                "focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20",
                                                "transition-all touch-manipulation",
                                                "sm:py-3",
                                                isUsernameValid ? "border-[var(--success)]" : "border-[var(--border-primary)]"
                                            )}
                                            aria-describedby={isUsernameValid ? "username-valid" : undefined}
                                        />
                                        {isUsernameValid && (
                                            <Check
                                                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--success)]"
                                                aria-hidden="true"
                                            />
                                        )}
                                        <span id="username-valid" className="sr-only">Имя пользователя валидно</span>
                                    </div>
                                </div>

                                {/* Room Code */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label
                                            htmlFor="roomCode"
                                            className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2"
                                        >
                                            <Key className="w-4 h-4" />
                                            Код комнаты
                                        </label>
                                        <button
                                            type="button"
                                            ref={createRoomButtonRef}
                                            onClick={handleCreateRoom}
                                            className="text-sm text-[var(--accent-primary)] hover:text-[var(--accent-hover)] transition-colors flex items-center gap-1 py-1 px-2 rounded touch-manipulation"
                                            aria-label="Создать новую комнату"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Создать
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            id="roomCode"
                                            type="text"
                                            value={roomCode}
                                            onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                            placeholder="ABC123"
                                            maxLength={6}
                                            autoComplete="off"
                                            inputMode="text"
                                            className={cn(
                                                "w-full px-4 py-4 bg-[var(--bg-secondary)] border rounded-lg text-center tracking-widest font-mono text-base",
                                                "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                                                "focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20",
                                                "transition-all touch-manipulation uppercase",
                                                "sm:py-3",
                                                isRoomCodeValid ? "border-[var(--success)]" : "border-[var(--border-primary)]"
                                            )}
                                            aria-describedby={isRoomCodeValid ? "roomcode-valid" : undefined}
                                        />
                                        {isRoomCodeValid && (
                                            <Check
                                                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--success)]"
                                                aria-hidden="true"
                                            />
                                        )}
                                        <span id="roomcode-valid" className="sr-only">Код комнаты валиден</span>
                                    </div>
                                </div>

                                <Button
                                    ref={submitButtonRef}
                                    type="submit"
                                    disabled={!isFormValid || isConnecting}
                                    isLoading={isConnecting}
                                    loadingText="Подключение..."
                                    className="w-full h-12 text-base font-medium touch-manipulation"
                                    size="lg"
                                >
                                    Войти
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </form>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section id="features" className="py-16 px-4">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] text-center mb-12">
                            Возможности
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                {
                                    icon: MessageCircle,
                                    title: "Чат",
                                    desc: "Приватное общение в реальном времени"
                                },
                                {
                                    icon: PenTool,
                                    title: "Рисование",
                                    desc: "Совместный холст для творчества"
                                },
                                {
                                    icon: Gamepad2,
                                    title: "Игры",
                                    desc: "Мини-игры для развлечения"
                                }
                            ].map((feature, i) => (
                                <div
                                    key={i}
                                    className="p-6 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]"
                                >
                                    <div className="w-10 h-10 bg-[var(--accent-light)] rounded-lg flex items-center justify-center mb-4">
                                        <feature.icon className="w-5 h-5 text-[var(--accent-primary)]" />
                                    </div>
                                    <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        {feature.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-8 px-4 border-t border-[var(--border-primary)]">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Logo className="w-5 h-5 text-[var(--text-muted)]" />
                        <span className="text-sm text-[var(--text-muted)]">ChatUs</span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">
                        © 2025 ChatUs
                    </p>
                </div>
            </footer>
        </div>
    );
}
