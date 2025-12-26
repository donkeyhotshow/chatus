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
        <div className="h-full flex flex-col p-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                    <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="font-semibold text-white">Участники</h3>
                    <p className="text-xs text-white/50">{users.length} в сети</p>
                </div>
            </div>

            {/* User list */}
            <div className="flex-1 space-y-2 overflow-y-auto mobile-scroll-y user-list">
                {users.length > 0 ? (
                    users.map((user) => {
                        const isCurrentUser = user.id === currentUserId;
                        return (
                            <div
                                key={user.id}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
                                    isCurrentUser
                                        ? "bg-violet-500/10 border border-violet-500/20"
                                        : "hover:bg-white/5"
                                )}
                            >
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    <div
                                        className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 overflow-hidden"
                                        style={{
                                            backgroundImage: user.avatar ? `url(${user.avatar})` : undefined,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center'
                                        }}
                                    >
                                        {!user.avatar && (
                                            <div className="w-full h-full flex items-center justify-center text-white/60 font-semibold">
                                                {user.name?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    {/* Online indicator */}
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-black shadow-lg shadow-emerald-500/50" />
                                </div>

                                {/* Name */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-sm font-medium truncate",
                                            isCurrentUser ? "text-violet-400" : "text-white"
                                        )}>
                                            {user.name}
                                        </span>
                                        {isCurrentUser && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500 text-white font-semibold">
                                                Вы
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                            <Users className="w-8 h-8 text-white/20" />
                        </div>
                        <p className="text-sm text-white/40">Пока никого нет</p>
                        <p className="text-xs text-white/30 mt-1">Пригласите друга по ссылке</p>
                    </div>
                )}
            </div>

            {/* Invite button */}
            <div className="pt-4 mt-auto">
                <Button
                    onClick={handleCopyLink}
                    variant={copied ? "secondary" : "primary"}
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
