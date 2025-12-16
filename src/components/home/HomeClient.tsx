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

    if (!username.trim()) {
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
    if (!roomCode.trim()) {
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

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Validation passed, navigating to chat');
    }
    // Сохраняем ник в localStorage для использования в чате
    localStorage.setItem('chatUsername', username.trim());

    // Переходим в реальную комнату чата
    const chatUrl = `/chat/${roomCode.trim().toUpperCase()}`;
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Navigating to:', chatUrl);
    }

    try {
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
          window.location.href = chatUrl;
        }
      }, 1000);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Router navigation failed:', error);
      }
      // Fallback to window.location
      window.location.href = chatUrl;
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
      <h1 className="font-sans text-5xl md:text-7xl font-bold mt-4 animate-in fade-in slide-in-from-top-4 duration-500">
        ЧАТ ДЛЯ НАС
      </h1>
      <p className="mt-4 text-lg text-neutral-400 max-w-xl animate-in fade-in slide-in-from-top-6 duration-500 delay-100">
        Приватный чат 1 на 1 с вашим собеседником.
      </p>

      <Card className="w-full max-w-md mt-10 bg-neutral-900/50 border border-white/10 backdrop-blur-md animate-in fade-in zoom-in-95 duration-500 delay-200 text-white">
        <CardHeader>
          <CardTitle className="text-xl font-medium flex items-center justify-center gap-2"><MessageCircle /> Войти в комнату</CardTitle>
          <CardDescription className="text-neutral-400">Введите ваш ник и код комнаты для приватного чата 1 на 1.</CardDescription>
        </CardHeader>
        <form onSubmit={handleJoinRoom}>
          <CardContent className="space-y-4">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ВАШ НИК ИЛИ ИМЯ"
              className="text-center font-mono text-lg tracking-widest h-14 bg-black/50 border-white/10 focus:ring-white/50 text-white placeholder:text-neutral-500"
              maxLength={20}
            />
            <Input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="КОД КОМНАТЫ"
              className="text-center font-mono text-lg tracking-widest h-14 bg-black/50 border-white/10 focus:ring-white/50 text-white placeholder:text-neutral-500"
              maxLength={6}
            />
          </CardContent>
          <CardFooter className="px-6 pb-6">
            <Button
              type="submit"
              className="w-full font-bold bg-white text-black hover:bg-neutral-200"
              size="lg"
              disabled={!username.trim() || !roomCode.trim()}
              onClick={(e) => {
                console.log('Button clicked!', { username, roomCode });
                if (!username.trim() || !roomCode.trim()) {
                  console.log('Button disabled due to validation');
                  e.preventDefault();
                  return;
                }
              }}
            >
              Войти в чат <ArrowRight className="ml-2" />
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
