'use client';

import { ChatRoom } from '@/components/chat/ChatRoom';
import { useParams } from 'next/navigation';

export default function ChatPage() {
  const params = useParams();
  const roomId = params?.roomId as string || '';

  // Decode and sanitize roomId to avoid URL-encoded or CR/LF issues
  let decodedRoomId = roomId;
  try {
    decodedRoomId = decodeURIComponent(roomId);
  } catch {
    // ignore decode errors
  }
  decodedRoomId = String(decodedRoomId).trim().replace(/[\r\n]+/g, '');

  return (
    <div className="h-full w-full overflow-hidden flex">
      <ChatRoom roomId={decodedRoomId} />
    </div>
  );
}
