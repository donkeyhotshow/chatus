"use client";

import { UserProfile } from '@/lib/types';
import { Copy, Check, Users, Crown } from 'lucide-react';
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
            <div className="flex items-center gap-3 mb-6 px-1">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/25">
                    <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white">Участники</h3>
                    <p className="text-xs text-white/40">{users.length} {users.length === 1 ? 'участник' : 'участников'} в сети</p>
                </div>
            </div>

            {/* User list */}
            <div className="flex-1 space-y-2 overflow-y-auto mobile-scroll-y pr-1">
                {users.length > 0 ? (
                    users.map((user, index) => {
                        const isCurrentUser = user.id === currentUserId;
                        const isFirst = index === 0;
                        return (
                            <div
                                key={user.id}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
                                    isCurrentUser
                                        ? "bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20"
                                        : "bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08]"
                                )}
                            >
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    <div
                                        className={cn(
                                            "w-11 h-11 rounded-xl overflow-hidden",
                                            "bg-gradient-to-br from-white/[0.08] to-white/[0.02]",
                                            "border border-white/[0.08]"
                                        )}
                                        style={{
                                            backgroundImage: user.avatar ? `url(${user.avatar})` : undefined,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center'
                                        }}
                                    >
                                        {!user.avatar && (
                                            <div className="w-full h-full flex items-center justify-center text-white/60 font-semibold text-lg">
                                                {user.name?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    {/* Online indicator */}
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-black shadow-lg shadow-emerald-500/50" />
                                </div>

                                {/* Name & badges */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-sm font-medium truncate",
                                            isCurrentUser ? "text-violet-300" : "text-white"
                                        )}>
                                            {user.name}
                                        </span>
                                        {isFirst && !isCurrentUser && (
                                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {isCurrentUser && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-medium">
                                                Это вы
                                            </span>
                                        )}
                                        <span className="text-[11px] text-emerald-400/80">В сети</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                            <Users className="w-10 h-10 text-white/15" />
                        </div>
                        <p className="text-sm text-white/40 font-medium">Пока никого нет</p>
                        <p className="text-xs text-white/25 mt-1">Пригласите друга по ссылке</p>
                    </div>
                )}
            </div>

            {/* Invite button */}
            <div className="pt-4 mt-auto">
                <Button
                    onClick={handleCopyLink}
                    variant={copied ? "secondary" : "primary"}
                    className={cn(
                        "w-full h-12 rounded-xl font-semibold transition-all duration-300",
                        copied && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    )}
                >
                    {copied ? (
                        <>
                            <Check className="w-5 h-5 mr-2" />
                            Скопировано!
                        </>
                    ) : (
                        <>
                            <Copy className="w-5 h-5 mr-2" />
                            Пригласить друга
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
