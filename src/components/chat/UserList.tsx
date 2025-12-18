"use client";

import { UserProfile } from '@/lib/types';
import { Copy, Check, Users } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

type UserListProps = {
  users: UserProfile[];
  currentUserId?: string;
};

export function UserList({ users, currentUserId }: UserListProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const userCount = users.length;

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast({
      title: "Ссылка скопирована!",
      description: "Отправьте её другу.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-transparent">
      <div className="p-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/5 text-neutral-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Участники</h3>
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest">{userCount} онлайн</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-2">
        <AnimatePresence mode="popLayout">
          {users.length > 0 ? (
            users.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group ${user.id === currentUserId
                    ? 'bg-white/10 border border-white/5'
                    : 'hover:bg-white/5 border border-transparent'
                  }`}
              >
                <div className="relative shrink-0">
                  <div
                    className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/5 overflow-hidden"
                    style={{
                      backgroundImage: `url(${user.avatar})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black bg-green-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold truncate ${user.id === currentUserId ? 'text-white' : 'text-neutral-400'
                      }`}>
                      {user.name}
                    </span>
                    {user.id === currentUserId && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/10 text-white font-mono uppercase">
                        Вы
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-neutral-500 text-xs">Никого нет...</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 shrink-0">
        <Button
          onClick={handleCopyLink}
          variant="ghost"
          className={`w-full h-11 rounded-xl font-bold text-xs transition-all border border-white/5 ${copied ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
            }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 mr-2" /> Скопировано
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 mr-2" /> Пригласить друга
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
