"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Plus, Menu, X, MessageCircle, PenTool, Gamepad2, User, Key, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function HomeClient() {
    const [roomCode, setRoomCode] = useState('');
    const [username, setUsername] = useState('');
    const [isFormValid, setIsFormValid] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const savedUsername = localStorage.getItem('chatUsername');
        if (savedUsername?.trim()) {
            setUsername(savedUsername.trim());
        }
    }, []);

    useEffect(() => {
        const trimmedUsername = username.trim();
        const trimmedRoomCode = roomCode.trim();
        const isUsernameValid = trimmedUsername.length >= 2 && trimmedUsername.length <= 20;
        const isRoomCodeValid = trimmedRoomCode.length >= 3 && trimmedRoomCode.length <= 6 && /^[A-Z0-9]+$/.test(trimmedRoomCode);
        setIsFormValid(isUsernameValid && isRoomCodeValid);
    }, [username, roomCode]);

    const handleJoinRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isConnecting || !isFormValid) return;

        const trimmedUsername = username.trim();
        const trimmedRoomCode = roomCode.trim();

        setIsConnecting(true);
        localStorage.setItem('chatUsername', trimmedUsername);

        try {
            router.push(`/chat/${trimmedRoomCode}`);
        } catch {
            setIsConnecting(false);
            toast({
                title: "Ошибка",
                description: "Не удалось подключиться",
                variant: "destructive"
            });
        }
    };

    const handleCreateRoom = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setRoomCode(result);
        toast({ title: "Комната создана", description: `Код: ${result}` });
    };

    const isUsernameValid = username.trim().length >= 2;
    const isRoomCodeValid = roomCode.trim().length >= 3 && /^[A-Z0-9]+$/.test(roomCode.trim());

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
                        className="md:hidden p-2 text-[var(--text-secondary)] touch-target"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            {/* Mobile menu */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-40 bg-[var(--bg-primary)] pt-14 md:hidden">
                    <nav className="flex flex-col items-center gap-6 pt-12">
                        <a
                            href="#features"
                            onClick={() => setIsMenuOpen(false)}
                            className="text-lg text-[var(--text-primary)]"
                        >
                            Возможности
                        </a>
                        <a
                            href="#login"
                            onClick={() => setIsMenuOpen(false)}
                            className="text-lg text-[var(--text-primary)]"
                        >
                            Войти
                        </a>
                    </nav>
                </div>
            )}

            <main className="pt-14">
                {/* Hero */}
                <section className="py-16 md:py-24 px-4">
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="w-16 h-16 bg-[var(--accent-primary)] rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Logo className="w-8 h-8 text-[var(--accent-contrast)]" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
                            Приватный чат
                        </h1>
                        <p className="text-lg text-[var(--text-secondary)] mb-8">
                            Общайтесь, рисуйте и играйте вместе. Без регистрации.
                        </p>
                    </div>
                </section>

                {/* Login Form */}
                <section id="login" className="py-12 px-4 bg-[var(--bg-secondary)]">
                    <div className="max-w-md mx-auto">
                        <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)] p-6">
                            <h2 className="text-xl font-semibold text-[var(--text-primary)] text-center mb-6">
                                Войти в чат
                            </h2>

                            <form onSubmit={handleJoinRoom} className="space-y-4">
                                {/* Username */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        Ваш ник
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="Введите ник"
                                            maxLength={20}
                                            className={cn(
                                                "w-full px-4 py-3 bg-[var(--bg-secondary)] border rounded-lg",
                                                "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                                                "focus:outline-none focus:border-[var(--accent-primary)]",
                                                "transition-colors",
                                                isUsernameValid ? "border-[var(--success)]" : "border-[var(--border-primary)]"
                                            )}
                                        />
                                        {isUsernameValid && (
                                            <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--success)]" />
                                        )}
                                    </div>
                                </div>

                                {/* Room Code */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                                            <Key className="w-4 h-4" />
                                            Код комнаты
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleCreateRoom}
                                            className="text-sm text-[var(--accent-primary)] hover:underline flex items-center gap-1"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Создать
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={roomCode}
                                            onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                            placeholder="ABC123"
                                            maxLength={6}
                                            className={cn(
                                                "w-full px-4 py-3 bg-[var(--bg-secondary)] border rounded-lg text-center tracking-widest font-mono",
                                                "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                                                "focus:outline-none focus:border-[var(--accent-primary)]",
                                                "transition-colors uppercase",
                                                isRoomCodeValid ? "border-[var(--success)]" : "border-[var(--border-primary)]"
                                            )}
                                        />
                                        {isRoomCodeValid && (
                                            <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--success)]" />
                                        )}
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={!isFormValid || isConnecting}
                                    isLoading={isConnecting}
                                    loadingText="Подключение..."
                                    className="w-full"
                                    size="lg"
                                >
                                    Войти
                                    <ArrowRight className="w-5 h-5" />
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
