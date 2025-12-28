/**
 * Skeleton components index
 * P2 Fix: Централизованный экспорт skeleton-компонентов
 */

export * from './GamesSkeleton';
export * from './CanvasSkeleton';
export * from './MessageListSkeleton';
export * from './RoomListSkeleton';
export * from './NavigationSkeleton';
export * from './ProfileSkeleton';
export * from './PageSkeleton';

// Re-export chat skeleton from existing location
export { ChatSkeleton, ChatListSkeleton, ChatHeaderSkeleton, MessageSkeleton } from '@/components/chat/ChatSkeleton';
