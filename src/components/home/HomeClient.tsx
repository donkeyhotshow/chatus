"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, Plus, CheckCircle2, Menu, X,
  Shield, Zap, Globe, Layout, Mail, Github, Twitter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons/logo';
import { useToast } from '@/hooks/use-toast';
import { isDemoMode } from '@/lib/demo-mode';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

export function HomeClient() {
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const { scrollY } = useScroll();
  const headerBg = useTransform(scrollY, [0, 100], ["rgba(0,0,0,0)", "rgba(0,0,0,0.8)"]);
  const headerBlur = useTransform(scrollY, [0, 100], ["blur(0px)", "blur(12px)"]);

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
    localStorage.setItem('chatUsername', trimmedUsername);
    const chatUrl = `/chat/${trimmedRoomCode}`;

    try {
      toast({ title: "Подключение...", description: `Входим в комнату ${trimmedRoomCode}` });
      router.push(chatUrl);
    } catch (error) {
      setIsConnecting(false);
      window.location.href = chatUrl;
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
    <div className="min-h-screen w-full bg-black text-white selection:bg-cyan-500/30">
      {/* Global Progress Loader */}
      <AnimatePresence>
        {isConnecting && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 z-[100] origin-left"
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        )}
      </AnimatePresence>

      {/* Navigation Header */}
      <motion.header
        style={{ backgroundColor: headerBg, backdropFilter: headerBlur }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Logo className="w-10 h-10 text-cyan-400 group-hover:rotate-12 transition-transform duration-500" />
            <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-500">
              ChatUs
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-neutral-400 hover:text-white transition-colors relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-500 transition-all group-hover:w-full" />
              </a>
            ))}
            <Button variant="outline" className="border-white/10 hover:bg-white/5 rounded-full px-6" onClick={() => document.getElementById('login')?.scrollIntoView({ behavior: 'smooth' })}>
              Войти
            </Button>
          </nav>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2 text-neutral-400" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-2xl md:hidden flex flex-col items-center justify-center gap-8"
          >
            <button className="absolute top-6 right-6 p-2" onClick={() => setIsMenuOpen(false)}>
              <X className="w-8 h-8" />
            </button>
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="text-3xl font-bold hover:text-cyan-400 transition-colors"
              >
                {link.name}
              </a>
            ))}
            <Button className="mt-4 w-64 h-14 text-lg" onClick={() => { setIsMenuOpen(false); document.getElementById('login')?.scrollIntoView({ behavior: 'smooth' }); }}>
              Начать сейчас
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex flex-col items-center justify-center pt-20">
        {/* Login Form Section */}
        <section id="login" className="w-full py-12 px-6 relative">
          <div className="absolute inset-0 bg-cyan-500/5 -z-10" />

          <div className="max-w-xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-[40px] blur opacity-20" />

              <Card className="relative bg-black border-white/10 rounded-[32px] shadow-2xl overflow-hidden p-4">
                <CardHeader className="text-center space-y-4 pb-10 pt-6">
                  <div className="w-20 h-20 bg-cyan-500/10 rounded-3xl flex items-center justify-center mx-auto mb-2">
                    <Logo className="w-10 h-10 text-cyan-400" />
                  </div>
                  <CardTitle className="text-3xl font-black tracking-tight uppercase">Вход в ChatUs</CardTitle>
                  <CardDescription className="text-neutral-500 text-base">
                    Создайте комнату или присоединитесь к существующей
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleJoinRoom} className="space-y-8 px-4 pb-8">
                  <div className="space-y-6">
                    {/* Username Input */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">Ваш уникальный ник</label>
                      <div className="relative group">
                        <Input
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Напр: Neo"
                          className={`h-16 bg-white/5 border-white/10 rounded-2xl px-6 text-lg font-bold transition-all focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 ${username.trim().length >= 2 ? 'border-green-500/30' : ''
                            }`}
                          maxLength={20}
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          {username.trim().length >= 2 ? (
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                          ) : username.trim().length > 0 ? (
                            <div className="w-6 h-6 rounded-full border-2 border-neutral-800 border-t-neutral-500 animate-spin" />
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Room Code Input */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Код комнаты</label>
                        <button
                          type="button"
                          onClick={handleCreateRoom}
                          className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Сгенерировать
                        </button>
                      </div>
                      <div className="relative group">
                        <Input
                          value={roomCode}
                          onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                          placeholder="ABC123"
                          className={`h-16 bg-white/5 border-white/10 rounded-2xl px-6 text-lg font-bold tracking-[0.2em] text-center transition-all focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 ${roomCode.trim().length >= 3 ? 'border-green-500/30' : ''
                            }`}
                          maxLength={6}
                        />
                        {roomCode.trim().length >= 3 && (
                          <CheckCircle2 className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={!isFormValid || isConnecting}
                    className={`w-full h-16 text-xl font-black rounded-2xl transition-all duration-500 ${isFormValid
                      ? 'bg-white text-black hover:bg-neutral-200 shadow-xl shadow-white/5'
                      : 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
                      }`}
                  >
                    {isConnecting ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        ПОДКЛЮЧЕНИЕ...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        ВОЙТИ В ЧАТ <ArrowRight className="w-6 h-6" />
                      </div>
                    )}
                  </Button>
                </form>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-24 px-6 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <h2 className="text-5xl font-black tracking-tight leading-none uppercase">Просто как <br /> раз, два, три.</h2>
              <div className="space-y-6">
                {[
                  { icon: Zap, title: "Мгновенный старт", desc: "Никакой регистрации. Просто введите ник и вы в игре." },
                  { icon: Shield, title: "Полная приватность", desc: "Ваши сообщения и рисунки доступны только вам и вашему другу." },
                  { icon: Globe, title: "Доступно везде", desc: "Работает на любом устройстве прямо в браузере." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 items-start">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                      <item.icon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xl font-bold text-white">{item.title}</h4>
                      <p className="text-neutral-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-10 bg-cyan-500/20 blur-[100px] -z-10" />
              <div className="aspect-square rounded-[40px] bg-gradient-to-br from-neutral-800 to-neutral-950 border border-white/10 p-8 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="text-8xl">🚀</div>
                  <div className="text-2xl font-black text-white">ГОТОВЫ К ПОЛЕТУ?</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contacts" className="bg-neutral-950 border-t border-white/5 pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-1 space-y-6">
            <div className="flex items-center gap-3">
              <Logo className="w-10 h-10 text-cyan-400" />
              <span className="text-xl font-black tracking-tighter">ChatUs</span>
            </div>
            <p className="text-neutral-500 leading-relaxed">
              Мы создаем инструменты для людей, которые ценят качественное общение и совместное творчество.
            </p>
            <div className="flex gap-4">
              <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                <Twitter className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                <Github className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                <Mail className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <h5 className="font-bold text-white uppercase tracking-widest text-sm">Продукт</h5>
            <ul className="space-y-4 text-neutral-500">
              <li><a href="/" className="hover:text-white transition-colors">Главная</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Как это работает</a></li>
              <li><a href="#login" className="hover:text-white transition-colors">Вход</a></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h5 className="font-bold text-white uppercase tracking-widest text-sm">Ресурсы</h5>
            <ul className="space-y-4 text-neutral-500">
              <li><a href="#" className="hover:text-white transition-colors">Документация</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Помощь</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Статус</a></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h5 className="font-bold text-white uppercase tracking-widest text-sm">Поддержка</h5>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
              <p className="text-xs text-neutral-400">Есть вопросы или предложения? Пишите нам!</p>
              <Button variant="outline" className="w-full border-white/10 hover:bg-white/5">
                Связаться с нами
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-neutral-600 text-[10px] font-bold uppercase tracking-[0.2em]">
          <span>© 2025 CHATUS. MADE WITH ❤️ FOR THE WEB.</span>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}



