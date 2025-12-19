"use client";

import { UserProfile } from '@/lib/types';
import { Copy, Check, Users } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UserListProps {
    users: UserProfile[];
    currentUserId?: string;
}

export function UserList({ users, currentUserId }: UserListProps) {
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        toast({ title: "Ссылка скопирована" });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[var(--accent-light)] rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-[var(--accent-primary)]" />
                </div>
                <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">Участники</h3>
                    <p className="text-xs text-[var(--text-muted)]">{users.length} в сети</p>
                </div>
            </div>

            {/* User list */}
            <div className="flex-1 space-y-1 overflow-y-auto">
                {users.length > 0 ? (
                    users.map((user) => {
                        const isCurrentUser = user.id === currentUserId;
                        return (
                            <div
                                key={user.id}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg transition-colors",
                                    isCurrentUser
                                        ? "bg-[var(--accent-light)]"
                                        : "hover:bg-[var(--bg-tertiary)]"
                                )}
                            >
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    <div
                                        className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] overflow-hidden"
                                        style={{
                                            backgroundImage: user.avatar ? `url(${user.avatar})` : undefined,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center'
                                        }}
                                    >
                                        {!user.avatar && (
                                            <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] font-medium">
                                                {user.name?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    {/* Online indicator */}
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[var(--success)] rounded-full border-2 border-[var(--bg-primary)]" />
                                </div>

                                {/* Name */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-sm font-medium truncate",
                                            isCurrentUser ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)]"
                                        )}>
                                            {user.name}
                                        </span>
                                        {isCurrentUser && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-primary)] text-[var(--accent-contrast)]">
                                                Вы
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-sm text-[var(--text-muted)]">Пока никого нет</p>
                    </div>
                )}
            </div>

            {/* Invite button */}
            <div className="pt-4 mt-auto">
                <Button
                    onClick={handleCopyLink}
                    variant={copied ? "secondary" : "outline"}
                    className="w-full"
                >
                    {copied ? (
                        <>
                            <Check className="w-4 h-4 mr-2" />
                            Скопировано
                        </>
                    ) : (
                        <>
                            <Copy className="w-4 h-4 mr-2" />
                            Пригласить
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
