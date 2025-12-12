"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons/logo';
import { useToast } from '@/hooks/use-toast';
import { isDemoMode } from '@/lib/demo-mode';

export function HomeClient() {
  const [roomCode, setRoomCode] = useState('');
  const [demoMode, setDemoMode] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setDemoMode(isDemoMode());
  }, []);

  const handleCreateRoom = () => {
    const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    router.push(`/chat/${newRoomCode}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) {
      router.push(`/chat/${roomCode.trim()}`);
    } else {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid room code.",
        variant: "destructive",
      });
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
        A monochrome collaboration space.
      </p>
      
      <Card className="w-full max-w-md mt-10 bg-neutral-900/50 border border-white/10 backdrop-blur-md animate-in fade-in zoom-in-95 duration-500 delay-200 text-white">
        <CardHeader>
          <CardTitle className="text-xl font-medium flex items-center justify-center gap-2"><Users/> Join a Room</CardTitle>
          <CardDescription className="text-neutral-400">Enter a room code to start chatting.</CardDescription>
        </CardHeader>
        <form onSubmit={handleJoinRoom}>
          <CardContent>
            <Input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ENTER ROOM CODE"
              className="text-center font-mono text-lg tracking-widest h-14 bg-black/50 border-white/10 focus:ring-white/50 text-white placeholder:text-neutral-500"
              maxLength={6}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4 px-6 pb-6">
            <Button type="submit" className="w-full font-bold bg-white text-black hover:bg-neutral-200" size="lg" disabled={!roomCode.trim()}>
              Join Room <ArrowRight className="ml-2"/>
            </Button>
            <div className="relative flex py-2 items-center w-full">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink mx-4 text-neutral-500 text-xs font-bold">OR</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>
            <Button onClick={handleCreateRoom} variant="secondary" className="w-full font-bold bg-neutral-800 text-white hover:bg-neutral-700" size="lg">
              <Plus className="mr-2"/> Create New Room
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
