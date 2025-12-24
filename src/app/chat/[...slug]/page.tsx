import { ChatRoomWrapper } from './ChatRoomWrapper';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;

  // Get roomId from slug array
  const roomId = slug?.[0];

  if (!roomId) {
    notFound();
  }

  return <ChatRoomWrapper roomId={roomId} />;
}
