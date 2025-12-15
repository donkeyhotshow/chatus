
"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PixelAvatarEditor } from '../avatar/PixelAvatarEditor';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ProfileCreationDialogProps {
  isOpen: boolean;
  onProfileCreate: (username: string, avatarDataUrl: string) => Promise<void>;
  roomId: string;
  isCreating: boolean;
}

const LoadingSpinner = () => (
  <div className="flex h-screen w-full items-center justify-center bg-black text-white">
    <div className="animate-pulse flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      <span className="font-mono text-white/70 tracking-widest">ЗАГРУЗКА...</span>
    </div>
  </div>
);


export function ProfileCreationDialog({ isOpen, onProfileCreate, roomId, isCreating }: ProfileCreationDialogProps) {
  const [username, setUsername] = useState('');
  const [avatarDataUrl, setAvatarDataUrl] = useState('');
  const { toast } = useToast();

  // Load saved username from localStorage on component mount
  useEffect(() => {
    const savedUsername = localStorage.getItem('chatUsername');
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  const handleFinalSave = async () => {
    if (!username.trim()) {
      toast({ title: 'Введите имя', variant: 'destructive' });
      return;
    }
    if (!avatarDataUrl) {
      toast({ title: 'Создайте и сохраните аватар', variant: 'destructive' });
      return;
    }

    try {
      await onProfileCreate(username, avatarDataUrl);
      // Don't set isCreating to false on success, as the component will unmount
    } catch {
      // Error is handled by the caller, which will set isCreating to false
    }
  };

  if (!isOpen) {
    return <LoadingSpinner />;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => { }}>
      <DialogContent className="bg-neutral-950 border-white/10 sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-white">Создайте профиль</DialogTitle>
          <DialogDescription className="text-neutral-400">Нарисуйте пиксельный аватар и выберите имя для входа в комнату <span className="font-bold text-neutral-300">{roomId.toUpperCase()}</span>.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 items-center">
          <PixelAvatarEditor onSave={setAvatarDataUrl} initialAvatar={avatarDataUrl} />
          <div className="flex flex-col gap-4">
            <Input
              placeholder="Ваше имя"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFinalSave()}
              className="h-12 text-lg"
              disabled={isCreating}
            />
            <Button onClick={handleFinalSave} className="h-12 text-lg" disabled={isCreating || !username.trim() || !avatarDataUrl}>
              {isCreating ? <Loader2 className="animate-spin" /> : 'Войти в чат'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
