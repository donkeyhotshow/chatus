"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, Plus, CheckCircle2, Menu, X,
  Shield, Zap, Globe, Mail, Github, Twitter,
  MessageCircle, PenTool, Gamepad2, User, Key,
  AlertCircle, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons/logo';
import { useToast } from '@/hooks/use-toast';
import { FeaturePreview } from './FeaturePreview';

export function HomeClient() {
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const savedUsername = localStorage.getItem('chatUsername');
    if (savedUsername && savedUsername.trim()) {
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
    if (isConnecting) return;

    const trimmedUsername = username.trim();
    const trimmedRoomCode = roomCode.trim();

    if (!trimmedUsername || trimmedUsername.length < 2) {
      toast({ title: "Ошибка", description: "Ник должен быть от 2 до 20 символов", variant: "destructive" });
      return;
    }

    if (!trimmedRoomCode || !/^[A-Z0-9]{3,6}$/.test(trimmedRoomCode)) {
      toast({ title: "Ошибка", description: "Код комнаты должен быть 3-6 символов (A-Z, 0-9)", variant: "destructive" });
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('Подготовка к подключению...');
    localStorage.setItem('chatUsername', trimmedUsername);
    const chatUrl = `/chat/${trimmedRoomCode}`;

    try {
      setConnectionStatus('Подключение к серверу...');
      toast({
        title: "Подключение...",
        description: `Входим в комнату ${trimmedRoomCode}`,
        duration: 2000
      });

      // Имитация задержки для показа статуса
      await new Promise(resolve => setTimeout(resolve, 1000));
      setConnectionStatus('Вход в комнату...');

      router.push(chatUrl);
    } catch (error) {
      setIsConnecting(false);
      setConnectionStatus('');
      toast({
        title: "Ошибка подключения",
        description: "Попробуйте еще раз или обновите страницу",
        variant: "destructive"
      });
      // Fallback
      setTimeout(() => {
        window.location.href = chatUrl;
      }, 1000);
    }
  };

  const handleCreateRoom = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRoomCode(result);
    toast({ title: "Комната создана!", description: `Код: ${result}. Скопируйте его для друга.` });
  };

  const navLinks = [
    { name: 'Главная', href: '/' },
    { name: 'Как это работает', href: '#how-it-works' },
    { name: 'Вход', href: '#login' },
    { name: 'Контакты', href: '#contacts' },
  ];

  return (
    <div className="min-h-screen w-full bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Global Progress Loader */}
      {isConnecting && (
        <>
          <div className="fixed top-0 left-0 right-0 h-1 bg-[var(--accent-primary)] z-[100] animate-fade-in" />
          {connectionStatus && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg px-4 py-2 shadow-[var(--shadow-lg)] animate-fade-in">
              <div className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                <div className="w-4 h-4 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
                {connectionStatus}
              </div>
            </div>
          )}
        </>
      )}

      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-secondary)]/80 backdrop-blur-sm border-b border-[var(--border-primary)] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Logo className="w-10 h-10 text-[var(--accent-primary)]" />
            <span className="text-xl font-bold text-[var(--text-primary)]">
              ChatUs
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {link.name}
              </a>
            ))}
            <Button variant="outline" onClick={() => document.getElementById('login')?.scrollIntoView({ behavior: 'smooth' })}>
              Войти
            </Button>
          </nav>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2 text-[var(--text-secondary)] touch-target" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-[var(--bg-primary)]/95 backdrop-blur-sm md:hidden flex flex-col items-center justify-center gap-8">
          <button className="absolute top-6 right-6 p-2 touch-target" onClick={() => setIsMenuOpen(false)}>
            <X className="w-8 h-8" />
          </button>
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="text-2xl font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors"
            >
              {link.name}
            </a>
          ))}
          <Button size="lg" onClick={() => { setIsMenuOpen(false); document.getElementById('login')?.scrollIntoView({ behavior: 'smooth' }); }}>
            Начать сейчас
          </Button>
        </div>
      )}

      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 px-6 text-center bg-gradient-to-b from-[var(--bg-primary)] to-[var(--bg-secondary)]">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="w-20 h-20 bg-[var(--accent-primary)] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Logo className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-[var(--text-primary)] mb-4">
                ChatUs
              </h1>
              <p className="text-xl md:text-2xl text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
                Приватный чат 1 на 1 с рисованием и играми
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <Shield className="w-4 h-4" /> Полная приватность
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-4 h-4" /> Без регистрации
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="w-4 h-4" /> Работает везде
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Login Form Section */}
        <section id="login" className="py-12 px-6 bg-[var(--bg-secondary)]">
          <div className="max-w-xl mx-auto">
            <Card className="p-6 shadow-[var(--shadow-lg)] border-0">
              <CardHeader className="text-center space-y-4 pb-8">
                <CardTitle className="text-2xl font-bold">Начать общение</CardTitle>
                <CardDescription>
                  Введите ваш ник и код комнаты для входа
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleJoinRoom} className="space-y-6">
                <div className="space-y-4">
                  {/* Username Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Ваш ник
                    </label>
                    <div className="relative">
                      <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Напр: Neo"
                        className={`pl-10 ${username.trim().length >= 2
                          ? 'border-[var(--success)] bg-green-50'
                          : username.trim().length > 0 && username.trim().length < 2
                            ? 'border-[var(--error)] bg-red-50'
                            : ''
                          }`}
                        maxLength={20}
                      />
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {username.trim().length >= 2 && (
                          <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />
                        )}
                      </div>
                    </div>
                    {username.trim().length > 0 && username.trim().length < 2 && (
                      <p className="text-sm text-[var(--error)] flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Ник должен содержать минимум 2 символа
                      </p>
                    )}
                    {username.trim().length >= 2 && (
                      <p className="text-sm text-[var(--success)] flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Отличный ник!
                      </p>
                    )}
                  </div>

                  {/* Room Code Input */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        Код комнаты
                      </label>
                      <button
                        type="button"
                        onClick={handleCreateRoom}
                        className="text-sm font-medium text-[var(--accent-primary)] hover:text-[var(--accent-hover)] transition-colors flex items-center gap-1 touch-target px-2 py-1 rounded-md hover:bg-[var(--accent-light)]"
                      >
                        <Plus className="w-4 h-4" /> Создать новую
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                        placeholder="ABC123"
                        className={`text-center tracking-wider pl-10 ${roomCode.trim().length >= 3
                          ? 'border-[var(--success)] bg-green-50'
                          : roomCode.trim().length > 0 && roomCode.trim().length < 3
                            ? 'border-[var(--warning)] bg-yellow-50'
                            : ''
                          }`}
                        maxLength={6}
                      />
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                      {roomCode.trim().length >= 3 && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--success)]" />
                      )}
                    </div>
                    {roomCode.trim().length > 0 && roomCode.trim().length < 3 && (
                      <p className="text-sm text-[var(--warning)] flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Код должен содержать минимум 3 символа
                      </p>
                    )}
                    {roomCode.trim().length >= 3 && (
                      <p className="text-sm text-[var(--success)] flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Код комнаты готов!
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    type="submit"
                    disabled={!isFormValid || isConnecting}
                    size="lg"
                    className="w-full"
                    isLoading={isConnecting}
                    loadingText="ПОДКЛЮЧЕНИЕ..."
                  >
                    <div className="flex items-center gap-2">
                      ВОЙТИ В ЧАТ <ArrowRight className="w-5 h-5" />
                    </div>
                  </Button>

                  <div className="text-center">
                    <p className="text-sm text-[var(--text-muted)]">
                      Или{' '}
                      <button
                        type="button"
                        onClick={handleCreateRoom}
                        className="text-[var(--accent-primary)] hover:text-[var(--accent-hover)] font-medium underline"
                      >
                        создайте новую комнату
                      </button>
                    </p>
                  </div>
                </div>
              </form>
            </Card>
          </div>
        </section>

        {/* Hero Features Section */}
        <section className="py-16 px-6 bg-[var(--bg-secondary)]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
                Приватный чат 1 на 1 с рисованием и играми
              </h2>
              <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
                Общайтесь, рисуйте вместе и играйте в мини-игры в полностью приватной среде.
                Никакой регистрации, мгновенный старт.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {[
                {
                  icon: MessageCircle,
                  title: "Приватный чат",
                  desc: "Безопасное общение один на один без сохранения истории на серверах",
                  color: "bg-blue-50 text-blue-600"
                },
                {
                  icon: PenTool,
                  title: "Совместное рисование",
                  desc: "Рисуйте вместе на общем холсте в реальном времени",
                  color: "bg-purple-50 text-purple-600"
                },
                {
                  icon: Gamepad2,
                  title: "Мини-игры",
                  desc: "Играйте в простые игры прямо в чате для развлечения",
                  color: "bg-green-50 text-green-600"
                }
              ].map((feature, i) => (
                <Card key={i} className="p-6 hover:shadow-[var(--shadow-lg)] transition-all duration-300 border-0 bg-white">
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">{feature.title}</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">{feature.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Preview */}
        <FeaturePreview />

        {/* How it works */}
        <section id="how-it-works" className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Как это работает</h2>
              <p className="text-lg text-[var(--text-secondary)]">Всего 3 простых шага до начала общения</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  icon: Zap,
                  title: "Введите ник",
                  desc: "Придумайте уникальное имя для общения"
                },
                {
                  step: "2",
                  icon: Shield,
                  title: "Создайте или войдите в комнату",
                  desc: "Создайте новую комнату или введите код существующей"
                },
                {
                  step: "3",
                  icon: Globe,
                  title: "Начните общение",
                  desc: "Отправляйте сообщения, рисуйте и играйте вместе"
                }
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                      {item.step}
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-[var(--accent-light)] flex items-center justify-center mx-auto -mt-2">
                      <item.icon className="w-6 h-6 text-[var(--accent-primary)]" />
                    </div>
                  </div>
                  <h4 className="text-xl font-semibold text-[var(--text-primary)] mb-2">{item.title}</h4>
                  <p className="text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contacts" className="bg-[var(--bg-secondary)] border-t border-[var(--border-primary)] pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-1 space-y-6">
            <div className="flex items-center gap-3">
              <Logo className="w-10 h-10 text-[var(--accent-primary)]" />
              <span className="text-xl font-bold">ChatUs</span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Мы создаем инструменты для людей, которые ценят качественное общение и совместное творчество.
            </p>
            <div className="flex gap-4">
              <button className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center hover:bg-[var(--accent-light)] transition-colors touch-target">
                <Twitter className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center hover:bg-[var(--accent-light)] transition-colors touch-target">
                <Github className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center hover:bg-[var(--accent-light)] transition-colors touch-target">
                <Mail className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <h5 className="font-semibold text-[var(--text-primary)]">Продукт</h5>
            <ul className="space-y-4 text-[var(--text-secondary)]">
              <li><a href="/" className="hover:text-[var(--text-primary)] transition-colors">Главная</a></li>
              <li><a href="#how-it-works" className="hover:text-[var(--text-primary)] transition-colors">Как это работает</a></li>
              <li><a href="#login" className="hover:text-[var(--text-primary)] transition-colors">Вход</a></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h5 className="font-semibold text-[var(--text-primary)]">Ресурсы</h5>
            <ul className="space-y-4 text-[var(--text-secondary)]">
              <li><a href="#" className="hover:text-[var(--text-primary)] transition-colors">Документация</a></li>
              <li><a href="#" className="hover:text-[var(--text-primary)] transition-colors">Помощь</a></li>
              <li><a href="#" className="hover:text-[var(--text-primary)] transition-colors">Статус</a></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h5 className="font-semibold text-[var(--text-primary)]">Поддержка</h5>
            <div className="p-6 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">Есть вопросы или предложения? Пишите нам!</p>
              <Button variant="outline" className="w-full">
                Связаться с нами
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-10 border-t border-[var(--border-primary)] flex flex-col md:flex-row justify-between items-center gap-6 text-[var(--text-muted)] text-sm">
          <span>© 2025 CHATUS. MADE WITH ❤️ FOR THE WEB.</span>
          <div className="flex gap-8">
            <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
