
import { ChatRoom } from '@/components/chat/ChatRoom';

type ChatPageProps = {
  params: Promise<{
    roomId: string;
  }>;
};

export default async function ChatPage({ params }: ChatPageProps) {
  const { roomId } = await params;
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
return <ChatRoom roomId={decodedRoomId} />;
}
