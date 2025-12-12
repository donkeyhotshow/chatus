"use client";

import { UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users } from 'lucide-react';

type UserListProps = {
  users: UserProfile[];
};

export function UserList({ users }: UserListProps) {
  // Count users
  const userCount = users.length;
  
  return (
    <div className="p-6 text-white flex-1 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
          Users ({userCount})
        </span>
      </div>
      <div className="flex flex-col gap-4">
        {users.length > 0 ? (
          users.map(user => {
            return (
              <div key={user.id} className="flex items-center gap-4 p-2 rounded-lg bg-neutral-900/50">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-neutral-800 border border-white/10" style={{backgroundImage: `url(${user.avatar})`, backgroundSize: 'cover'}} />
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-neutral-900 bg-green-500 animate-pulse" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-neutral-200 block">{user.name}</span>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-neutral-500 text-sm mt-4">Only you are here.</p>
        )}
      </div>
    </div>
  );
}
