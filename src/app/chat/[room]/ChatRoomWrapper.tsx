'use client';

import { ChatRoom } from '@/components/chat/ChatRoom';

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
