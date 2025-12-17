
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
  // Исправление: Инициализируем состояние сразу, избегая "Cannot access before initialization"
  const [username, setUsername] = useState(() => {
    // Безопасная инициализация с проверкой на клиентскую сторону
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chatUsername') || '';
    }
    return '';
  });

  const [avatarDataUrl, setAvatarDataUrl] = useState(() => {
    // Безопасная инициализация аватара
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chatAvatar') || '';
    }
    return '';
  });

  const { toast } = useToast();

  // Сохраняем данные пользователя в localStorage при изменении
  useEffect(() => {
    if (typeof window !== 'undefined' && username) {
      localStorage.setItem('chatUsername', username);
    }
  }, [username]);

  useEffect(() => {
    if (typeof window !== 'undefined' && avatarDataUrl) {
      localStorage.setItem('chatAvatar', avatarDataUrl);
    }
  }, [avatarDataUrl]);

  const handleFinalSave = async () => {
    if (!username.trim()) {
      toast({ title: 'Введите имя', variant: 'destructive' });
      return;
    }

    // If no avatar is saved, try to get current avatar from editor
    let finalAvatarDataUrl = avatarDataUrl;
    if (!finalAvatarDataUrl) {
      // Try to trigger avatar save automatically
      const avatarEditor = document.querySelector('[data-avatar-editor]') as any;
      if (avatarEditor && avatarEditor.saveAvatar) {
        finalAvatarDataUrl = avatarEditor.saveAvatar();
      }

      // If still no avatar, create a default one
      if (!finalAvatarDataUrl) {
        // Create a simple default avatar (8x8 pixel canvas)
        const canvas = document.createElement('canvas');
        canvas.width = 8;
        canvas.height = 8;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#3b82f6'; // Blue background
        ctx.fillRect(0, 0, 8, 8);
        ctx.fillStyle = '#ffffff'; // White face
        ctx.fillRect(2, 2, 4, 4);
        ctx.fillStyle = '#000000'; // Black eyes
        ctx.fillRect(2, 3, 1, 1);
        ctx.fillRect(5, 3, 1, 1);
        ctx.fillStyle = '#ff0000'; // Red mouth
        ctx.fillRect(3, 5, 2, 1);
        finalAvatarDataUrl = canvas.toDataURL();
      }
    }

    try {
      await onProfileCreate(username, finalAvatarDataUrl);
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
            <Button onClick={handleFinalSave} className="h-12 text-lg" disabled={isCreating || !username.trim()}>
              {isCreating ? <Loader2 className="animate-spin" /> : 'Войти в чат'}
            </Button>
            {!avatarDataUrl && (
              <p className="text-xs text-neutral-500 text-center">
                Аватар будет создан автоматически, если не сохранен
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
