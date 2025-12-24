import { ChatRoomWrapper } from './ChatRoomWrapper';
import { notFound } from 'next/navigation';

// Force Node.js runtime and dynamic rendering
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default async function ChatPage({ params }: PageProps) {
  const { roomId } = await params;

  if (!roomId) {
    notFound();
  }

  return <ChatRoomWrapper roomId={roomId} />;
}
