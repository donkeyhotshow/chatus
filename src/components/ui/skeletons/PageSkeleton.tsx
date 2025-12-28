/**
 * PageSkeleton - Полноэкранные skeleton для
 P2: Улучшенные skeleton screens
 */

'use client';

import { cn } from '@/lib/utils';
import { MessageListSkeleton } from './MessageListSkeleton';
import { RoomListSkeleton } from './RoomListSkeleton';
import { NavigationSkeleton } from './NavigationSkeleton';
import { ProfileSkeleton } from './ProfileSkeleton';

interface PageSkeletonProps {
  variant: 'chat' | 'rooms' | 'profile' | 'games' | 'canvas' | 'home';
  className?: string;
}

export function PageSkeleton({ variant, className }: PageSkeletonProps) {
  return (
    <div className={cn('flex flex-col h-screen bg-bg-primary', className)}>
      {/* Header */}
      <NavigationSkeleton variant="header" />

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {variant === 'chat' && <ChatPageSkeleton />}
        {variant === 'rooms' && <RoomsPageSkeleton />}
        {variant === 'profile' && <ProfilePageSkeleton />}
        {variant === 'games' && <GamesPageSkeleton />}
        {variant === 'canvas' && <CanvasPageSkeleton />}
        {variant === 'home' && <HomePageSkeleton />}
      </div>

      {/* Bottom Nav (mobile) */}
      <div className="md:hidden">
        <NavigationSkeleton variant="bottom" />
      </div>
    </div>
  );
}

function ChatPageSkeleton() {
  return (
    <div className="flex h-full">
      {/* Sidebar (desktop) */}
      <div className="hidden md:block w-80 border-r border-border-primary">
        <div className="p-4">
          <div className="h-10 w-full bg-bg-tertiary rounded-xl skeleton-wave mb-4" />
        </div>
        <RoomListSkeleton count={8} />
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-border-primary">
          <div className="w-10 h-10 rounded-full bg-bg-tertiary skeleton-wave" />
          <div className="space-y-1.5">
            <div className="h-4 w-32 bg-bg-tertiary rounded skeleton-wave" />
            <div className="h-3 w-20 bg-bg-tertiary rounded skeleton-wave" />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <MessageListSkeleton count={10} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border-primary">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bg-tertiary skeleton-wave" />
            <div className="flex-1 h-12 bg-bg-tertiary rounded-full skeleton-wave" />
            <div className="w-10 h-10 rounded-xl bg-bg-tertiary skeleton-wave" />
          </div>
        </div>
      </div>
    </div>
  );
}

function RoomsPageSkeleton() {
  return (
    <div className="p-4">
      {/* Search */}
      <div className="h-12 w-full bg-bg-tertiary rounded-xl skeleton-wave mb-4" />

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-20 bg-bg-tertiary rounded-lg skeleton-wave" />
        ))}
      </div>

      {/* Room list */}
      <RoomListSkeleton count={10} />
    </div>
  );
}

function ProfilePageSkeleton() {
  return (
    <div className="max-w-lg mx-auto">
      <ProfileSkeleton variant="full" />

      {/* Settings sections */}
      <div className="px-4 mt-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-xl bg-bg-secondary border border-border-primary">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-bg-tertiary skeleton-wave" />
                <div className="h-4 w-28 bg-bg-tertiary rounded skeleton-wave" />
              </div>
              <div className="w-5 h-5 bg-bg-tertiary rounded skeleton-wave" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GamesPageSkeleton() {
  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="h-7 w-32 bg-bg-tertiary rounded skeleton-wave mb-2" />
        <div className="h-4 w-48 bg-bg-tertiary rounded skeleton-wave" />
      </div>

      {/* Games grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-2xl bg-bg-secondary border border-border-primary p-4">
            <div className="w-12 h-12 rounded-xl bg-bg-tertiary skeleton-wave mb-3" />
            <div className="h-4 w-20 bg-bg-tertiary rounded skeleton-wave mb-2" />
            <div className="h-3 w-full bg-bg-tertiary rounded skeleton-wave" />
          </div>
        ))}
      </div>
    </div>
  );
}

function CanvasPageSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Canvas area */}
      <div className="flex-1 bg-bg-secondary m-4 rounded-2xl skeleton-wave" />

      {/* Toolbar */}
      <div className="flex items-center justify-center gap-2 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-12 h-12 rounded-xl bg-bg-tertiary skeleton-wave" />
        ))}
      </div>
    </div>
  );
}

function HomePageSkeleton() {
  return (
    <div className="p-4 space-y-6">
      {/* Welcome */}
      <div className="text-center py-8">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-bg-tertiary skeleton-wave mb-4" />
        <div className="h-8 w-48 mx-auto bg-bg-tertiary rounded skeleton-wave mb-2" />
        <div className="h-4 w-64 mx-auto bg-bg-tertiary rounded skeleton-wave" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-xl bg-bg-secondary border border-border-primary">
            <div className="w-10 h-10 rounded-lg bg-bg-tertiary skeleton-wave mb-3" />
            <div className="h-4 w-20 bg-bg-tertiary rounded skeleton-wave mb-1" />
            <div className="h-3 w-full bg-bg-tertiary rounded skeleton-wave" />
          </div>
        ))}
      </div>

      {/* Recent */}
      <div>
        <div className="h-5 w-32 bg-bg-tertiary rounded skeleton-wave mb-3" />
        <RoomListSkeleton count={3} />
      </div>
    </div>
  );
}

export { ChatPageSkeleton, RoomsPageSkeleton, ProfilePageSkeleton, GamesPageSkeleton, CanvasPageSkeleton, HomePageSkeleton };
