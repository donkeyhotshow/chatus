'use client';

import dynamic from 'next/dynamic';

const ChatRoom = dynamic(
  () => import('@/components/chat/ChatRoom').then(m => ({ default: m.ChatRoom })),
  {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center">Loading...</div>
  }
);

interface ChatRoomWrapperProps {
  roomId: string;
}

export function ChatRoomWrapper({ roomId }: ChatRoomWrapperProps) {
  return (
    <div className="h-full w-full overflow-hidden flex">
      <ChatRoom roomId={roomId} />
    </div>
  );
}
