import { ChatRoomWrapper } from './ChatRoomWrapper';

// Force dynamic rendering for this route - these MUST be in server component
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default async function ChatPage({ params }: PageProps) {
  const { roomId } = await params;

  // Decode and sanitize roomId
  let decodedRoomId = roomId;
  try {
    decodedRoomId = decodeURIComponent(roomId);
  } catch {
    // ignore decode errors
  }
  decodedRoomId = String(decodedRoomId).trim().replace(/[\r\n]+/g, '');

  return <ChatRoomWrapper roomId={decodedRoomId} />;
}
