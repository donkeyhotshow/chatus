import { ChatRoomWrapper } from './ChatRoomWrapper';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <ChatRoomWrapper roomId={roomId} />;
}
