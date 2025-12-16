"use client";

import { UserProfile } from '@/lib/types';

type UserListProps = {
  users: UserProfile[];
};

export function UserList({ users }: UserListProps) {
  // Count users
  const userCount = users.length;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/10 flex-shrink-0">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
          Участники ({userCount})
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-3">
          {users.length > 0 ? (
            users.map(user => {
              return (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900/50 hover:bg-neutral-900/70 transition-colors">
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-10 h-10 rounded-full bg-neutral-800 border border-white/10"
                      style={{
                        backgroundImage: `url(${user.avatar})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-neutral-900 bg-green-500 animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-neutral-200 block truncate">{user.name}</span>
                    <span className="text-xs text-neutral-500">В сети</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-neutral-800 border-2 border-dashed border-neutral-600 flex items-center justify-center mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <p className="text-neutral-500 text-sm">Ожидание собеседника...</p>
              <p className="text-neutral-600 text-xs mt-1">Поделитесь ссылкой на комнату</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
