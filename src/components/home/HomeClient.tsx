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

        // BUG-003 fix: Restore last room code from user preferences
        try {
            const prefsStr = localStorage.getItem('user-preferences');
            if (prefsStr) {
                const prefs = JSON.parse(prefsStr);
                if (prefs.lastRoomId?.trim()) {
                    setRoomCode(prefs.lastRoomId.trim().toUpperCase());
                }
            }
        } catch {
            // Ignore parse errors
        }
    }, []);

    // Form validation - using useMemo for better reactivity
    // BUG-006 FIX: Minimum 3 characters as per specification
    const isUsernameValid = username.trim().length >= 3 && username.trim().length <= 20;
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
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-2xl border-b border-white/[0.06]">
                <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
                            <Logo className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-white">ChatUs</span>
                    </div>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-6">
                        <a href="#features" className="text-sm text-white/50 hover:text-white transition-colors">
                            Возможности
                        </a>
                        <a href="#login" className="text-sm text-white/50 hover:text-white transition-colors">
                            Войти
                        </a>
                    </nav>

                    {/* Mobile menu button */}
                    <button
                        className="md:hidden p-3 text-white/50 hover:text-white transition-colors touch-manipulation"
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
                    className="fixed inset-0 z-40 bg-black pt-14 md:hidden animate-in fade-in duration-200"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Мобильное меню"
                >
                    <nav className="flex flex-col items-center gap-8 pt-16 px-4">
                        <a
                            href="#features"
                            onClick={() => setIsMenuOpen(false)}
                            className="text-xl text-white hover:text-violet-400 transition-colors py-2"
                        >
                            Возможности
                        </a>
                        <a
                            href="#login"
                            onClick={() => setIsMenuOpen(false)}
                            className="text-xl text-white hover:text-violet-400 transition-colors py-2"
                        >
                            Войти
                        </a>
                    </nav>
                </div>
            )}

            <main className="pt-14">
                {/* Hero */}
                <section className="py-16 md:py-28 px-4">
                    <div className="max-w-2xl mx-auto text-center">
                        {/* Animated Logo */}
                        <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-violet-600 to-purple-700 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-float shadow-2xl" style={{ boxShadow: '0 20px 60px rgba(124, 58, 237, 0.4)' }}>
                            <Logo className="w-12 h-12 md:w-14 md:h-14 text-white" />
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                            Приватный чат
                        </h1>
                        <p className="text-lg sm:text-xl text-white/40 mb-10 px-4 leading-relaxed">
                            Общайтесь, рисуйте и играйте вместе.<br className="hidden sm:block" /> Без регистрации.
                        </p>
                    </div>
                </section>

                {/* Login Form */}
                <section id="login" className="py-12 md:py-16 px-4">
                    <div className="max-w-md mx-auto">
                        <div className="bg-white/[0.02] rounded-3xl border border-white/[0.08] p-6 md:p-8 shadow-2xl backdrop-blur-sm">
                            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
                                Войти в чат
                            </h2>

                            <form onSubmit={handleJoinRoom} className="space-y-5">
                                {/* Username */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="username"
                                        className="text-sm font-medium text-white/50 flex items-center gap-2 px-1"
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
                                                "w-full px-4 py-4 bg-white/[0.04] border-2 rounded-xl text-base",
                                                "text-white placeholder:text-white/30",
                                                "focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.06]",
                                                "transition-all duration-200 touch-manipulation",
                                                isUsernameValid ? "border-emerald-500/50" : "border-white/[0.08]"
                                            )}
                                            aria-describedby={isUsernameValid ? "username-valid" : undefined}
                                        />
                                        {isUsernameValid && (
                                            <Check
                                                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400"
                                                aria-hidden="true"
                                            />
                                        )}
                                        <span id="username-valid" className="sr-only">
                                            {isUsernameValid ? "Имя пользователя валидно" : "Введите имя от 2 до 20 символов"}
                                        </span>
                                    </div>
                                </div>

                                {/* Room Code */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between px-1">
                                        <label
                                            htmlFor="roomCode"
                                            className="text-sm font-medium text-white/50 flex items-center gap-2"
                                        >
                                            <Key className="w-4 h-4" />
                                            Код комнаты
                                        </label>
                                        <button
                                            type="button"
                                            ref={createRoomButtonRef}
                                            onClick={handleCreateRoom}
                                            className="text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1 py-2 px-3 rounded-lg min-h-[44px] min-w-[44px] touch-manipulation hover:bg-violet-500/10"
                                            aria-label="Создать новую комнату"
                                        >
                                            <Plus className="w-4 h-4" aria-hidden="true" />
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
                                                "w-full px-4 py-4 bg-white/[0.04] border-2 rounded-xl text-center tracking-[0.3em] font-mono text-lg",
                                                "text-white placeholder:text-white/30",
                                                "focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.06]",
                                                "transition-all duration-200 touch-manipulation uppercase",
                                                isRoomCodeValid ? "border-emerald-500/50" : "border-white/[0.08]"
                                            )}
                                            aria-describedby={isRoomCodeValid ? "roomcode-valid" : undefined}
                                        />
                                        {isRoomCodeValid && (
                                            <Check
                                                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400"
                                                aria-hidden="true"
                                            />
                                        )}
                                        <span id="roomcode-valid" className="sr-only">
                                            {isRoomCodeValid ? "Код комнаты валиден" : "Введите код от 3 до 6 символов"}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    ref={submitButtonRef}
                                    type="submit"
                                    disabled={!isFormValid || isConnecting}
                                    aria-disabled={!isFormValid || isConnecting}
                                    isLoading={isConnecting}
                                    loadingText="Подключение..."
                                    className={cn(
                                        "w-full h-14 text-base font-semibold touch-manipulation min-h-[56px] rounded-xl",
                                        "bg-gradient-to-r from-violet-600 to-purple-600",
                                        "hover:shadow-lg hover:shadow-violet-500/30",
                                        "transition-all duration-300"
                                    )}
                                    size="lg"
                                >
                                    Войти
                                    <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                                </Button>
                            </form>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section id="features" className="py-20 px-4 bg-gradient-to-b from-black to-[#050505]">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-white text-center mb-3">
                            Возможности
                        </h2>
                        <p className="text-white/40 text-center mb-14 max-w-lg mx-auto">
                            Всё что нужно для общения в одном месте
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {[
                                {
                                    icon: MessageCircle,
                                    title: "Чат",
                                    desc: "Приватное общение в реальном времени",
                                    color: "var(--chat-primary)",
                                    gradient: "from-violet-600 to-purple-700"
                                },
                                {
                                    icon: PenTool,
                                    title: "Холст",
                                    desc: "Совместное рисование и творчество",
                                    color: "var(--draw-primary)",
                                    gradient: "from-emerald-500 to-teal-600"
                                },
                                {
                                    icon: Gamepad2,
                                    title: "Игры",
                                    desc: "Мини-игры для развлечения вдвоём",
                                    color: "var(--game-primary)",
                                    gradient: "from-purple-500 to-fuchsia-600"
                                }
                            ].map((feature, i) => (
                                <div
                                    key={i}
                                    className="group p-6 bg-white/[0.02] rounded-2xl border border-white/[0.06] transition-all duration-300 hover:bg-white/[0.04] hover:border-white/[0.12] hover:-translate-y-1"
                                >
                                    <div
                                        className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300",
                                            "bg-gradient-to-br",
                                            feature.gradient,
                                            "group-hover:scale-105 shadow-lg"
                                        )}
                                        style={{ boxShadow: `0 8px 24px ${feature.color}30` }}
                                    >
                                        <feature.icon className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-white/40 leading-relaxed">
                                        {feature.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-8 px-4 border-t border-white/[0.06]">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Logo className="w-5 h-5 text-white/30" />
                        <span className="text-sm text-white/30">ChatUs</span>
                    </div>
                    <p className="text-sm text-white/30">
                        © 2025 ChatUs
                    </p>
                </div>
            </footer>
        </div>
    );
}
