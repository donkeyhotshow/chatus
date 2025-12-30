"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowRight, MessageCircle, PenTool, Gamepad2, Key, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/components/firebase/FirebaseProvider';
import { cn } from '@/lib/utils';
import { isTestMode } from '@/lib/mock-services';
import { isSafari, safariSafeClick, forceSafariButtonState } from '@/lib/safari-workarounds';
import { logger } from '@/lib/logger';

import { HeaderLogin } from './HeaderLogin';

export function HomeClient() {
    const [roomCode, setRoomCode] = useState('');
    const [username, setUsername] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);

    // Refs for Safari button state management
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

    const handleJoinRoom = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
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
            <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)]/90 backdrop-blur-2xl border-b border-[var(--border-subtle)]">
                <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5 shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
                            <Logo className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-[var(--text-primary)] hidden sm:block">ChatUs</span>
                    </div>

                    {/* Center: Header Login Dropdown */}
                    <HeaderLogin
                        username={username}
                        roomCode={roomCode}
                        onUsernameChange={setUsername}
                        onRoomCodeChange={setRoomCode}
                        onJoin={() => handleJoinRoom()}
                        isConnecting={isConnecting}
                        isValid={isFormValid}
                    />

                    {/* Right: Desktop nav */}
                    <nav className="flex items-center gap-4 shrink-0" role="navigation" aria-label="Основная навигация">
                        <a href="#features" className="text-[var(--font-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors hidden lg:block touch-target">
                            Возможности
                        </a>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-white/60 hover:text-white hover:bg-white/5 rounded-full px-4"
                            onClick={() => document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Войти
                        </Button>
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
                            <h1 className="text-[var(--h1-size)] font-bold text-[var(--text-primary)] mb-2 leading-[var(--h1-lh)] hero-title">
                                Приватный чат
                            </h1>
                            <p className="text-[var(--font-body)] text-[var(--text-secondary)] leading-[var(--lh-body)] hero-subtitle">
                                Общайтесь, рисуйте и играйте вместе
                            </p>
                        </div>

                        {/* Login Form - Redesigned for Stage 1.2 */}
                        <div id="login-section" className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
                            {/* Join Room Block */}
                            <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-subtle)] p-6 shadow-xl backdrop-blur-sm flex flex-col">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                        <Key className="w-5 h-5 text-violet-500" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Войти в комнату</h2>
                                </div>
                                
                                <form onSubmit={handleJoinRoom} className="space-y-4 flex-1 flex flex-col">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label htmlFor="username" className="text-sm font-medium text-[var(--text-secondary)]">Ваше имя</label>
                                            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">2–20 символов</span>
                                        </div>
                                        <input
                                            id="username"
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="Напр. Александр"
                                            className="w-full px-4 h-12 bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder:opacity-40 focus:border-violet-500/50 outline-none transition-all"
                                        />
                                        <p className="text-[10px] text-[var(--text-muted)] leading-tight">Это имя будут видеть другие участники в чате.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="roomCode" className="text-sm font-medium text-[var(--text-secondary)]">Код комнаты</label>
                                        <input
                                            id="roomCode"
                                            type="text"
                                            value={roomCode}
                                            onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                            placeholder="_ _ _ _ _ _"
                                            maxLength={6}
                                            className="w-full px-4 h-12 bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-xl text-center tracking-[0.3em] font-mono text-[var(--text-primary)] placeholder:opacity-20 focus:border-violet-500/50 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="mt-auto pt-4">
                                        <Button
                                            type="submit"
                                            disabled={!isFormValid || isConnecting}
                                            className={cn(
                                                "w-full h-12 rounded-xl font-bold transition-all",
                                                isFormValid && !isConnecting
                                                    ? "bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20"
                                                    : "bg-[var(--bg-tertiary)] text-[var(--text-disabled)]"
                                            )}
                                        >
                                            {isConnecting && <Loader2 className="w-4 h-4 animate-spin" />}
                                            {isConnecting ? "Подключение..." : "Войти"}
                                        </Button>
                                    </div>
                                </form>
                            </div>

                            {/* Create Room Block */}
                            <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-subtle)] p-6 shadow-xl backdrop-blur-sm flex flex-col">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                        <PenTool className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Новая комната</h2>
                                </div>

                                <div className="flex-1 flex flex-col justify-between">
                                    <p className="text-[var(--text-secondary)] mb-8">
                                        Создайте свою приватную комнату для общения, рисования и игр. Ссылка будет доступна только вам и вашим друзьям.
                                    </p>

                                    <div className="space-y-4">
                                        <Button
                                            onClick={handleCreateRoom}
                                            className="w-full h-14 rounded-xl font-bold text-lg bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>Создать комнату</span>
                                                <ArrowRight className="w-5 h-5" />
                                            </div>
                                        </Button>
                                        <p className="text-center text-xs text-[var(--text-muted)]">Регистрация не требуется</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features - Phase 3 Spacing */}
                <section id="features" className="py-12 px-4 bg-[var(--bg-primary)]">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-center mb-8">Возможности</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="card-base flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-2xl bg-[var(--accent-chat)]/10 flex items-center justify-center mb-4">
                                    <MessageCircle className="w-6 h-6 text-[var(--accent-chat)]" />
                                </div>
                                <h3 className="text-[var(--h3-size)] mb-2">Быстрый чат</h3>
                                <p className="text-[var(--font-secondary)] text-[var(--text-secondary)]">Мгновенный обмен сообщениями в приватных комнатах.</p>
                            </div>
                            <div className="card-base flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-2xl bg-[var(--accent-canvas)]/10 flex items-center justify-center mb-4">
                                    <PenTool className="w-6 h-6 text-[var(--accent-canvas)]" />
                                </div>
                                <h3 className="text-[var(--h3-size)] mb-2">Общий холст</h3>
                                <p className="text-[var(--font-secondary)] text-[var(--text-secondary)]">Рисуйте вместе с друзьями в реальном времени.</p>
                            </div>
                            <div className="card-base flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-2xl bg-[var(--accent-games)]/10 flex items-center justify-center mb-4">
                                    <Gamepad2 className="w-6 h-6 text-[var(--accent-games)]" />
                                </div>
                                <h3 className="text-[var(--h3-size)] mb-2">Мини-игры</h3>
                                <p className="text-[var(--font-secondary)] text-[var(--text-secondary)]">Играйте в классические игры не выходя из чата.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer - Improved visibility */}
            <footer className="py-6 sm:py-8 px-4 border-t border-white/[0.1] bg-[var(--bg-secondary)]">
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Logo className="w-5 h-5 text-[var(--text-muted)]" />
                        <span className="text-sm text-[var(--text-muted)] font-medium">ChatUs</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
                        <span>Приватный чат без регистрации</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline">© 2025</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
