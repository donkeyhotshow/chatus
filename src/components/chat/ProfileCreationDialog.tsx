"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PixelAvatarEditor } from '../avatar/PixelAvatarEditor';
import { useToast } from '@/hooks/use-toast';
import { User, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileCreationDialogProps {
    isOpen: boolean;
    onProfileCreate: (username: string, avatarDataUrl: string) => Promise<void>;
    roomId: string;
    isCreating: boolean;
}

export function ProfileCreationDialog({ isOpen, onProfileCreate, roomId, isCreating }: ProfileCreationDialogProps) {
    const [username, setUsername] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('chatUsername') || '';
        }
        return '';
    });

    const [avatarDataUrl, setAvatarDataUrl] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('chatAvatar') || '';
        }
        return '';
    });

    const { toast } = useToast();

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

    const handleSubmit = async () => {
        if (!username.trim()) {
            toast({ title: 'Введите имя', variant: 'destructive' });
            return;
        }

        let finalAvatar = avatarDataUrl;
        if (!finalAvatar) {
            // Create default avatar
            const canvas = document.createElement('canvas');
            canvas.width = 8;
            canvas.height = 8;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = '#171717';
            ctx.fillRect(0, 0, 8, 8);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(2, 2, 4, 4);
            ctx.fillStyle = '#171717';
            ctx.fillRect(2, 3, 1, 1);
            ctx.fillRect(5, 3, 1, 1);
            ctx.fillRect(3, 5, 2, 1);
            finalAvatar = canvas.toDataURL();
        }

        try {
            await onProfileCreate(username, finalAvatar);
        } catch { }
    };

    if (!isOpen) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[var(--bg-primary)]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[var(--border-primary)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
                    <span className="text-sm text-[var(--text-muted)]">Загрузка...</span>
                </div>
            </div>
        );
    }

    const isValid = username.trim().length >= 2;

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent
                className="bg-[var(--bg-primary)] border border-[var(--border-primary)] p-0 max-w-md mx-4"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <div className="p-6">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                            Создайте профиль
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Комната <span className="font-mono font-medium">{roomId.toUpperCase()}</span>
                        </p>
                    </div>

                    {/* Avatar Editor */}
                    <div className="flex justify-center mb-6">
                        <PixelAvatarEditor onSave={setAvatarDataUrl} initialAvatar={avatarDataUrl} />
                    </div>

                    {/* Username Input */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Ваше имя
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && isValid && handleSubmit()}
                                placeholder="Введите имя"
                                disabled={isCreating}
                                maxLength={20}
                                className={cn(
                                    "w-full px-4 py-3 bg-[var(--bg-secondary)] border rounded-lg",
                                    "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                                    "focus:outline-none focus:border-[var(--accent-primary)]",
                                    "transition-colors disabled:opacity-50",
                                    isValid ? "border-[var(--success)]" : "border-[var(--border-primary)]"
                                )}
                                style={{ fontSize: '16px' }}
                            />
                            {username.length > 0 && username.length < 2 && (
                                <p className="text-xs text-[var(--warning)]">
                                    Минимум 2 символа
                                </p>
                            )}
                        </div>

                        <Button
                            onClick={handleSubmit}
                            disabled={!isValid || isCreating}
                            isLoading={isCreating}
                            loadingText="Вход..."
                            className="w-full"
                            size="lg"
                        >
                            Войти в чат
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
