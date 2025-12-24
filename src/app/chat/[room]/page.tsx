import { ChatRoomWrapper } from './ChatRoomWrapper';
import { notFound } from 'next/navigation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ room: string }>;
}

export default async function ChatPage({ params }: PageProps) {
  const { room } = await params;

  if (!room) {
    notFound();
  }

  return <ChatRoomWrapper roomId={room} />;
}
