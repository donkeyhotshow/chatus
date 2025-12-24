import { ChatRoomWrapper } from './ChatRoomWrapper';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const runtime = 'nodejs';

// Allow any roomId at runtime
export async function generateStaticParams() {
  return [];
}

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
