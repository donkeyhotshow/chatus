"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowRight, Plus, MessageCircle, PenTool, Gamepad2, User, Key, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/components/firebase/FirebaseProvider';
import { cn } from '@/lib/utils';
import { isTestMode } from '@/lib/mock-services';
import { isSafari, safariSafeClick, forceSafariButtonState } from '@/lib/safari-workarounds';
import { logger } from '@/lib/logger';


export function HomeClient() {
    const [roomCode, setRoomCode] = useState('');
    const [username, setUsername] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);

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
    // BUG #7 FIX: Allow Unicode characters (including Cyrillic) in username
    const isUsernameValid = username.trim().length >= 2 && username.trim().length <= 20;
    const isRoomCodeValid = roomCode.trim().length >= 3 &&
                           roomCode.trim().length <= 6 &&
                           /^[A-Z0-9]+$/i.test(roomCode.trim());
    const isFormValid = isUsernameValid && isRoomCodeValid;

    const { db } = useFirebase();

    const handleJoinRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isConnecting || !isFormValid || !db) return;

        const trimmedUsername = username.trim();
        const trimmedRoomCode = roomCode.trim().toUpperCase();

        setIsConnecting(true);
        localStorage.setItem('chatUsername', trimmedUsername);

        try {
            // BUG-003 FIX: Check if room exists before navigating
            const roomRef = doc(db, 'rooms', trimmedRoomCode);
            const roomSnap = await getDoc(roomRef);

            if (!roomSnap.exists()) {
                // If room doesn't exist, we'll create it in ChatService,
                // but we should at least log it or show a different message
                logger.info('Room does not exist, will be created', { roomCode: trimmedRoomCode });
            }

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
        } catch (error) {
            setIsConnecting(false);
            logger.error('Error checking room existence', error as Error, { roomCode: trimmedRoomCode });
            toast({
                title: "Ошибка подключения",
                description: "Проверьте интернет-соединение",
                variant: "destructive"
            });
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
        <div className="min-h-screen w-full bg-[var(--bg-primary)]" style={{ background: 'var(--bg-gradient)' }}>
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)]/90 backdrop-blur-2xl border-b border-white/[0.08]">
                <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
                            <Logo className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-white">ChatUs</span>
                    </div>

                    {/* Desktop nav - P2 FIX: убран гамбургер-меню на мобильных */}
                    <nav className="flex items-center gap-6">
                        <a href="#features" className="text-sm text-white/50 hover:text-white transition-colors hidden sm:block">
                            Возможности
                        </a>
                        <a href="#login" className="text-sm text-white/50 hover:text-white transition-colors hidden sm:block">
                            Войти
                        </a>
                    </nav>
                </div>
            </header>

            <main className="pt-14 min-h-[calc(100vh-56px)] flex flex-col">
                {/* Hero + Login - Combined for mobile to fit in first screen */}
                <section className="flex-1 flex items-center justify-center px-4 py-4 sm:py-8 md:py-16 mobile-hero">
                    <div className="max-w-md mx-auto w-full">
                        {/* Compact Hero */}
                        <div className="text-center mb-4 sm:mb-6">
                            {/* Logo - very compact on mobile */}
                            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 animate-float shadow-xl hero-logo" style={{ boxShadow: '0 12px 40px rgba(124, 58, 237, 0.35)' }}>
                                <Logo className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
                            </div>
                            <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-white mb-1 sm:mb-2 leading-tight hero-title">
                                Приватный чат
                            </h1>
                            <p className="text-xs sm:text-sm md:text-base text-white/70 leading-snug hero-subtitle">
                                Общайтесь, рисуйте и играйте вместе
                            </p>
                        </div>

                        {/* Login Form - Compact */}
                        <div className="bg-[var(--bg-card)] rounded-xl sm:rounded-2xl border border-white/[0.1] p-3 sm:p-4 md:p-6 shadow-xl backdrop-blur-sm">
                            <form onSubmit={handleJoinRoom} className="space-y-4 sm:space-y-5">
                                {/* Username */}
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="username"
                                        className="text-[11px] sm:text-xs font-medium text-white/70 flex items-center gap-1.5 px-0.5"
                                    >
                                        <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
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
                                                "w-full px-3 h-14 bg-[var(--bg-secondary)] border-2 rounded-lg sm:rounded-xl text-sm",
                                                "text-white placeholder:text-[var(--text-disabled)]",
                                                "focus:outline-none focus:border-violet-500/50 focus:bg-[var(--bg-tertiary)]",
                                                "transition-all duration-200 touch-manipulation",
                                                isUsernameValid ? "border-emerald-500/50" : "border-white/[0.1]"
                                            )}
                                        />
                                        {isUsernameValid && (
                                            <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Room Code - P2 FIX: показывается только после ввода ника */}
                                {username.trim().length >= 2 && (
                                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="flex items-center justify-between px-0.5">
                                            <label
                                                htmlFor="roomCode"
                                                className="text-[11px] sm:text-xs font-medium text-white/70 flex items-center gap-1.5"
                                            >
                                                <Key className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                                Код комнаты
                                            </label>
                                            <button
                                                type="button"
                                                ref={createRoomButtonRef}
                                                onClick={handleCreateRoom}
                                                className="text-[11px] sm:text-xs font-medium text-violet-400 hover:text-violet-300 flex items-center gap-1 py-1 px-2 rounded-md min-h-[28px] touch-manipulation hover:bg-violet-500/10 active:scale-[0.98]"
                                            >
                                                <Plus className="w-3 h-3" />
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
                                                    "w-full px-3 h-14 bg-[var(--bg-secondary)] border-2 rounded-lg sm:rounded-xl text-center tracking-[0.25em] font-mono text-sm sm:text-base",
                                                    "text-white placeholder:text-[var(--text-disabled)]",
                                                    "focus:outline-none focus:border-violet-500/50 focus:bg-[var(--bg-tertiary)]",
                                                    "transition-all duration-200 touch-manipulation uppercase",
                                                    isRoomCodeValid ? "border-emerald-500/50" : "border-white/[0.1]"
                                                )}
                                            />
                                            {isRoomCodeValid && (
                                                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                                            )}
                                        </div>
                                    </div>
                                )}

                                <Button
                                    ref={submitButtonRef}
                                    type="submit"
                                    disabled={!isFormValid || isConnecting}
                                    isLoading={isConnecting}
                                    loadingText="Подключение..."
                                    className={cn(
                                        "w-full h-14 text-sm font-semibold touch-manipulation rounded-lg sm:rounded-xl mt-2",
                                        "bg-gradient-to-r from-violet-600 to-purple-600",
                                        "hover:shadow-lg hover:shadow-violet-500/30",
                                        "disabled:opacity-50 disabled:cursor-not-allowed"
                                    )}
                                    size="lg"
                                >
                                    {isConnecting ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Подключение...</span>
                                        </div>
                                    ) : (
                                        <>
                                            Войти в чат
                                            <ArrowRight className="w-4 h-4 ml-1.5" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </div>
                    </div>
                </section>

                {/* Features - Compact for second screen */}
                <section id="features" className="py-6 sm:py-10 md:py-16 px-4 bg-gradient-to-b from-[var(--bg-primary)] to-[var(--bg-secondary)]">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white text-center mb-1 sm:mb-2">
                            Возможности
                        </h2>
                        <p className="text-xs sm:text-sm text-[var(--text-muted)] text-center mb-4 sm:mb-6 md:mb-10">
                            Всё для общения в одном месте
                        </p>

                        <div className="grid grid-cols-3 md:grid-cols-3 gap-2 sm:gap-3 md:gap-5">
                            {[
                                {
                                    icon: MessageCircle,
                                    title: "Чат",
                                    desc: "Мгновенные сообщения",
                                    gradient: "from-violet-600 to-purple-700"
                                },
                                {
                                    icon: PenTool,
                                    title: "Холст",
                                    desc: "Рисуйте вместе",
                                    gradient: "from-emerald-500 to-teal-600"
                                },
                                {
                                    icon: Gamepad2,
                                    title: "Игры",
                                    desc: "Играйте с друзьями",
                                    gradient: "from-purple-500 to-fuchsia-600"
                                }
                            ].map((feature, i) => (
                                <div
                                    key={i}
                                    className="group p-3 sm:p-4 md:p-6 bg-[var(--bg-card)] rounded-xl sm:rounded-2xl border border-white/[0.08] transition-all duration-200 hover:bg-[var(--bg-hover)] hover:border-white/[0.15] hover:-translate-y-0.5 text-center"
                                >
                                    <div
                                        className={cn(
                                            "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-3 mx-auto",
                                            "bg-gradient-to-br shadow-lg",
                                            feature.gradient
                                        )}
                                    >
                                        <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                                    </div>
                                    <h3 className="text-xs sm:text-sm md:text-base font-semibold text-white mb-0.5 sm:mb-1">
                                        {feature.title}
                                    </h3>
                                    <p className="text-[10px] sm:text-xs text-[var(--text-tertiary)] leading-snug hidden sm:block">
                                        {feature.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer - Compact */}
            <footer className="py-4 sm:py-6 px-4 border-t border-white/[0.08]">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <Logo className="w-4 h-4 text-[var(--text-disabled)]" />
                        <span className="text-xs text-[var(--text-disabled)]">ChatUs</span>
                    </div>
                    <p className="text-xs text-[var(--text-disabled)]">© 2025</p>
                </div>
            </footer>
        </div>
    );
}
