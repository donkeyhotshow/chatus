"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons/logo';
import { useToast } from '@/hooks/use-toast';
import { isDemoMode } from '@/lib/demo-mode';

export function HomeClient() {
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');
  const [demoMode, setDemoMode] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setDemoMode(isDemoMode());

    // Автозаповнення останнього збереженого ніка
    const savedUsername = localStorage.getItem('chatUsername');
    if (savedUsername && savedUsername.trim()) {
      setUsername(savedUsername.trim());
    }
  }, []);

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('handleJoinRoom called', { username, roomCode });
      // eslint-disable-next-line no-console
      console.log('Router object:', router);
      // eslint-disable-next-line no-console
      console.log('Current pathname:', window.location.pathname);
    }

    // Валідація імені користувача
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Username validation failed');
      }
      toast({
        title: "Введите ник",
        description: "Пожалуйста, введите ваше имя или ник.",
        variant: "destructive",
      });
      return;
    }

    if (trimmedUsername.length < 2) {
      toast({
        title: "Ник слишком короткий",
        description: "Ник должен содержать минимум 2 символа.",
        variant: "destructive",
      });
      return;
    }

    if (trimmedUsername.length > 20) {
      toast({
        title: "Ник слишком длинный",
        description: "Ник должен содержать максимум 20 символов.",
        variant: "destructive",
      });
      return;
    }

    // Валідація коду кімнати
    const trimmedRoomCode = roomCode.trim();
    if (!trimmedRoomCode) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Room code validation failed');
      }
      toast({
        title: "Введите код комнаты",
        description: "Пожалуйста, введите код комнаты.",
        variant: "destructive",
      });
      return;
    }

    // Перевірка формату коду кімнати (тільки цифри та букви)
    const roomCodeRegex = /^[A-Z0-9]{3,6}$/;
    if (!roomCodeRegex.test(trimmedRoomCode)) {
      toast({
        title: "Неверный формат кода",
        description: "Код комнаты должен содержать 3-6 символов (буквы и цифры).",
        variant: "destructive",
      });
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Validation passed, navigating to chat');
    }
    // Сохраняем ник в localStorage для использования в чате
    localStorage.setItem('chatUsername', trimmedUsername);

    // Переходим в реальную комнату чата
    const chatUrl = `/chat/${trimmedRoomCode}`;
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Navigating to:', chatUrl);
    }

    try {
      // Показуємо індикатор завантаження
      toast({
        title: "Подключение к чату...",
        description: "Переходим в комнату " + trimmedRoomCode,
      });

      router.push(chatUrl);
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Router.push called successfully');
      }

      // Дополнительная проверка через setTimeout
      setTimeout(() => {
        if (window.location.pathname === '/') {
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.error('Navigation failed, using window.location');
          }
          toast({
            title: "Переадресация...",
            description: "Используем альтернативный способ навигации",
            variant: "default",
          });
          window.location.href = chatUrl;
        }
      }, 1000);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Router navigation failed:', error);
      }
      toast({
        title: "Ошибка навигации",
        description: "Попробуем альтернативный способ перехода",
        variant: "destructive",
      });
      // Fallback to window.location
      setTimeout(() => {
        window.location.href = chatUrl;
      }, 500);
    }
  };

  return (
    <div className="flex flex-col items-center text-center text-white">
      {demoMode && (
        <div className="mb-4 px-4 py-2 bg-blue-900/30 border border-blue-500/50 rounded-lg text-blue-200 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
          🎭 <strong>Demo Mode</strong> - Локальное тестирование без Firebase
        </div>
      )}
      <Logo />
      <h1 className="font-sans text-4xl sm:text-5xl md:text-7xl font-bold mt-4 animate-in fade-in slide-in-from-top-4 duration-500 px-4">
        ЧАТ ДЛЯ НАС
      </h1>
      <p className="mt-4 text-base sm:text-lg text-neutral-400 max-w-xl animate-in fade-in slide-in-from-top-6 duration-500 delay-100 px-4">
        Приватный чат 1 на 1 с вашим собеседником.
      </p>

      <Card className="w-full max-w-md mt-6 sm:mt-10 mx-4 bg-neutral-900/50 border border-white/10 backdrop-blur-md animate-in fade-in zoom-in-95 duration-500 delay-200 text-white">
        <CardHeader>
          <CardTitle className="text-xl font-medium flex items-center justify-center gap-2"><MessageCircle /> Войти в комнату</CardTitle>
          <CardDescription className="text-neutral-400">
            Введите ваш ник (2-20 символов) и код комнаты (3-6 символов) для приватного чата 1 на 1.
            <br />
            <span className="text-xs text-neutral-500 mt-1 block">
              💡 Подсказка: Нажмите Enter для перехода к следующему полю
            </span>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleJoinRoom}>
          <CardContent className="space-y-4">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ВАШ НИК ИЛИ ИМЯ"
              className="text-center font-mono text-base sm:text-lg tracking-widest h-12 sm:h-14 bg-black/50 border-white/10 focus:ring-white/50 text-white placeholder:text-neutral-500"
              maxLength={20}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const roomCodeInput = document.querySelector('input[placeholder="КОД КОМНАТЫ"]') as HTMLInputElement;
                  if (roomCodeInput) {
                    roomCodeInput.focus();
                  }
                }
              }}
              autoComplete="username"
              title="Введите ваш ник (2-20 символов)"
            />
            <Input
              value={roomCode}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                setRoomCode(value);
              }}
              placeholder="КОД КОМНАТЫ"
              className="text-center font-mono text-base sm:text-lg tracking-widest h-12 sm:h-14 bg-black/50 border-white/10 focus:ring-white/50 text-white placeholder:text-neutral-500"
              maxLength={6}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (username.trim() && roomCode.trim()) {
                    handleJoinRoom(e as any);
                  }
                }
              }}
              autoComplete="off"
              title="Введите код комнаты (3-6 символов, буквы и цифры)"
            />
          </CardContent>
          <CardFooter className="px-6 pb-6">
            <Button
              type="submit"
              className="w-full font-bold bg-white text-black hover:bg-neutral-200 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100"
              size="lg"
              disabled={!username.trim() || !roomCode.trim()}
              onClick={(e) => {
                if (process.env.NODE_ENV === 'development') {
                  console.log('Button clicked!', { username, roomCode });
                }
                if (!username.trim() || !roomCode.trim()) {
                  if (process.env.NODE_ENV === 'development') {
                    console.log('Button disabled due to validation');
                  }
                  e.preventDefault();
                  return;
                }
              }}
            >
              Войти в чат <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
